import { UserResponse } from '@models/dto/UserResponse';
import { RegisterRequest } from '@models/dto/RegisterRequest';
import { UserRole } from '@models/dto/UserRole';
import { userRepository } from '@repositories/userRepository';
import { ConflictError } from '@models/errors/ConflictError';
import { logInfo } from '@services/loggingService';
import { mapUserEntityToUserResponse } from '@services/mapperService';

/**
 * Service for user-related business logic
 */
class UserService {
  /**
   * Registers a new citizen
   * Validates uniqueness of username and email
   * Role should be UserRole.CITIZEN (set by controller)
   * @param registerData User registration data with role
   * @returns UserResponse DTO
   */
  async registerCitizen(registerData: RegisterRequest): Promise<UserResponse> {
    const { username, email, password, first_name, last_name, role } = registerData;

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

    // Create new user with hashed password
    // Use role from registerData (should be CITIZEN, set by controller)
    const newUser = await userRepository.createUserWithPassword({
      username,
      email,
      password,
      firstName: first_name,
      lastName: last_name,
      role: role || UserRole.CITIZEN, // Fallback to CITIZEN if not set
      emailNotificationsEnabled: true
    });

    logInfo(`New citizen registered: ${username} (ID: ${newUser.id})`);

    return mapUserEntityToUserResponse(newUser);
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
}

export const userService = new UserService();