"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const authController_1 = __importDefault(require("@controllers/authController"));
const authService_1 = require("@services/authService");
const UnauthorizedError_1 = require("@models/errors/UnauthorizedError");
const passport_1 = __importDefault(require("passport"));
// Mock delle dipendenze
jest.mock('@services/authService');
jest.mock('passport');
describe('AuthController Unit Tests', () => {
    let mockRequest;
    let mockResponse;
    let mockNext;
    let jsonMock;
    let statusMock;
    let clearCookieMock;
    const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'salt:hash',
        firstName: 'Test',
        lastName: 'User',
        departmentRoleId: 1,
        departmentRole: {
            id: 1,
            departmentId: 1,
            roleId: 1,
            department: {},
            role: {
                id: 1,
                name: 'Citizen',
                description: 'Regular citizen user',
                departmentRoles: []
            },
            users: []
        },
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
        role_name: 'citizen',
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
            },
            user: undefined,
            logIn: jest.fn((user, callback) => callback(null)),
            logout: jest.fn((callback) => callback(null)),
            isAuthenticated: jest.fn(),
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
            authService_1.authService.createUserResponse.mockReturnValue(mockUserResponse);
            // Mock passport.authenticate per simulare successo
            passport_1.default.authenticate.mockImplementation((strategy, callback) => {
                return (req, res, next) => {
                    callback(null, mockUser, { message: 'Success' });
                };
            });
            // Act
            authController_1.default.login(mockRequest, mockResponse, mockNext);
            // Assert
            expect(passport_1.default.authenticate).toHaveBeenCalledWith('local', expect.any(Function));
            expect(mockRequest.logIn).toHaveBeenCalledWith(mockUser, expect.any(Function));
            expect(authService_1.authService.createUserResponse).toHaveBeenCalledWith(mockUser);
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(mockUserResponse);
            expect(mockNext).not.toHaveBeenCalled();
        });
        it('should return 401 for invalid credentials', () => {
            // Arrange
            mockRequest.body = loginData;
            // Mock passport.authenticate per simulare fallimento
            passport_1.default.authenticate.mockImplementation((strategy, callback) => {
                return (req, res, next) => {
                    callback(null, false, { message: 'Invalid credentials' });
                };
            });
            // Act
            authController_1.default.login(mockRequest, mockResponse, mockNext);
            // Assert
            expect(passport_1.default.authenticate).toHaveBeenCalledWith('local', expect.any(Function));
            expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError_1.UnauthorizedError));
            expect(statusMock).not.toHaveBeenCalled();
        });
        it('should handle authentication errors', () => {
            // Arrange
            mockRequest.body = loginData;
            const authError = new Error('Authentication failed');
            // Mock passport.authenticate per simulare errore
            passport_1.default.authenticate.mockImplementation((strategy, callback) => {
                return (req, res, next) => {
                    callback(authError, false, {});
                };
            });
            // Act
            authController_1.default.login(mockRequest, mockResponse, mockNext);
            // Assert
            expect(passport_1.default.authenticate).toHaveBeenCalledWith('local', expect.any(Function));
            expect(mockNext).toHaveBeenCalledWith(authError);
            expect(statusMock).not.toHaveBeenCalled();
        });
        it('should handle login errors from req.logIn', () => {
            // Arrange
            mockRequest.body = loginData;
            const loginError = new Error('Login failed');
            mockRequest.logIn = jest.fn((user, callback) => callback(loginError));
            // Mock passport.authenticate per simulare successo
            passport_1.default.authenticate.mockImplementation((strategy, callback) => {
                return (req, res, next) => {
                    callback(null, mockUser, { message: 'Success' });
                };
            });
            // Act
            authController_1.default.login(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockRequest.logIn).toHaveBeenCalledWith(mockUser, expect.any(Function));
            expect(mockNext).toHaveBeenCalledWith(loginError);
            expect(statusMock).not.toHaveBeenCalled();
        });
        it('should use default message if info.message is not provided', () => {
            // Arrange
            mockRequest.body = loginData;
            // Mock passport.authenticate con info vuoto
            passport_1.default.authenticate.mockImplementation((strategy, callback) => {
                return (req, res, next) => {
                    callback(null, false, {});
                };
            });
            // Act
            authController_1.default.login(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Invalid credentials',
            }));
        });
        it('should not expose sensitive data in response', () => {
            // Arrange
            mockRequest.body = loginData;
            authService_1.authService.createUserResponse.mockReturnValue(mockUserResponse);
            // Mock passport.authenticate per simulare successo
            passport_1.default.authenticate.mockImplementation((strategy, callback) => {
                return (req, res, next) => {
                    callback(null, mockUser, { message: 'Success' });
                };
            });
            // Act
            authController_1.default.login(mockRequest, mockResponse, mockNext);
            // Assert
            expect(jsonMock).toHaveBeenCalledWith(expect.not.objectContaining({
                passwordHash: expect.anything(),
            }));
        });
    });
    describe('getCurrentUser', () => {
        it('should return current user if authenticated', () => {
            // Arrange
            mockRequest.user = mockUser;
            authService_1.authService.createUserResponse.mockReturnValue(mockUserResponse);
            // Act
            authController_1.default.getCurrentUser(mockRequest, mockResponse, mockNext);
            // Assert
            expect(authService_1.authService.createUserResponse).toHaveBeenCalledWith(mockUser);
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(mockUserResponse);
            expect(mockNext).not.toHaveBeenCalled();
        });
        it('should return 401 if not authenticated', () => {
            // Arrange
            mockRequest.user = undefined;
            // Act
            authController_1.default.getCurrentUser(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError_1.UnauthorizedError));
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Not authenticated',
            }));
            expect(statusMock).not.toHaveBeenCalled();
        });
        it('should handle errors from authService', () => {
            // Arrange
            mockRequest.user = mockUser;
            const serviceError = new Error('Service error');
            authService_1.authService.createUserResponse.mockImplementation(() => {
                throw serviceError;
            });
            // Act
            authController_1.default.getCurrentUser(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalledWith(serviceError);
            expect(statusMock).not.toHaveBeenCalled();
        });
        it('should not expose sensitive data in response', () => {
            // Arrange
            mockRequest.user = mockUser;
            authService_1.authService.createUserResponse.mockReturnValue(mockUserResponse);
            // Act
            authController_1.default.getCurrentUser(mockRequest, mockResponse, mockNext);
            // Assert
            expect(jsonMock).toHaveBeenCalledWith(expect.not.objectContaining({
                passwordHash: expect.anything(),
            }));
        });
    });
    describe('logout', () => {
        it('should logout successfully', () => {
            // Act
            authController_1.default.logout(mockRequest, mockResponse, mockNext);
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
            mockRequest.logout = jest.fn((callback) => callback(logoutError));
            // Act
            authController_1.default.logout(mockRequest, mockResponse, mockNext);
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
            };
            // Act
            authController_1.default.logout(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockRequest.logout).toHaveBeenCalled();
            expect(mockRequest.session?.destroy).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(sessionError);
            expect(statusMock).not.toHaveBeenCalled();
        });
        it('should clear session cookie', () => {
            // Act
            authController_1.default.logout(mockRequest, mockResponse, mockNext);
            // Assert
            expect(clearCookieMock).toHaveBeenCalledWith('connect.sid');
        });
        it('should call logout and destroy in correct order', () => {
            // Arrange
            const callOrder = [];
            mockRequest.logout = jest.fn((callback) => {
                callOrder.push('logout');
                callback(null);
            });
            mockRequest.session = {
                destroy: jest.fn((callback) => {
                    callOrder.push('destroy');
                    callback(null);
                }),
            };
            // Act
            authController_1.default.logout(mockRequest, mockResponse, mockNext);
            // Assert
            expect(callOrder).toEqual(['logout', 'destroy']);
        });
    });
    describe('Controller Structure', () => {
        it('should be an object', () => {
            expect(typeof authController_1.default).toBe('object');
        });
        it('should have login method', () => {
            expect(authController_1.default).toHaveProperty('login');
            expect(typeof authController_1.default.login).toBe('function');
        });
        it('should have getCurrentUser method', () => {
            expect(authController_1.default).toHaveProperty('getCurrentUser');
            expect(typeof authController_1.default.getCurrentUser).toBe('function');
        });
        it('should have logout method', () => {
            expect(authController_1.default).toHaveProperty('logout');
            expect(typeof authController_1.default.logout).toBe('function');
        });
        it('login should accept three parameters (req, res, next)', () => {
            expect(authController_1.default.login.length).toBe(3);
        });
        it('getCurrentUser should accept three parameters (req, res, next)', () => {
            expect(authController_1.default.getCurrentUser.length).toBe(3);
        });
        it('logout should accept three parameters (req, res, next)', () => {
            expect(authController_1.default.logout.length).toBe(3);
        });
    });
});
