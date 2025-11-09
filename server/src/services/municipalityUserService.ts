import { UserResponse } from '@models/dto/UserResponse';
import { UserRole } from '@models/dto/UserRole';
import { municipalityUserRepository } from '@repositories/municipalityUserRepository';
import { userRepository } from '@repositories/userRepository';
import { ConflictError } from '@models/errors/ConflictError';
import { NotFoundError } from '@models/errors/NotFoundError';
import { BadRequest } from '@models/errors/BadRequestError';
import { logInfo } from '@services/loggingService';
import { mapUserEntityToUserResponse } from '@services/mapperService';

/**
 * Service for municipality user management
 */
class MunicipalityUserService {
  

  /**
   * Assign role to municipality user
   * Story: As a system administrator, I want to assign roles to municipality users
   */
  async assignRole(userId: number, role: UserRole): Promise<UserResponse> {
    if (role === UserRole.CITIZEN) {
      throw new BadRequest('Cannot assign Citizen role to municipality user');
    }
    if (role === UserRole.ADMINISTRATOR) {
      throw new BadRequest('Cannot assign Administrator role through this endpoint');
    }

    // Verify user exists and is a municipality user
    const user = await municipalityUserRepository.findMunicipalityUserById(userId);

    if (!user) {
      throw new NotFoundError('Municipality user not found');
    }

    // Update role
    const updatedUser = await municipalityUserRepository.updateMunicipalityUser(userId, { 
      role 
    });

    logInfo(`Role assigned to user ${user.username}: ${role} (ID: ${userId})`);

    return mapUserEntityToUserResponse(updatedUser);
  }
}

export const municipalityUserService = new MunicipalityUserService();