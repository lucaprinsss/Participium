import { Request, Response, NextFunction } from 'express';
import userController from '@controllers/userController';
import { userService } from '@services/userService';
import { userRepository } from '@repositories/userRepository';
import { BadRequestError } from '@models/errors/BadRequestError';
import { UnauthorizedError } from '@errors/UnauthorizedError';
import { ConflictError } from '@models/errors/ConflictError';
import { AppError } from '@models/errors/AppError';
import { departmentService } from '@services/departmentService';

// Mock dependencies
jest.mock('@services/userService');
jest.mock('@services/departmentService');
jest.mock('@repositories/userRepository');

describe('UserController Unit Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  // Mock citizen department_role_ids (V5.0 multi-role support)
  const mockCitizenDepartmentRoleIds = [1];

  const mockUserResponse = {
    id: 1,
    username: 'newcitizen',
    email: 'citizen@example.com',
    first_name: 'John',
    last_name: 'Doe',
    roles: [{ role_name: 'Citizen', department_name: 'Organization' }],
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup response mock
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    // Setup request mock
    mockRequest = {
      body: {},
    };

    // Setup response mock
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    // Setup next mock
    mockNext = jest.fn();

    // Setup default mock for departmentService.getDepartmentRoleIdsByRoleName
    (departmentService.getDepartmentRoleIdsByRoleName as jest.Mock).mockResolvedValue(mockCitizenDepartmentRoleIds);
  });

  describe('register', () => {
    const validRegistrationData = {
      username: 'newcitizen',
      email: 'citizen@example.com',
      password: 'SecurePass123!',
      first_name: 'John',
      last_name: 'Doe',
    };

    it('should register a new citizen successfully', async () => {
      // Arrange
      mockRequest.body = validRegistrationData;
      (userService.registerCitizen as jest.Mock).mockResolvedValue(mockUserResponse);

      // Act
      await userController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(departmentService.getDepartmentRoleIdsByRoleName).toHaveBeenCalledWith('Citizen');
      expect(userService.registerCitizen).toHaveBeenCalledWith({
        username: validRegistrationData.username,
        email: validRegistrationData.email,
        password: validRegistrationData.password,
        first_name: validRegistrationData.first_name,
        last_name: validRegistrationData.last_name,
        department_role_ids: mockCitizenDepartmentRoleIds,
      });
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(mockUserResponse);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 for missing username', async () => {
      // Arrange
      mockRequest.body = {
        email: validRegistrationData.email,
        password: validRegistrationData.password,
        first_name: validRegistrationData.first_name,
        last_name: validRegistrationData.last_name,
        // username mancante
      };

      // Act
      await userController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'All fields are required: username, email, password, first_name, last_name',
        })
      );
      expect(userService.registerCitizen).not.toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should return 400 for missing email', async () => {
      // Arrange
      mockRequest.body = {
        username: validRegistrationData.username,
        password: validRegistrationData.password,
        first_name: validRegistrationData.first_name,
        last_name: validRegistrationData.last_name,
        // email mancante
      };

      // Act
      await userController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(userService.registerCitizen).not.toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should return 400 for missing password', async () => {
      // Arrange
      mockRequest.body = {
        username: validRegistrationData.username,
        email: validRegistrationData.email,
        first_name: validRegistrationData.first_name,
        last_name: validRegistrationData.last_name,
        // password mancante
      };

      // Act
      await userController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(userService.registerCitizen).not.toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should return 400 for missing first_name', async () => {
      // Arrange
      mockRequest.body = {
        username: validRegistrationData.username,
        email: validRegistrationData.email,
        password: validRegistrationData.password,
        last_name: validRegistrationData.last_name,
        // first_name mancante
      };

      // Act
      await userController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(userService.registerCitizen).not.toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should return 400 for missing last_name', async () => {
      // Arrange
      mockRequest.body = {
        username: validRegistrationData.username,
        email: validRegistrationData.email,
        password: validRegistrationData.password,
        first_name: validRegistrationData.first_name,
        // last_name mancante
      };

      // Act
      await userController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(userService.registerCitizen).not.toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should return 400 for empty string username', async () => {
      // Arrange
      mockRequest.body = {
        username: '',
        email: validRegistrationData.email,
        password: validRegistrationData.password,
        first_name: validRegistrationData.first_name,
        last_name: validRegistrationData.last_name,
      };

      // Act
      await userController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(userService.registerCitizen).not.toHaveBeenCalled();
    });

    it('should return 400 for empty string email', async () => {
      // Arrange
      mockRequest.body = {
        username: validRegistrationData.username,
        email: '',
        password: validRegistrationData.password,
        first_name: validRegistrationData.first_name,
        last_name: validRegistrationData.last_name,
      };

      // Act
      await userController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(userService.registerCitizen).not.toHaveBeenCalled();
    });

    it('should return 409 if username already exists', async () => {
      // Arrange
      mockRequest.body = validRegistrationData;
      const conflictError = new ConflictError('Username already exists');
      (userService.registerCitizen as jest.Mock).mockRejectedValue(conflictError);

      // Act
      await userController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(userService.registerCitizen).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(conflictError);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should return 409 if email already exists', async () => {
      // Arrange
      mockRequest.body = validRegistrationData;
      const conflictError = new ConflictError('Email already exists');
      (userService.registerCitizen as jest.Mock).mockRejectedValue(conflictError);

      // Act
      await userController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(userService.registerCitizen).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(conflictError);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      mockRequest.body = validRegistrationData;
      const serviceError = new Error('Service error');
      (userService.registerCitizen as jest.Mock).mockRejectedValue(serviceError);

      // Act
      await userController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(userService.registerCitizen).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should assign Citizen department_role_ids by default', async () => {
      // Arrange
      mockRequest.body = validRegistrationData;
      (userService.registerCitizen as jest.Mock).mockResolvedValue(mockUserResponse);

      // Act
      await userController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(departmentService.getDepartmentRoleIdsByRoleName).toHaveBeenCalledWith('Citizen');
      expect(userService.registerCitizen).toHaveBeenCalledWith(
        expect.objectContaining({
          department_role_ids: mockCitizenDepartmentRoleIds,
        })
      );
    });

    it('should return 500 if no Citizen role configuration found', async () => {
      // Arrange
      mockRequest.body = validRegistrationData;
      (departmentService.getDepartmentRoleIdsByRoleName as jest.Mock).mockResolvedValue([]);

      // Act
      await userController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Citizen role configuration not found in database',
        })
      );
      expect(userService.registerCitizen).not.toHaveBeenCalled();
    });

    it('should not expose sensitive data in response', async () => {
      // Arrange
      mockRequest.body = validRegistrationData;
      (userService.registerCitizen as jest.Mock).mockResolvedValue(mockUserResponse);

      // Act
      await userController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(jsonMock).toHaveBeenCalledWith(
        expect.not.objectContaining({
          password: expect.anything(),
          passwordHash: expect.anything(),
        })
      );
    });

    it('should handle null values in request body', async () => {
      // Arrange
      mockRequest.body = {
        username: null,
        email: validRegistrationData.email,
        password: validRegistrationData.password,
        first_name: validRegistrationData.first_name,
        last_name: validRegistrationData.last_name,
      };

      // Act
      await userController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(userService.registerCitizen).not.toHaveBeenCalled();
    });

    it('should handle undefined values in request body', async () => {
      // Arrange
      mockRequest.body = {
        username: undefined,
        email: validRegistrationData.email,
        password: validRegistrationData.password,
        first_name: validRegistrationData.first_name,
        last_name: validRegistrationData.last_name,
      };

      // Act
      await userController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(userService.registerCitizen).not.toHaveBeenCalled();
    });

    it('should call userService.registerCitizen with correct parameters', async () => {
      // Arrange
      mockRequest.body = validRegistrationData;
      (userService.registerCitizen as jest.Mock).mockResolvedValue(mockUserResponse);

      // Act
      await userController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(userService.registerCitizen).toHaveBeenCalledTimes(1);
      expect(userService.registerCitizen).toHaveBeenCalledWith({
        username: validRegistrationData.username,
        email: validRegistrationData.email,
        password: validRegistrationData.password,
        first_name: validRegistrationData.first_name,
        last_name: validRegistrationData.last_name,
        department_role_ids: mockCitizenDepartmentRoleIds,
      });
    });
  });

  describe('getExternalMaintainersByCategory', () => {
    it('should get external maintainers and return 200 status', async () => {
      const maintainers = [{ id: 1, name: 'Maintainer 1' }];
      mockRequest.query = { category: 'Public Lighting' };

      (userService.getExternalMaintainersByCategory as jest.Mock).mockResolvedValue(maintainers);

      await userController.getExternalMaintainersByCategory(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(userService.getExternalMaintainersByCategory).toHaveBeenCalledWith('Public Lighting');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(maintainers);
    });

    it('should call service with undefined if category is missing', async () => {
      mockRequest.query = {};

      await userController.getExternalMaintainersByCategory(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(userService.getExternalMaintainersByCategory).toHaveBeenCalledWith(undefined);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should call next with an error if fetching maintainers fails', async () => {
      const error = new Error('Fetch failed');
      mockRequest.query = { categoryId: '1' };
      (userService.getExternalMaintainersByCategory as jest.Mock).mockRejectedValue(error);

      await userController.getExternalMaintainersByCategory(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateProfile', () => {
    const validUpdateData = {
      firstName: 'UpdatedFirst',
      lastName: 'UpdatedLast',
      email: 'updated@example.com',
      personalPhoto: 'photo.jpg',
      telegramUsername: 'updateduser',
      emailNotificationsEnabled: true,
    };

    const mockUpdatedUser = {
      id: 1,
      username: 'testuser',
      email: 'updated@example.com',
      first_name: 'UpdatedFirst',
      last_name: 'UpdatedLast',
      personal_photo: 'photo.jpg',
      telegram_username: 'updateduser',
      email_notifications_enabled: true,
    };

    it('should update user profile successfully', async () => {
      // Arrange
      mockRequest.user = { id: 1 };
      mockRequest.body = validUpdateData;
      (userService.updateUserProfile as jest.Mock).mockResolvedValue(mockUpdatedUser);

      // Act
      await userController.updateProfile(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(userService.updateUserProfile).toHaveBeenCalledWith(1, validUpdateData);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockUpdatedUser);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError if user is not authenticated', async () => {
      // Arrange
      mockRequest.user = undefined;
      mockRequest.body = validUpdateData;

      // Act
      await userController.updateProfile(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(userService.updateUserProfile).not.toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      mockRequest.user = { id: 1 };
      mockRequest.body = validUpdateData;
      const serviceError = new Error('Update failed');
      (userService.updateUserProfile as jest.Mock).mockRejectedValue(serviceError);

      // Act
      await userController.updateProfile(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(userService.updateUserProfile).toHaveBeenCalledWith(1, validUpdateData);
      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(statusMock).not.toHaveBeenCalled();
    });
  });

  describe('updatePassword', () => {
    const validPasswordData = {
      currentPassword: 'oldPass123',
      newPassword: 'newPass123',
    };

    it('should update password successfully', async () => {
      // Arrange
      mockRequest.user = { id: 1 };
      mockRequest.body = validPasswordData;
      (userService.updatePassword as jest.Mock).mockResolvedValue(undefined);

      // Act
      await userController.updatePassword(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(userService.updatePassword).toHaveBeenCalledWith(1, 'oldPass123', 'newPass123');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Password updated successfully' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError if user is not authenticated', async () => {
      // Arrange
      mockRequest.user = undefined;
      mockRequest.body = validPasswordData;

      // Act
      await userController.updatePassword(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(userService.updatePassword).not.toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should throw BadRequestError if currentPassword is missing', async () => {
      // Arrange
      mockRequest.user = { id: 1 };
      mockRequest.body = {
        newPassword: 'newPass123',
      };

      // Act
      await userController.updatePassword(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Current password and new password are required',
        })
      );
      expect(userService.updatePassword).not.toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should throw BadRequestError if newPassword is missing', async () => {
      // Arrange
      mockRequest.user = { id: 1 };
      mockRequest.body = {
        currentPassword: 'oldPass123',
      };

      // Act
      await userController.updatePassword(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(userService.updatePassword).not.toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should throw BadRequestError if newPassword is too short', async () => {
      // Arrange
      mockRequest.user = { id: 1 };
      mockRequest.body = {
        currentPassword: 'oldPass123',
        newPassword: '12345', // less than 6
      };

      // Act
      await userController.updatePassword(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'New password must be at least 6 characters long',
        })
      );
      expect(userService.updatePassword).not.toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      mockRequest.user = { id: 1 };
      mockRequest.body = validPasswordData;
      const serviceError = new Error('Password update failed');
      (userService.updatePassword as jest.Mock).mockRejectedValue(serviceError);

      // Act
      await userController.updatePassword(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(userService.updatePassword).toHaveBeenCalledWith(1, 'oldPass123', 'newPass123');
      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(statusMock).not.toHaveBeenCalled();
    });
  });

  describe('register - Input Validation Edge Cases', () => {
    const validRegistrationData = {
      username: 'newcitizen',
      email: 'citizen@example.com',
      password: 'SecurePass123!',
      first_name: 'John',
      last_name: 'Doe',
    };

    it('should handle special characters in names', async () => {
      // Arrange
      mockRequest.body = {
        ...validRegistrationData,
        first_name: 'João',
        last_name: "O'Reilly",
      };
      (userService.registerCitizen as jest.Mock).mockResolvedValue(mockUserResponse);

      // Act
      await userController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(userService.registerCitizen).toHaveBeenCalledWith(
        expect.objectContaining({
          first_name: 'João',
          last_name: "O'Reilly",
        })
      );
    });

    it('should handle numeric username', async () => {
      // Arrange
      mockRequest.body = {
        ...validRegistrationData,
        username: '12345',
      };
      (userService.registerCitizen as jest.Mock).mockResolvedValue(mockUserResponse);

      // Act
      await userController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(userService.registerCitizen).toHaveBeenCalledWith(
        expect.objectContaining({
          username: '12345',
        })
      );
    });

    it('should pass through extra fields in body to service', async () => {
      // Arrange
      mockRequest.body = {
        ...validRegistrationData,
        extraField: 'should-be-ignored',
      };
      (userService.registerCitizen as jest.Mock).mockResolvedValue(mockUserResponse);

      // Act
      await userController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(userService.registerCitizen).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(201);
    });
  });

  describe('getExternalMaintainersByCategory - Extended Coverage', () => {
    it('should return empty array when no maintainers found', async () => {
      // Arrange
      mockRequest.query = { categoryId: '999' };
      (userService.getExternalMaintainersByCategory as jest.Mock).mockResolvedValue([]);

      // Act
      await userController.getExternalMaintainersByCategory(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith([]);
    });

    it('should return multiple external maintainers', async () => {
      // Arrange
      const maintainers = [
        { id: 1, name: 'Maintainer 1' },
        { id: 2, name: 'Maintainer 2' },
        { id: 3, name: 'Maintainer 3' },
      ];
      mockRequest.query = { categoryId: '1' };
      (userService.getExternalMaintainersByCategory as jest.Mock).mockResolvedValue(maintainers);

      // Act
      await userController.getExternalMaintainersByCategory(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(jsonMock).toHaveBeenCalledWith(maintainers);
      expect(jsonMock.mock.calls[0][0]).toHaveLength(3);
    });

    it('should handle valid category string', async () => {
      // Arrange
      mockRequest.query = { category: 'Roads and Urban Furnishings' };
      (userService.getExternalMaintainersByCategory as jest.Mock).mockResolvedValue([]);

      // Act
      await userController.getExternalMaintainersByCategory(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(userService.getExternalMaintainersByCategory).toHaveBeenCalledWith('Roads and Urban Furnishings');
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should handle timeout errors from service', async () => {
      // Arrange
      mockRequest.query = { category: 'Public Lighting' };
      const timeoutError = new Error('Request timeout');
      (userService.getExternalMaintainersByCategory as jest.Mock).mockRejectedValue(timeoutError);

      // Act
      await userController.getExternalMaintainersByCategory(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(timeoutError);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should handle ConflictError from service', async () => {
      // Arrange
      mockRequest.query = { categoryId: '1' };
      const conflictError = new ConflictError('Category not found');
      (userService.getExternalMaintainersByCategory as jest.Mock).mockRejectedValue(conflictError);

      // Act
      await userController.getExternalMaintainersByCategory(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(conflictError);
    });
  });

  describe('generateTelegramLinkCode', () => {
    it('should generate telegram link code successfully', async () => {
      // Arrange
      const mockUser = { id: 1 };
      const mockCode = 'ABC123';
      mockRequest.user = mockUser;
      (userService.generateTelegramLinkCode as jest.Mock).mockResolvedValue(mockCode);

      // Act
      await userController.generateTelegramLinkCode(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(userService.generateTelegramLinkCode).toHaveBeenCalledWith(1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'ABC123',
        expiresAt: expect.any(String)
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 404 when user not found', async () => {
      // Arrange
      const mockUser = { id: 1 };
      mockRequest.user = mockUser;
      (userService.generateTelegramLinkCode as jest.Mock).mockResolvedValue(null);

      // Act
      await userController.generateTelegramLinkCode(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(userService.generateTelegramLinkCode).toHaveBeenCalledWith(1);
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 404,
        name: 'NotFoundError',
        message: 'User not found'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      // Arrange
      const mockUser = { id: 1 };
      const mockError = new Error('Service error');
      mockRequest.user = mockUser;
      (userService.generateTelegramLinkCode as jest.Mock).mockRejectedValue(mockError);

      // Act
      await userController.generateTelegramLinkCode(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(userService.generateTelegramLinkCode).toHaveBeenCalledWith(1);
      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(statusMock).not.toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();
    });
  });

  describe('getTelegramStatus', () => {
    it('should return telegram status with linked account', async () => {
      // Arrange
      const mockUser = { id: 1 };
      const mockUserEntity = {
        id: 1,
        telegramUsername: 'testuser',
        telegramLinkCode: 'ABC123',
        telegramLinkCodeExpiresAt: new Date(Date.now() + 600000) // 10 minutes from now
      };
      mockRequest.user = mockUser;
      (userRepository.findUserById as jest.Mock).mockResolvedValue(mockUserEntity);

      // Act
      await userController.getTelegramStatus(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(userRepository.findUserById).toHaveBeenCalledWith(1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        isLinked: false,
        telegramUsername: 'testuser',
        activeCode: {
          code: 'ABC123',
          expiresAt: mockUserEntity.telegramLinkCodeExpiresAt
        },
        requiresConfirmation: true
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return telegram status with unlinked account and no active code', async () => {
      // Arrange
      const mockUser = { id: 1 };
      const mockUserEntity = {
        id: 1,
        telegramUsername: null,
        telegramLinkCode: null,
        telegramLinkCodeExpiresAt: null
      };
      mockRequest.user = mockUser;
      (userRepository.findUserById as jest.Mock).mockResolvedValue(mockUserEntity);

      // Act
      await userController.getTelegramStatus(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(userRepository.findUserById).toHaveBeenCalledWith(1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        isLinked: false,
        telegramUsername: null,
        activeCode: null,
        requiresConfirmation: false
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return telegram status with expired code', async () => {
      // Arrange
      const mockUser = { id: 1 };
      const mockUserEntity = {
        id: 1,
        telegramUsername: null,
        telegramLinkCode: 'ABC123',
        telegramLinkCodeExpiresAt: new Date(Date.now() - 600000) // 10 minutes ago
      };
      mockRequest.user = mockUser;
      (userRepository.findUserById as jest.Mock).mockResolvedValue(mockUserEntity);

      // Act
      await userController.getTelegramStatus(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(userRepository.findUserById).toHaveBeenCalledWith(1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        isLinked: false,
        telegramUsername: null,
        activeCode: null,
        requiresConfirmation: false
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 404 when user not found', async () => {
      // Arrange
      const mockUser = { id: 1 };
      mockRequest.user = mockUser;
      (userRepository.findUserById as jest.Mock).mockResolvedValue(null);

      // Act
      await userController.getTelegramStatus(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(userRepository.findUserById).toHaveBeenCalledWith(1);
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 404,
        name: 'NotFoundError',
        message: 'User not found'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      // Arrange
      const mockUser = { id: 1 };
      const mockError = new Error('Repository error');
      mockRequest.user = mockUser;
      (userRepository.findUserById as jest.Mock).mockRejectedValue(mockError);

      // Act
      await userController.getTelegramStatus(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(userRepository.findUserById).toHaveBeenCalledWith(1);
      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(statusMock).not.toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();
    });
  });

  describe('unlinkTelegramAccount', () => {
    it('should unlink telegram account successfully', async () => {
      // Arrange
      const mockUser = { id: 1 };
      const mockResult = { success: true, message: 'Telegram account unlinked successfully' };
      mockRequest.user = mockUser;
      (userService.unlinkTelegramAccount as jest.Mock).mockResolvedValue(mockResult);

      // Act
      await userController.unlinkTelegramAccount(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(userService.unlinkTelegramAccount).toHaveBeenCalledWith(1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Telegram account unlinked successfully'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 when unlink fails', async () => {
      // Arrange
      const mockUser = { id: 1 };
      const mockResult = { success: false, message: 'Account not linked' };
      mockRequest.user = mockUser;
      (userService.unlinkTelegramAccount as jest.Mock).mockResolvedValue(mockResult);

      // Act
      await userController.unlinkTelegramAccount(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(userService.unlinkTelegramAccount).toHaveBeenCalledWith(1);
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 400,
        name: 'BadRequestError',
        message: 'Account not linked'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      // Arrange
      const mockUser = { id: 1 };
      const mockError = new Error('Service error');
      mockRequest.user = mockUser;
      (userService.unlinkTelegramAccount as jest.Mock).mockRejectedValue(mockError);

      // Act
      await userController.unlinkTelegramAccount(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(userService.unlinkTelegramAccount).toHaveBeenCalledWith(1);
      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(statusMock).not.toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();
    });
  });

  describe('confirmTelegramLink', () => {
    it('should confirm telegram link successfully and return refreshed status', async () => {
      // Arrange
      const mockUser = { id: 7 };
      const mockResult = { success: true, message: 'Confirmed' };
      const refreshedUser = {
        id: 7,
        telegramUsername: 'john_doe',
        telegramLinkConfirmed: true
      } as any;

      mockRequest.user = mockUser;
      (userService.confirmTelegramLink as jest.Mock).mockResolvedValue(mockResult);
      (userRepository.findUserById as jest.Mock).mockResolvedValue(refreshedUser);

      // Act
      await userController.confirmTelegramLink(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(userService.confirmTelegramLink).toHaveBeenCalledWith(7);
      expect(userRepository.findUserById).toHaveBeenCalledWith(7);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Confirmed',
        isLinked: true,
        telegramUsername: 'john_doe',
        requiresConfirmation: false
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 when confirmation fails', async () => {
      // Arrange
      const mockUser = { id: 8 };
      const mockResult = { success: false, message: 'Code expired' };
      mockRequest.user = mockUser;
      (userService.confirmTelegramLink as jest.Mock).mockResolvedValue(mockResult);

      // Act
      await userController.confirmTelegramLink(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(userService.confirmTelegramLink).toHaveBeenCalledWith(8);
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 400,
        name: 'BadRequestError',
        message: 'Code expired'
      });
      expect(userRepository.findUserById).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      // Arrange
      const mockUser = { id: 9 };
      const mockError = new Error('Service error');
      mockRequest.user = mockUser;
      (userService.confirmTelegramLink as jest.Mock).mockRejectedValue(mockError);

      // Act
      await userController.confirmTelegramLink(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(userService.confirmTelegramLink).toHaveBeenCalledWith(9);
      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(statusMock).not.toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();
    });
  });

  describe('getNotifications', () => {
    it('should get notifications without filter', async () => {
      // Arrange
      const mockUser = { id: 1 };
      const mockNotifications = [
        { id: 1, message: 'Test notification', isRead: false },
        { id: 2, message: 'Another notification', isRead: true }
      ];
      mockRequest.user = mockUser;
      mockRequest.query = {};
      (userService.getUserNotifications as jest.Mock).mockResolvedValue(mockNotifications);

      // Act
      await userController.getNotifications(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(userService.getUserNotifications).toHaveBeenCalledWith(1, undefined);
      expect(jsonMock).toHaveBeenCalledWith(mockNotifications);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should get notifications filtered by read status true', async () => {
      // Arrange
      const mockUser = { id: 1 };
      const mockNotifications = [{ id: 2, message: 'Read notification', isRead: true }];
      mockRequest.user = mockUser;
      mockRequest.query = { is_read: 'true' };
      (userService.getUserNotifications as jest.Mock).mockResolvedValue(mockNotifications);

      // Act
      await userController.getNotifications(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(userService.getUserNotifications).toHaveBeenCalledWith(1, true);
      expect(jsonMock).toHaveBeenCalledWith(mockNotifications);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should get notifications filtered by read status false', async () => {
      // Arrange
      const mockUser = { id: 1 };
      const mockNotifications = [{ id: 1, message: 'Unread notification', isRead: false }];
      mockRequest.user = mockUser;
      mockRequest.query = { is_read: 'false' };
      (userService.getUserNotifications as jest.Mock).mockResolvedValue(mockNotifications);

      // Act
      await userController.getNotifications(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(userService.getUserNotifications).toHaveBeenCalledWith(1, false);
      expect(jsonMock).toHaveBeenCalledWith(mockNotifications);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should get notifications with invalid is_read query parameter', async () => {
      // Arrange
      const mockUser = { id: 1 };
      const mockNotifications = [
        { id: 1, message: 'Test notification', isRead: false },
        { id: 2, message: 'Another notification', isRead: true }
      ];
      mockRequest.user = mockUser;
      mockRequest.query = { is_read: 'invalid' };
      (userService.getUserNotifications as jest.Mock).mockResolvedValue(mockNotifications);

      // Act
      await userController.getNotifications(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(userService.getUserNotifications).toHaveBeenCalledWith(1, undefined);
      expect(jsonMock).toHaveBeenCalledWith(mockNotifications);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when user not authenticated', async () => {
      // Arrange
      mockRequest.user = undefined;

      // Act
      await userController.getNotifications(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(new UnauthorizedError('Not authenticated'));
      expect(userService.getUserNotifications).not.toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      // Arrange
      const mockUser = { id: 1 };
      const mockError = new Error('Service error');
      mockRequest.user = mockUser;
      mockRequest.query = {};
      (userService.getUserNotifications as jest.Mock).mockRejectedValue(mockError);

      // Act
      await userController.getNotifications(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(userService.getUserNotifications).toHaveBeenCalledWith(1, undefined);
      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(jsonMock).not.toHaveBeenCalled();
    });
  });

  describe('markNotificationAsRead', () => {
    it('should mark notification as read', async () => {
      // Arrange
      const mockUser = { id: 1 };
      const mockNotification = { id: 1, message: 'Test notification', isRead: true };
      mockRequest.user = mockUser;
      mockRequest.params = { id: '1' };
      mockRequest.body = { is_read: true };
      (userService.markNotificationAsRead as jest.Mock).mockResolvedValue(mockNotification);

      // Act
      await userController.markNotificationAsRead(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(userService.markNotificationAsRead).toHaveBeenCalledWith(1, 1, true);
      expect(jsonMock).toHaveBeenCalledWith(mockNotification);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should mark notification as unread', async () => {
      // Arrange
      const mockUser = { id: 1 };
      const mockNotification = { id: 1, message: 'Test notification', isRead: false };
      mockRequest.user = mockUser;
      mockRequest.params = { id: '1' };
      mockRequest.body = { is_read: false };
      (userService.markNotificationAsRead as jest.Mock).mockResolvedValue(mockNotification);

      // Act
      await userController.markNotificationAsRead(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(userService.markNotificationAsRead).toHaveBeenCalledWith(1, 1, false);
      expect(jsonMock).toHaveBeenCalledWith(mockNotification);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle falsy is_read value as false', async () => {
      // Arrange
      const mockUser = { id: 1 };
      const mockNotification = { id: 1, message: 'Test notification', isRead: false };
      mockRequest.user = mockUser;
      mockRequest.params = { id: '1' };
      mockRequest.body = { is_read: null };
      (userService.markNotificationAsRead as jest.Mock).mockResolvedValue(mockNotification);

      // Act
      await userController.markNotificationAsRead(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(userService.markNotificationAsRead).toHaveBeenCalledWith(1, 1, false);
      expect(jsonMock).toHaveBeenCalledWith(mockNotification);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when user not authenticated', async () => {
      // Arrange
      mockRequest.user = undefined;
      mockRequest.params = { id: '1' };
      mockRequest.body = { is_read: true };

      // Act
      await userController.markNotificationAsRead(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(new UnauthorizedError('Not authenticated'));
      expect(userService.markNotificationAsRead).not.toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      // Arrange
      const mockUser = { id: 1 };
      const mockError = new Error('Service error');
      mockRequest.user = mockUser;
      mockRequest.params = { id: '1' };
      mockRequest.body = { is_read: true };
      (userService.markNotificationAsRead as jest.Mock).mockRejectedValue(mockError);

      // Act
      await userController.markNotificationAsRead(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(userService.markNotificationAsRead).toHaveBeenCalledWith(1, 1, true);
      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(jsonMock).not.toHaveBeenCalled();
    });
  });

  describe('findUserByUsername', () => {
    it('should find user by username successfully', async () => {
      // Arrange
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };
      mockRequest.params = { username: 'testuser' };
      (userService.getUserByUsername as jest.Mock).mockResolvedValue(mockUser);

      // Act
      await userController.findUserByUsername(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(userService.getUserByUsername).toHaveBeenCalledWith('testuser');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockUser);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 404 when user not found', async () => {
      // Arrange
      mockRequest.params = { username: 'nonexistent' };
      (userService.getUserByUsername as jest.Mock).mockResolvedValue(null);

      // Act
      await userController.findUserByUsername(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(userService.getUserByUsername).toHaveBeenCalledWith('nonexistent');
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'User not found' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      // Arrange
      const mockError = new Error('Service error');
      mockRequest.params = { username: 'testuser' };
      (userService.getUserByUsername as jest.Mock).mockRejectedValue(mockError);

      // Act
      await userController.findUserByUsername(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(userService.getUserByUsername).toHaveBeenCalledWith('testuser');
      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(statusMock).not.toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();
    });
  });

  describe('Controller Structure', () => {
    it('should be an object', () => {
      expect(typeof userController).toBe('object');
    });

    it('should have register method', () => {
      expect(userController).toHaveProperty('register');
      expect(typeof userController.register).toBe('function');
    });

    it('should have getExternalMaintainersByCategory method', () => {
      expect(userController).toHaveProperty('getExternalMaintainersByCategory');
      expect(typeof userController.getExternalMaintainersByCategory).toBe('function');
    });

    it('should have generateTelegramLinkCode method', () => {
      expect(userController).toHaveProperty('generateTelegramLinkCode');
      expect(typeof userController.generateTelegramLinkCode).toBe('function');
    });

    it('should have getTelegramStatus method', () => {
      expect(userController).toHaveProperty('getTelegramStatus');
      expect(typeof userController.getTelegramStatus).toBe('function');
    });

    it('should have unlinkTelegramAccount method', () => {
      expect(userController).toHaveProperty('unlinkTelegramAccount');
      expect(typeof userController.unlinkTelegramAccount).toBe('function');
    });

    it('should have getNotifications method', () => {
      expect(userController).toHaveProperty('getNotifications');
      expect(typeof userController.getNotifications).toBe('function');
    });

    it('should have markNotificationAsRead method', () => {
      expect(userController).toHaveProperty('markNotificationAsRead');
      expect(typeof userController.markNotificationAsRead).toBe('function');
    });

    it('should have findUserByUsername method', () => {
      expect(userController).toHaveProperty('findUserByUsername');
      expect(typeof userController.findUserByUsername).toBe('function');
    });

    it('register should accept three parameters (req, res, next)', () => {
      expect(userController.register.length).toBe(3);
    });

    it('register should be async', () => {
      expect(userController.register.constructor.name).toBe('AsyncFunction');
    });

    it('getExternalMaintainersByCategory should accept three parameters (req, res, next)', () => {
      expect(userController.getExternalMaintainersByCategory.length).toBe(3);
    });

    it('getExternalMaintainersByCategory should be async', () => {
      expect(userController.getExternalMaintainersByCategory.constructor.name).toBe('AsyncFunction');
    });

    it('generateTelegramLinkCode should accept three parameters (req, res, next)', () => {
      expect(userController.generateTelegramLinkCode.length).toBe(3);
    });

    it('generateTelegramLinkCode should be async', () => {
      expect(userController.generateTelegramLinkCode.constructor.name).toBe('AsyncFunction');
    });

    it('getTelegramStatus should accept three parameters (req, res, next)', () => {
      expect(userController.getTelegramStatus.length).toBe(3);
    });

    it('getTelegramStatus should be async', () => {
      expect(userController.getTelegramStatus.constructor.name).toBe('AsyncFunction');
    });

    it('unlinkTelegramAccount should accept three parameters (req, res, next)', () => {
      expect(userController.unlinkTelegramAccount.length).toBe(3);
    });

    it('unlinkTelegramAccount should be async', () => {
      expect(userController.unlinkTelegramAccount.constructor.name).toBe('AsyncFunction');
    });

    it('getNotifications should accept three parameters (req, res, next)', () => {
      expect(userController.getNotifications.length).toBe(3);
    });

    it('getNotifications should be async', () => {
      expect(userController.getNotifications.constructor.name).toBe('AsyncFunction');
    });

    it('markNotificationAsRead should accept three parameters (req, res, next)', () => {
      expect(userController.markNotificationAsRead.length).toBe(3);
    });

    it('markNotificationAsRead should be async', () => {
      expect(userController.markNotificationAsRead.constructor.name).toBe('AsyncFunction');
    });

    it('findUserByUsername should accept three parameters (req, res, next)', () => {
      expect(userController.findUserByUsername.length).toBe(3);
    });

    it('findUserByUsername should be async', () => {
      expect(userController.findUserByUsername.constructor.name).toBe('AsyncFunction');
    });
  });
});
