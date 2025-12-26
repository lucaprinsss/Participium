import { UserResponse } from '@models/dto/output/UserResponse';
import { RegisterRequest } from '@models/dto/input/RegisterRequest';
import { userRepository } from '@repositories/userRepository';
import { departmentRoleRepository } from '@repositories/departmentRoleRepository';
import { companyRepository } from '@repositories/companyRepository';
import { ConflictError } from '@models/errors/ConflictError';
import { NotFoundError } from '@models/errors/NotFoundError'; // Assunto che esista
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
/**
 * Service for user-related business logic
 */
class UserService {
  
  /**
   * Helper privato per generare i dati di verifica (Codice + Scadenza)
   */
  private generateOtpData() {
    // Genera un intero tra 100000 (incluso) e 1000000 (escluso)
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

    // Genera i dati OTP usando l'helper
    const { otpCode, otpExpiration } = this.generateOtpData();

    // Create new user with hashed password
    const newUser = await userRepository.createUserWithPassword({
      username,
      email,
      password,
      firstName: first_name,
      lastName: last_name,
      emailNotificationsEnabled: true,
      isVerified: false,  // New citizens must verify their email
      verificationCode: otpCode,
      verificationCodeExpiresAt: otpExpiration,
    });

    // Insert user roles using raw SQL (same pattern as municipalityUserService)
    await AppDataSource.createQueryBuilder()
      .insert()
      .into('user_roles')
      .values(
        targetRoleIds.map(roleId => ({
          userId: newUser.id,
          departmentRoleId: roleId
        }))
      )
      .execute();

    // Reload user with roles
    const userWithRoles = await userRepository.findUserById(newUser.id);
    if (!userWithRoles) {
      throw new AppError('Failed to reload user after role assignment', 500);
    }

    logInfo(`New citizen registered: ${username} (ID: ${newUser.id})`);

    const userResponse = mapUserEntityToUserResponse(userWithRoles);

    if (!userResponse) {
      throw new AppError('Failed to map user data', 500);
    }

    // Invio email (gestito senza bloccare il ritorno della risposta se fallisce l'invio, o come preferisci)
    await this.sendVerificationCode(email, otpCode);

    return userResponse;
  }

  /**
   * Gestisce il rinvio del codice di verifica.
   * Aggiorna i dati dell'utente con un nuovo codice e una nuova scadenza.
   * @param email Email dell'utente
   */
  async resendVerificationCode(email: string): Promise<void> {
    // 1. Trova l'utente
    const user = await userRepository.findUserByEmail(email);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // 2. Controllo opzionale: se è già verificato, non ha senso inviare un nuovo codice
    if (user.isVerified) {
      throw new ConflictError('User is already verified');
    }

    // 3. Genera nuovi dati OTP
    const { otpCode, otpExpiration } = this.generateOtpData();

    // 4. Aggiorna l'utente nel DB (Assumendo che il repository abbia un metodo di update)
    // Nota: È fondamentale aggiornare sia il codice che la data di scadenza
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
  private async sendVerificationCode(email: string, otpCode: string): Promise<void> {
    try {
      await sendVerificationEmail(email, otpCode);
    } catch (error) {
      logInfo(`Failed to send verification email to ${email}: ${error}`);
      // Qui potresti decidere se lanciare un errore o lasciare che sia "silent"
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
      personalPhoto?: string;
      telegramUsername?: string;
      emailNotificationsEnabled?: boolean;
    }
  ): Promise<any> {
    const user = await userRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updatedFields:  Partial<UserEntity> = {};

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
        if (user.personalPhotoUrl) {
          deleteImage(user.personalPhotoUrl);
        }

        // Save new photo
        try {
          const photoUrl = await saveBase64Image(updateData.personalPhoto, userId);
          updatedFields.personalPhotoUrl = photoUrl;
        } catch (error) {
          throw new BadRequestError('Failed to save photo.  Please ensure the image is valid and not too large.');
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
        const cleanUsername = updateData.telegramUsername.replace('@', '');
        
        if (!telegramRegex. test(cleanUsername)) {
          throw new BadRequestError('Invalid Telegram username format. Must be 5-32 characters, alphanumeric and underscores only.');
        }

        // Check if telegram username is already taken by another user
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
    const updatedUser = await userRepository.updateUser(userId, updatedFields);

    logInfo(`User profile updated: ${updatedUser.username} (ID: ${userId})`);

    // Format response (convert to snake_case for API consistency)
    return this.formatUserProfileResponse(updatedUser);
  }

  /**
   * Validate base64 image format
   */
  private isValidBase64Image(base64String: string): boolean {
    // Check if it's a data URI
    const dataUriRegex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
    if (! dataUriRegex.test(base64String)) {
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
   * Format user response with snake_case fields
   */
  private formatUserProfileResponse(user: UserEntity): any {
    // Get the primary role (first role)
    const primaryRole = user. userRoles?.[0]?.departmentRole?. role?. name || 'Citizen';

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      personal_photo_url: user.personalPhotoUrl,
      telegram_username: user.telegramUsername,
      email_notifications_enabled:  user.emailNotificationsEnabled,
      role_name: primaryRole
    };
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
    const companyIds = [...new Set(
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

  async getUserNotifications(userId: number, isRead?: boolean) {
    const where: any = { userId };
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
      // Forbidden: trying to update someone else's notification
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
   * Unlink Telegram account
   * @param userId User ID
   * @returns Result with success status and message
   */
  async unlinkTelegramAccount(userId: number): Promise<{ success: boolean; message: string }> {
    return userRepository.unlinkTelegramAccount(userId);
  }}

export const userService = new UserService();