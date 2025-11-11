import { Request, Response, NextFunction } from 'express';
import userController from '@controllers/userController';
import { userService } from '@services/userService';
import { BadRequestError } from '@models/errors/BadRequestError';
import { ConflictError } from '@models/errors/ConflictError';
import { UserRole } from '@models/dto/UserRole';

// Mock delle dipendenze
jest.mock('@services/userService');

describe('UserController Unit Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  const mockUserResponse = {
    id: 1,
    username: 'newcitizen',
    email: 'citizen@example.com',
    first_name: 'John',
    last_name: 'Doe',
    role: 'citizen',
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
      expect(userService.registerCitizen).toHaveBeenCalledWith({
        username: validRegistrationData.username,
        email: validRegistrationData.email,
        password: validRegistrationData.password,
        first_name: validRegistrationData.first_name,
        last_name: validRegistrationData.last_name,
        role: UserRole.CITIZEN,
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

    it('should set role as CITIZEN by default', async () => {
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
      expect(userService.registerCitizen).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.CITIZEN,
        })
      );
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
        role: UserRole.CITIZEN,
      });
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

    it('register should accept three parameters (req, res, next)', () => {
      expect(userController.register.length).toBe(3);
    });

    it('register should be async', () => {
      expect(userController.register.constructor.name).toBe('AsyncFunction');
    });
  });
});
