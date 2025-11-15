"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const userService_1 = require("@services/userService");
const userRepository_1 = require("@repositories/userRepository");
const departmentRoleRepository_1 = require("@repositories/departmentRoleRepository");
const loggingService_1 = require("@services/loggingService");
const mapperService_1 = require("@services/mapperService");
const ConflictError_1 = require("@models/errors/ConflictError");
const AppError_1 = require("@models/errors/AppError");
const mockEntities_1 = require("@test/utils/mockEntities");
jest.mock('@repositories/userRepository');
jest.mock('@repositories/departmentRoleRepository');
jest.mock('@services/loggingService');
jest.mock('@services/mapperService');
const mockedUserRepository = userRepository_1.userRepository;
const mockedDepartmentRoleRepository = departmentRoleRepository_1.departmentRoleRepository;
const mockedLogInfo = loggingService_1.logInfo;
const mockedMapper = mapperService_1.mapUserEntityToUserResponse;
const mockCitizenEntity = (0, mockEntities_1.createMockCitizen)({
    id: 1,
    username: 'test.citizen',
    email: 'citizen@test.com',
    firstName: 'Test',
    lastName: 'Citizen',
});
const mockCitizenResponse = {
    id: 1,
    username: 'test.citizen',
    email: 'citizen@test.com',
    first_name: 'Test',
    last_name: 'Citizen',
    role_name: 'Citizen',
};
const registerRequest = {
    username: 'test.citizen',
    email: 'citizen@test.com',
    first_name: 'Test',
    last_name: 'Citizen',
    password: 'Password123!',
    role_name: 'Citizen',
};
describe('UserService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedMapper.mockImplementation((entity) => {
            if (entity && entity.id === mockCitizenEntity.id) {
                return mockCitizenResponse;
            }
            return null;
        });
    });
    describe('registerCitizen', () => {
        it('should register a new citizen successfully', async () => {
            // Arrange
            const mockDepartmentRole = (0, mockEntities_1.createMockDepartmentRole)('Citizen');
            mockedUserRepository.existsUserByUsername.mockResolvedValue(false);
            mockedUserRepository.existsUserByEmail.mockResolvedValue(false);
            mockedDepartmentRoleRepository.findByDepartmentAndRole.mockResolvedValue(mockDepartmentRole);
            mockedUserRepository.createUserWithPassword.mockResolvedValue(mockCitizenEntity);
            // Act
            const result = await userService_1.userService.registerCitizen(registerRequest);
            // Assert
            expect(result).toEqual(mockCitizenResponse);
            expect(mockedUserRepository.existsUserByUsername).toHaveBeenCalledWith(registerRequest.username);
            expect(mockedUserRepository.existsUserByEmail).toHaveBeenCalledWith(registerRequest.email);
            expect(mockedDepartmentRoleRepository.findByDepartmentAndRole).toHaveBeenCalledWith('Organization', 'Citizen');
            expect(mockedUserRepository.createUserWithPassword).toHaveBeenCalledWith({
                username: registerRequest.username,
                email: registerRequest.email,
                password: registerRequest.password,
                firstName: registerRequest.first_name,
                lastName: registerRequest.last_name,
                departmentRoleId: mockDepartmentRole.id,
                emailNotificationsEnabled: true
            });
            expect(mockedLogInfo).toHaveBeenCalledWith(expect.stringContaining('New citizen registered'));
            expect(mockedMapper).toHaveBeenCalledWith(mockCitizenEntity);
        });
        it('should use fallback role CITIZEN if role is not provided', async () => {
            // Arrange
            const requestWithoutRole = { ...registerRequest };
            delete requestWithoutRole.role_name;
            const mockDepartmentRole = (0, mockEntities_1.createMockDepartmentRole)('Citizen');
            mockedUserRepository.existsUserByUsername.mockResolvedValue(false);
            mockedUserRepository.existsUserByEmail.mockResolvedValue(false);
            mockedDepartmentRoleRepository.findByDepartmentAndRole.mockResolvedValue(mockDepartmentRole);
            mockedUserRepository.createUserWithPassword.mockResolvedValue(mockCitizenEntity);
            // Act
            await userService_1.userService.registerCitizen(requestWithoutRole);
            // Assert
            expect(mockedDepartmentRoleRepository.findByDepartmentAndRole).toHaveBeenCalledWith('Organization', 'Citizen');
            expect(mockedUserRepository.createUserWithPassword).toHaveBeenCalledWith(expect.objectContaining({
                departmentRoleId: mockDepartmentRole.id
            }));
        });
        it('should throw ConflictError if username already exists', async () => {
            // Arrange
            mockedUserRepository.existsUserByUsername.mockResolvedValue(true);
            // Act and Assert
            await expect(userService_1.userService.registerCitizen(registerRequest)).rejects.toThrow(ConflictError_1.ConflictError);
            await expect(userService_1.userService.registerCitizen(registerRequest)).rejects.toThrow('Username already exists');
            expect(mockedUserRepository.existsUserByEmail).not.toHaveBeenCalled();
            expect(mockedUserRepository.createUserWithPassword).not.toHaveBeenCalled();
        });
        it('should throw ConflictError if email already exists', async () => {
            // Arrange
            mockedUserRepository.existsUserByUsername.mockResolvedValue(false);
            mockedUserRepository.existsUserByEmail.mockResolvedValue(true);
            // Act and Assert
            await expect(userService_1.userService.registerCitizen(registerRequest)).rejects.toThrow(ConflictError_1.ConflictError);
            await expect(userService_1.userService.registerCitizen(registerRequest)).rejects.toThrow('Email already exists');
            expect(mockedUserRepository.createUserWithPassword).not.toHaveBeenCalled();
        });
        it('should throw AppError if mapping fails (safeMapUserToResponse)', async () => {
            // Arrange
            const mockDepartmentRole = (0, mockEntities_1.createMockDepartmentRole)('Citizen');
            mockedUserRepository.existsUserByUsername.mockResolvedValue(false);
            mockedUserRepository.existsUserByEmail.mockResolvedValue(false);
            mockedDepartmentRoleRepository.findByDepartmentAndRole.mockResolvedValue(mockDepartmentRole);
            mockedUserRepository.createUserWithPassword.mockResolvedValue(mockCitizenEntity);
            // Act
            mockedMapper.mockReturnValue(null);
            // Assert
            await expect(userService_1.userService.registerCitizen(registerRequest)).rejects.toThrow(AppError_1.AppError);
            await expect(userService_1.userService.registerCitizen(registerRequest)).rejects.toThrow('Failed to map user data');
        });
    });
    describe('getUserById', () => {
        it('should return a user response if user is found', async () => {
            // Setup Mock
            mockedUserRepository.findUserById.mockResolvedValue(mockCitizenEntity);
            // Esecuzione
            const result = await userService_1.userService.getUserById(1);
            // Assert
            expect(result).toEqual(mockCitizenResponse);
            expect(mockedUserRepository.findUserById).toHaveBeenCalledWith(1);
            expect(mockedMapper).toHaveBeenCalledWith(mockCitizenEntity);
        });
        it('should return null if user is not found', async () => {
            // Arrange
            mockedUserRepository.findUserById.mockResolvedValue(null);
            // Act
            const result = await userService_1.userService.getUserById(999);
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
            const result = await userService_1.userService.getUserById(1);
            // Assert
            expect(result).toBeNull();
            expect(mockedUserRepository.findUserById).toHaveBeenCalledWith(1);
            expect(mockedMapper).toHaveBeenCalledWith(mockCitizenEntity);
        });
    });
});
