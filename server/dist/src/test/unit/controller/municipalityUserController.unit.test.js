"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const municipalityUserController_1 = __importDefault(require("@controllers/municipalityUserController"));
const municipalityUserService_1 = require("@services/municipalityUserService");
const BadRequestError_1 = require("@models/errors/BadRequestError");
const NotFoundError_1 = require("@models/errors/NotFoundError");
// Mock del service
jest.mock('@services/municipalityUserService');
describe('MunicipalityUserController Unit Tests', () => {
    let mockRequest;
    let mockResponse;
    let mockNext;
    beforeEach(() => {
        // Reset dei mock prima di ogni test
        jest.clearAllMocks();
        // Setup mock request
        mockRequest = {
            body: {},
            params: {},
        };
        // Setup mock response
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        };
        // Setup mock next
        mockNext = jest.fn();
    });
    describe('createMunicipalityUser', () => {
        it('should create municipality user successfully', async () => {
            // Arrange
            const requestData = {
                username: 'municipality_user',
                email: 'municipality@test.com',
                password: 'Password123!',
                first_name: 'John',
                last_name: 'Doe',
                role_name: 'Municipal Administrator',
            };
            const expectedResponse = {
                id: 1,
                username: 'municipality_user',
                email: 'municipality@test.com',
                firstName: 'John',
                lastName: 'Doe',
                role_name: 'Municipal Administrator',
            };
            mockRequest.body = requestData;
            municipalityUserService_1.municipalityUserService.createMunicipalityUser.mockResolvedValue(expectedResponse);
            // Act
            await municipalityUserController_1.default.createMunicipalityUser(mockRequest, mockResponse, mockNext);
            // Assert
            expect(municipalityUserService_1.municipalityUserService.createMunicipalityUser).toHaveBeenCalledWith(requestData);
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
            expect(mockNext).not.toHaveBeenCalled();
        });
        it('should return 400 when required fields are missing', async () => {
            // Arrange
            mockRequest.body = {
                username: 'test',
                // email mancante
                password: 'Password123!',
            };
            // Act
            await municipalityUserController_1.default.createMunicipalityUser(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                message: 'All fields are required: username, email, password, first_name, last_name, role_name',
            }));
            expect(municipalityUserService_1.municipalityUserService.createMunicipalityUser).not.toHaveBeenCalled();
        });
        it('should handle service errors', async () => {
            // Arrange
            const requestData = {
                username: 'municipality_user',
                email: 'municipality@test.com',
                password: 'Password123!',
                first_name: 'John',
                last_name: 'Doe',
                role_name: 'Citizen', // Ruolo non valido
            };
            mockRequest.body = requestData;
            const error = new BadRequestError_1.BadRequestError('Cannot create a municipality user with Citizen role');
            municipalityUserService_1.municipalityUserService.createMunicipalityUser.mockRejectedValue(error);
            // Act
            await municipalityUserController_1.default.createMunicipalityUser(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
    describe('getAllMunicipalityUsers', () => {
        it('should return all municipality users', async () => {
            // Arrange
            const expectedUsers = [
                {
                    id: 1,
                    username: 'user1',
                    email: 'user1@test.com',
                    firstName: 'John',
                    lastName: 'Doe',
                    role_name: 'Municipal Administrator',
                },
                {
                    id: 2,
                    username: 'user2',
                    email: 'user2@test.com',
                    firstName: 'Jane',
                    lastName: 'Smith',
                    role_name: 'Technical Office Staff Member',
                },
            ];
            municipalityUserService_1.municipalityUserService.getAllMunicipalityUsers.mockResolvedValue(expectedUsers);
            // Act
            await municipalityUserController_1.default.getAllMunicipalityUsers(mockRequest, mockResponse, mockNext);
            // Assert
            expect(municipalityUserService_1.municipalityUserService.getAllMunicipalityUsers).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(expectedUsers);
            expect(mockNext).not.toHaveBeenCalled();
        });
        it('should handle service errors', async () => {
            // Arrange
            const error = new Error('Database error');
            municipalityUserService_1.municipalityUserService.getAllMunicipalityUsers.mockRejectedValue(error);
            // Act
            await municipalityUserController_1.default.getAllMunicipalityUsers(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
    describe('getMunicipalityUserById', () => {
        it('should return municipality user by valid ID', async () => {
            // Arrange
            const expectedUser = {
                id: 1,
                username: 'municipality_user',
                email: 'municipality@test.com',
                firstName: 'John',
                lastName: 'Doe',
                role_name: 'Municipal Administrator',
            };
            mockRequest.params = { id: '1' };
            municipalityUserService_1.municipalityUserService.getMunicipalityUserById.mockResolvedValue(expectedUser);
            // Act
            await municipalityUserController_1.default.getMunicipalityUserById(mockRequest, mockResponse, mockNext);
            // Assert
            expect(municipalityUserService_1.municipalityUserService.getMunicipalityUserById).toHaveBeenCalledWith(1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(expectedUser);
            expect(mockNext).not.toHaveBeenCalled();
        });
        it('should return 400 for invalid ID', async () => {
            // Arrange
            mockRequest.params = { id: 'invalid' };
            // Act
            await municipalityUserController_1.default.getMunicipalityUserById(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Invalid user ID',
            }));
            expect(municipalityUserService_1.municipalityUserService.getMunicipalityUserById).not.toHaveBeenCalled();
        });
        it('should handle not found error', async () => {
            // Arrange
            mockRequest.params = { id: '999' };
            const error = new NotFoundError_1.NotFoundError('User not found');
            municipalityUserService_1.municipalityUserService.getMunicipalityUserById.mockRejectedValue(error);
            // Act
            await municipalityUserController_1.default.getMunicipalityUserById(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
    describe('updateMunicipalityUser', () => {
        it('should update municipality user successfully', async () => {
            // Arrange
            const updateData = {
                first_name: 'UpdatedName',
                last_name: 'UpdatedLastName',
                email: 'updated@test.com',
                role_name: 'Infrastructure Manager',
            };
            const expectedResponse = {
                id: 1,
                username: 'municipality_user',
                email: 'updated@test.com',
                firstName: 'UpdatedName',
                lastName: 'UpdatedLastName',
                role_name: 'Infrastructure Manager',
            };
            mockRequest.params = { id: '1' };
            mockRequest.body = updateData;
            municipalityUserService_1.municipalityUserService.updateMunicipalityUser.mockResolvedValue(expectedResponse);
            // Act
            await municipalityUserController_1.default.updateMunicipalityUser(mockRequest, mockResponse, mockNext);
            // Assert
            expect(municipalityUserService_1.municipalityUserService.updateMunicipalityUser).toHaveBeenCalledWith(1, {
                firstName: 'UpdatedName',
                lastName: 'UpdatedLastName',
                email: 'updated@test.com',
                role_name: 'Infrastructure Manager',
            });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
            expect(mockNext).not.toHaveBeenCalled();
        });
        it('should return 400 when no fields provided for update', async () => {
            // Arrange
            mockRequest.params = { id: '1' };
            mockRequest.body = {}; // Nessun campo da aggiornare
            // Act
            await municipalityUserController_1.default.updateMunicipalityUser(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                message: 'At least one field must be provided for update',
            }));
            expect(municipalityUserService_1.municipalityUserService.updateMunicipalityUser).not.toHaveBeenCalled();
        });
        it('should return 400 for invalid ID', async () => {
            // Arrange
            mockRequest.params = { id: 'invalid' };
            mockRequest.body = { first_name: 'Test' };
            // Act
            await municipalityUserController_1.default.updateMunicipalityUser(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Invalid user ID',
            }));
            expect(municipalityUserService_1.municipalityUserService.updateMunicipalityUser).not.toHaveBeenCalled();
        });
        it('should update only provided fields', async () => {
            // Arrange
            const updateData = {
                email: 'newemail@test.com',
            };
            const expectedResponse = {
                id: 1,
                username: 'municipality_user',
                email: 'newemail@test.com',
                firstName: 'John',
                lastName: 'Doe',
                role_name: 'Municipal Administrator',
            };
            mockRequest.params = { id: '1' };
            mockRequest.body = updateData;
            municipalityUserService_1.municipalityUserService.updateMunicipalityUser.mockResolvedValue(expectedResponse);
            // Act
            await municipalityUserController_1.default.updateMunicipalityUser(mockRequest, mockResponse, mockNext);
            // Assert
            expect(municipalityUserService_1.municipalityUserService.updateMunicipalityUser).toHaveBeenCalledWith(1, {
                email: 'newemail@test.com',
            });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
        });
    });
    describe('deleteMunicipalityUser', () => {
        it('should delete municipality user successfully', async () => {
            // Arrange
            mockRequest.params = { id: '1' };
            municipalityUserService_1.municipalityUserService.deleteMunicipalityUser.mockResolvedValue(undefined);
            // Act
            await municipalityUserController_1.default.deleteMunicipalityUser(mockRequest, mockResponse, mockNext);
            // Assert
            expect(municipalityUserService_1.municipalityUserService.deleteMunicipalityUser).toHaveBeenCalledWith(1);
            expect(mockResponse.status).toHaveBeenCalledWith(204);
            expect(mockResponse.send).toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });
        it('should return 400 for invalid ID', async () => {
            // Arrange
            mockRequest.params = { id: 'invalid' };
            // Act
            await municipalityUserController_1.default.deleteMunicipalityUser(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Invalid user ID',
            }));
            expect(municipalityUserService_1.municipalityUserService.deleteMunicipalityUser).not.toHaveBeenCalled();
        });
        it('should handle not found error', async () => {
            // Arrange
            mockRequest.params = { id: '999' };
            const error = new NotFoundError_1.NotFoundError('User not found');
            municipalityUserService_1.municipalityUserService.deleteMunicipalityUser.mockRejectedValue(error);
            // Act
            await municipalityUserController_1.default.deleteMunicipalityUser(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
    describe('assignRole', () => {
        it('should assign role successfully', async () => {
            // Arrange
            const newRole = 'Urban Planning Manager';
            const expectedResponse = {
                id: 1,
                username: 'municipality_user',
                email: 'municipality@test.com',
                firstName: 'John',
                lastName: 'Doe',
                role_name: newRole,
            };
            mockRequest.params = { id: '1' };
            mockRequest.body = { role_name: newRole };
            municipalityUserService_1.municipalityUserService.assignRole.mockResolvedValue(expectedResponse);
            // Act
            await municipalityUserController_1.default.assignRole(mockRequest, mockResponse, mockNext);
            // Assert
            expect(municipalityUserService_1.municipalityUserService.assignRole).toHaveBeenCalledWith(1, newRole);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
            expect(mockNext).not.toHaveBeenCalled();
        });
        it('should return 400 when role is missing', async () => {
            // Arrange
            mockRequest.params = { id: '1' };
            mockRequest.body = {}; // Role mancante
            // Act
            await municipalityUserController_1.default.assignRole(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Role is required',
            }));
            expect(municipalityUserService_1.municipalityUserService.assignRole).not.toHaveBeenCalled();
        });
        it('should return 400 for invalid ID', async () => {
            // Arrange
            mockRequest.params = { id: 'invalid' };
            mockRequest.body = { role_name: 'Municipal Administrator' };
            // Act
            await municipalityUserController_1.default.assignRole(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Invalid user ID',
            }));
            expect(municipalityUserService_1.municipalityUserService.assignRole).not.toHaveBeenCalled();
        });
        it('should return 400 for invalid role value', async () => {
            // Arrange
            mockRequest.params = { id: '1' };
            mockRequest.body = { role_name: 'InvalidRole' };
            // Act
            await municipalityUserController_1.default.assignRole(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Invalid role specified',
            }));
            expect(municipalityUserService_1.municipalityUserService.assignRole).not.toHaveBeenCalled();
        });
    });
    describe('getAllRoles', () => {
        it('should return all municipality roles', async () => {
            // Arrange
            const expectedRoles = [
                'Municipal Public Relations Officer',
                'Municipal Administrator',
                'Technical Office Staff Member',
                'Urban Planning Manager',
                'Private Building Manager',
                'Infrastructure Manager',
                'Maintenance Staff Member',
                'Public Green Spaces Manager',
            ];
            // Act
            await municipalityUserController_1.default.getAllRoles(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.arrayContaining(expectedRoles));
            expect(mockNext).not.toHaveBeenCalled();
        });
        it('should not include Citizen or Administrator roles', async () => {
            // Act
            await municipalityUserController_1.default.getAllRoles(mockRequest, mockResponse, mockNext);
            // Assert
            const calledRoles = mockResponse.json.mock.calls[0][0];
            expect(calledRoles).not.toContain('Citizen');
            expect(calledRoles).not.toContain('Administrator');
        });
        it('should handle errors', async () => {
            // Arrange
            // Forziamo un errore mockando RoleUtils
            const error = new Error('Internal error');
            jest.spyOn(mockResponse, 'json').mockImplementationOnce(() => {
                throw error;
            });
            // Act
            await municipalityUserController_1.default.getAllRoles(mockRequest, mockResponse, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
});
