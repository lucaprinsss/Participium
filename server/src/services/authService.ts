import { UserResponse } from '../models/dto/output/UserResponse';
import { UserEntity } from '../models/entity/userEntity';
import { mapUserEntityToUserResponse } from './mapperService';

/**
 * Service for authentication-related business logic
 */
class AuthService {
  /**
   * Creates a UserResponse DTO from a user entity
   * Excludes sensitive data like password hash
   * @param user The user entity
   * @returns UserResponse DTO
   */
  
  createUserResponse(user: Express.User | null | undefined): UserResponse | null {
    
    if (!user) {
      return null;
    }

    const userEntityData = user as UserEntity;
    return mapUserEntityToUserResponse(userEntityData);
  }
}

export const authService = new AuthService();