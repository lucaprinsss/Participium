import { userRepository } from '@repositories/userRepository';
import { UserEntity } from '@models/entity/userEntity';
import * as passwordUtils from '@utils/passwordUtils';
import { createMockCitizen } from '@test/utils/mockEntities';

// Mock delle dipendenze
jest.mock('@database/connection');
jest.mock('@utils/passwordUtils');

describe('UserRepository Unit Tests', () => {
  let mockRepository: any;
  let mockQueryBuilder: any;

  beforeEach(() => {
    // Reset dei mock prima di ogni test
    jest.clearAllMocks();

    // Setup mock del QueryBuilder
    mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      execute: jest.fn(),
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
    (userRepository as any).repository = mockRepository;

    // Mock di passwordUtils
    (passwordUtils.generatePasswordData as jest.Mock).mockResolvedValue({
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
      isVerified: true,
    };

    it('should create user with hashed password successfully', async () => {
      // Arrange
      const mockCreatedUser = createMockCitizen({
        id: 1,
        username: validUserData.username,
        email: validUserData.email,
        firstName: validUserData.firstName,
        lastName: validUserData.lastName,
      });
      mockCreatedUser.passwordHash = 'mocksalt:mockhash';

      mockRepository.create.mockReturnValue(mockCreatedUser);
      mockRepository.save.mockResolvedValue(mockCreatedUser);
      mockQueryBuilder.getOne.mockResolvedValue(mockCreatedUser);

      // Act
      const result = await userRepository.createUserWithPassword(validUserData);

      // Assert
      expect(passwordUtils.generatePasswordData).toHaveBeenCalledWith(validUserData.password);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: validUserData.username,
          email: validUserData.email,
          firstName: validUserData.firstName,
          lastName: validUserData.lastName,
          departmentRoleId: validUserData.departmentRoleId,
          passwordHash: 'mocksalt:mockhash',
        })
      );
      expect(mockRepository.save).toHaveBeenCalledWith(mockCreatedUser);
      expect(result).toEqual(mockCreatedUser);
      expect(result.id).toBe(1);
    });

    it('should set default emailNotificationsEnabled to true', async () => {
      // Arrange
      const mockCreatedUser = createMockCitizen({
        id: 1,
        username: validUserData.username,
        email: validUserData.email,
        firstName: validUserData.firstName,
        lastName: validUserData.lastName,
      });
      mockCreatedUser.passwordHash = 'mocksalt:mockhash';

      mockRepository.create.mockReturnValue(mockCreatedUser);
      mockRepository.save.mockResolvedValue(mockCreatedUser);
      mockQueryBuilder.getOne.mockResolvedValue(mockCreatedUser);

      // Act
      const result = await userRepository.createUserWithPassword(validUserData);

      // Assert - Verifica che il database imposti il valore di default
      expect(result.emailNotificationsEnabled).toBe(true);
    });

    it('should allow custom emailNotificationsEnabled value', async () => {
      // Arrange
      const userDataWithNotifications = {
        ...validUserData,
        emailNotificationsEnabled: false,
      };
      const mockCreatedUser = createMockCitizen({
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
      mockQueryBuilder.getOne.mockResolvedValue(mockCreatedUser);

      // Act
      const result = await userRepository.createUserWithPassword(userDataWithNotifications);

      // Assert - Verifica che il valore custom sia preservato
      expect(result.emailNotificationsEnabled).toBe(false);
    });

    it('should hash password with salt', async () => {
      // Arrange
      const mockCreatedUser = createMockCitizen({
        id: 1,
        username: validUserData.username,
        email: validUserData.email,
        firstName: validUserData.firstName,
        lastName: validUserData.lastName,
      });
      mockCreatedUser.passwordHash = 'mocksalt:mockhash';

      mockRepository.create.mockReturnValue(mockCreatedUser);
      mockRepository.save.mockResolvedValue(mockCreatedUser);
      mockQueryBuilder.getOne.mockResolvedValue(mockCreatedUser);

      // Act
      await userRepository.createUserWithPassword(validUserData);

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
      await expect(
        userRepository.createUserWithPassword(validUserData)
      ).rejects.toThrow('Database connection failed');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should create user with all required fields', async () => {
      // Arrange
      const mockCreatedUser = createMockCitizen({
        id: 1,
        username: validUserData.username,
        email: validUserData.email,
        firstName: validUserData.firstName,
        lastName: validUserData.lastName,
      });
      mockCreatedUser.passwordHash = 'mocksalt:mockhash';

      mockRepository.create.mockReturnValue(mockCreatedUser);
      mockRepository.save.mockResolvedValue(mockCreatedUser);
      mockQueryBuilder.getOne.mockResolvedValue(mockCreatedUser);

      // Act
      const result = await userRepository.createUserWithPassword(validUserData);

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
      (passwordUtils.generatePasswordData as jest.Mock).mockRejectedValue(hashError);

      // Act & Assert
      await expect(
        userRepository.createUserWithPassword(validUserData)
      ).rejects.toThrow('Password hashing failed');
    });
  });

  describe('existsUserByUsername', () => {
    it('should return true if username exists', async () => {
      // Arrange
      mockRepository.exists.mockResolvedValue(true);

      // Act
      const result = await userRepository.existsUserByUsername('existinguser');

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
      const result = await userRepository.existsUserByUsername('newuser');

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
      await userRepository.existsUserByUsername('TestUser');

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
      await expect(
        userRepository.existsUserByUsername('testuser')
      ).rejects.toThrow('Database query failed');
    });
  });

  describe('existsUserByEmail', () => {
    it('should return true if email exists', async () => {
      // Arrange
      mockRepository.exists.mockResolvedValue(true);

      // Act
      const result = await userRepository.existsUserByEmail('existing@example.com');

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
      const result = await userRepository.existsUserByEmail('new@example.com');

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
      await expect(
        userRepository.existsUserByEmail('test@example.com')
      ).rejects.toThrow('Database query failed');
    });
  });

  describe('findUserByUsername', () => {
    const mockUser: UserEntity = createMockCitizen({
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
      const result = await userRepository.findUserByUsername('testuser');

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
      const result = await userRepository.findUserByUsername('nonexistent');

      // Assert
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('user.username = :username', { username: 'nonexistent' });
      expect(result).toBeNull();
    });

    it('should be case-sensitive', async () => {
      // Arrange
      mockQueryBuilder.getOne.mockResolvedValue(null);

      // Act
      await userRepository.findUserByUsername('TestUser');

      // Assert
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('user.username = :username', { username: 'TestUser' });
    });

    it('should return user with all fields', async () => {
      // Arrange
      mockQueryBuilder.getOne.mockResolvedValue(mockUser);

      // Act
      const result = await userRepository.findUserByUsername('testuser');

      // Assert
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('username');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('passwordHash');
      expect(result).toHaveProperty('firstName');
      expect(result).toHaveProperty('lastName');
      expect(result).toHaveProperty('departmentRole');
    });

    it('should handle database errors', async () => {
      // Arrange
      const dbError = new Error('Database query failed');
      mockQueryBuilder.getOne.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        userRepository.findUserByUsername('testuser')
      ).rejects.toThrow('Database query failed');
    });

    it('should return user with passwordHash for authentication', async () => {
      // Arrange
      mockQueryBuilder.getOne.mockResolvedValue(mockUser);

      // Act
      const result = await userRepository.findUserByUsername('testuser');

      // Assert
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith('user.passwordHash');
      expect(result?.passwordHash).toBeDefined();
      expect(result?.passwordHash).toContain(':');
      expect(result?.passwordHash).not.toBe('plainPassword');
    });
  });

  describe('findUserById', () => {
    const mockUser: UserEntity = createMockCitizen({
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    });
    mockUser.passwordHash = 'salt:hashedpassword';

    beforeEach(() => {
      mockRepository.findOne = jest.fn();
    });

    it('should return user if found by ID', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await userRepository.findUserById(1);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['departmentRole', 'departmentRole.department', 'departmentRole.role']
      });
      expect(result).toEqual(mockUser);
      expect(result?.id).toBe(1);
    });

    it('should return null if user not found', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await userRepository.findUserById(999);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
        relations: ['departmentRole', 'departmentRole.department', 'departmentRole.role']
      });
      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      // Arrange
      const dbError = new Error('Database query failed');
      mockRepository.findOne.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        userRepository.findUserById(1)
      ).rejects.toThrow('Database query failed');
    });
  });

  describe('findUserByEmail', () => {
    const mockUser: UserEntity = createMockCitizen({
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    });
    mockUser.passwordHash = 'salt:hashedpassword';

    beforeEach(() => {
      mockRepository.findOne = jest.fn();
    });

    it('should return user if found by email', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await userRepository.findUserByEmail('test@example.com');

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        relations: ['departmentRole', 'departmentRole.department', 'departmentRole.role']
      });
      expect(result).toEqual(mockUser);
      expect(result?.email).toBe('test@example.com');
    });

    it('should return null if user not found', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await userRepository.findUserByEmail('nonexistent@example.com');

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
        relations: ['departmentRole', 'departmentRole.department', 'departmentRole.role']
      });
      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      // Arrange
      const dbError = new Error('Database query failed');
      mockRepository.findOne.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        userRepository.findUserByEmail('test@example.com')
      ).rejects.toThrow('Database query failed');
    });
  });

  describe('findAllUsers', () => {
    const mockUsers: UserEntity[] = [
      createMockCitizen({
        id: 1,
        username: 'user1',
        email: 'user1@example.com',
        firstName: 'User',
        lastName: 'One',
      }),
      createMockCitizen({
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
      const result = await userRepository.findAllUsers();

      // Assert
      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['departmentRole', 'departmentRole.department', 'departmentRole.role']
      });
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
      const result = await userRepository.findAllUsers(options);

      // Assert
      expect(mockRepository.find).toHaveBeenCalledWith({
        ...options,
        relations: ['departmentRole', 'departmentRole.department', 'departmentRole.role']
      });
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
      const result = await userRepository.findAllUsers(options);

      // Assert
      expect(mockRepository.find).toHaveBeenCalledWith({
        ...options,
        relations: ['departmentRole', 'departmentRole.department', 'departmentRole.role']
      });
      expect(result).toEqual(mockUsers);
    });

    it('should return empty array when no users found', async () => {
      // Arrange
      mockRepository.find.mockResolvedValue([]);

      // Act
      const result = await userRepository.findAllUsers();

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
      await expect(
        userRepository.findAllUsers()
      ).rejects.toThrow('Database query failed');
    });
  });

  describe('updateUser', () => {
    const mockUser: UserEntity = createMockCitizen({
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    });
    mockUser.passwordHash = 'salt:hashedpassword';

    beforeEach(() => {
      mockRepository.update = jest.fn();
      mockRepository.findOne = jest.fn();
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
      mockRepository.findOne.mockResolvedValue(updatedUser);

      // Act
      const result = await userRepository.updateUser(1, updateData);

      // Assert
      expect(mockRepository.update).toHaveBeenCalledWith(1, updateData);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['departmentRole', 'departmentRole.department', 'departmentRole.role']
      });
      expect(result).toEqual(updatedUser);
      expect(result.firstName).toBe('UpdatedName');
    });

    it('should update only provided fields', async () => {
      // Arrange
      const updateData = { email: 'newemail@example.com' };
      const updatedUser = { ...mockUser, email: 'newemail@example.com' };

      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue(updatedUser);

      // Act
      const result = await userRepository.updateUser(1, updateData);

      // Assert
      expect(mockRepository.update).toHaveBeenCalledWith(1, updateData);
      expect(result.email).toBe('newemail@example.com');
      expect(result.firstName).toBe(mockUser.firstName); // Unchanged
    });

    it('should throw error if user not found after update', async () => {
      // Arrange
      const updateData = { firstName: 'UpdatedName' };

      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        userRepository.updateUser(1, updateData)
      ).rejects.toThrow('User not found after update');
    });

    it('should handle database errors during update', async () => {
      // Arrange
      const updateData = { firstName: 'UpdatedName' };
      const dbError = new Error('Database update failed');

      mockRepository.update.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        userRepository.updateUser(1, updateData)
      ).rejects.toThrow('Database update failed');
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
      await userRepository.deleteUser(1);

      // Assert
      expect(mockRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw error if user not found', async () => {
      // Arrange
      mockRepository.delete.mockResolvedValue({ affected: 0 });

      // Act & Assert
      await expect(
        userRepository.deleteUser(999)
      ).rejects.toThrow('User not found');
    });

    it('should handle database errors', async () => {
      // Arrange
      const dbError = new Error('Database delete failed');
      mockRepository.delete.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        userRepository.deleteUser(1)
      ).rejects.toThrow('Database delete failed');
    });

    it('should delete user by correct ID', async () => {
      // Arrange
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      // Act
      await userRepository.deleteUser(42);

      // Assert
      expect(mockRepository.delete).toHaveBeenCalledWith(42);
    });
  });

  describe('verifyCredentials', () => {
    const mockUser: UserEntity = createMockCitizen({
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    });
    mockUser.passwordHash = 'mocksalt:mockhash';

    beforeEach(() => {
      mockQueryBuilder.getOne = jest.fn();
      (passwordUtils.verifyPassword as jest.Mock).mockClear();
    });

    it('should return user when credentials are valid', async () => {
      // Arrange
      mockQueryBuilder.getOne.mockResolvedValue(mockUser);
      (passwordUtils.verifyPassword as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await userRepository.verifyCredentials('testuser', 'correctpassword');

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
      (passwordUtils.verifyPassword as jest.Mock).mockResolvedValue(false);

      // Act
      const result = await userRepository.verifyCredentials('testuser', 'wrongpassword');

      // Assert
      expect(passwordUtils.verifyPassword).toHaveBeenCalledWith('wrongpassword', 'mocksalt', 'mockhash');
      expect(result).toBeNull();
    });

    it('should return null when user not found', async () => {
      // Arrange
      mockQueryBuilder.getOne.mockResolvedValue(null);

      // Act
      const result = await userRepository.verifyCredentials('nonexistent', 'password');

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
      const result = await userRepository.verifyCredentials('testuser', 'password');

      // Assert
      expect(passwordUtils.verifyPassword).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null when passwordHash format is invalid', async () => {
      // Arrange
      const userWithInvalidHash = { ...mockUser, passwordHash: 'invalidformat' };
      mockQueryBuilder.getOne.mockResolvedValue(userWithInvalidHash);

      // Act
      const result = await userRepository.verifyCredentials('testuser', 'password');

      // Assert
      expect(passwordUtils.verifyPassword).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should handle password verification errors', async () => {
      // Arrange
      mockQueryBuilder.getOne.mockResolvedValue(mockUser);
      const verifyError = new Error('Password verification failed');
      (passwordUtils.verifyPassword as jest.Mock).mockRejectedValue(verifyError);

      // Act & Assert
      await expect(
        userRepository.verifyCredentials('testuser', 'password')
      ).rejects.toThrow('Password verification failed');
    });
  });

  describe('save', () => {
    const mockUser: UserEntity = createMockCitizen({
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
      const result = await userRepository.save(mockUser);

      // Assert
      expect(mockRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });

    it('should save user with all fields', async () => {
      // Arrange
      mockRepository.save.mockResolvedValue(mockUser);

      // Act
      const result = await userRepository.save(mockUser);

      // Assert
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('username');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('passwordHash');
      expect(result).toHaveProperty('firstName');
      expect(result).toHaveProperty('lastName');
      expect(result).toHaveProperty('departmentRole');
    });

    it('should handle database errors', async () => {
      // Arrange
      const dbError = new Error('Database save failed');
      mockRepository.save.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        userRepository.save(mockUser)
      ).rejects.toThrow('Database save failed');
    });
  });

  describe('Repository Structure', () => {
    it('should have createUserWithPassword method', () => {
      expect(typeof userRepository.createUserWithPassword).toBe('function');
    });

    it('should have existsUserByUsername method', () => {
      expect(typeof userRepository.existsUserByUsername).toBe('function');
    });

    it('should have existsUserByEmail method', () => {
      expect(typeof userRepository.existsUserByEmail).toBe('function');
    });

    it('should have findUserByUsername method', () => {
      expect(typeof userRepository.findUserByUsername).toBe('function');
    });

    it('should have findUserById method', () => {
      expect(typeof userRepository.findUserById).toBe('function');
    });

    it('should have findUserByEmail method', () => {
      expect(typeof userRepository.findUserByEmail).toBe('function');
    });

    it('should have findAllUsers method', () => {
      expect(typeof userRepository.findAllUsers).toBe('function');
    });

    it('should have updateUser method', () => {
      expect(typeof userRepository.updateUser).toBe('function');
    });

    it('should have deleteUser method', () => {
      expect(typeof userRepository.deleteUser).toBe('function');
    });

    it('should have verifyCredentials method', () => {
      expect(typeof userRepository.verifyCredentials).toBe('function');
    });

    it('should have save method', () => {
      expect(typeof userRepository.save).toBe('function');
    });
  });

  describe('findExternalMaintainersByCategory', () => {
    it('should find and return external maintainers for a given category', async () => {
        const category = 'Public Lighting';
        const expectedUsers: UserEntity[] = [new UserEntity(), new UserEntity()];

        mockQueryBuilder.getMany.mockResolvedValue(expectedUsers);

        const result = await userRepository.findExternalMaintainersByCategory(category);

        expect(result).toEqual(expectedUsers);
        expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('user');
        expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('user.departmentRole', 'departmentRole');
        expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('departmentRole.department', 'department');
        expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('departmentRole.role', 'role');
        expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith(
            'companies',
            'c',
            'c.id = user.company_id AND c.category = :category',
            { category }
        );
        expect(mockQueryBuilder.where).toHaveBeenCalledWith('role.name = :roleName', { roleName: 'External Maintainer' });
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('user.company_id IS NOT NULL');
        expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('user.last_name', 'ASC');
        expect(mockQueryBuilder.getMany).toHaveBeenCalled();
    });

    it('should return an empty array if no maintainers are found', async () => {
        const category = 'Roads and Urban Furnishings';
        mockQueryBuilder.getMany.mockResolvedValue([]);

        const result = await userRepository.findExternalMaintainersByCategory(category);

        expect(result).toEqual([]);
    });
  });

  describe('removeCompanyFromUser', () => {
    it('should remove company assignment from user', async () => {
      const userId = 5;
      mockQueryBuilder.execute.mockResolvedValue({ affected: 1 });

      await userRepository.removeCompanyFromUser(userId);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(UserEntity);
      expect(mockQueryBuilder.set).toHaveBeenCalledWith({ companyId: null });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('id = :id', { id: userId });
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });

    it('should handle removal even if user does not exist', async () => {
      const userId = 999;
      mockQueryBuilder.execute.mockResolvedValue({ affected: 0 });

      await expect(userRepository.removeCompanyFromUser(userId)).resolves.not.toThrow();

      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });
  });
});