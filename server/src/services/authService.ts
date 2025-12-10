import { userRepository } from '@repositories/userRepository';
import { UserResponse } from '../models/dto/output/UserResponse';
import { UserEntity } from '../models/entity/userEntity';
import { mapUserEntityToUserResponse } from './mapperService';
import { UnauthorizedError } from '@models/errors/UnauthorizedError';
import { BadRequestError } from '@models/errors/BadRequestError';

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

  /**
   * Verifies the email code for a user
   * @param email The user's email address
   * @param code The verification code sent to the user
   * @throws UnauthorizedError if email or code is invalid, expired, or already verified
   */
  async verifyEmailCode(email: string, otpCode: string): Promise<void> {

    // Check if already verified first
    if(await userRepository.isUserVerified(email) == true) {
      throw new BadRequestError('Email is already verified.');
    }

    // Verify code matches the stored code for that email
    const isCodeValid = await userRepository.verifyEmailCode(email, otpCode);
    
    if(!isCodeValid) {
      throw new BadRequestError('Invalid verification code');
    }

    // If valid, update user's is_verified flag to true
    await userRepository.updateUserIsVerified(email, true);

     
  }

}

export const authService = new AuthService();