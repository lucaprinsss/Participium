import { Request, Response, NextFunction } from 'express';
import userController from '@controllers/userController';
import { userService } from '@services/userService';
import { departmentService } from '@services/departmentService';
import { BadRequestError } from '@models/errors/BadRequestError';
import { ConflictError } from '@models/errors/ConflictError';
import { AppError } from '@models/errors/AppError';

// Mock delle dipendenze
jest.mock('@services/userService');
jest.mock('@services/departmentService');

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
    // Reset dei mock prima di ogni test
    jest.clearAllMocks();

    // Setup mock della response
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    // Setup mock della request
    mockRequest = {
      body: {},
    };

    // Setup mock della response
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    // Setup mock del next
    mockNext = jest.fn();

    // Setup default mock per departmentService.getDepartmentRoleIdsByRoleName
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
  });
});
