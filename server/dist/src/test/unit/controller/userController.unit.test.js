"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const userController_1 = __importDefault(require("@controllers/userController"));
const userService_1 = require("@services/userService");
const BadRequestError_1 = require("@models/errors/BadRequestError");
const ConflictError_1 = require("@models/errors/ConflictError");
// Mock delle dipendenze
jest.mock('@services/userService');
describe('UserController Unit Tests', () => {
    let mockRequest;
    let mockResponse;
    let mockNext;
    let jsonMock;
    let statusMock;
    const mockUserResponse = {
        id: 1,
        username: 'newcitizen',
        email: 'citizen@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role_name: 'Citizen',
        department_name: 'Organization',
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
            userService_1.userService.registerCitizen.mockResolvedValue(mockUserResponse);
            // Act
            await userController_1.default.register(mockRequest, mockResponse, mockNext);
            // Assert
            expect(userService_1.userService.registerCitizen).toHaveBeenCalledWith({
                username: validRegistrationData.username,
                email: validRegistrationData.email,
                password: validRegistrationData.password,
                first_name: validRegistrationData.first_name,
                last_name: validRegistrationData.last_name,
                role_name: 'Citizen',
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
            await userController_1.default.register(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError_1.BadRequestError));
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                message: 'All fields are required: username, email, password, first_name, last_name',
            }));
            expect(userService_1.userService.registerCitizen).not.toHaveBeenCalled();
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
            await userController_1.default.register(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError_1.BadRequestError));
            expect(userService_1.userService.registerCitizen).not.toHaveBeenCalled();
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
            await userController_1.default.register(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError_1.BadRequestError));
            expect(userService_1.userService.registerCitizen).not.toHaveBeenCalled();
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
            await userController_1.default.register(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError_1.BadRequestError));
            expect(userService_1.userService.registerCitizen).not.toHaveBeenCalled();
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
            await userController_1.default.register(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError_1.BadRequestError));
            expect(userService_1.userService.registerCitizen).not.toHaveBeenCalled();
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
            await userController_1.default.register(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError_1.BadRequestError));
            expect(userService_1.userService.registerCitizen).not.toHaveBeenCalled();
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
            await userController_1.default.register(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError_1.BadRequestError));
            expect(userService_1.userService.registerCitizen).not.toHaveBeenCalled();
        });
        it('should return 409 if username already exists', async () => {
            // Arrange
            mockRequest.body = validRegistrationData;
            const conflictError = new ConflictError_1.ConflictError('Username already exists');
            userService_1.userService.registerCitizen.mockRejectedValue(conflictError);
            // Act
            await userController_1.default.register(mockRequest, mockResponse, mockNext);
            // Assert
            expect(userService_1.userService.registerCitizen).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(conflictError);
            expect(statusMock).not.toHaveBeenCalled();
        });
        it('should return 409 if email already exists', async () => {
            // Arrange
            mockRequest.body = validRegistrationData;
            const conflictError = new ConflictError_1.ConflictError('Email already exists');
            userService_1.userService.registerCitizen.mockRejectedValue(conflictError);
            // Act
            await userController_1.default.register(mockRequest, mockResponse, mockNext);
            // Assert
            expect(userService_1.userService.registerCitizen).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(conflictError);
            expect(statusMock).not.toHaveBeenCalled();
        });
        it('should handle service errors gracefully', async () => {
            // Arrange
            mockRequest.body = validRegistrationData;
            const serviceError = new Error('Service error');
            userService_1.userService.registerCitizen.mockRejectedValue(serviceError);
            // Act
            await userController_1.default.register(mockRequest, mockResponse, mockNext);
            // Assert
            expect(userService_1.userService.registerCitizen).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(serviceError);
            expect(statusMock).not.toHaveBeenCalled();
        });
        it('should set role as CITIZEN by default', async () => {
            // Arrange
            mockRequest.body = validRegistrationData;
            userService_1.userService.registerCitizen.mockResolvedValue(mockUserResponse);
            // Act
            await userController_1.default.register(mockRequest, mockResponse, mockNext);
            // Assert
            expect(userService_1.userService.registerCitizen).toHaveBeenCalledWith(expect.objectContaining({
                role_name: 'Citizen',
            }));
        });
        it('should not expose sensitive data in response', async () => {
            // Arrange
            mockRequest.body = validRegistrationData;
            userService_1.userService.registerCitizen.mockResolvedValue(mockUserResponse);
            // Act
            await userController_1.default.register(mockRequest, mockResponse, mockNext);
            // Assert
            expect(jsonMock).toHaveBeenCalledWith(expect.not.objectContaining({
                password: expect.anything(),
                passwordHash: expect.anything(),
            }));
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
            await userController_1.default.register(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError_1.BadRequestError));
            expect(userService_1.userService.registerCitizen).not.toHaveBeenCalled();
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
            await userController_1.default.register(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError_1.BadRequestError));
            expect(userService_1.userService.registerCitizen).not.toHaveBeenCalled();
        });
        it('should call userService.registerCitizen with correct parameters', async () => {
            // Arrange
            mockRequest.body = validRegistrationData;
            userService_1.userService.registerCitizen.mockResolvedValue(mockUserResponse);
            // Act
            await userController_1.default.register(mockRequest, mockResponse, mockNext);
            // Assert
            expect(userService_1.userService.registerCitizen).toHaveBeenCalledTimes(1);
            expect(userService_1.userService.registerCitizen).toHaveBeenCalledWith({
                username: validRegistrationData.username,
                email: validRegistrationData.email,
                password: validRegistrationData.password,
                first_name: validRegistrationData.first_name,
                last_name: validRegistrationData.last_name,
                role_name: 'Citizen',
            });
        });
    });
    describe('Controller Structure', () => {
        it('should be an object', () => {
            expect(typeof userController_1.default).toBe('object');
        });
        it('should have register method', () => {
            expect(userController_1.default).toHaveProperty('register');
            expect(typeof userController_1.default.register).toBe('function');
        });
        it('register should accept three parameters (req, res, next)', () => {
            expect(userController_1.default.register.length).toBe(3);
        });
        it('register should be async', () => {
            expect(userController_1.default.register.constructor.name).toBe('AsyncFunction');
        });
    });
});
