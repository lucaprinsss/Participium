import { Request, Response, NextFunction } from 'express';
import authController from '@controllers/authController';
import { authService } from '@services/authService';
import { UnauthorizedError } from '@models/errors/UnauthorizedError';
import { userEntity } from '@models/entity/userEntity';
import passport from 'passport';

// Mock delle dipendenze
jest.mock('@services/authService');
jest.mock('passport');

describe('AuthController Unit Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let clearCookieMock: jest.Mock;

  const mockUser: userEntity = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    passwordHash: 'salt:hash',
    firstName: 'Test',
    lastName: 'User',
    role: 'citizen',
    personalPhotoUrl: undefined,
    telegramUsername: undefined,
    emailNotificationsEnabled: true,
    createdAt: new Date(),
  };

  const mockUserResponse = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    role: 'citizen',
  };

  beforeEach(() => {
    // Reset dei mock prima di ogni test
    jest.clearAllMocks();

    // Setup mock della response
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    clearCookieMock = jest.fn();

    // Setup mock della request
    mockRequest = {
      body: {},
      session: {
        destroy: jest.fn((callback) => callback(null)),
      } as any,
      user: undefined,
      logIn: jest.fn((user, callback) => callback(null)) as any,
      logout: jest.fn((callback) => callback(null)) as any,
      isAuthenticated: jest.fn() as any,
    };

    // Setup mock della response
    mockResponse = {
      status: statusMock,
      json: jsonMock,
      clearCookie: clearCookieMock,
    };

    // Setup mock del next
    mockNext = jest.fn();
  });

  describe('login', () => {
    const loginData = {
      username: 'testuser',
      password: 'Password123!',
    };

    it('should login successfully with valid credentials', () => {
      // Arrange
      mockRequest.body = loginData;
      (authService.createUserResponse as jest.Mock).mockReturnValue(mockUserResponse);

      // Mock passport.authenticate per simulare successo
      (passport.authenticate as jest.Mock).mockImplementation((strategy, callback) => {
        return (req: Request, res: Response, next: NextFunction) => {
          callback(null, mockUser, { message: 'Success' });
        };
      });

      // Act
      authController.login(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(passport.authenticate).toHaveBeenCalledWith('local', expect.any(Function));
      expect(mockRequest.logIn).toHaveBeenCalledWith(mockUser, expect.any(Function));
      expect(authService.createUserResponse).toHaveBeenCalledWith(mockUser);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockUserResponse);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid credentials', () => {
      // Arrange
      mockRequest.body = loginData;

      // Mock passport.authenticate per simulare fallimento
      (passport.authenticate as jest.Mock).mockImplementation((strategy, callback) => {
        return (req: Request, res: Response, next: NextFunction) => {
          callback(null, false, { message: 'Invalid credentials' });
        };
      });

      // Act
      authController.login(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(passport.authenticate).toHaveBeenCalledWith('local', expect.any(Function));
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should handle authentication errors', () => {
      // Arrange
      mockRequest.body = loginData;
      const authError = new Error('Authentication failed');

      // Mock passport.authenticate per simulare errore
      (passport.authenticate as jest.Mock).mockImplementation((strategy, callback) => {
        return (req: Request, res: Response, next: NextFunction) => {
          callback(authError, false, {});
        };
      });

      // Act
      authController.login(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(passport.authenticate).toHaveBeenCalledWith('local', expect.any(Function));
      expect(mockNext).toHaveBeenCalledWith(authError);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should handle login errors from req.logIn', () => {
      // Arrange
      mockRequest.body = loginData;
      const loginError = new Error('Login failed');
      mockRequest.logIn = jest.fn((user, callback) => callback(loginError)) as any;

      // Mock passport.authenticate per simulare successo
      (passport.authenticate as jest.Mock).mockImplementation((strategy, callback) => {
        return (req: Request, res: Response, next: NextFunction) => {
          callback(null, mockUser, { message: 'Success' });
        };
      });

      // Act
      authController.login(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockRequest.logIn).toHaveBeenCalledWith(mockUser, expect.any(Function));
      expect(mockNext).toHaveBeenCalledWith(loginError);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should use default message if info.message is not provided', () => {
      // Arrange
      mockRequest.body = loginData;

      // Mock passport.authenticate con info vuoto
      (passport.authenticate as jest.Mock).mockImplementation((strategy, callback) => {
        return (req: Request, res: Response, next: NextFunction) => {
          callback(null, false, {});
        };
      });

      // Act
      authController.login(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid credentials',
        })
      );
    });

    it('should not expose sensitive data in response', () => {
      // Arrange
      mockRequest.body = loginData;
      (authService.createUserResponse as jest.Mock).mockReturnValue(mockUserResponse);

      // Mock passport.authenticate per simulare successo
      (passport.authenticate as jest.Mock).mockImplementation((strategy, callback) => {
        return (req: Request, res: Response, next: NextFunction) => {
          callback(null, mockUser, { message: 'Success' });
        };
      });

      // Act
      authController.login(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(jsonMock).toHaveBeenCalledWith(
        expect.not.objectContaining({
          passwordHash: expect.anything(),
        })
      );
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user if authenticated', () => {
      // Arrange
      mockRequest.user = mockUser;
      (authService.createUserResponse as jest.Mock).mockReturnValue(mockUserResponse);

      // Act
      authController.getCurrentUser(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(authService.createUserResponse).toHaveBeenCalledWith(mockUser);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockUserResponse);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if not authenticated', () => {
      // Arrange
      mockRequest.user = undefined;

      // Act
      authController.getCurrentUser(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Not authenticated',
        })
      );
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should handle errors from authService', () => {
      // Arrange
      mockRequest.user = mockUser;
      const serviceError = new Error('Service error');
      (authService.createUserResponse as jest.Mock).mockImplementation(() => {
        throw serviceError;
      });

      // Act
      authController.getCurrentUser(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should not expose sensitive data in response', () => {
      // Arrange
      mockRequest.user = mockUser;
      (authService.createUserResponse as jest.Mock).mockReturnValue(mockUserResponse);

      // Act
      authController.getCurrentUser(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(jsonMock).toHaveBeenCalledWith(
        expect.not.objectContaining({
          passwordHash: expect.anything(),
        })
      );
    });
  });

  describe('logout', () => {
    it('should logout successfully', () => {
      // Act
      authController.logout(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockRequest.logout).toHaveBeenCalled();
      expect(mockRequest.session?.destroy).toHaveBeenCalled();
      expect(clearCookieMock).toHaveBeenCalledWith('connect.sid');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Logged out successfully' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle logout errors from req.logout', () => {
      // Arrange
      const logoutError = new Error('Logout failed');
      mockRequest.logout = jest.fn((callback) => callback(logoutError)) as any;

      // Act
      authController.logout(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockRequest.logout).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(logoutError);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should handle session destroy errors', () => {
      // Arrange
      const sessionError = new Error('Session destroy failed');
      mockRequest.session = {
        destroy: jest.fn((callback) => callback(sessionError)),
      } as any;

      // Act
      authController.logout(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockRequest.logout).toHaveBeenCalled();
      expect(mockRequest.session?.destroy).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(sessionError);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should clear session cookie', () => {
      // Act
      authController.logout(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(clearCookieMock).toHaveBeenCalledWith('connect.sid');
    });

    it('should call logout and destroy in correct order', () => {
      // Arrange
      const callOrder: string[] = [];
      mockRequest.logout = jest.fn((callback) => {
        callOrder.push('logout');
        callback(null);
      }) as any;
      mockRequest.session = {
        destroy: jest.fn((callback) => {
          callOrder.push('destroy');
          callback(null);
        }),
      } as any;

      // Act
      authController.logout(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(callOrder).toEqual(['logout', 'destroy']);
    });
  });

  describe('Controller Structure', () => {
    it('should be an object', () => {
      expect(typeof authController).toBe('object');
    });

    it('should have login method', () => {
      expect(authController).toHaveProperty('login');
      expect(typeof authController.login).toBe('function');
    });

    it('should have getCurrentUser method', () => {
      expect(authController).toHaveProperty('getCurrentUser');
      expect(typeof authController.getCurrentUser).toBe('function');
    });

    it('should have logout method', () => {
      expect(authController).toHaveProperty('logout');
      expect(typeof authController.logout).toBe('function');
    });

    it('login should accept three parameters (req, res, next)', () => {
      expect(authController.login.length).toBe(3);
    });

    it('getCurrentUser should accept three parameters (req, res, next)', () => {
      expect(authController.getCurrentUser.length).toBe(3);
    });

    it('logout should accept three parameters (req, res, next)', () => {
      expect(authController.logout.length).toBe(3);
    });
  });
});
