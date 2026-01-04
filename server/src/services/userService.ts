import { UserResponse } from '@models/dto/output/UserResponse';
import { RegisterRequest } from '@models/dto/input/RegisterRequest';
import { userRepository } from '@repositories/userRepository';
import { departmentRoleRepository } from '@repositories/departmentRoleRepository';
import { companyRepository } from '@repositories/companyRepository';
import { ConflictError } from '@models/errors/ConflictError';
import { NotFoundError } from '@models/errors/NotFoundError';
import { logInfo } from '@services/loggingService';
import { mapUserEntityToUserResponse } from '@services/mapperService';
import { AppError } from '@models/errors/AppError';
import { AppDataSource } from '@database/connection';
import { InsufficientRightsError } from '@models/errors/InsufficientRightsError';
import { BadRequestError } from '@models/errors/BadRequestError';
import { sendVerificationEmail } from '@utils/emailSender';
import crypto from 'crypto';
import { notificationRepository } from '../repositories/notificationRepository';
import { UserEntity } from '@models/entity/userEntity';
import { saveBase64Image, deleteImage } from '@utils/fileUploadUtils';
import { verifyPassword, generatePasswordData } from '@utils/passwordUtils';
import { UnauthorizedError } from '@models/errors/UnauthorizedError';

/**
 * Service for user-related business logic
 */
class UserService {
  
  /**
   * Helper privato per generare i dati di verifica (Codice + Scadenza)
   */
  private generateOtpData() {
    // Generate an integer between 100000 (inclusive) and 1000000 (exclusive)
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const otpExpiration = new Date(Date.now() + 1800000); // 30 minutes from now
    return { otpCode, otpExpiration };
  }

  /**
   * Registers a new citizen
   * Validates uniqueness of username and email
   * @param registerData User registration data with department_role_ids
   * @returns UserResponse DTO
   */
  async registerCitizen(registerData: RegisterRequest): Promise<UserResponse> {
    const { username, email, password, first_name, last_name, department_role_ids } = registerData;

    // Check if username already exists
    const existingUsername = await userRepository.existsUserByUsername(username);
    if (existingUsername) {
      throw new ConflictError('Username already exists');
    }

    // Check if email already exists
    const existingEmail = await userRepository.existsUserByEmail(email);
    if (existingEmail) {
      throw new ConflictError('Email already exists');
    }

    // Validate department_role_ids - if missing, default to Citizen
    let targetRoleIds = department_role_ids;
    if (!targetRoleIds || targetRoleIds.length === 0) {
      const citizenRole = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Citizen');
      if (!citizenRole) {
        throw new AppError('Default Citizen role not found', 500);
      }
      targetRoleIds = [citizenRole.id];
    }

    // Generate OTP data using the helper
    const { otpCode, otpExpiration } = this.generateOtpData();

    // Create new user with hashed password
    const newUser = await userRepository.createUserWithPassword({
      username,
      email,
      password,
      firstName:  first_name,
      lastName:  last_name,
      emailNotificationsEnabled: true,
      isVerified: false,  // New citizens must verify their email
      verificationCode: otpCode,
      verificationCodeExpiresAt:  otpExpiration,
      telegramLinkConfirmed: false,
    });

    // Insert user roles using raw SQL (same pattern as municipalityUserService)
    await AppDataSource.createQueryBuilder()
      .insert()
      .into('user_roles')
      .values(
        targetRoleIds.map(roleId => ({
          userId: newUser.id,
          departmentRoleId:  roleId
        }))
      )
      .execute();

    // Reload user with roles
    const userWithRoles = await userRepository.findUserById(newUser.id);
    if (!userWithRoles) {
      throw new AppError('Failed to reload user after role assignment', 500);
    }

    logInfo(`New citizen registered: ${username} (ID: ${newUser. id})`);

    const userResponse = mapUserEntityToUserResponse(userWithRoles);

    if (!userResponse) {
      throw new AppError('Failed to map user data', 500);
    }

    // Send email (handled without blocking the response return if sending fails, or as you prefer)
    await this.sendVerificationCode(email, otpCode);

    return userResponse;
  }

  /**
   * Gestisce il rinvio del codice di verifica. 
   * Aggiorna i dati dell'utente con un nuovo codice e una nuova scadenza.
   * @param email Email dell'utente
   */
  async resendVerificationCode(email: string): Promise<void> {
    // 1. Find the user
    const user = await userRepository. findUserByEmail(email);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // 2. Optional check: if already verified, it doesn't make sense to send a new code
    if (user.isVerified) {
      throw new ConflictError('User is already verified');
    }

    // 3. Generate new OTP data
    const { otpCode, otpExpiration } = this.generateOtpData();

    // 4. Update the user in DB (Assuming the repository has an update method)
    // Note: It's essential to update both the code and the expiration date
    await userRepository.updateVerificationData(user.id, {
        verificationCode: otpCode,
        verificationCodeExpiresAt: otpExpiration
    });

    logInfo(`Verification code regenerated for user: ${user.username} (ID: ${user.id})`);

    // 5. Invia la mail
    await this.sendVerificationCode(email, otpCode);
  }

  /**
   * Wrapper per l'invio dell'email per gestire errori di logging centralizzati
   */
  private async sendVerificationCode(email:  string, otpCode: string): Promise<void> {
    try {
      await sendVerificationEmail(email, otpCode);
    } catch (error) {
      logInfo(`Failed to send verification email to ${email}: ${error}`);
      // Here you could decide whether to throw an error or let it be "silent"
      // throw new AppError('Error sending verification email', 500); 
    }
  }

  /**
   * Update user profile settings (photo, telegram, email notifications)
   * @param userId The ID of the user to update
   * @param updateData Data to update
   * @returns Updated user data formatted for response
   */
  async updateUserProfile(
    userId: number,
    updateData: {
      firstName?: string;
      lastName?: string;
      email?: string;
      personalPhoto?: string;
      telegramUsername?: string;
      emailNotificationsEnabled?: boolean;
    }
  ): Promise<any> {
    // ✅ FIXED: Handle empty/no updates - return current user gracefully
    const hasAnyUpdate = Object.keys(updateData || {}).some(key => {
      const value = updateData[key as keyof typeof updateData];
      return value !== undefined;
    });

    if (!hasAnyUpdate) {
      const user = await userRepository.findUserById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }
      
      const response = mapUserEntityToUserResponse(user);
      if (!response) {
        throw new AppError('Failed to format user response', 500);
      }
      
      return response;
    }

    // Get user (only once!)
    const user = await userRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updatedFields:  Partial<UserEntity> = {};

    // Handle First Name
    if (updateData. firstName !== undefined) {
      if (updateData.firstName.trim().length === 0) {
        throw new BadRequestError('First name cannot be empty');
      }
      updatedFields.firstName = updateData.firstName;
    }

    // Handle Last Name
    if (updateData.lastName !== undefined) {
      if (updateData. lastName.trim().length === 0) {
        throw new BadRequestError('Last name cannot be empty');
      }
      updatedFields.lastName = updateData.lastName;
    }

    // Handle Email
    if (updateData.email !== undefined) {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email)) {
        throw new BadRequestError('Invalid email format');
      }

      // Check uniqueness if email is changing
      if (updateData.email !== user.email) {
        const existingEmail = await userRepository.existsUserByEmail(updateData.email);
        if (existingEmail) {
          throw new ConflictError('Email already in use');
        }
        updatedFields.email = updateData.email;
      }
    }

    // Handle personal photo upload (base64)
    if (updateData.personalPhoto !== undefined) {
      if (updateData.personalPhoto === null || updateData.personalPhoto === '') {
        // Remove existing photo
        if (user.personalPhotoUrl) {
          deleteImage(user.personalPhotoUrl);
        }
        updatedFields.personalPhotoUrl = null as any;
      } else {
        // Validate base64 format
        if (!this.isValidBase64Image(updateData.personalPhoto)) {
          throw new BadRequestError('Invalid photo format.  Must be a valid base64 encoded image (JPEG, PNG, GIF, or WebP)');
        }

        // Delete old photo if exists
        if (user. personalPhotoUrl) {
          deleteImage(user.personalPhotoUrl);
        }

        // Save new photo
        try {
          const photoUrl = await saveBase64Image(updateData.personalPhoto, userId);
          updatedFields.personalPhotoUrl = photoUrl;
        } catch (error:  any) {
          // If the error is already a known type (e.g.  BadRequestError from saveBase64Image), rethrow it
          if (error.statusCode) {
            throw error;
          }
          // Otherwise throw a generic error with details
          throw new BadRequestError(`Failed to save photo: ${error. message}`);
        }
      }
    }

    // Handle telegram username
    if (updateData. telegramUsername !== undefined) {
      if (updateData.telegramUsername === null || updateData.telegramUsername === '') {
        updatedFields.telegramUsername = null as any;
      } else {
        // Validate telegram username format (alphanumeric, underscore, 5-32 chars)
        const telegramRegex = /^[a-zA-Z0-9_]{5,32}$/;
        const cleanUsername = updateData.telegramUsername. replace('@', '').toLowerCase();
        
        if (!telegramRegex. test(cleanUsername)) {
          throw new BadRequestError('Invalid Telegram username format.  Must be 5-32 characters, alphanumeric and underscores only.');
        }

        // Check if telegram username is already taken by another user (case-insensitive)
        const existingUser = await userRepository.findUserByTelegramUsername(cleanUsername);
        if (existingUser && existingUser.id !== userId) {
          throw new BadRequestError('Telegram username already in use by another user');
        }

        updatedFields.telegramUsername = cleanUsername;
      }
    }

    // Handle email notifications
    if (updateData.emailNotificationsEnabled !== undefined) {
      updatedFields.emailNotificationsEnabled = updateData.emailNotificationsEnabled;
    }

    // Update user in database
    const updatedUser = await userRepository. updateUser(userId, updatedFields);

    logInfo(`User profile updated: ${updatedUser.username} (ID: ${userId})`);

    // Format response (convert to snake_case for API consistency)
    return mapUserEntityToUserResponse(updatedUser);
  }

  /**
   * Update user password
   * @param userId User ID
   * @param currentPassword Current password
   * @param newPassword New password
   */
  async updatePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    // 1. Get user with password hash
    const user = await userRepository.findUserByIdWithPassword(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!user.passwordHash) {
      // Should not happen for registered users, but maybe for some legacy/external auth
      throw new BadRequestError('User has no password set');
    }

    // 2. Verify current password
    const [salt, hash] = user.passwordHash.split(': ');
    const isValid = await verifyPassword(currentPassword, salt, hash);
    
    if (!isValid) {
      throw new UnauthorizedError('Incorrect current password');
    }

    // 3. Hash new password
    const { salt: newSalt, hash: newHash } = await generatePasswordData(newPassword);
    
    // 4. Update user
    user.passwordHash = `${newSalt}:${newHash}`;
    await userRepository.save(user);

    logInfo(`User password updated: ${user.username} (ID: ${userId})`);
  }

  /**
   * Validate base64 image format
   */
  private isValidBase64Image(base64String: string): boolean {
    // Check if it's a data URI
    const dataUriRegex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
    if (!dataUriRegex.test(base64String)) {
      return false;
    }

    // Extract base64 data
    const base64Data = base64String.split(',')[1];
    if (!base64Data) {
      return false;
    }

    // Check if valid base64
    try {
      Buffer.from(base64Data, 'base64');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets user by ID
   * @param userId User ID
   * @returns UserResponse DTO or null
   */
  async getUserById(userId: number): Promise<UserResponse | null> {
    const user = await userRepository.findUserById(userId);

    if (!user) {
      return null;
    }

    return mapUserEntityToUserResponse(user);
  }

  /**
   * Gets user by username
   * @param username Username
   * @returns UserResponse DTO or null
   */
  async getUserByUsername(username: string): Promise<UserResponse | null> {
    const user = await userRepository.findUserByUsername(username);
    if (!user) {
      return null;
    }

    return mapUserEntityToUserResponse(user);
  }

  /**
   * Get external maintainers by category
   * @param category Category name to filter by
   * @returns Array of UserResponse DTOs
   */
  async getExternalMaintainersByCategory(category: string | undefined): Promise<UserResponse[]> {
    const externalMaintainers = await userRepository.findExternalMaintainersByCategory(category);

    // Batch query companies for all external maintainers
    const companyIds = [... new Set(
      externalMaintainers
        .map(user => user.companyId)
        .filter(id => id !== undefined && id !== null)
    )] as number[];

    const companyMap = new Map<number, string>();
    if (companyIds.length > 0) {
      const companies = await Promise.all(
        companyIds.map(id => companyRepository.findById(id))
      );
      for (const company of companies) {
        if (company) companyMap.set(company.id, company.name);
      }
    }

    return externalMaintainers
      .map(user => {
        const companyName = user.companyId ? companyMap.get(user.companyId) : undefined;
        return mapUserEntityToUserResponse(user, companyName);
      })
      .filter((user): user is UserResponse => user !== null);
  }

  async getUserNotifications(userId: number, isRead?:  boolean) {
    const where:  any = { userId };
    if (typeof isRead !== 'undefined') {
      where.isRead = isRead;
    }
    return await notificationRepository.find({
      where,
      order: { createdAt: 'DESC' }
    });
  }

  async markNotificationAsRead(userId: number, notificationId: number, isRead: boolean) {
    const notification = await notificationRepository.findOneBy({ id: notificationId });
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }
    if (notification.userId !== userId) {
      // Forbidden:  trying to update someone else's notification
      throw new InsufficientRightsError('You can only update your own notifications');
    }
    notification.isRead = isRead;
    return await notificationRepository.save(notification);
  }

  /**
   * Generate Telegram link code
   * @param userId User ID
   * @returns Generated verification code
   */
  async generateTelegramLinkCode(userId: number): Promise<string | null> {
    return userRepository.generateTelegramLinkCode(userId);
  }

  /**
   * Confirm Telegram link after the user acknowledges in the web app. 
   */
  async confirmTelegramLink(userId: number): Promise<{ success: boolean; message:  string }> {
    return userRepository.confirmTelegramLink(userId);
  }

  /**
   * Unlink Telegram account
   * @param userId User ID
   * @returns Result with success status and message
   */
  async unlinkTelegramAccount(userId: number): Promise<{ success: boolean; message:  string }> {
    return userRepository.unlinkTelegramAccount(userId);
  }
}

export const userService = new UserService();