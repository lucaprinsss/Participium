import { UserResponse } from '@models/dto/output/UserResponse';
import { RegisterRequest } from '@models/dto/input/RegisterRequest';
import { userRepository } from '@repositories/userRepository';
import { departmentRoleRepository } from '@repositories/departmentRoleRepository';
import { companyRepository } from '@repositories/companyRepository';
import { ConflictError } from '@models/errors/ConflictError';
import { logInfo } from '@services/loggingService';
import { mapUserEntityToUserResponse } from '@services/mapperService';
import { AppError } from '@models/errors/AppError';
import { AppDataSource } from '@database/connection';

import { sendVerificationEmail } from '@utils/emailSender';

import crypto from 'crypto';

/**
 * Service for user-related business logic
 */
class UserService {
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

    // Genera un intero tra 100000 (incluso) e 1000000 (escluso)
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const otpExpiration = new Date(Date.now() + 1800000) // 30 minutes from now

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

    await sendVerificationEmail(email, otpCode).catch((error) => {
      logInfo(`Failed to send verification email to ${email}: ${error}`);
    });
    return userResponse;
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
}

export const userService = new UserService();