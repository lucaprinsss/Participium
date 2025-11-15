"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const userRepository_1 = require("@repositories/userRepository");
const passwordUtils = __importStar(require("@utils/passwordUtils"));
const mockEntities_1 = require("@test/utils/mockEntities");
// Mock delle dipendenze
jest.mock('@database/connection');
jest.mock('@utils/passwordUtils');
describe('UserRepository Unit Tests', () => {
    let mockRepository;
    let mockQueryBuilder;
    beforeEach(() => {
        // Reset dei mock prima di ogni test
        jest.clearAllMocks();
        // Setup mock del QueryBuilder
        mockQueryBuilder = {
            where: jest.fn().mockReturnThis(),
            addSelect: jest.fn().mockReturnThis(),
            getOne: jest.fn(),
            leftJoinAndSelect: jest.fn().mockReturnThis(),
        };
        // Setup mock del repository TypeORM
        mockRepository = {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            exists: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
        };
        // Mock del repository interno di userRepository
        userRepository_1.userRepository.repository = mockRepository;
        // Mock di passwordUtils
        passwordUtils.generatePasswordData.mockResolvedValue({
            salt: 'mocksalt',
            hash: 'mockhash',
        });
    });
    describe('createUserWithPassword', () => {
        const validUserData = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'SecurePass123!',
            firstName: 'Test',
            lastName: 'User',
            departmentRoleId: 1,
        };
        it('should create user with hashed password successfully', async () => {
            // Arrange
            const mockCreatedUser = (0, mockEntities_1.createMockCitizen)({
                id: 1,
                username: validUserData.username,
                email: validUserData.email,
                firstName: validUserData.firstName,
                lastName: validUserData.lastName,
            });
            mockCreatedUser.passwordHash = 'mocksalt:mockhash';
            mockRepository.create.mockReturnValue(mockCreatedUser);
            mockRepository.save.mockResolvedValue(mockCreatedUser);
            // Act
            const result = await userRepository_1.userRepository.createUserWithPassword(validUserData);
            // Assert
            expect(passwordUtils.generatePasswordData).toHaveBeenCalledWith(validUserData.password);
            expect(mockRepository.create).toHaveBeenCalledWith(expect.objectContaining({
                username: validUserData.username,
                email: validUserData.email,
                firstName: validUserData.firstName,
                lastName: validUserData.lastName,
                departmentRoleId: validUserData.departmentRoleId,
                passwordHash: 'mocksalt:mockhash',
            }));
            expect(mockRepository.save).toHaveBeenCalledWith(mockCreatedUser);
            expect(result).toEqual(mockCreatedUser);
            expect(result.id).toBe(1);
        });
        it('should set default emailNotificationsEnabled to true', async () => {
            // Arrange
            const mockCreatedUser = (0, mockEntities_1.createMockCitizen)({
                id: 1,
                username: validUserData.username,
                email: validUserData.email,
                firstName: validUserData.firstName,
                lastName: validUserData.lastName,
            });
            mockCreatedUser.passwordHash = 'mocksalt:mockhash';
            mockRepository.create.mockReturnValue(mockCreatedUser);
            mockRepository.save.mockResolvedValue(mockCreatedUser);
            // Act
            const result = await userRepository_1.userRepository.createUserWithPassword(validUserData);
            // Assert - Verifica che il database imposti il valore di default
            expect(result.emailNotificationsEnabled).toBe(true);
        });
        it('should allow custom emailNotificationsEnabled value', async () => {
            // Arrange
            const userDataWithNotifications = {
                ...validUserData,
                emailNotificationsEnabled: false,
            };
            const mockCreatedUser = (0, mockEntities_1.createMockCitizen)({
                id: 1,
                username: userDataWithNotifications.username,
                email: userDataWithNotifications.email,
                firstName: userDataWithNotifications.firstName,
                lastName: userDataWithNotifications.lastName,
            });
            mockCreatedUser.passwordHash = 'mocksalt:mockhash';
            mockCreatedUser.emailNotificationsEnabled = false;
            mockRepository.create.mockReturnValue(mockCreatedUser);
            mockRepository.save.mockResolvedValue(mockCreatedUser);
            // Act
            const result = await userRepository_1.userRepository.createUserWithPassword(userDataWithNotifications);
            // Assert - Verifica che il valore custom sia preservato
            expect(result.emailNotificationsEnabled).toBe(false);
        });
        it('should hash password with salt', async () => {
            // Arrange
            const mockCreatedUser = (0, mockEntities_1.createMockCitizen)({
                id: 1,
                username: validUserData.username,
                email: validUserData.email,
                firstName: validUserData.firstName,
                lastName: validUserData.lastName,
            });
            mockCreatedUser.passwordHash = 'mocksalt:mockhash';
            mockRepository.create.mockReturnValue(mockCreatedUser);
            mockRepository.save.mockResolvedValue(mockCreatedUser);
            // Act
            await userRepository_1.userRepository.createUserWithPassword(validUserData);
            // Assert
            expect(passwordUtils.generatePasswordData).toHaveBeenCalledWith(validUserData.password);
            const createCall = mockRepository.create.mock.calls[0][0];
            expect(createCall.passwordHash).toBeDefined();
            expect(createCall.passwordHash).toBe('mocksalt:mockhash');
            expect(createCall.passwordHash).toContain(':');
            expect(createCall.passwordHash).not.toBe(validUserData.password);
        });
        it('should handle database save errors', async () => {
            // Arrange
            const dbError = new Error('Database connection failed');
            mockRepository.create.mockReturnValue({});
            mockRepository.save.mockRejectedValue(dbError);
            // Act & Assert
            await expect(userRepository_1.userRepository.createUserWithPassword(validUserData)).rejects.toThrow('Database connection failed');
            expect(mockRepository.save).toHaveBeenCalled();
        });
        it('should create user with all required fields', async () => {
            // Arrange
            const mockCreatedUser = (0, mockEntities_1.createMockCitizen)({
                id: 1,
                username: validUserData.username,
                email: validUserData.email,
                firstName: validUserData.firstName,
                lastName: validUserData.lastName,
            });
            mockCreatedUser.passwordHash = 'mocksalt:mockhash';
            mockRepository.create.mockReturnValue(mockCreatedUser);
            mockRepository.save.mockResolvedValue(mockCreatedUser);
            // Act
            const result = await userRepository_1.userRepository.createUserWithPassword(validUserData);
            // Assert
            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('username');
            expect(result).toHaveProperty('email');
            expect(result).toHaveProperty('passwordHash');
            expect(result).toHaveProperty('firstName');
            expect(result).toHaveProperty('lastName');
            expect(result).toHaveProperty('departmentRoleId');
            expect(result).toHaveProperty('createdAt');
        });
        it('should handle password hashing errors', async () => {
            // Arrange
            const hashError = new Error('Password hashing failed');
            passwordUtils.generatePasswordData.mockRejectedValue(hashError);
            // Act & Assert
            await expect(userRepository_1.userRepository.createUserWithPassword(validUserData)).rejects.toThrow('Password hashing failed');
        });
    });
    describe('existsUserByUsername', () => {
        it('should return true if username exists', async () => {
            // Arrange
            mockRepository.exists.mockResolvedValue(true);
            // Act
            const result = await userRepository_1.userRepository.existsUserByUsername('existinguser');
            // Assert
            expect(mockRepository.exists).toHaveBeenCalledWith({
                where: { username: 'existinguser' },
            });
            expect(result).toBe(true);
        });
        it('should return false if username does not exist', async () => {
            // Arrange
            mockRepository.exists.mockResolvedValue(false);
            // Act
            const result = await userRepository_1.userRepository.existsUserByUsername('newuser');
            // Assert
            expect(mockRepository.exists).toHaveBeenCalledWith({
                where: { username: 'newuser' },
            });
            expect(result).toBe(false);
        });
        it('should be case-sensitive', async () => {
            // Arrange
            mockRepository.exists.mockResolvedValue(false);
            // Act
            await userRepository_1.userRepository.existsUserByUsername('TestUser');
            // Assert
            expect(mockRepository.exists).toHaveBeenCalledWith({
                where: { username: 'TestUser' },
            });
        });
        it('should handle database errors', async () => {
            // Arrange
            const dbError = new Error('Database query failed');
            mockRepository.exists.mockRejectedValue(dbError);
            // Act & Assert
            await expect(userRepository_1.userRepository.existsUserByUsername('testuser')).rejects.toThrow('Database query failed');
        });
    });
    describe('existsUserByEmail', () => {
        it('should return true if email exists', async () => {
            // Arrange
            mockRepository.exists.mockResolvedValue(true);
            // Act
            const result = await userRepository_1.userRepository.existsUserByEmail('existing@example.com');
            // Assert
            expect(mockRepository.exists).toHaveBeenCalledWith({
                where: { email: 'existing@example.com' },
            });
            expect(result).toBe(true);
        });
        it('should return false if email does not exist', async () => {
            // Arrange
            mockRepository.exists.mockResolvedValue(false);
            // Act
            const result = await userRepository_1.userRepository.existsUserByEmail('new@example.com');
            // Assert
            expect(mockRepository.exists).toHaveBeenCalledWith({
                where: { email: 'new@example.com' },
            });
            expect(result).toBe(false);
        });
        it('should handle database errors', async () => {
            // Arrange
            const dbError = new Error('Database query failed');
            mockRepository.exists.mockRejectedValue(dbError);
            // Act & Assert
            await expect(userRepository_1.userRepository.existsUserByEmail('test@example.com')).rejects.toThrow('Database query failed');
        });
    });
    describe('findUserByUsername', () => {
        const mockUser = (0, mockEntities_1.createMockCitizen)({
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
        });
        mockUser.passwordHash = 'salt:hashedpassword';
        it('should return user if found', async () => {
            // Arrange
            mockQueryBuilder.getOne.mockResolvedValue(mockUser);
            // Act
            const result = await userRepository_1.userRepository.findUserByUsername('testuser');
            // Assert
            expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('user');
            expect(mockQueryBuilder.where).toHaveBeenCalledWith('user.username = :username', { username: 'testuser' });
            expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith('user.passwordHash');
            expect(mockQueryBuilder.getOne).toHaveBeenCalled();
            expect(result).toEqual(mockUser);
            expect(result?.username).toBe('testuser');
        });
        it('should return null if user not found', async () => {
            // Arrange
            mockQueryBuilder.getOne.mockResolvedValue(null);
            // Act
            const result = await userRepository_1.userRepository.findUserByUsername('nonexistent');
            // Assert
            expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('user');
            expect(mockQueryBuilder.where).toHaveBeenCalledWith('user.username = :username', { username: 'nonexistent' });
            expect(result).toBeNull();
        });
        it('should be case-sensitive', async () => {
            // Arrange
            mockQueryBuilder.getOne.mockResolvedValue(null);
            // Act
            await userRepository_1.userRepository.findUserByUsername('TestUser');
            // Assert
            expect(mockQueryBuilder.where).toHaveBeenCalledWith('user.username = :username', { username: 'TestUser' });
        });
        it('should return user with all fields', async () => {
            // Arrange
            mockQueryBuilder.getOne.mockResolvedValue(mockUser);
            // Act
            const result = await userRepository_1.userRepository.findUserByUsername('testuser');
            // Assert
            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('username');
            expect(result).toHaveProperty('email');
            expect(result).toHaveProperty('passwordHash');
            expect(result).toHaveProperty('firstName');
            expect(result).toHaveProperty('lastName');
            expect(result).toHaveProperty('role');
        });
        it('should handle database errors', async () => {
            // Arrange
            const dbError = new Error('Database query failed');
            mockQueryBuilder.getOne.mockRejectedValue(dbError);
            // Act & Assert
            await expect(userRepository_1.userRepository.findUserByUsername('testuser')).rejects.toThrow('Database query failed');
        });
        it('should return user with passwordHash for authentication', async () => {
            // Arrange
            mockQueryBuilder.getOne.mockResolvedValue(mockUser);
            // Act
            const result = await userRepository_1.userRepository.findUserByUsername('testuser');
            // Assert
            expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith('user.passwordHash');
            expect(result?.passwordHash).toBeDefined();
            expect(result?.passwordHash).toContain(':');
            expect(result?.passwordHash).not.toBe('plainPassword');
        });
    });
    describe('findUserById', () => {
        const mockUser = (0, mockEntities_1.createMockCitizen)({
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
        });
        mockUser.passwordHash = 'salt:hashedpassword';
        beforeEach(() => {
            mockRepository.findOneBy = jest.fn();
        });
        it('should return user if found by ID', async () => {
            // Arrange
            mockRepository.findOneBy.mockResolvedValue(mockUser);
            // Act
            const result = await userRepository_1.userRepository.findUserById(1);
            // Assert
            expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
            expect(result).toEqual(mockUser);
            expect(result?.id).toBe(1);
        });
        it('should return null if user not found', async () => {
            // Arrange
            mockRepository.findOneBy.mockResolvedValue(null);
            // Act
            const result = await userRepository_1.userRepository.findUserById(999);
            // Assert
            expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 999 });
            expect(result).toBeNull();
        });
        it('should handle database errors', async () => {
            // Arrange
            const dbError = new Error('Database query failed');
            mockRepository.findOneBy.mockRejectedValue(dbError);
            // Act & Assert
            await expect(userRepository_1.userRepository.findUserById(1)).rejects.toThrow('Database query failed');
        });
    });
    describe('findUserByEmail', () => {
        const mockUser = (0, mockEntities_1.createMockCitizen)({
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
        });
        mockUser.passwordHash = 'salt:hashedpassword';
        beforeEach(() => {
            mockRepository.findOneBy = jest.fn();
        });
        it('should return user if found by email', async () => {
            // Arrange
            mockRepository.findOneBy.mockResolvedValue(mockUser);
            // Act
            const result = await userRepository_1.userRepository.findUserByEmail('test@example.com');
            // Assert
            expect(mockRepository.findOneBy).toHaveBeenCalledWith({ email: 'test@example.com' });
            expect(result).toEqual(mockUser);
            expect(result?.email).toBe('test@example.com');
        });
        it('should return null if user not found', async () => {
            // Arrange
            mockRepository.findOneBy.mockResolvedValue(null);
            // Act
            const result = await userRepository_1.userRepository.findUserByEmail('nonexistent@example.com');
            // Assert
            expect(mockRepository.findOneBy).toHaveBeenCalledWith({ email: 'nonexistent@example.com' });
            expect(result).toBeNull();
        });
        it('should handle database errors', async () => {
            // Arrange
            const dbError = new Error('Database query failed');
            mockRepository.findOneBy.mockRejectedValue(dbError);
            // Act & Assert
            await expect(userRepository_1.userRepository.findUserByEmail('test@example.com')).rejects.toThrow('Database query failed');
        });
    });
    describe('findAllUsers', () => {
        const mockUsers = [
            (0, mockEntities_1.createMockCitizen)({
                id: 1,
                username: 'user1',
                email: 'user1@example.com',
                firstName: 'User',
                lastName: 'One',
            }),
            (0, mockEntities_1.createMockCitizen)({
                id: 2,
                username: 'user2',
                email: 'user2@example.com',
                firstName: 'User',
                lastName: 'Two',
            }),
        ];
        mockUsers[0].passwordHash = 'salt:hash1';
        mockUsers[1].passwordHash = 'salt:hash2';
        beforeEach(() => {
            mockRepository.find = jest.fn();
        });
        it('should return all users without filters', async () => {
            // Arrange
            mockRepository.find.mockResolvedValue(mockUsers);
            // Act
            const result = await userRepository_1.userRepository.findAllUsers();
            // Assert
            expect(mockRepository.find).toHaveBeenCalledWith(undefined);
            expect(result).toEqual(mockUsers);
            expect(result).toHaveLength(2);
        });
        it('should return users with order filter', async () => {
            // Arrange
            mockRepository.find.mockResolvedValue(mockUsers);
            const options = {
                order: { createdAt: 'DESC' }
            };
            // Act
            const result = await userRepository_1.userRepository.findAllUsers(options);
            // Assert
            expect(mockRepository.find).toHaveBeenCalledWith(options);
            expect(result).toEqual(mockUsers);
        });
        it('should return users with combined filters', async () => {
            // Arrange
            mockRepository.find.mockResolvedValue(mockUsers);
            const options = {
                where: { role: 'Municipal Administrator' },
                order: { createdAt: 'DESC' }
            };
            // Act
            const result = await userRepository_1.userRepository.findAllUsers(options);
            // Assert
            expect(mockRepository.find).toHaveBeenCalledWith(options);
            expect(result).toEqual(mockUsers);
        });
        it('should return empty array when no users found', async () => {
            // Arrange
            mockRepository.find.mockResolvedValue([]);
            // Act
            const result = await userRepository_1.userRepository.findAllUsers();
            // Assert
            expect(mockRepository.find).toHaveBeenCalled();
            expect(result).toEqual([]);
            expect(result).toHaveLength(0);
        });
        it('should handle database errors', async () => {
            // Arrange
            const dbError = new Error('Database query failed');
            mockRepository.find.mockRejectedValue(dbError);
            // Act & Assert
            await expect(userRepository_1.userRepository.findAllUsers()).rejects.toThrow('Database query failed');
        });
    });
    describe('updateUser', () => {
        const mockUser = (0, mockEntities_1.createMockCitizen)({
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
        });
        mockUser.passwordHash = 'salt:hashedpassword';
        beforeEach(() => {
            mockRepository.update = jest.fn();
            mockRepository.findOneBy = jest.fn();
        });
        it('should update user successfully', async () => {
            // Arrange
            const updateData = {
                firstName: 'UpdatedName',
                lastName: 'UpdatedLastName',
                email: 'updated@example.com',
            };
            const updatedUser = { ...mockUser, ...updateData };
            mockRepository.update.mockResolvedValue({ affected: 1 });
            mockRepository.findOneBy.mockResolvedValue(updatedUser);
            // Act
            const result = await userRepository_1.userRepository.updateUser(1, updateData);
            // Assert
            expect(mockRepository.update).toHaveBeenCalledWith(1, updateData);
            expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
            expect(result).toEqual(updatedUser);
            expect(result.firstName).toBe('UpdatedName');
        });
        it('should update only provided fields', async () => {
            // Arrange
            const updateData = { email: 'newemail@example.com' };
            const updatedUser = { ...mockUser, email: 'newemail@example.com' };
            mockRepository.update.mockResolvedValue({ affected: 1 });
            mockRepository.findOneBy.mockResolvedValue(updatedUser);
            // Act
            const result = await userRepository_1.userRepository.updateUser(1, updateData);
            // Assert
            expect(mockRepository.update).toHaveBeenCalledWith(1, updateData);
            expect(result.email).toBe('newemail@example.com');
            expect(result.firstName).toBe(mockUser.firstName); // Unchanged
        });
        it('should throw error if user not found after update', async () => {
            // Arrange
            const updateData = { firstName: 'UpdatedName' };
            mockRepository.update.mockResolvedValue({ affected: 1 });
            mockRepository.findOneBy.mockResolvedValue(null);
            // Act & Assert
            await expect(userRepository_1.userRepository.updateUser(1, updateData)).rejects.toThrow('User not found after update');
        });
        it('should handle database errors during update', async () => {
            // Arrange
            const updateData = { firstName: 'UpdatedName' };
            const dbError = new Error('Database update failed');
            mockRepository.update.mockRejectedValue(dbError);
            // Act & Assert
            await expect(userRepository_1.userRepository.updateUser(1, updateData)).rejects.toThrow('Database update failed');
        });
    });
    describe('deleteUser', () => {
        beforeEach(() => {
            mockRepository.delete = jest.fn();
        });
        it('should delete user successfully', async () => {
            // Arrange
            mockRepository.delete.mockResolvedValue({ affected: 1 });
            // Act
            await userRepository_1.userRepository.deleteUser(1);
            // Assert
            expect(mockRepository.delete).toHaveBeenCalledWith(1);
        });
        it('should throw error if user not found', async () => {
            // Arrange
            mockRepository.delete.mockResolvedValue({ affected: 0 });
            // Act & Assert
            await expect(userRepository_1.userRepository.deleteUser(999)).rejects.toThrow('User not found');
        });
        it('should handle database errors', async () => {
            // Arrange
            const dbError = new Error('Database delete failed');
            mockRepository.delete.mockRejectedValue(dbError);
            // Act & Assert
            await expect(userRepository_1.userRepository.deleteUser(1)).rejects.toThrow('Database delete failed');
        });
        it('should delete user by correct ID', async () => {
            // Arrange
            mockRepository.delete.mockResolvedValue({ affected: 1 });
            // Act
            await userRepository_1.userRepository.deleteUser(42);
            // Assert
            expect(mockRepository.delete).toHaveBeenCalledWith(42);
        });
    });
    describe('verifyCredentials', () => {
        const mockUser = (0, mockEntities_1.createMockCitizen)({
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
        });
        mockUser.passwordHash = 'mocksalt:mockhash';
        beforeEach(() => {
            mockQueryBuilder.getOne = jest.fn();
            passwordUtils.verifyPassword.mockClear();
        });
        it('should return user when credentials are valid', async () => {
            // Arrange
            mockQueryBuilder.getOne.mockResolvedValue(mockUser);
            passwordUtils.verifyPassword.mockResolvedValue(true);
            // Act
            const result = await userRepository_1.userRepository.verifyCredentials('testuser', 'correctpassword');
            // Assert
            expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('user');
            expect(mockQueryBuilder.where).toHaveBeenCalledWith('user.username = :username', { username: 'testuser' });
            expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith('user.passwordHash');
            expect(passwordUtils.verifyPassword).toHaveBeenCalledWith('correctpassword', 'mocksalt', 'mockhash');
            expect(result).toEqual(mockUser);
        });
        it('should return null when password is invalid', async () => {
            // Arrange
            mockQueryBuilder.getOne.mockResolvedValue(mockUser);
            passwordUtils.verifyPassword.mockResolvedValue(false);
            // Act
            const result = await userRepository_1.userRepository.verifyCredentials('testuser', 'wrongpassword');
            // Assert
            expect(passwordUtils.verifyPassword).toHaveBeenCalledWith('wrongpassword', 'mocksalt', 'mockhash');
            expect(result).toBeNull();
        });
        it('should return null when user not found', async () => {
            // Arrange
            mockQueryBuilder.getOne.mockResolvedValue(null);
            // Act
            const result = await userRepository_1.userRepository.verifyCredentials('nonexistent', 'password');
            // Assert
            expect(mockQueryBuilder.getOne).toHaveBeenCalled();
            expect(passwordUtils.verifyPassword).not.toHaveBeenCalled();
            expect(result).toBeNull();
        });
        it('should return null when passwordHash is missing', async () => {
            // Arrange
            const userWithoutPassword = { ...mockUser, passwordHash: '' };
            mockQueryBuilder.getOne.mockResolvedValue(userWithoutPassword);
            // Act
            const result = await userRepository_1.userRepository.verifyCredentials('testuser', 'password');
            // Assert
            expect(passwordUtils.verifyPassword).not.toHaveBeenCalled();
            expect(result).toBeNull();
        });
        it('should return null when passwordHash format is invalid', async () => {
            // Arrange
            const userWithInvalidHash = { ...mockUser, passwordHash: 'invalidformat' };
            mockQueryBuilder.getOne.mockResolvedValue(userWithInvalidHash);
            // Act
            const result = await userRepository_1.userRepository.verifyCredentials('testuser', 'password');
            // Assert
            expect(passwordUtils.verifyPassword).not.toHaveBeenCalled();
            expect(result).toBeNull();
        });
        it('should handle password verification errors', async () => {
            // Arrange
            mockQueryBuilder.getOne.mockResolvedValue(mockUser);
            const verifyError = new Error('Password verification failed');
            passwordUtils.verifyPassword.mockRejectedValue(verifyError);
            // Act & Assert
            await expect(userRepository_1.userRepository.verifyCredentials('testuser', 'password')).rejects.toThrow('Password verification failed');
        });
    });
    describe('save', () => {
        const mockUser = (0, mockEntities_1.createMockCitizen)({
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
        });
        mockUser.passwordHash = 'salt:hashedpassword';
        beforeEach(() => {
            mockRepository.save = jest.fn();
        });
        it('should save user successfully', async () => {
            // Arrange
            mockRepository.save.mockResolvedValue(mockUser);
            // Act
            const result = await userRepository_1.userRepository.save(mockUser);
            // Assert
            expect(mockRepository.save).toHaveBeenCalledWith(mockUser);
            expect(result).toEqual(mockUser);
        });
        it('should save user with all fields', async () => {
            // Arrange
            mockRepository.save.mockResolvedValue(mockUser);
            // Act
            const result = await userRepository_1.userRepository.save(mockUser);
            // Assert
            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('username');
            expect(result).toHaveProperty('email');
            expect(result).toHaveProperty('passwordHash');
            expect(result).toHaveProperty('firstName');
            expect(result).toHaveProperty('lastName');
            expect(result).toHaveProperty('role');
        });
        it('should handle database errors', async () => {
            // Arrange
            const dbError = new Error('Database save failed');
            mockRepository.save.mockRejectedValue(dbError);
            // Act & Assert
            await expect(userRepository_1.userRepository.save(mockUser)).rejects.toThrow('Database save failed');
        });
    });
    describe('Repository Structure', () => {
        it('should have createUserWithPassword method', () => {
            expect(typeof userRepository_1.userRepository.createUserWithPassword).toBe('function');
        });
        it('should have existsUserByUsername method', () => {
            expect(typeof userRepository_1.userRepository.existsUserByUsername).toBe('function');
        });
        it('should have existsUserByEmail method', () => {
            expect(typeof userRepository_1.userRepository.existsUserByEmail).toBe('function');
        });
        it('should have findUserByUsername method', () => {
            expect(typeof userRepository_1.userRepository.findUserByUsername).toBe('function');
        });
        it('should have findUserById method', () => {
            expect(typeof userRepository_1.userRepository.findUserById).toBe('function');
        });
        it('should have findUserByEmail method', () => {
            expect(typeof userRepository_1.userRepository.findUserByEmail).toBe('function');
        });
        it('should have findAllUsers method', () => {
            expect(typeof userRepository_1.userRepository.findAllUsers).toBe('function');
        });
        it('should have updateUser method', () => {
            expect(typeof userRepository_1.userRepository.updateUser).toBe('function');
        });
        it('should have deleteUser method', () => {
            expect(typeof userRepository_1.userRepository.deleteUser).toBe('function');
        });
        it('should have verifyCredentials method', () => {
            expect(typeof userRepository_1.userRepository.verifyCredentials).toBe('function');
        });
        it('should have save method', () => {
            expect(typeof userRepository_1.userRepository.save).toBe('function');
        });
    });
});
