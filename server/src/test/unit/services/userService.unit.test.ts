import { userService } from '../../../services/userService';
import { userRepository } from '@repositories/userRepository';
import { departmentRoleRepository } from '@repositories/departmentRoleRepository';
import * as mapperService from '@services/mapperService';
import * as loggingService from '@services/loggingService';
import { ConflictError } from '@models/errors/ConflictError';
import { AppError } from '@models/errors/AppError';
import { RegisterRequest } from '@models/dto/input/RegisterRequest';
import { UserEntity } from '@models/entity/userEntity';
import { UserResponse } from '@models/dto/output/UserResponse';

jest.mock('@repositories/userRepository');
jest.mock('@repositories/departmentRoleRepository');
jest.mock('@services/mapperService');
jest.mock('@services/loggingService');

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
  mockUser.isVerified = true;
  mockUser.emailNotificationsEnabled = true;
  mockUser.createdAt = new Date();
  return { ...mockUser, ...overrides };
};

// Helper to create mock user response
const createMockUserResponse = (overrides?: Partial<UserResponse>): UserResponse => {
  const mockResponse: UserResponse = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    ...overrides,
  };
  return mockResponse;
};

// Helper to create mock department role
const createMockDepartmentRole = (overrides?: any): any => {
  return {
    id: 1,
    department: { id: 1, name: 'Organization' },
    role: { id: 1, name: 'Citizen' },
    ...overrides,
  };
};

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerCitizen', () => {
    const validRegisterData: RegisterRequest = {
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      first_name: 'New',
      last_name: 'User',
      role_name: 'Citizen',
      department_name: 'Organization',
    };

    describe('successful registration', () => {
      it('should register a new citizen with valid data', async () => {
        // Arrange
        const mockUser = createMockUserEntity({ id: 10, username: 'newuser' });
        const mockResponse = createMockUserResponse({ id: 10, username: 'newuser' });
        const mockDepartmentRole = createMockDepartmentRole();

        (userRepository.existsUserByUsername as jest.Mock).mockResolvedValue(false);
        (userRepository.existsUserByEmail as jest.Mock).mockResolvedValue(false);
        (departmentRoleRepository.findByDepartmentAndRole as jest.Mock).mockResolvedValue(
          mockDepartmentRole
        );
        (userRepository.createUserWithPassword as jest.Mock).mockResolvedValue(mockUser);
        (mapperService.mapUserEntityToUserResponse as jest.Mock).mockReturnValue(mockResponse);

        // Act
        const result = await userService.registerCitizen(validRegisterData);

        // Assert
        expect(userRepository.existsUserByUsername).toHaveBeenCalledWith('newuser');
        expect(userRepository.existsUserByEmail).toHaveBeenCalledWith('newuser@example.com');
        expect(departmentRoleRepository.findByDepartmentAndRole).toHaveBeenCalledWith(
          'Organization',
          'Citizen'
        );
        expect(userRepository.createUserWithPassword).toHaveBeenCalledWith({
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'SecurePass123!',
          firstName: 'New',
          lastName: 'User',
          departmentRoleId: 1,
          emailNotificationsEnabled: true,
          isVerified: false,
        });
        expect(result).toEqual(mockResponse);
        expect(loggingService.logInfo).toHaveBeenCalledWith('New citizen registered: newuser (ID: 10)');
      });

      it('should use default values for role_name and department_name if not provided', async () => {
        // Arrange
        const registerDataWithoutDefaults: RegisterRequest = {
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'SecurePass123!',
          first_name: 'New',
          last_name: 'User',
          role_name: 'Citizen',
        };

        const mockUser = createMockUserEntity({ id: 10 });
        const mockResponse = createMockUserResponse({ id: 10 });
        const mockDepartmentRole = createMockDepartmentRole();

        (userRepository.existsUserByUsername as jest.Mock).mockResolvedValue(false);
        (userRepository.existsUserByEmail as jest.Mock).mockResolvedValue(false);
        (departmentRoleRepository.findByDepartmentAndRole as jest.Mock).mockResolvedValue(
          mockDepartmentRole
        );
        (userRepository.createUserWithPassword as jest.Mock).mockResolvedValue(mockUser);
        (mapperService.mapUserEntityToUserResponse as jest.Mock).mockReturnValue(mockResponse);

        // Act
        await userService.registerCitizen(registerDataWithoutDefaults);

        // Assert
        expect(departmentRoleRepository.findByDepartmentAndRole).toHaveBeenCalledWith(
          'Organization',
          'Citizen'
        );
      });
    });

    describe('duplicate username', () => {
      it('should throw ConflictError if username already exists', async () => {
        // Arrange
        (userRepository.existsUserByUsername as jest.Mock).mockResolvedValue(true);

        // Act & Assert
        await expect(userService.registerCitizen(validRegisterData)).rejects.toThrow(
          ConflictError
        );
        await expect(userService.registerCitizen(validRegisterData)).rejects.toThrow(
          'Username already exists'
        );
        expect(userRepository.existsUserByEmail).not.toHaveBeenCalled();
      });
    });

    describe('duplicate email', () => {
      it('should throw ConflictError if email already exists', async () => {
        // Arrange
        (userRepository.existsUserByUsername as jest.Mock).mockResolvedValue(false);
        (userRepository.existsUserByEmail as jest.Mock).mockResolvedValue(true);

        // Act & Assert
        await expect(userService.registerCitizen(validRegisterData)).rejects.toThrow(
          ConflictError
        );
        await expect(userService.registerCitizen(validRegisterData)).rejects.toThrow(
          'Email already exists'
        );
        expect(departmentRoleRepository.findByDepartmentAndRole).not.toHaveBeenCalled();
      });
    });

    describe('missing department role configuration', () => {
      it('should throw AppError if citizen role configuration not found', async () => {
        // Arrange
        (userRepository.existsUserByUsername as jest.Mock).mockResolvedValue(false);
        (userRepository.existsUserByEmail as jest.Mock).mockResolvedValue(false);
        (departmentRoleRepository.findByDepartmentAndRole as jest.Mock).mockResolvedValue(null);

        // Act & Assert
        await expect(userService.registerCitizen(validRegisterData)).rejects.toThrow(
          AppError
        );
        await expect(userService.registerCitizen(validRegisterData)).rejects.toThrow(
          'Citizen role configuration not found in database'
        );
        expect(userRepository.createUserWithPassword).not.toHaveBeenCalled();
      });
    });

    describe('mapper failure', () => {
      it('should throw AppError if user mapping fails', async () => {
        // Arrange
        const mockUser = createMockUserEntity();
        const mockDepartmentRole = createMockDepartmentRole();

        (userRepository.existsUserByUsername as jest.Mock).mockResolvedValue(false);
        (userRepository.existsUserByEmail as jest.Mock).mockResolvedValue(false);
        (departmentRoleRepository.findByDepartmentAndRole as jest.Mock).mockResolvedValue(
          mockDepartmentRole
        );
        (userRepository.createUserWithPassword as jest.Mock).mockResolvedValue(mockUser);
        (mapperService.mapUserEntityToUserResponse as jest.Mock).mockReturnValue(null);

        // Act & Assert
        await expect(userService.registerCitizen(validRegisterData)).rejects.toThrow(
          AppError
        );
        await expect(userService.registerCitizen(validRegisterData)).rejects.toThrow(
          'Failed to map user data'
        );
      });
    });

    describe('repository errors', () => {
      it('should propagate errors from userRepository.existsUserByUsername', async () => {
        // Arrange
        const error = new Error('Database connection error');
        (userRepository.existsUserByUsername as jest.Mock).mockRejectedValue(error);

        // Act & Assert
        await expect(userService.registerCitizen(validRegisterData)).rejects.toThrow(
          'Database connection error'
        );
      });

      it('should propagate errors from userRepository.createUserWithPassword', async () => {
        // Arrange
        const error = new Error('Failed to create user');
        const mockDepartmentRole = createMockDepartmentRole();

        (userRepository.existsUserByUsername as jest.Mock).mockResolvedValue(false);
        (userRepository.existsUserByEmail as jest.Mock).mockResolvedValue(false);
        (departmentRoleRepository.findByDepartmentAndRole as jest.Mock).mockResolvedValue(
          mockDepartmentRole
        );
        (userRepository.createUserWithPassword as jest.Mock).mockRejectedValue(error);

        // Act & Assert
        await expect(userService.registerCitizen(validRegisterData)).rejects.toThrow(
          'Failed to create user'
        );
      });
    });

    describe('edge cases', () => {
      it('should handle registration with special characters in name', async () => {
        // Arrange
        const specialCharData: RegisterRequest = {
          ...validRegisterData,
          first_name: "Jean-Pierre",
          last_name: "O'Brien",
        };

        const mockUser = createMockUserEntity({
          firstName: "Jean-Pierre",
          lastName: "O'Brien",
        });
        const mockResponse = createMockUserResponse({
          first_name: "Jean-Pierre",
          last_name: "O'Brien",
        });
        const mockDepartmentRole = createMockDepartmentRole();

        (userRepository.existsUserByUsername as jest.Mock).mockResolvedValue(false);
        (userRepository.existsUserByEmail as jest.Mock).mockResolvedValue(false);
        (departmentRoleRepository.findByDepartmentAndRole as jest.Mock).mockResolvedValue(
          mockDepartmentRole
        );
        (userRepository.createUserWithPassword as jest.Mock).mockResolvedValue(mockUser);
        (mapperService.mapUserEntityToUserResponse as jest.Mock).mockReturnValue(mockResponse);

        // Act
        const result = await userService.registerCitizen(specialCharData);

        // Assert
        expect(result?.first_name).toBe("Jean-Pierre");
        expect(result?.last_name).toBe("O'Brien");
      });
    });
  });

  describe('getUserById', () => {
    describe('user exists', () => {
      it('should return user response when user exists', async () => {
        // Arrange
        const userId = 5;
        const mockUser = createMockUserEntity({ id: userId });
        const mockResponse = createMockUserResponse({ id: userId });

        (userRepository.findUserById as jest.Mock).mockResolvedValue(mockUser);
        (mapperService.mapUserEntityToUserResponse as jest.Mock).mockReturnValue(mockResponse);

        // Act
        const result = await userService.getUserById(userId);

        // Assert
        expect(userRepository.findUserById).toHaveBeenCalledWith(userId);
        expect(mapperService.mapUserEntityToUserResponse).toHaveBeenCalledWith(mockUser);
        expect(result).toEqual(mockResponse);
      });

      it('should fetch different users by ID', async () => {
        // Arrange
        const userId1 = 1;
        const userId2 = 99;
        const mockUser1 = createMockUserEntity({ id: userId1, username: 'user1' });
        const mockUser2 = createMockUserEntity({ id: userId2, username: 'user99' });
        const mockResponse1 = createMockUserResponse({ id: userId1, username: 'user1' });
        const mockResponse2 = createMockUserResponse({ id: userId2, username: 'user99' });

        (userRepository.findUserById as jest.Mock)
          .mockResolvedValueOnce(mockUser1)
          .mockResolvedValueOnce(mockUser2);
        (mapperService.mapUserEntityToUserResponse as jest.Mock)
          .mockReturnValueOnce(mockResponse1)
          .mockReturnValueOnce(mockResponse2);

        // Act
        const result1 = await userService.getUserById(userId1);
        const result2 = await userService.getUserById(userId2);

        // Assert
        expect(result1?.id).toBe(userId1);
        expect(result2?.id).toBe(userId2);
        expect(userRepository.findUserById).toHaveBeenCalledTimes(2);
      });
    });

    describe('user not found', () => {
      it('should return null when user does not exist', async () => {
        // Arrange
        const userId = 999;
        (userRepository.findUserById as jest.Mock).mockResolvedValue(null);

        // Act
        const result = await userService.getUserById(userId);

        // Assert
        expect(userRepository.findUserById).toHaveBeenCalledWith(userId);
        expect(mapperService.mapUserEntityToUserResponse).not.toHaveBeenCalled();
        expect(result).toBeNull();
      });
    });

    describe('repository errors', () => {
      it('should propagate database errors', async () => {
        // Arrange
        const userId = 1;
        const error = new Error('Database unavailable');
        (userRepository.findUserById as jest.Mock).mockRejectedValue(error);

        // Act & Assert
        await expect(userService.getUserById(userId)).rejects.toThrow('Database unavailable');
      });
    });
  });

  describe('getExternalMaintainersByCategory', () => {
    describe('valid category ID', () => {
      it('should return external maintainers for valid category', async () => {
        // Arrange
        const categoryId = 5;
        const mockUsers = [
          createMockUserEntity({ id: 1, username: 'maintainer1' }),
          createMockUserEntity({ id: 2, username: 'maintainer2' }),
        ];
        const mockResponses = [
          createMockUserResponse({ id: 1, username: 'maintainer1' }),
          createMockUserResponse({ id: 2, username: 'maintainer2' }),
        ];

        (userRepository.findExternalMaintainersByCategory as jest.Mock).mockResolvedValue(
          mockUsers
        );
        (mapperService.mapUserEntityToUserResponse as jest.Mock)
          .mockReturnValueOnce(mockResponses[0])
          .mockReturnValueOnce(mockResponses[1]);

        // Act
        const result = await userService.getExternalMaintainersByCategory(categoryId);

        // Assert
        expect(userRepository.findExternalMaintainersByCategory).toHaveBeenCalledWith(categoryId);
        expect(result).toHaveLength(2);
        expect(result).toEqual(mockResponses);
      });

      it('should handle empty list of maintainers', async () => {
        // Arrange
        const categoryId = 5;
        (userRepository.findExternalMaintainersByCategory as jest.Mock).mockResolvedValue([]);

        // Act
        const result = await userService.getExternalMaintainersByCategory(categoryId);

        // Assert
        expect(userRepository.findExternalMaintainersByCategory).toHaveBeenCalledWith(categoryId);
        expect(result).toHaveLength(0);
        expect(mapperService.mapUserEntityToUserResponse).not.toHaveBeenCalled();
      });

      it('should filter out null mappings', async () => {
        // Arrange
        const categoryId = 5;
        const mockUsers = [
          createMockUserEntity({ id: 1, username: 'maintainer1' }),
          createMockUserEntity({ id: 2, username: 'maintainer2' }),
          createMockUserEntity({ id: 3, username: 'maintainer3' }),
        ];
        const mockResponses = [
          createMockUserResponse({ id: 1, username: 'maintainer1' }),
          null,
          createMockUserResponse({ id: 3, username: 'maintainer3' }),
        ];

        (userRepository.findExternalMaintainersByCategory as jest.Mock).mockResolvedValue(
          mockUsers
        );
        (mapperService.mapUserEntityToUserResponse as jest.Mock)
          .mockReturnValueOnce(mockResponses[0])
          .mockReturnValueOnce(mockResponses[1])
          .mockReturnValueOnce(mockResponses[2]);

        // Act
        const result = await userService.getExternalMaintainersByCategory(categoryId);

        // Assert
        expect(result).toHaveLength(2);
        expect(result).toEqual([mockResponses[0], mockResponses[2]]);
      });
    });

    describe('invalid or missing category ID', () => {
      it('should throw AppError if categoryId is undefined', async () => {
        // Act & Assert
        await expect(userService.getExternalMaintainersByCategory(undefined)).rejects.toThrow(
          AppError
        );
        await expect(userService.getExternalMaintainersByCategory(undefined)).rejects.toThrow(
          'categoryId query parameter is required'
        );
      });

      it('should throw AppError if categoryId is null', async () => {
        // Act & Assert
        await expect(userService.getExternalMaintainersByCategory(null as any)).rejects.toThrow(
          AppError
        );
        await expect(userService.getExternalMaintainersByCategory(null as any)).rejects.toThrow(
          'categoryId query parameter is required'
        );
      });

      it('should throw AppError if categoryId is not a positive integer', async () => {
        // Act & Assert
        await expect(userService.getExternalMaintainersByCategory(0)).rejects.toThrow(
          'categoryId must be a valid positive integer'
        );
        await expect(userService.getExternalMaintainersByCategory(-5)).rejects.toThrow(
          'categoryId must be a valid positive integer'
        );
      });

      it('should throw AppError if categoryId is NaN', async () => {
        // Act & Assert
        await expect(userService.getExternalMaintainersByCategory(Number.NaN)).rejects.toThrow(
          'categoryId must be a valid positive integer'
        );
      });
    });

    describe('repository errors', () => {
      it('should propagate repository errors', async () => {
        // Arrange
        const categoryId = 5;
        const error = new Error('Database query failed');
        (userRepository.findExternalMaintainersByCategory as jest.Mock).mockRejectedValue(error);

        // Act & Assert
        await expect(userService.getExternalMaintainersByCategory(categoryId)).rejects.toThrow(
          'Database query failed'
        );
      });
    });

    describe('multiple maintainers for different categories', () => {
      it('should return different maintainers for different categories', async () => {
        // Arrange
        const categoryId1 = 1;
        const categoryId2 = 2;
        const mockUsersCategory1 = [createMockUserEntity({ id: 1 })];
        const mockUsersCategory2 = [
          createMockUserEntity({ id: 10 }),
          createMockUserEntity({ id: 11 }),
        ];
        const mockResponsesCategory1 = [createMockUserResponse({ id: 1 })];
        const mockResponsesCategory2 = [
          createMockUserResponse({ id: 10 }),
          createMockUserResponse({ id: 11 }),
        ];

        (userRepository.findExternalMaintainersByCategory as jest.Mock)
          .mockResolvedValueOnce(mockUsersCategory1)
          .mockResolvedValueOnce(mockUsersCategory2);
        (mapperService.mapUserEntityToUserResponse as jest.Mock)
          .mockReturnValueOnce(mockResponsesCategory1[0])
          .mockReturnValueOnce(mockResponsesCategory2[0])
          .mockReturnValueOnce(mockResponsesCategory2[1]);

        // Act
        const result1 = await userService.getExternalMaintainersByCategory(categoryId1);
        const result2 = await userService.getExternalMaintainersByCategory(categoryId2);

        // Assert
        expect(result1).toHaveLength(1);
        expect(result2).toHaveLength(2);
        expect(userRepository.findExternalMaintainersByCategory).toHaveBeenCalledTimes(2);
        expect(userRepository.findExternalMaintainersByCategory).toHaveBeenNthCalledWith(
          1,
          categoryId1
        );
        expect(userRepository.findExternalMaintainersByCategory).toHaveBeenNthCalledWith(
          2,
          categoryId2
        );
      });
    });
  });
});
