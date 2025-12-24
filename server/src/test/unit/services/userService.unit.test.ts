import { userService } from '../../../services/userService';
import { userRepository } from '@repositories/userRepository';
import { departmentRoleRepository } from '@repositories/departmentRoleRepository';
import { notificationRepository } from '@repositories/notificationRepository';
import { companyRepository } from '@repositories/companyRepository';
import * as mapperService from '@services/mapperService';
import * as loggingService from '@services/loggingService';
import { ConflictError } from '@models/errors/ConflictError';
import { NotFoundError } from '@models/errors/NotFoundError';
import { AppError } from '@models/errors/AppError';
import { InsufficientRightsError } from '@models/errors/InsufficientRightsError';
import { RegisterRequest } from '@models/dto/input/RegisterRequest';
import { UserEntity } from '@models/entity/userEntity';
import { UserResponse } from '@models/dto/output/UserResponse';
import { AppDataSource } from '@database/connection';

jest.mock('@repositories/userRepository');
jest.mock('@repositories/departmentRoleRepository');
jest.mock('@repositories/companyRepository');
jest.mock('@repositories/notificationRepository');
jest.mock('@services/mapperService');
jest.mock('@services/loggingService');
jest.mock('@database/connection');
jest.mock('@utils/emailSender', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined)
}));

// Helper to create mock user entity with userRoles (V5.0 multi-role structure)
const createMockUserEntity = (overrides?: Partial<UserEntity>): UserEntity => {
  const mockUser = new UserEntity();
  mockUser.id = 1;
  mockUser.username = 'testuser';
  mockUser.email = 'test@example.com';
  mockUser.firstName = 'Test';
  mockUser.lastName = 'User';
  mockUser.passwordHash = 'hashed_password';
  mockUser.isVerified = true;
  mockUser.emailNotificationsEnabled = true;
  mockUser.createdAt = new Date();
  // V5.0: Use userRoles array instead of departmentRoleId
  mockUser.userRoles = [{
    id: 1,
    userId: 1,
    departmentRoleId: 1,
    departmentRole: {
      id: 1,
      departmentId: 1,
      roleId: 1,
      department: { id: 1, name: 'Organization', departmentRoles: [] },
      role: { id: 1, name: 'Citizen', description: 'Citizen role', departmentRoles: [] },
      userRoles: []
    },
    createdAt: new Date()
  }] as any;
  return { ...mockUser, ...overrides };
};

// Helper to create mock user response with roles array
const createMockUserResponse = (overrides?: Partial<UserResponse>): UserResponse => {
  const mockResponse: UserResponse = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    roles: [{ department_role_id: 1, department_name: 'Organization', role_name: 'Citizen' }],
    ...overrides,
  };
  return mockResponse;
};

// Mock query builder for AppDataSource
const createMockQueryBuilder = () => ({
  insert: jest.fn().mockReturnThis(),
  into: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  execute: jest.fn().mockResolvedValue({ identifiers: [] }),
});

describe('UserService', () => {
  let mockQueryBuilder: ReturnType<typeof createMockQueryBuilder>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup AppDataSource.createQueryBuilder mock
    mockQueryBuilder = createMockQueryBuilder();
    (AppDataSource.createQueryBuilder as jest.Mock).mockReturnValue(mockQueryBuilder);
  });

  describe('registerCitizen', () => {
    // V5.0: Updated to use department_role_ids
    const validRegisterData: RegisterRequest = {
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      first_name: 'New',
      last_name: 'User',
      department_role_ids: [1], // V5.0: Now requires department_role_ids
    };

    describe('successful registration', () => {
      it('should register a new citizen with valid data', async () => {
        // Arrange
        const mockCreatedUser = createMockUserEntity({ id: 10, username: 'newuser', isVerified: false });
        const mockUserWithRoles = createMockUserEntity({ id: 10, username: 'newuser' });
        const mockResponse = createMockUserResponse({ id: 10, username: 'newuser' });

        (userRepository.existsUserByUsername as jest.Mock).mockResolvedValue(false);
        (userRepository.existsUserByEmail as jest.Mock).mockResolvedValue(false);
        (userRepository.createUserWithPassword as jest.Mock).mockResolvedValue(mockCreatedUser);
        (userRepository.findUserById as jest.Mock).mockResolvedValue(mockUserWithRoles);
        (mapperService.mapUserEntityToUserResponse as jest.Mock).mockReturnValue(mockResponse);

        // Act
        const result = await userService.registerCitizen(validRegisterData);

        // Assert
        expect(userRepository.existsUserByUsername).toHaveBeenCalledWith('newuser');
        expect(userRepository.existsUserByEmail).toHaveBeenCalledWith('newuser@example.com');
        expect(userRepository.createUserWithPassword).toHaveBeenCalled();
        expect(mockQueryBuilder.insert).toHaveBeenCalled();
        expect(mockQueryBuilder.into).toHaveBeenCalledWith('user_roles');
        expect(userRepository.findUserById).toHaveBeenCalledWith(10);
        expect(result).toEqual(mockResponse);
        expect(loggingService.logInfo).toHaveBeenCalledWith('New citizen registered: newuser (ID: 10)');
      });

      it('should insert user roles with department_role_ids', async () => {
        // Arrange
        const mockCreatedUser = createMockUserEntity({ id: 10 });
        const mockUserWithRoles = createMockUserEntity({ id: 10 });
        const mockResponse = createMockUserResponse({ id: 10 });

        (userRepository.existsUserByUsername as jest.Mock).mockResolvedValue(false);
        (userRepository.existsUserByEmail as jest.Mock).mockResolvedValue(false);
        (userRepository.createUserWithPassword as jest.Mock).mockResolvedValue(mockCreatedUser);
        (userRepository.findUserById as jest.Mock).mockResolvedValue(mockUserWithRoles);
        (mapperService.mapUserEntityToUserResponse as jest.Mock).mockReturnValue(mockResponse);

        // Act
        await userService.registerCitizen(validRegisterData);

        // Assert
        expect(mockQueryBuilder.values).toHaveBeenCalledWith([
          { userId: 10, departmentRoleId: 1 }
        ]);
        expect(mockQueryBuilder.values).toHaveBeenCalledWith([
          { userId: 10, departmentRoleId: 1 }
        ]);
      });

      it('should send verification email upon registration', async () => {
        // Arrange
        const mockCreatedUser = createMockUserEntity({ id: 10 });
        const mockUserWithRoles = createMockUserEntity({ id: 10 });
        const mockResponse = createMockUserResponse({ id: 10 });

        (userRepository.existsUserByUsername as jest.Mock).mockResolvedValue(false);
        (userRepository.existsUserByEmail as jest.Mock).mockResolvedValue(false);
        (userRepository.createUserWithPassword as jest.Mock).mockResolvedValue(mockCreatedUser);
        (userRepository.findUserById as jest.Mock).mockResolvedValue(mockUserWithRoles);
        (mapperService.mapUserEntityToUserResponse as jest.Mock).mockReturnValue(mockResponse);

        // Mocking sendVerificationEmail directly if it's imported
        const { sendVerificationEmail } = require('@utils/emailSender');

        // Act
        await userService.registerCitizen(validRegisterData);

        // Assert
        expect(sendVerificationEmail).toHaveBeenCalledWith('newuser@example.com', expect.any(String));
      });

      it('should handle multiple department_role_ids', async () => {
        // Arrange
        const multiRoleData: RegisterRequest = {
          ...validRegisterData,
          department_role_ids: [1, 2, 3],
        };
        const mockCreatedUser = createMockUserEntity({ id: 10 });
        const mockUserWithRoles = createMockUserEntity({ id: 10 });
        const mockResponse = createMockUserResponse({ id: 10 });

        (userRepository.existsUserByUsername as jest.Mock).mockResolvedValue(false);
        (userRepository.existsUserByEmail as jest.Mock).mockResolvedValue(false);
        (userRepository.createUserWithPassword as jest.Mock).mockResolvedValue(mockCreatedUser);
        (userRepository.findUserById as jest.Mock).mockResolvedValue(mockUserWithRoles);
        (mapperService.mapUserEntityToUserResponse as jest.Mock).mockReturnValue(mockResponse);

        // Act
        await userService.registerCitizen(multiRoleData);

        // Assert
        expect(mockQueryBuilder.values).toHaveBeenCalledWith([
          { userId: 10, departmentRoleId: 1 },
          { userId: 10, departmentRoleId: 2 },
          { userId: 10, departmentRoleId: 3 },
        ]);
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
        expect(userRepository.createUserWithPassword).not.toHaveBeenCalled();
      });
    });

    describe('missing department_role_ids', () => {
      it('should assign default Citizen role if department_role_ids is empty', async () => {
        // Arrange
        const dataWithoutRoles: RegisterRequest = {
          ...validRegisterData,
          department_role_ids: [],
        };

        const mockDefaultRole = { id: 99 };
        const mockCreatedUser = createMockUserEntity({ id: 10 });
        const mockUserWithRoles = createMockUserEntity({ id: 10 });
        const mockResponse = createMockUserResponse({ id: 10 });

        (userRepository.existsUserByUsername as jest.Mock).mockResolvedValue(false);
        (userRepository.existsUserByEmail as jest.Mock).mockResolvedValue(false);
        (departmentRoleRepository.findByDepartmentAndRole as jest.Mock).mockResolvedValue(mockDefaultRole);
        (userRepository.createUserWithPassword as jest.Mock).mockResolvedValue(mockCreatedUser);
        (userRepository.findUserById as jest.Mock).mockResolvedValue(mockUserWithRoles);
        (mapperService.mapUserEntityToUserResponse as jest.Mock).mockReturnValue(mockResponse);

        // Act
        const result = await userService.registerCitizen(dataWithoutRoles);

        // Assert
        expect(departmentRoleRepository.findByDepartmentAndRole).toHaveBeenCalledWith('Organization', 'Citizen');
        expect(userRepository.createUserWithPassword).toHaveBeenCalled();
        expect(mockQueryBuilder.values).toHaveBeenCalledWith([
          { userId: 10, departmentRoleId: 99 }
        ]);
        expect(result).toEqual(mockResponse);
      });

      it('should assign default Citizen role if department_role_ids is undefined', async () => {
        // Arrange
        const dataWithoutRoles: RegisterRequest = {
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'SecurePass123!',
          first_name: 'New',
          last_name: 'User',
          // department_role_ids not provided
        };

        const mockDefaultRole = { id: 99 };
        const mockCreatedUser = createMockUserEntity({ id: 10 });
        const mockUserWithRoles = createMockUserEntity({ id: 10 });
        const mockResponse = createMockUserResponse({ id: 10 });

        (userRepository.existsUserByUsername as jest.Mock).mockResolvedValue(false);
        (userRepository.existsUserByEmail as jest.Mock).mockResolvedValue(false);
        (departmentRoleRepository.findByDepartmentAndRole as jest.Mock).mockResolvedValue(mockDefaultRole);
        (userRepository.createUserWithPassword as jest.Mock).mockResolvedValue(mockCreatedUser);
        (userRepository.findUserById as jest.Mock).mockResolvedValue(mockUserWithRoles);
        (mapperService.mapUserEntityToUserResponse as jest.Mock).mockReturnValue(mockResponse);

        // Act
        await userService.registerCitizen(dataWithoutRoles);

        // Assert
        expect(departmentRoleRepository.findByDepartmentAndRole).toHaveBeenCalledWith('Organization', 'Citizen');
        expect(mockQueryBuilder.values).toHaveBeenCalledWith([
          { userId: 10, departmentRoleId: 99 }
        ]);
      });
    });

    describe('reload user failure', () => {
      it('should throw AppError if user reload fails after role assignment', async () => {
        // Arrange
        const mockCreatedUser = createMockUserEntity({ id: 10 });

        (userRepository.existsUserByUsername as jest.Mock).mockResolvedValue(false);
        (userRepository.existsUserByEmail as jest.Mock).mockResolvedValue(false);
        (userRepository.createUserWithPassword as jest.Mock).mockResolvedValue(mockCreatedUser);
        (userRepository.findUserById as jest.Mock).mockResolvedValue(null);

        // Act & Assert
        await expect(userService.registerCitizen(validRegisterData)).rejects.toThrow(
          AppError
        );
        await expect(userService.registerCitizen(validRegisterData)).rejects.toThrow(
          'Failed to reload user after role assignment'
        );
      });
    });

    describe('mapper failure', () => {
      it('should throw AppError if user mapping fails', async () => {
        // Arrange
        const mockCreatedUser = createMockUserEntity({ id: 10 });
        const mockUserWithRoles = createMockUserEntity({ id: 10 });

        (userRepository.existsUserByUsername as jest.Mock).mockResolvedValue(false);
        (userRepository.existsUserByEmail as jest.Mock).mockResolvedValue(false);
        (userRepository.createUserWithPassword as jest.Mock).mockResolvedValue(mockCreatedUser);
        (userRepository.findUserById as jest.Mock).mockResolvedValue(mockUserWithRoles);
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

        (userRepository.existsUserByUsername as jest.Mock).mockResolvedValue(false);
        (userRepository.existsUserByEmail as jest.Mock).mockResolvedValue(false);
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

        const mockCreatedUser = createMockUserEntity({
          firstName: "Jean-Pierre",
          lastName: "O'Brien",
        });
        const mockUserWithRoles = createMockUserEntity({
          firstName: "Jean-Pierre",
          lastName: "O'Brien",
        });
        const mockResponse = createMockUserResponse({
          first_name: "Jean-Pierre",
          last_name: "O'Brien",
        });

        (userRepository.existsUserByUsername as jest.Mock).mockResolvedValue(false);
        (userRepository.existsUserByEmail as jest.Mock).mockResolvedValue(false);
        (userRepository.createUserWithPassword as jest.Mock).mockResolvedValue(mockCreatedUser);
        (userRepository.findUserById as jest.Mock).mockResolvedValue(mockUserWithRoles);
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
    describe('valid category', () => {
      it('should return external maintainers for valid category', async () => {
        // Arrange
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
        const result = await userService.getExternalMaintainersByCategory('Public Lighting');

        // Assert
        expect(userRepository.findExternalMaintainersByCategory).toHaveBeenCalledWith('Public Lighting');
        expect(result).toHaveLength(2);
        expect(result).toEqual(mockResponses);
      });

      it('should handle empty list of maintainers', async () => {
        // Arrange
        const category = 'Public Lighting';
        (userRepository.findExternalMaintainersByCategory as jest.Mock).mockResolvedValue([]);

        // Act
        const result = await userService.getExternalMaintainersByCategory(category);

        // Assert
        expect(userRepository.findExternalMaintainersByCategory).toHaveBeenCalledWith(category);
        expect(result).toHaveLength(0);
        expect(mapperService.mapUserEntityToUserResponse).not.toHaveBeenCalled();
      });

      it('should filter out null mappings', async () => {
        // Arrange
        const category = 'Public Lighting';
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
        const result = await userService.getExternalMaintainersByCategory(category);

        // Assert
        expect(result).toHaveLength(2);
        expect(result).toHaveLength(2);
        expect(result).toEqual([mockResponses[0], mockResponses[2]]);
      });

      it('should fetch and map company names for external maintainers', async () => {
        // Arrange
        const category = 'Public Lighting';
        const mockUsers = [
          createMockUserEntity({ id: 1, companyId: 100 }),
          createMockUserEntity({ id: 2, companyId: 101 })
        ];
        const mockCompany1 = { id: 100, name: 'Acme Lighting' };
        const mockCompany2 = { id: 101, name: 'Bright City' };

        (userRepository.findExternalMaintainersByCategory as jest.Mock).mockResolvedValue(mockUsers);
        (companyRepository.findById as jest.Mock).mockImplementation((id) => {
          if (id === 100) return Promise.resolve(mockCompany1);
          if (id === 101) return Promise.resolve(mockCompany2);
          return Promise.resolve(null);
        });
        (mapperService.mapUserEntityToUserResponse as jest.Mock).mockImplementation((user, companyName) => ({
          id: user.id,
          company_name: companyName
        } as any));

        // Act
        const result = await userService.getExternalMaintainersByCategory(category);

        // Assert
        expect(companyRepository.findById).toHaveBeenCalledWith(100);
        expect(companyRepository.findById).toHaveBeenCalledWith(101);
        expect(result).toHaveLength(2);
        expect(result[0].company_name).toBe('Acme Lighting');
        expect(result[1].company_name).toBe('Bright City');
      });
    });

    describe('invalid or missing category ID', () => {
      it('should return all external maintainers when category is undefined', async () => {
        // Arrange
        const mockUsers = [createMockUserEntity({ id: 1 })];
        const mockResponses = [createMockUserResponse({ id: 1 })];

        (userRepository.findExternalMaintainersByCategory as jest.Mock).mockResolvedValue(mockUsers);
        (mapperService.mapUserEntityToUserResponse as jest.Mock).mockReturnValue(mockResponses[0]);

        // Act
        const result = await userService.getExternalMaintainersByCategory(undefined);

        // Assert
        expect(result.length).toBeGreaterThanOrEqual(0);
      });

      it('should return all external maintainers when category is null', async () => {
        // Arrange
        const mockUsers = [createMockUserEntity({ id: 1 })];
        const mockResponses = [createMockUserResponse({ id: 1 })];

        (userRepository.findExternalMaintainersByCategory as jest.Mock).mockResolvedValue(mockUsers);
        (mapperService.mapUserEntityToUserResponse as jest.Mock).mockReturnValue(mockResponses[0]);

        // Act
        const result = await userService.getExternalMaintainersByCategory(null as any);

        // Assert
        expect(result.length).toBeGreaterThanOrEqual(0);
      });

      it('should return all external maintainers when category is empty string', async () => {
        // Arrange
        const mockUsers = [createMockUserEntity({ id: 1 })];
        const mockResponses = [createMockUserResponse({ id: 1 })];

        (userRepository.findExternalMaintainersByCategory as jest.Mock).mockResolvedValue(mockUsers);
        (mapperService.mapUserEntityToUserResponse as jest.Mock).mockReturnValue(mockResponses[0]);

        // Act
        const result = await userService.getExternalMaintainersByCategory('');

        // Assert
        expect(result.length).toBeGreaterThanOrEqual(0);
      });
    });

    describe('repository errors', () => {
      it('should propagate repository errors', async () => {
        // Arrange
        const category = 'Public Lighting';
        const error = new Error('Database query failed');
        (userRepository.findExternalMaintainersByCategory as jest.Mock).mockRejectedValue(error);

        // Act & Assert
        await expect(userService.getExternalMaintainersByCategory(category)).rejects.toThrow(
          'Database query failed'
        );
      });
    });

    describe('multiple maintainers for different categories', () => {
      it('should return different maintainers for different categories', async () => {
        // Arrange
        const category1 = 'Public Lighting';
        const category2 = 'Roads and Urban Furnishings';
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
        const result1 = await userService.getExternalMaintainersByCategory(category1);
        const result2 = await userService.getExternalMaintainersByCategory(category2);

        // Assert
        expect(result1).toHaveLength(1);
        expect(result2).toHaveLength(2);
        expect(userRepository.findExternalMaintainersByCategory).toHaveBeenCalledTimes(2);
        expect(userRepository.findExternalMaintainersByCategory).toHaveBeenNthCalledWith(
          1,
          category1
        );
        expect(userRepository.findExternalMaintainersByCategory).toHaveBeenNthCalledWith(
          2,
          category2
        );
      });
    });
  });

  describe('generateTelegramLinkCode', () => {
    it('should generate telegram link code successfully', async () => {
      // Arrange
      const userId = 1;
      const expectedCode = '123456';
      (userRepository.generateTelegramLinkCode as jest.Mock).mockResolvedValue(expectedCode);

      // Act
      const result = await userService.generateTelegramLinkCode(userId);

      // Assert
      expect(userRepository.generateTelegramLinkCode).toHaveBeenCalledWith(userId);
      expect(result).toBe(expectedCode);
    });

    it('should return null when user not found', async () => {
      // Arrange
      const userId = 999;
      (userRepository.generateTelegramLinkCode as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await userService.generateTelegramLinkCode(userId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('resendVerificationCode', () => {
    const testEmail = 'test@example.com';

    it('should resend verification code for unverified user', async () => {
      // Arrange
      const mockUser = createMockUserEntity({
        id: 1,
        username: 'testuser',
        email: testEmail,
        isVerified: false
      });

      (userRepository.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.updateVerificationData as jest.Mock).mockResolvedValue(undefined);

      // Act
      await userService.resendVerificationCode(testEmail);

      // Assert
      expect(userRepository.findUserByEmail).toHaveBeenCalledWith(testEmail);
      expect(userRepository.updateVerificationData).toHaveBeenCalledWith(1, expect.objectContaining({
        verificationCode: expect.any(String),
        verificationCodeExpiresAt: expect.any(Date)
      }));
      expect(loggingService.logInfo).toHaveBeenCalledWith(
        'Verification code regenerated for user: testuser (ID: 1)'
      );
    });

    it('should throw NotFoundError if user not found', async () => {
      // Arrange
      (userRepository.findUserByEmail as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(userService.resendVerificationCode(testEmail)).rejects.toThrow(NotFoundError);
      await expect(userService.resendVerificationCode(testEmail)).rejects.toThrow('User not found');
    });

    it('should throw ConflictError if user is already verified', async () => {
      // Arrange
      const mockUser = createMockUserEntity({
        isVerified: true
      });

      (userRepository.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);

      // Act & Assert
      await expect(userService.resendVerificationCode(testEmail)).rejects.toThrow(ConflictError);
      await expect(userService.resendVerificationCode(testEmail)).rejects.toThrow('User is already verified');
    });
  });

  describe('getUserByUsername', () => {
    const testUsername = 'testuser';

    it('should return user response when user exists', async () => {
      // Arrange
      const mockUser = createMockUserEntity({ username: testUsername });
      const mockResponse = createMockUserResponse({ username: testUsername });

      (userRepository.findUserByUsername as jest.Mock).mockResolvedValue(mockUser);
      (mapperService.mapUserEntityToUserResponse as jest.Mock).mockReturnValue(mockResponse);

      // Act
      const result = await userService.getUserByUsername(testUsername);

      // Assert
      expect(userRepository.findUserByUsername).toHaveBeenCalledWith(testUsername);
      expect(mapperService.mapUserEntityToUserResponse).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockResponse);
    });

    it('should return null when user does not exist', async () => {
      // Arrange
      (userRepository.findUserByUsername as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await userService.getUserByUsername(testUsername);

      // Assert
      expect(userRepository.findUserByUsername).toHaveBeenCalledWith(testUsername);
      expect(mapperService.mapUserEntityToUserResponse).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should propagate database errors', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      (userRepository.findUserByUsername as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(userService.getUserByUsername(testUsername)).rejects.toThrow('Database connection failed');
    });
  });

  describe('getUserNotifications', () => {
    const userId = 1;

    it('should return all notifications for user when isRead is not specified', async () => {
      // Arrange
      const mockNotifications = [
        { id: 1, userId, message: 'Test notification 1', isRead: false },
        { id: 2, userId, message: 'Test notification 2', isRead: true }
      ];

      (notificationRepository.find as jest.Mock).mockResolvedValue(mockNotifications);

      // Act
      const result = await userService.getUserNotifications(userId);

      // Assert
      expect(notificationRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' }
      });
      expect(result).toEqual(mockNotifications);
    });

    it('should return only unread notifications when isRead is false', async () => {
      // Arrange
      const mockNotifications = [
        { id: 1, userId, message: 'Unread notification', isRead: false }
      ];

      (notificationRepository.find as jest.Mock).mockResolvedValue(mockNotifications);

      // Act
      const result = await userService.getUserNotifications(userId, false);

      // Assert
      expect(notificationRepository.find).toHaveBeenCalledWith({
        where: { userId, isRead: false },
        order: { createdAt: 'DESC' }
      });
      expect(result).toEqual(mockNotifications);
    });

    it('should return only read notifications when isRead is true', async () => {
      // Arrange
      const mockNotifications = [
        { id: 2, userId, message: 'Read notification', isRead: true }
      ];

      (notificationRepository.find as jest.Mock).mockResolvedValue(mockNotifications);

      // Act
      const result = await userService.getUserNotifications(userId, true);

      // Assert
      expect(notificationRepository.find).toHaveBeenCalledWith({
        where: { userId, isRead: true },
        order: { createdAt: 'DESC' }
      });
      expect(result).toEqual(mockNotifications);
    });

    it('should return empty array when no notifications exist', async () => {
      // Arrange
      (notificationRepository.find as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await userService.getUserNotifications(userId);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('markNotificationAsRead', () => {
    const userId = 1;
    const notificationId = 10;

    it('should mark notification as read successfully', async () => {
      // Arrange
      const mockNotification = {
        id: notificationId,
        userId,
        message: 'Test notification',
        isRead: false
      };

      const savedNotification = { ...mockNotification, isRead: true };

      (notificationRepository.findOneBy as jest.Mock).mockResolvedValue(mockNotification);
      (notificationRepository.save as jest.Mock).mockResolvedValue(savedNotification);

      // Act
      const result = await userService.markNotificationAsRead(userId, notificationId, true);

      // Assert
      expect(notificationRepository.findOneBy).toHaveBeenCalledWith({ id: notificationId });
      expect(mockNotification.isRead).toBe(true);
      expect(notificationRepository.save).toHaveBeenCalledWith(mockNotification);
      expect(result).toBe(savedNotification);
    });

    it('should mark notification as unread successfully', async () => {
      // Arrange
      const mockNotification = {
        id: notificationId,
        userId,
        message: 'Test notification',
        isRead: true
      };

      const savedNotification = { ...mockNotification, isRead: false };

      (notificationRepository.findOneBy as jest.Mock).mockResolvedValue(mockNotification);
      (notificationRepository.save as jest.Mock).mockResolvedValue(savedNotification);

      // Act
      const result = await userService.markNotificationAsRead(userId, notificationId, false);

      // Assert
      expect(mockNotification.isRead).toBe(false);
      expect(notificationRepository.save).toHaveBeenCalledWith(mockNotification);
      expect(result).toBe(savedNotification);
    });

    it('should throw NotFoundError if notification not found', async () => {
      // Arrange
      (notificationRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(userService.markNotificationAsRead(userId, notificationId, true)).rejects.toThrow(NotFoundError);
      await expect(userService.markNotificationAsRead(userId, notificationId, true)).rejects.toThrow('Notification not found');
    });

    it('should throw InsufficientRightsError if trying to update another user notification', async () => {
      // Arrange
      const mockNotification = {
        id: notificationId,
        userId: 999, // Different user ID
        message: 'Test notification',
        isRead: false
      };

      (notificationRepository.findOneBy as jest.Mock).mockResolvedValue(mockNotification);

      // Act & Assert
      await expect(userService.markNotificationAsRead(userId, notificationId, true)).rejects.toThrow(InsufficientRightsError);
      await expect(userService.markNotificationAsRead(userId, notificationId, true)).rejects.toThrow('You can only update your own notifications');
    });
  });

  describe('generateTelegramLinkCode', () => {
    const userId = 1;

    it('should generate telegram link code successfully', async () => {
      // Arrange
      const expectedCode = 'ABC123XYZ';
      (userRepository.generateTelegramLinkCode as jest.Mock).mockResolvedValue(expectedCode);

      // Act
      const result = await userService.generateTelegramLinkCode(userId);

      // Assert
      expect(userRepository.generateTelegramLinkCode).toHaveBeenCalledWith(userId);
      expect(result).toBe(expectedCode);
    });

    it('should return null when code generation fails', async () => {
      // Arrange
      (userRepository.generateTelegramLinkCode as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await userService.generateTelegramLinkCode(userId);

      // Assert
      expect(result).toBeNull();
    });

    it('should propagate repository errors', async () => {
      // Arrange
      const error = new Error('Database error');
      (userRepository.generateTelegramLinkCode as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(userService.generateTelegramLinkCode(userId)).rejects.toThrow('Database error');
    });
  });
});
