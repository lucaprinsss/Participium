import { userService } from '../../../services/userService';
import { userRepository } from '@repositories/userRepository';
import * as mapperService from '@services/mapperService';
import * as loggingService from '@services/loggingService';
import { BadRequestError } from '@models/errors/BadRequestError';
import { NotFoundError } from '@models/errors/NotFoundError';
import { ConflictError } from '@models/errors/ConflictError';
import { UserEntity } from '@models/entity/userEntity';
import { UserResponse } from '@models/dto/output/UserResponse';
import * as fileUploadUtils from '@utils/fileUploadUtils';

jest.mock('@repositories/userRepository');
jest.mock('@services/mapperService');
jest.mock('@services/loggingService');
jest.mock('@utils/fileUploadUtils');

// Helper to create mock user entity
const createMockUserEntity = (overrides?: Partial<UserEntity>): UserEntity => {
  const mockUser = new UserEntity();
  mockUser.id = 1;
  mockUser.username = 'testuser';
  mockUser.email = 'test@example.com';
  mockUser.firstName = 'Test';
  mockUser. lastName = 'User';
  mockUser.passwordHash = 'hashed_password';
  mockUser.personalPhotoUrl = undefined;
  mockUser.telegramUsername = undefined;
  mockUser.companyId = undefined;
  mockUser.emailNotificationsEnabled = true;
  mockUser.isVerified = true;
  mockUser.verificationCode = undefined;
  mockUser.verificationCodeExpiresAt = undefined;
  mockUser.telegramLinkCode = undefined;
  mockUser.telegramLinkCodeExpiresAt = undefined;
  mockUser.telegramLinkConfirmed = false;
  mockUser.createdAt = new Date();
  mockUser.userRoles = [{
    id:  1,
    userId: 1,
    departmentRoleId: 1,
    departmentRole:  {
      id: 1,
      departmentId: 1,
      roleId: 1,
      department: { id: 1, name: 'Organization', departmentRoles:  [] },
      role: { id: 1, name: 'Citizen', description: 'Citizen role', departmentRoles:  [] },
      userRoles:  []
    },
    createdAt: new Date()
  }] as any;
  return { ...mockUser, ...overrides };
};

// Helper to create mock user response
const createMockUserResponse = (overrides?: Partial<UserResponse>): UserResponse => {
  const mockResponse:  UserResponse = {
    id:  1,
    username: 'testuser',
    email:  'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    roles: [{ department_role_id: 1, department_name: 'Organization', role_name: 'Citizen' }],
    ... overrides,
  };
  return mockResponse;
};

describe('UserService - updateUserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('successful profile updates', () => {
    it('should update firstName successfully', async () => {
      // Arrange
      const userId = 1;
      const updateData = { firstName: 'NewFirstName' };
      const existingUser = createMockUserEntity({ firstName: 'OldFirstName' });
      const updatedUser = createMockUserEntity({ firstName: 'NewFirstName' });
      const mockResponse = createMockUserResponse({ first_name: 'NewFirstName' });

      (userRepository.findUserById as jest.Mock).mockResolvedValue(existingUser);
      (userRepository.updateUser as jest.Mock).mockResolvedValue(updatedUser);
      (mapperService.mapUserEntityToUserResponse as jest.Mock).mockReturnValue(mockResponse);

      // Act
      const result = await userService.updateUserProfile(userId, updateData);

      // Assert
      expect(userRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(userRepository.updateUser).toHaveBeenCalledWith(userId, { firstName: 'NewFirstName' });
      expect(result. first_name).toBe('NewFirstName');
      expect(loggingService.logInfo).toHaveBeenCalledWith('User profile updated: testuser (ID: 1)');
    });

    it('should update lastName successfully', async () => {
      // Arrange
      const userId = 1;
      const updateData = { lastName: 'NewLastName' };
      const existingUser = createMockUserEntity({ lastName: 'OldLastName' });
      const updatedUser = createMockUserEntity({ lastName: 'NewLastName' });
      const mockResponse = createMockUserResponse({ last_name:  'NewLastName' });

      (userRepository.findUserById as jest.Mock).mockResolvedValue(existingUser);
      (userRepository.updateUser as jest.Mock).mockResolvedValue(updatedUser);
      (mapperService.mapUserEntityToUserResponse as jest.Mock).mockReturnValue(mockResponse);

      // Act
      const result = await userService.updateUserProfile(userId, updateData);

      // Assert
      expect(result.last_name).toBe('NewLastName');
    });

    it('should update email with valid format', async () => {
      // Arrange
      const userId = 1;
      const updateData = { email: 'newemail@example.com' };
      const existingUser = createMockUserEntity({ email: 'old@example.com' });
      const updatedUser = createMockUserEntity({ email: 'newemail@example.com' });
      const mockResponse = createMockUserResponse({ email: 'newemail@example.com' });

      (userRepository.findUserById as jest.Mock).mockResolvedValue(existingUser);
      (userRepository.existsUserByEmail as jest.Mock).mockResolvedValue(false);
      (userRepository.updateUser as jest.Mock).mockResolvedValue(updatedUser);
      (mapperService.mapUserEntityToUserResponse as jest. Mock).mockReturnValue(mockResponse);

      // Act
      const result = await userService.updateUserProfile(userId, updateData);

      // Assert
      expect(userRepository.existsUserByEmail).toHaveBeenCalledWith('newemail@example.com');
      expect(result.email).toBe('newemail@example.com');
    });

    it('should update telegram username successfully', async () => {
      // Arrange
      const userId = 1;
      const updateData = { telegramUsername: '@newusername' };
      const existingUser = createMockUserEntity({ telegramUsername: undefined });
      const updatedUser = createMockUserEntity({ telegramUsername: 'newusername' });
      const mockResponse = createMockUserResponse({ telegram_username: 'newusername' });

      (userRepository.findUserById as jest.Mock).mockResolvedValue(existingUser);
      (userRepository.findUserByTelegramUsername as jest.Mock).mockResolvedValue(null);
      (userRepository.updateUser as jest.Mock).mockResolvedValue(updatedUser);
      (mapperService.mapUserEntityToUserResponse as jest. Mock).mockReturnValue(mockResponse);

      // Act
      const result = await userService.updateUserProfile(userId, updateData);

      // Assert
      expect(userRepository.updateUser).toHaveBeenCalledWith(userId, { telegramUsername: 'newusername' });
      expect(result.telegram_username).toBe('newusername');
    });

    it('should update personal photo successfully', async () => {
      // Arrange
      const userId = 1;
      const base64Image = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD... ';
      const updateData = { personalPhoto: base64Image };
      const existingUser = createMockUserEntity({ personalPhotoUrl: undefined });
      const updatedUser = createMockUserEntity({ personalPhotoUrl: '/uploads/users/1/profile. jpg' });
      const mockResponse = createMockUserResponse({ personal_photo_url: '/uploads/users/1/profile.jpg' });

      (userRepository.findUserById as jest.Mock).mockResolvedValue(existingUser);
      (fileUploadUtils.saveBase64Image as jest.Mock).mockResolvedValue('/uploads/users/1/profile.jpg');
      (userRepository.updateUser as jest. Mock).mockResolvedValue(updatedUser);
      (mapperService.mapUserEntityToUserResponse as jest.Mock).mockReturnValue(mockResponse);

      // Act
      const result = await userService.updateUserProfile(userId, updateData);

      // Assert
      expect(fileUploadUtils.saveBase64Image).toHaveBeenCalledWith(base64Image, userId);
      expect(result.personal_photo_url).toBe('/uploads/users/1/profile.jpg');
    });

    it('should update emailNotificationsEnabled successfully', async () => {
      // Arrange
      const userId = 1;
      const updateData = { emailNotificationsEnabled: false };
      const existingUser = createMockUserEntity({ emailNotificationsEnabled: true });
      const updatedUser = createMockUserEntity({ emailNotificationsEnabled: false });
      const mockResponse = createMockUserResponse({ email_notifications_enabled: false });

      (userRepository.findUserById as jest.Mock).mockResolvedValue(existingUser);
      (userRepository.updateUser as jest.Mock).mockResolvedValue(updatedUser);
      (mapperService.mapUserEntityToUserResponse as jest.Mock).mockReturnValue(mockResponse);

      // Act
      const result = await userService.updateUserProfile(userId, updateData);

      // Assert
      expect(result.email_notifications_enabled).toBe(false);
    });

    it('should handle partial updates (only some fields)', async () => {
      // Arrange
      const userId = 1;
      const updateData = { 
        firstName: 'UpdatedFirst',
        emailNotificationsEnabled: false
      };
      const existingUser = createMockUserEntity({
        firstName: 'OldFirst',
        lastName: 'Doe',
        emailNotificationsEnabled: true
      });
      const updatedUser = createMockUserEntity({
        firstName: 'UpdatedFirst',
        lastName: 'Doe',
        emailNotificationsEnabled:  false
      });
      const mockResponse = createMockUserResponse({
        first_name: 'UpdatedFirst',
        last_name: 'Doe',
        email_notifications_enabled: false
      });

      (userRepository.findUserById as jest.Mock).mockResolvedValue(existingUser);
      (userRepository.updateUser as jest.Mock).mockResolvedValue(updatedUser);
      (mapperService.mapUserEntityToUserResponse as jest.Mock).mockReturnValue(mockResponse);

      // Act
      const result = await userService.updateUserProfile(userId, updateData);

      // Assert
      expect(result.first_name).toBe('UpdatedFirst');
      expect(result.last_name).toBe('Doe'); // Unchanged
      expect(result.email_notifications_enabled).toBe(false);
    });

    it('should delete old photo when uploading new one', async () => {
      // Arrange
      const userId = 1;
      const newBase64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...';
      const updateData = { personalPhoto: newBase64Image };
      const existingUser = createMockUserEntity({ personalPhotoUrl: '/uploads/users/1/old-photo.jpg' });
      const updatedUser = createMockUserEntity({ personalPhotoUrl: '/uploads/users/1/new-photo.png' });
      const mockResponse = createMockUserResponse({ personal_photo_url: '/uploads/users/1/new-photo.png' });

      (userRepository. findUserById as jest.Mock).mockResolvedValue(existingUser);
      (fileUploadUtils.deleteImage as jest.Mock).mockReturnValue(undefined);
      (fileUploadUtils.saveBase64Image as jest.Mock).mockResolvedValue('/uploads/users/1/new-photo.png');
      (userRepository.updateUser as jest.Mock).mockResolvedValue(updatedUser);
      (mapperService.mapUserEntityToUserResponse as jest.Mock).mockReturnValue(mockResponse);

      // Act
      await userService.updateUserProfile(userId, updateData);

      // Assert
      expect(fileUploadUtils.deleteImage).toHaveBeenCalledWith('/uploads/users/1/old-photo.jpg');
      expect(fileUploadUtils.saveBase64Image).toHaveBeenCalledWith(newBase64Image, userId);
    });

    it('should remove personal photo when set to null', async () => {
      // Arrange
      const userId = 1;
      const updateData = { personalPhoto: null as any };
      const existingUser = createMockUserEntity({ personalPhotoUrl: '/uploads/users/1/photo.jpg' });
      const updatedUser = createMockUserEntity({ personalPhotoUrl: undefined });
      const mockResponse = createMockUserResponse({ personal_photo_url: undefined });

      (userRepository.findUserById as jest.Mock).mockResolvedValue(existingUser);
      (fileUploadUtils.deleteImage as jest.Mock).mockReturnValue(undefined);
      (userRepository.updateUser as jest.Mock).mockResolvedValue(updatedUser);
      (mapperService.mapUserEntityToUserResponse as jest.Mock).mockReturnValue(mockResponse);

      // Act
      const result = await userService.updateUserProfile(userId, updateData);

      // Assert
      expect(fileUploadUtils.deleteImage).toHaveBeenCalledWith('/uploads/users/1/photo.jpg');
      expect(result. personal_photo_url).toBeUndefined();
    });

    it('should remove telegram username when set to null', async () => {
      // Arrange
      const userId = 1;
      const updateData = { telegramUsername: null as any };
      const existingUser = createMockUserEntity({ telegramUsername: 'oldusername' });
      const updatedUser = createMockUserEntity({ telegramUsername: undefined });
      const mockResponse = createMockUserResponse({ telegram_username: undefined });

      (userRepository.findUserById as jest.Mock).mockResolvedValue(existingUser);
      (userRepository.updateUser as jest.Mock).mockResolvedValue(updatedUser);
      (mapperService.mapUserEntityToUserResponse as jest. Mock).mockReturnValue(mockResponse);

      // Act
      const result = await userService.updateUserProfile(userId, updateData);

      // Assert
      expect(result.telegram_username).toBeUndefined();
    });
  });

  describe('validation errors', () => {
    it('should throw BadRequestError for empty firstName', async () => {
      // Arrange
      const userId = 1;
      const updateData = { firstName: '   ' }; // Only whitespace
      const existingUser = createMockUserEntity();

      (userRepository.findUserById as jest.Mock).mockResolvedValue(existingUser);

      // Act & Assert
      await expect(userService.updateUserProfile(userId, updateData)).rejects.toThrow(BadRequestError);
      await expect(userService.updateUserProfile(userId, updateData)).rejects.toThrow('First name cannot be empty');
    });

    it('should throw BadRequestError for empty lastName', async () => {
      // Arrange
      const userId = 1;
      const updateData = { lastName: '' };
      const existingUser = createMockUserEntity();

      (userRepository.findUserById as jest.Mock).mockResolvedValue(existingUser);

      // Act & Assert
      await expect(userService.updateUserProfile(userId, updateData)).rejects.toThrow(BadRequestError);
      await expect(userService.updateUserProfile(userId, updateData)).rejects.toThrow('Last name cannot be empty');
    });

    it('should throw BadRequestError for invalid email format', async () => {
      // Arrange
      const userId = 1;
      const updateData = { email: 'invalid-email' };
      const existingUser = createMockUserEntity();

      (userRepository.findUserById as jest.Mock).mockResolvedValue(existingUser);

      // Act & Assert
      await expect(userService.updateUserProfile(userId, updateData)).rejects.toThrow(BadRequestError);
      await expect(userService.updateUserProfile(userId, updateData)).rejects.toThrow('Invalid email format');
    });

    it('should throw BadRequestError for invalid base64 image format', async () => {
      // Arrange
      const userId = 1;
      const updateData = { personalPhoto: 'not-a-valid-base64-image' };
      const existingUser = createMockUserEntity();

      (userRepository.findUserById as jest.Mock).mockResolvedValue(existingUser);

      // Act & Assert
      await expect(userService.updateUserProfile(userId, updateData)).rejects.toThrow(BadRequestError);
      await expect(userService.updateUserProfile(userId, updateData)).rejects.toThrow(/Invalid photo format/);
    });

    it('should throw BadRequestError for invalid telegram username format', async () => {
      // Arrange
      const userId = 1;
      const updateData = { telegramUsername: 'ab' }; // Too short (< 5 chars)
      const existingUser = createMockUserEntity();

      (userRepository. findUserById as jest.Mock).mockResolvedValue(existingUser);

      // Act & Assert
      await expect(userService. updateUserProfile(userId, updateData)).rejects.toThrow(BadRequestError);
      await expect(userService.updateUserProfile(userId, updateData)).rejects.toThrow(/Invalid Telegram username format/);
    });

    it('should throw BadRequestError for telegram username with invalid characters', async () => {
      // Arrange
      const userId = 1;
      const updateData = { telegramUsername: 'user@name!' }; // Invalid characters
      const existingUser = createMockUserEntity();

      (userRepository. findUserById as jest.Mock).mockResolvedValue(existingUser);

      // Act & Assert
      await expect(userService. updateUserProfile(userId, updateData)).rejects.toThrow(BadRequestError);
      await expect(userService.updateUserProfile(userId, updateData)).rejects.toThrow(/Invalid Telegram username format/);
    });
  });

  describe('user not found', () => {
    it('should throw NotFoundError when user does not exist', async () => {
      // Arrange
      const userId = 999;
      const updateData = { firstName: 'Test' };

      (userRepository. findUserById as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(userService.updateUserProfile(userId, updateData)).rejects.toThrow(NotFoundError);
      await expect(userService.updateUserProfile(userId, updateData)).rejects.toThrow('User not found');
      expect(userRepository.updateUser).not.toHaveBeenCalled();
    });
  });

  describe('uniqueness constraints', () => {
    it('should throw ConflictError when email already exists', async () => {
      // Arrange
      const userId = 1;
      const updateData = { email: 'taken@example.com' };
      const existingUser = createMockUserEntity({ email: 'old@example.com' });

      (userRepository.findUserById as jest.Mock).mockResolvedValue(existingUser);
      (userRepository.existsUserByEmail as jest.Mock).mockResolvedValue(true);

      // Act & Assert
      await expect(userService.updateUserProfile(userId, updateData)).rejects.toThrow(ConflictError);
      await expect(userService.updateUserProfile(userId, updateData)).rejects.toThrow('Email already in use');
    });

    it('should not check email uniqueness when email is unchanged', async () => {
      // Arrange
      const userId = 1;
      const sameEmail = 'test@example.com';
      const updateData = { email: sameEmail, firstName: 'NewName' };
      const existingUser = createMockUserEntity({ email: sameEmail });
      const updatedUser = createMockUserEntity({ email: sameEmail, firstName: 'NewName' });
      const mockResponse = createMockUserResponse({ email: sameEmail, first_name: 'NewName' });

      (userRepository. findUserById as jest.Mock).mockResolvedValue(existingUser);
      (userRepository. updateUser as jest.Mock).mockResolvedValue(updatedUser);
      (mapperService.mapUserEntityToUserResponse as jest.Mock).mockReturnValue(mockResponse);

      // Act
      await userService.updateUserProfile(userId, updateData);

      // Assert
      expect(userRepository.existsUserByEmail).not.toHaveBeenCalled();
    });

    it('should throw BadRequestError when telegram username is taken by another user', async () => {
      // Arrange
      const userId = 1;
      const updateData = { telegramUsername: 'takenusername' };
      const existingUser = createMockUserEntity({ id: 1 });
      const otherUser = createMockUserEntity({ id: 2, telegramUsername: 'takenusername' });

      (userRepository.findUserById as jest.Mock).mockResolvedValue(existingUser);
      (userRepository.findUserByTelegramUsername as jest.Mock).mockResolvedValue(otherUser);

      // Act & Assert
      await expect(userService.updateUserProfile(userId, updateData)).rejects.toThrow(BadRequestError);
      await expect(userService.updateUserProfile(userId, updateData)).rejects.toThrow('Telegram username already in use by another user');
    });

    it('should allow user to keep their own telegram username', async () => {
      // Arrange
      const userId = 1;
      const updateData = { telegramUsername: 'myusername', firstName: 'NewName' };
      const existingUser = createMockUserEntity({ id: 1, telegramUsername: 'myusername' });
      const updatedUser = createMockUserEntity({ id: 1, telegramUsername: 'myusername', firstName: 'NewName' });
      const mockResponse = createMockUserResponse({ telegram_username: 'myusername', first_name: 'NewName' });

      (userRepository.findUserById as jest. Mock).mockResolvedValue(existingUser);
      (userRepository.findUserByTelegramUsername as jest.Mock).mockResolvedValue(existingUser); // Same user
      (userRepository.updateUser as jest.Mock).mockResolvedValue(updatedUser);
      (mapperService.mapUserEntityToUserResponse as jest.Mock).mockReturnValue(mockResponse);

      // Act
      const result = await userService.updateUserProfile(userId, updateData);

      // Assert
      expect(result.telegram_username).toBe('myusername');
    });
  });

  describe('telegram username sanitization', () => {
    it('should remove @ symbol from telegram username', async () => {
      // Arrange
      const userId = 1;
      const updateData = { telegramUsername: '@username123' };
      const existingUser = createMockUserEntity();
      const updatedUser = createMockUserEntity({ telegramUsername: 'username123' });
      const mockResponse = createMockUserResponse({ telegram_username: 'username123' });

      (userRepository.findUserById as jest.Mock).mockResolvedValue(existingUser);
      (userRepository.findUserByTelegramUsername as jest.Mock).mockResolvedValue(null);
      (userRepository.updateUser as jest.Mock).mockResolvedValue(updatedUser);
      (mapperService.mapUserEntityToUserResponse as jest. Mock).mockReturnValue(mockResponse);

      // Act
      await userService.updateUserProfile(userId, updateData);

      // Assert
      expect(userRepository.updateUser).toHaveBeenCalledWith(userId, { telegramUsername: 'username123' });
    });

    it('should convert telegram username to lowercase', async () => {
      // Arrange
      const userId = 1;
      const updateData = { telegramUsername: 'UserName123' };
      const existingUser = createMockUserEntity();
      const updatedUser = createMockUserEntity({ telegramUsername: 'username123' });
      const mockResponse = createMockUserResponse({ telegram_username:  'username123' });

      (userRepository.findUserById as jest.Mock).mockResolvedValue(existingUser);
      (userRepository.findUserByTelegramUsername as jest.Mock).mockResolvedValue(null);
      (userRepository.updateUser as jest.Mock).mockResolvedValue(updatedUser);
      (mapperService.mapUserEntityToUserResponse as jest.Mock).mockReturnValue(mockResponse);

      // Act
      await userService.updateUserProfile(userId, updateData);

      // Assert
      expect(userRepository.updateUser).toHaveBeenCalledWith(userId, { telegramUsername: 'username123' });
    });
  });

  describe('file upload errors', () => {
    it('should throw BadRequestError when photo save fails', async () => {
      // Arrange
      const userId = 1;
      const updateData = { personalPhoto: 'data:image/jpeg;base64,validbase64data' };
      const existingUser = createMockUserEntity();

      (userRepository.findUserById as jest.Mock).mockResolvedValue(existingUser);
      (fileUploadUtils.saveBase64Image as jest.Mock).mockRejectedValue(new Error('Disk full'));

      // Act & Assert
      await expect(userService.updateUserProfile(userId, updateData)).rejects.toThrow(BadRequestError);
      await expect(userService.updateUserProfile(userId, updateData)).rejects.toThrow(/Failed to save photo/);
    });

    it('should rethrow BadRequestError from saveBase64Image', async () => {
      // Arrange
      const userId = 1;
      const updateData = { personalPhoto: 'data:image/jpeg;base64,validbase64data' };
      const existingUser = createMockUserEntity();
      const badRequestError = new BadRequestError('Image too large');
      (badRequestError as any).statusCode = 400;

      (userRepository.findUserById as jest.Mock).mockResolvedValue(existingUser);
      (fileUploadUtils.saveBase64Image as jest.Mock).mockRejectedValue(badRequestError);

      // Act & Assert
      await expect(userService.updateUserProfile(userId, updateData)).rejects.toThrow(BadRequestError);
      await expect(userService.updateUserProfile(userId, updateData)).rejects.toThrow('Image too large');
    });
  });

  describe('edge cases', () => {
    it('should handle update with no fields changed', async () => {
      // Arrange
      const userId = 1;
      const updateData = {}; // Empty update
      const existingUser = createMockUserEntity();
      const mockResponse = createMockUserResponse();

      (userRepository.findUserById as jest.Mock).mockResolvedValue(existingUser);
      (userRepository.updateUser as jest.Mock).mockResolvedValue(existingUser);
      (mapperService.mapUserEntityToUserResponse as jest.Mock).mockReturnValue(mockResponse);

      // Act
      const result = await userService.updateUserProfile(userId, updateData);

      // Assert
      expect(userRepository.updateUser).not.toHaveBeenCalledWith();
      expect(result).toEqual(mockResponse);
    });

    it('should handle special characters in name fields', async () => {
      // Arrange
      const userId = 1;
      const updateData = {
        firstName: "Jean-Pierre",
        lastName: "O'Brien-Smith"
      };
      const existingUser = createMockUserEntity();
      const updatedUser = createMockUserEntity(updateData);
      const mockResponse = createMockUserResponse({
        first_name: "Jean-Pierre",
        last_name: "O'Brien-Smith"
      });

      (userRepository.findUserById as jest.Mock).mockResolvedValue(existingUser);
      (userRepository.updateUser as jest.Mock).mockResolvedValue(updatedUser);
      (mapperService.mapUserEntityToUserResponse as jest.Mock).mockReturnValue(mockResponse);

      // Act
      const result = await userService.updateUserProfile(userId, updateData);

      // Assert
      expect(result.first_name).toBe("Jean-Pierre");
      expect(result.last_name).toBe("O'Brien-Smith");
    });

    it('should handle update of all fields at once', async () => {
      // Arrange
      const userId = 1;
      const updateData = {
        firstName: 'New',
        lastName: 'Name',
        email: 'new@example.com',
        telegramUsername: 'newuser',
        emailNotificationsEnabled: false,
        personalPhoto: 'data:image/png;base64,validdata'
      };
      const existingUser = createMockUserEntity();
      const updatedUser = createMockUserEntity({
        firstName: 'New',
        lastName: 'Name',
        email: 'new@example.com',
        telegramUsername: 'newuser',
        emailNotificationsEnabled: false,
        personalPhotoUrl: '/uploads/users/1/photo.png'
      });
      const mockResponse = createMockUserResponse({
        first_name: 'New',
        last_name:  'Name',
        email:  'new@example.com',
        telegram_username: 'newuser',
        email_notifications_enabled:  false,
        personal_photo_url: '/uploads/users/1/photo.png'
      });

      (userRepository.findUserById as jest.Mock).mockResolvedValue(existingUser);
      (userRepository.existsUserByEmail as jest.Mock).mockResolvedValue(false);
      (userRepository.findUserByTelegramUsername as jest.Mock).mockResolvedValue(null);
      (fileUploadUtils.saveBase64Image as jest.Mock).mockResolvedValue('/uploads/users/1/photo.png');
      (userRepository. updateUser as jest.Mock).mockResolvedValue(updatedUser);
      (mapperService. mapUserEntityToUserResponse as jest.Mock).mockReturnValue(mockResponse);

      // Act
      const result = await userService. updateUserProfile(userId, updateData);

      // Assert
      expect(result.first_name).toBe('New');
      expect(result.last_name).toBe('Name');
      expect(result.email).toBe('new@example.com');
      expect(result.telegram_username).toBe('newuser');
      expect(result.email_notifications_enabled).toBe(false);
      expect(result.personal_photo_url).toBe('/uploads/users/1/photo.png');
    });
  });

  describe('repository errors', () => {
    it('should propagate errors from userRepository.findUserById', async () => {
      // Arrange
      const userId = 1;
      const updateData = { firstName: 'Test' };
      const error = new Error('Database connection error');

      (userRepository.findUserById as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(userService.updateUserProfile(userId, updateData)).rejects.toThrow('Database connection error');
    });

    it('should propagate errors from userRepository.updateUser', async () => {
      // Arrange
      const userId = 1;
      const updateData = { firstName:  'Test' };
      const existingUser = createMockUserEntity();
      const error = new Error('Update failed');

      (userRepository. findUserById as jest.Mock).mockResolvedValue(existingUser);
      (userRepository. updateUser as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(userService.updateUserProfile(userId, updateData)).rejects.toThrow('Update failed');
    });
  });
});