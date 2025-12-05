import { UserResponse } from '@models/dto/output/UserResponse';
import { RegisterRequest } from '@models/dto/input/RegisterRequest';
import { userRepository } from '@repositories/userRepository';
import { departmentRoleRepository } from '@repositories/departmentRoleRepository';
import { ConflictError } from '@models/errors/ConflictError';
import { logInfo } from '@services/loggingService';
import { mapUserEntityToUserResponse } from '@services/mapperService';
import { AppError } from '@models/errors/AppError';

/**
 * Service for user-related business logic
 */
class UserService {
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

    // Create new user with hashed password
    const newUser = await userRepository.createUserWithPassword({
      username,
      email,
      password,
      firstName: first_name,
      lastName: last_name,
      departmentRoleId: citizenDepartmentRole.id,
      emailNotificationsEnabled: true,
      isVerified: false  // New citizens must verify their email
    });

    logInfo(`New citizen registered: ${username} (ID: ${newUser.id})`);
    
    const userResponse = mapUserEntityToUserResponse(newUser);

    if (!userResponse) {
      throw new AppError('Failed to map user data', 500);
    }

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
   * Gets external maintainers filtered by category
   * @param categoryId Category ID to filter by
   * @returns Array of UserResponse DTOs
   */
  async getExternalMaintainersByCategory(categoryId: number | undefined): Promise<UserResponse[]> {
    if (categoryId === undefined || categoryId === null) {
      throw new AppError('categoryId query parameter is required', 400);
    }

    if (isNaN(categoryId) || categoryId <= 0) {
      throw new AppError('categoryId must be a valid positive integer', 400);
    }

    const externalMaintainers = await userRepository.findExternalMaintainersByCategory(categoryId);
    
    return externalMaintainers
      .map(user => mapUserEntityToUserResponse(user))
      .filter((user): user is UserResponse => user !== null);
  }
}

export const userService = new UserService();