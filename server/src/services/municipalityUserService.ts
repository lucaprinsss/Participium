import { UserResponse } from '@models/dto/UserResponse';
import { UserRole } from '@models/dto/UserRole';
import { RegisterRequest } from '@models/dto/RegisterRequest';
import { userRepository } from '@repositories/userRepository';
import { NotFoundError } from '@models/errors/NotFoundError';
import { BadRequestError } from '@models/errors/BadRequestError';
import { logInfo } from '@services/loggingService';
import { mapUserEntityToUserResponse } from '@services/mapperService';
import { Not, In } from 'typeorm';
import { ConflictError } from '@models/errors/ConflictError';
import { AppError } from '@models/errors/AppError'; 

/**
 * Service for municipality user management
 */
class MunicipalityUserService {

  /**
   * Create a new municipality user
   * @param registerData User registration data
   * @returns The created user response
   * @throws BadRequestError if trying to create Citizen or Administrator
   * @throws ConflictError if username or email already exists
   */
  async createMunicipalityUser(registerData: RegisterRequest): Promise<UserResponse> {
    const { role, password, first_name, last_name, username, email } = registerData;

    if (role === UserRole.CITIZEN) {
      throw new BadRequestError('Cannot create a municipality user with Citizen role');
    }
    if (role === UserRole.ADMINISTRATOR) {
      throw new BadRequestError('Cannot create an Administrator through this endpoint');
    }

    // Check for duplicate username
    const existingUserByUsername = await userRepository.existsUserByUsername(username);
    if (existingUserByUsername) {
      throw new ConflictError('Username already exists');
    }

    // Check for duplicate email
    const existingUserByEmail = await userRepository.existsUserByEmail(email);
    if (existingUserByEmail) {
      throw new ConflictError('Email already exists');
    }

    // Create user with repository (it will hash the password)
    const newUser = await userRepository.createUserWithPassword({
      username,
      email,
      firstName: first_name,
      lastName: last_name,
      role,
      password
    });
    logInfo(`Municipality user created: ${username} with role ${role}`);

    const userResponse = mapUserEntityToUserResponse(newUser);
    if (!userResponse) {
      throw new AppError('Failed to map user response after creation', 500);
    }
    return userResponse;
  }

  /**
   * Get all municipality users
   * @returns Array of user responses (excludes Citizen and Administrator)
   */
  async getAllMunicipalityUsers(): Promise<UserResponse[]> {
    const users = await userRepository.findAllUsers({
      where: {
        role: Not(In([UserRole.CITIZEN, UserRole.ADMINISTRATOR]))
      },
      order: {
        createdAt: 'DESC'
      }
    });
    
    logInfo(`Retrieved ${users.length} municipality users`);
    return users
      .map(user => mapUserEntityToUserResponse(user))
      .filter(user => user !== null) as UserResponse[];
  }

  /**
   * Get municipality user by ID
   * @param id User ID
   * @returns User response
   * @throws NotFoundError if user not found or is not a municipality user
   */
  async getMunicipalityUserById(id: number): Promise<UserResponse> {
    const user = await userRepository.findUserById(id);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.role === UserRole.CITIZEN || user.role === UserRole.ADMINISTRATOR) {
      throw new NotFoundError('Municipality user not found');
    }
    const userResponse = mapUserEntityToUserResponse(user);
    if (!userResponse) {
      throw new AppError('Failed to map user response for getById', 500);
    }
    return userResponse;
  }

  /**
   * Update municipality user
   * @param id User ID
   * @param updateData Data to update (Nota: si aspetta camelCase)
   * @returns Updated user response
   * @throws NotFoundError if user not found
   * @throws BadRequestError if trying to update non-municipality user
   */
  async updateMunicipalityUser(
    id: number,
    updateData: Partial<{ firstName: string; lastName: string; email: string; role: UserRole }>
  ): Promise<UserResponse> {
    const existingUser = await userRepository.findUserById(id);
    
    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    if (existingUser.role === UserRole.CITIZEN || existingUser.role === UserRole.ADMINISTRATOR) {
      throw new BadRequestError('Cannot modify Citizen or Administrator through this endpoint');
    }
        if (updateData.email && updateData.email !== existingUser.email) {
        const emailExists = await userRepository.existsUserByEmail(updateData.email);
        if (emailExists) {
            throw new ConflictError('Email already exists');
        }
    }
    
    if (updateData.role) {
      if (updateData.role === UserRole.CITIZEN || updateData.role === UserRole.ADMINISTRATOR) {
        throw new BadRequestError('Cannot change role to Citizen or Administrator');
      }
    }
    const updatedUser = await userRepository.updateUser(id, updateData);

    logInfo(`Municipality user updated: ${updatedUser.username} (ID: ${id})`);

    const userResponse = mapUserEntityToUserResponse(updatedUser);
    if (!userResponse) {
      throw new AppError('Failed to map user response after update', 500);
    }
    return userResponse;
  }

  /**
   * Delete municipality user
   * @param id User ID
   * @returns void
   * @throws NotFoundError if user not found
   * @throws BadRequestError if trying to delete non-municipality user
   */
  async deleteMunicipalityUser(id: number): Promise<void> {
    const existingUser = await userRepository.findUserById(id);
    
    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    if (existingUser.role === UserRole.CITIZEN || existingUser.role === UserRole.ADMINISTRATOR) {
      throw new BadRequestError('Cannot delete Citizen or Administrator through this endpoint');
    }

    await userRepository.deleteUser(id);

    logInfo(`Municipality user deleted: ${existingUser.username} (ID: ${id})`);
  }

  /**
   * Assign role to municipality user
   * @param userId User ID
   * @param role Role to assign
   * @returns Updated user response
   * @throws NotFoundError if user not found
   * @throws BadRequestError if trying to assign invalid roles
   */
  async assignRole(userId: number, role: UserRole): Promise<UserResponse> {
    if (role === UserRole.CITIZEN) {
      throw new BadRequestError('Cannot assign Citizen role to municipality user');
    }
    if (role === UserRole.ADMINISTRATOR) {
      throw new BadRequestError('Cannot assign Administrator role through this endpoint');
    }

    const user = await userRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.role === UserRole.CITIZEN || user.role === UserRole.ADMINISTRATOR) {
      throw new BadRequestError('Cannot assign role to Citizen or Administrator through this endpoint');
    }

    const updatedUser = await userRepository.updateUser(userId, { role });

    logInfo(`Role assigned to user ${user.username}: ${role} (ID: ${userId})`);

    const userResponse = mapUserEntityToUserResponse(updatedUser);
    if (!userResponse) {
      throw new AppError('Failed to map user response after role assignment', 500);
    }
    return userResponse;
  }

}

export const municipalityUserService = new MunicipalityUserService();