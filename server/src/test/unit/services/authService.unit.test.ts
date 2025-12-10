import { authService } from '../../../services/authService';
import { userRepository } from '@repositories/userRepository';
import { BadRequestError } from '@models/errors/BadRequestError';
import { UserEntity } from '@models/entity/userEntity';

jest.mock('@repositories/userRepository');

// Helper to create mock user entity
const createMockUserEntity = (overrides?: Partial<UserEntity>): UserEntity => {
  const mockUser = new UserEntity();
  mockUser.id = 1;
  mockUser.username = 'testuser';
  mockUser.email = 'test@example.com';
  mockUser.firstName = 'Test';
  mockUser.lastName = 'User';
  mockUser.passwordHash = 'hashed_password';
  mockUser.departmentRoleId = 1;
  mockUser.isVerified = false;
  mockUser.emailNotificationsEnabled = true;
  mockUser.createdAt = new Date();
  mockUser.verificationCode = '123456';
  mockUser.verificationCodeExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
  return { ...mockUser, ...overrides };
};

describe('AuthService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyEmailCode', () => {
    const email = 'test@example.com';
    const validCode = '123456';

    it('should verify email successfully with valid code', async () => {
      // Arrange
      (userRepository.isUserVerified as jest.Mock).mockResolvedValue(false);
      (userRepository.verifyEmailCode as jest.Mock).mockResolvedValue(true);
      (userRepository.updateUserIsVerified as jest.Mock).mockResolvedValue(undefined);

      // Act
      await authService.verifyEmailCode(email, validCode);

      // Assert
      expect(userRepository.isUserVerified).toHaveBeenCalledWith(email);
      expect(userRepository.verifyEmailCode).toHaveBeenCalledWith(email, validCode);
      expect(userRepository.updateUserIsVerified).toHaveBeenCalledWith(email, true);
    });

    it('should throw BadRequestError when email is already verified', async () => {
      // Arrange
      (userRepository.isUserVerified as jest.Mock).mockResolvedValue(true);

      // Act & Assert
      await expect(authService.verifyEmailCode(email, validCode)).rejects.toThrow(
        BadRequestError
      );
      await expect(authService.verifyEmailCode(email, validCode)).rejects.toThrow(
        'Email is already verified.'
      );

      expect(userRepository.isUserVerified).toHaveBeenCalledWith(email);
      expect(userRepository.verifyEmailCode).not.toHaveBeenCalled();
      expect(userRepository.updateUserIsVerified).not.toHaveBeenCalled();
    });

    it('should throw BadRequestError when verification code is invalid', async () => {
      // Arrange
      (userRepository.isUserVerified as jest.Mock).mockResolvedValue(false);
      (userRepository.verifyEmailCode as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(authService.verifyEmailCode(email, validCode)).rejects.toThrow(
        BadRequestError
      );
      await expect(authService.verifyEmailCode(email, validCode)).rejects.toThrow(
        'Invalid verification code'
      );

      expect(userRepository.verifyEmailCode).toHaveBeenCalledWith(email, validCode);
      expect(userRepository.updateUserIsVerified).not.toHaveBeenCalled();
    });

    it('should throw error when verification code is expired', async () => {
      // Arrange
      const expiredError = new BadRequestError('Verification code has expired. Please request a new code.');
      (userRepository.isUserVerified as jest.Mock).mockResolvedValue(false);
      (userRepository.verifyEmailCode as jest.Mock).mockRejectedValue(expiredError);

      // Act & Assert
      await expect(authService.verifyEmailCode(email, validCode)).rejects.toThrow(
        'Verification code has expired'
      );

      expect(userRepository.verifyEmailCode).toHaveBeenCalledWith(email, validCode);
      expect(userRepository.updateUserIsVerified).not.toHaveBeenCalled();
    });

    it('should not call updateUserIsVerified when code verification fails', async () => {
      // Arrange
      (userRepository.isUserVerified as jest.Mock).mockResolvedValue(false);
      (userRepository.verifyEmailCode as jest.Mock).mockResolvedValue(false);

      // Act
      try {
        await authService.verifyEmailCode(email, validCode);
      } catch (error) {
        // Expected to throw
      }

      // Assert
      expect(userRepository.updateUserIsVerified).not.toHaveBeenCalled();
    });
  });

  describe('createUserResponse', () => {
    it('should map user entity to UserResponse correctly', () => {
      // Arrange
      const mockUser = createMockUserEntity({
        id: 5,
        username: 'mario.rossi',
        email: 'mario@example.com',
        firstName: 'Mario',
        lastName: 'Rossi',
      });
      mockUser.departmentRole = {
        id: 1,
        departmentId: 1,
        roleId: 1,
        department: { id: 1, name: 'Organization', departmentRoles: [] },
        role: { id: 1, name: 'Citizen', description: 'Citizen role', departmentRoles: [] },
        users: [],
      };

      // Act
      const result = authService.createUserResponse(mockUser as Express.User);

      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe(5);
      expect(result?.username).toBe('mario.rossi');
      expect(result?.email).toBe('mario@example.com');
      expect(result?.first_name).toBe('Mario');
      expect(result?.last_name).toBe('Rossi');
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('verificationCode');
    });

    it('should return null when user is null', () => {
      // Act
      const result = authService.createUserResponse(null);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when user is undefined', () => {
      // Act
      const result = authService.createUserResponse(undefined);

      // Assert
      expect(result).toBeNull();
    });
  });
});
