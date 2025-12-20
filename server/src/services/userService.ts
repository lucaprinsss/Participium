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
import { InsufficientRightsError } from '@models/errors/InsufficientRightsError';

import { sendVerificationEmail } from '@utils/emailSender';
import crypto from 'crypto';
import { notificationRepository } from '../repositories/notificationRepository';
import { NotFoundError } from '@models/errors/NotFoundError';

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
   * @param registerData User registration data
   * @returns UserResponse DTO
   */
  async registerCitizen(registerData: RegisterRequest): Promise<UserResponse> {
    const { username, email, password, first_name, last_name, role_name, department_name } = registerData;

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

    // Get the department_role_id for Citizen role
    const citizenDepartmentRole = await departmentRoleRepository.findByDepartmentAndRole(
      department_name || 'Organization',
      role_name || 'Citizen'
    );

    if (!citizenDepartmentRole) {
      throw new AppError('Citizen role configuration not found in database', 500);
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
      departmentRoleId: citizenDepartmentRole.id,
      emailNotificationsEnabled: true,
      isVerified: false,  // New citizens must verify their email
      verificationCode: otpCode,
      verificationCodeExpiresAt: otpExpiration,
    });

    logInfo(`New citizen registered: ${username} (ID: ${newUser.id})`);
    
    const userResponse = mapUserEntityToUserResponse(newUser);

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
}

export const userService = new UserService();