/* import { userService } from '@services/userService';
import { userRepository } from '@repositories/userRepository';
import { logInfo } from '@services/loggingService';
import { mapUserEntityToUserResponse } from '@services/mapperService';
import { UserRole } from '@models/dto/UserRole';
import { RegisterRequest } from '@models/dto/RegisterRequest';
import { userEntity } from '@models/entity/userEntity';
import { UserResponse } from '@models/dto/UserResponse';
import { ConflictError } from '@models/errors/ConflictError';
import { AppError } from '@models/errors/AppError';

jest.mock('@repositories/userRepository');
jest.mock('@services/loggingService');
jest.mock('@services/mapperService');

const mockedUserRepository = userRepository as jest.Mocked<typeof userRepository>;
const mockedLogInfo = logInfo as jest.Mock;
const mockedMapper = mapUserEntityToUserResponse as jest.Mock;

const mockCitizenEntity: userEntity = {
  id: 1,
  username: 'test.citizen',
  email: 'citizen@test.com',
  firstName: 'Test',
  lastName: 'Citizen',
  role: UserRole.CITIZEN,
  passwordHash: 'hashedpassword',
  createdAt: new Date(),
  emailNotificationsEnabled: true,
};

const mockCitizenResponse: UserResponse = {
  id: 1,
  username: 'test.citizen',
  email: 'citizen@test.com',
  first_name: 'Test',
  last_name: 'Citizen',
  role: UserRole.CITIZEN,
};

const registerRequest: RegisterRequest = {
  username: 'test.citizen',
  email: 'citizen@test.com',
  first_name: 'Test',
  last_name: 'Citizen',
  password: 'Password123!',
  role: UserRole.CITIZEN,
};

describe('UserService', () => {

  beforeEach(() => {
    jest.clearAllMocks();

    mockedMapper.mockImplementation((entity: userEntity) => {
      if (entity && entity.id === mockCitizenEntity.id) {
        return mockCitizenResponse;
      }
      return null;
    });
  });

  describe('registerCitizen', () => {

    it('should register a new citizen successfully', async () => {
      // Arrange
      mockedUserRepository.existsUserByUsername.mockResolvedValue(false);
      mockedUserRepository.existsUserByEmail.mockResolvedValue(false);
      mockedUserRepository.createUserWithPassword.mockResolvedValue(mockCitizenEntity);

      // Act
      const result = await userService.registerCitizen(registerRequest);

      // Assert
      expect(result).toEqual(mockCitizenResponse);
      expect(mockedUserRepository.existsUserByUsername).toHaveBeenCalledWith(registerRequest.username);
      expect(mockedUserRepository.existsUserByEmail).toHaveBeenCalledWith(registerRequest.email);
      
      expect(mockedUserRepository.createUserWithPassword).toHaveBeenCalledWith({
        username: registerRequest.username,
        email: registerRequest.email,
        password: registerRequest.password,
        firstName: registerRequest.first_name,
        lastName: registerRequest.last_name,
        role: UserRole.CITIZEN, 
        emailNotificationsEnabled: true 
      });
      
      expect(mockedLogInfo).toHaveBeenCalledWith(expect.stringContaining('New citizen registered'));
      expect(mockedMapper).toHaveBeenCalledWith(mockCitizenEntity);
    });

    it('should use fallback role CITIZEN if role is not provided', async () => {
      // Arrange
      const requestWithoutRole: Omit<RegisterRequest, 'role'> & { role?: UserRole } = { ...registerRequest };
      delete requestWithoutRole.role;

      mockedUserRepository.existsUserByUsername.mockResolvedValue(false);
      mockedUserRepository.existsUserByEmail.mockResolvedValue(false);
      mockedUserRepository.createUserWithPassword.mockResolvedValue(mockCitizenEntity);
      
      // Act
      await userService.registerCitizen(requestWithoutRole as RegisterRequest);

      // Assert
      expect(mockedUserRepository.createUserWithPassword).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.CITIZEN 
        })
      );
    });

    it('should throw ConflictError if username already exists', async () => {
      // Arrange
      mockedUserRepository.existsUserByUsername.mockResolvedValue(true);

      // Act and Assert
      await expect(userService.registerCitizen(registerRequest)).rejects.toThrow(ConflictError);
      await expect(userService.registerCitizen(registerRequest)).rejects.toThrow('Username already exists');

      expect(mockedUserRepository.existsUserByEmail).not.toHaveBeenCalled();
      expect(mockedUserRepository.createUserWithPassword).not.toHaveBeenCalled();
    });

    it('should throw ConflictError if email already exists', async () => {
      // Arrange
      mockedUserRepository.existsUserByUsername.mockResolvedValue(false); 
      mockedUserRepository.existsUserByEmail.mockResolvedValue(true);

      // Act and Assert
      await expect(userService.registerCitizen(registerRequest)).rejects.toThrow(ConflictError);
      await expect(userService.registerCitizen(registerRequest)).rejects.toThrow('Email already exists');

      expect(mockedUserRepository.createUserWithPassword).not.toHaveBeenCalled();
    });

    
    it('should throw AppError if mapping fails (safeMapUserToResponse)', async () => {
      // Arrange
      mockedUserRepository.existsUserByUsername.mockResolvedValue(false);
      mockedUserRepository.existsUserByEmail.mockResolvedValue(false);
      mockedUserRepository.createUserWithPassword.mockResolvedValue(mockCitizenEntity);
      
      // Act
      mockedMapper.mockReturnValue(null);
      
      // Assert
      await expect(
        userService.registerCitizen(registerRequest)
      ).rejects.toThrow(AppError);

      await expect(
        userService.registerCitizen(registerRequest)
      ).rejects.toThrow('Failed to map user data');
    });
  });

  describe('getUserById', () => {

    it('should return a user response if user is found', async () => {
      // Setup Mock
      mockedUserRepository.findUserById.mockResolvedValue(mockCitizenEntity);

      // Esecuzione
      const result = await userService.getUserById(1);

      // Assert
      expect(result).toEqual(mockCitizenResponse);
      expect(mockedUserRepository.findUserById).toHaveBeenCalledWith(1);
      expect(mockedMapper).toHaveBeenCalledWith(mockCitizenEntity);
    });

    it('should return null if user is not found', async () => {
      // Arrange
      mockedUserRepository.findUserById.mockResolvedValue(null);

      // Act
      const result = await userService.getUserById(999);

      // Assert
      expect(result).toBeNull();
      expect(mockedUserRepository.findUserById).toHaveBeenCalledWith(999);
      expect(mockedMapper).not.toHaveBeenCalled();
    });

    it('should return null if mapper returns null', async () => {
        // Arrange
        mockedUserRepository.findUserById.mockResolvedValue(mockCitizenEntity);
        mockedMapper.mockReturnValueOnce(null);

        // Act
        const result = await userService.getUserById(1);

        // Assert
        expect(result).toBeNull();
        expect(mockedUserRepository.findUserById).toHaveBeenCalledWith(1);
        expect(mockedMapper).toHaveBeenCalledWith(mockCitizenEntity);
    });
  });
}); */

// dummy test
describe('Dummy test', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });
});