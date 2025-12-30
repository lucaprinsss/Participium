import { userRepository } from '@repositories/userRepository';
import { UserEntity } from '@models/entity/userEntity';
import * as passwordUtils from '@utils/passwordUtils';
import { createMockCitizen } from '@test/utils/mockEntities';

// Mock dependencies
jest.mock('@database/connection');
jest.mock('@utils/passwordUtils');

describe('UserRepository Unit Tests', () => {
  let mockRepository: any;
  let mockQueryBuilder: any;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup mock del QueryBuilder
    mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      execute: jest.fn(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
    };

    // Setup mock del repository TypeORM
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      exists: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      update: jest.fn(),
      delete: jest.fn(),
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
      expect(result).toHaveProperty('userRoles');
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

    it('should throw error when user cannot be reloaded with relations', async () => {
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
      mockQueryBuilder.getOne.mockResolvedValue(null); // Simulate failure to reload

      // Act & Assert
      await expect(
        userRepository.createUserWithPassword(validUserData)
      ).rejects.toThrow('Failed to load user with relations after creation');
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
      expect(result).toHaveProperty('userRoles');
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
        relations: ['userRoles', 'userRoles.departmentRole', 'userRoles.departmentRole.department', 'userRoles.departmentRole.role']
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
        relations: ['userRoles', 'userRoles.departmentRole', 'userRoles.departmentRole.department', 'userRoles.departmentRole.role']
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
        relations: ['userRoles', 'userRoles.departmentRole', 'userRoles.departmentRole.department', 'userRoles.departmentRole.role']
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
        relations: ['userRoles', 'userRoles.departmentRole', 'userRoles.departmentRole.department', 'userRoles.departmentRole.role']
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
        relations: ['userRoles', 'userRoles.departmentRole', 'userRoles.departmentRole.department', 'userRoles.departmentRole.role']
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
        relations: ['userRoles', 'userRoles.departmentRole', 'userRoles.departmentRole.department', 'userRoles.departmentRole.role']
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
        relations: ['userRoles', 'userRoles.departmentRole', 'userRoles.departmentRole.department', 'userRoles.departmentRole.role']
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
        relations: ['userRoles', 'userRoles.departmentRole', 'userRoles.departmentRole.department', 'userRoles.departmentRole.role']
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
      expect(result).toHaveProperty('userRoles');
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
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('user.userRoles', 'userRoles');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('userRoles.departmentRole', 'departmentRole');
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

  describe('verifyEmailCode', () => {
    const email = 'test@example.com';
    const validCode = '123456';

    it('should return true when code is valid and not expired', async () => {
      // Arrange
      const mockUser = createMockCitizen({
        email,
        isVerified: false,
      });
      mockUser.verificationCode = validCode;
      mockUser.verificationCodeExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes in future

      const mockFindUserByEmail = jest.fn().mockResolvedValue(mockUser);
      (userRepository as any).findUserByEmail = mockFindUserByEmail;

      // Act
      const result = await userRepository.verifyEmailCode(email, validCode);

      // Assert
      expect(mockFindUserByEmail).toHaveBeenCalledWith(email);
      expect(result).toBe(true);
    });

    it('should return false when code does not match', async () => {
      // Arrange
      const mockUser = createMockCitizen({
        email,
        isVerified: false,
      });
      mockUser.verificationCode = '999999';
      mockUser.verificationCodeExpiresAt = new Date(Date.now() + 30 * 60 * 1000);

      const mockFindUserByEmail = jest.fn().mockResolvedValue(mockUser);
      (userRepository as any).findUserByEmail = mockFindUserByEmail;

      // Act
      const result = await userRepository.verifyEmailCode(email, validCode);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when user has no verification code', async () => {
      // Arrange
      const mockUser = createMockCitizen({
        email,
        isVerified: true,
      });
      mockUser.verificationCode = undefined;
      mockUser.verificationCodeExpiresAt = undefined;

      const mockFindUserByEmail = jest.fn().mockResolvedValue(mockUser);
      (userRepository as any).findUserByEmail = mockFindUserByEmail;

      // Act
      const result = await userRepository.verifyEmailCode(email, validCode);

      // Assert
      expect(result).toBe(false);
    });

    it('should throw BadRequestError when code is expired', async () => {
      // Arrange
      const mockUser = createMockCitizen({
        email,
        isVerified: false,
      });
      mockUser.verificationCode = validCode;
      mockUser.verificationCodeExpiresAt = new Date(Date.now() - 60 * 1000); // 1 minute ago

      const mockFindUserByEmail = jest.fn().mockResolvedValue(mockUser);
      (userRepository as any).findUserByEmail = mockFindUserByEmail;

      // Act & Assert
      await expect(userRepository.verifyEmailCode(email, validCode)).rejects.toThrow(
        'Verification code has expired'
      );
    });

    it('should return false when user does not exist', async () => {
      // Arrange
      const mockFindUserByEmail = jest.fn().mockResolvedValue(null);
      (userRepository as any).findUserByEmail = mockFindUserByEmail;

      // Act
      const result = await userRepository.verifyEmailCode(email, validCode);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('updateUserIsVerified', () => {
    const email = 'test@example.com';

    it('should update user verification status and clear verification code', async () => {
      // Arrange
      mockQueryBuilder.execute.mockResolvedValue({ affected: 1 });

      // Act
      await userRepository.updateUserIsVerified(email, true);

      // Assert
      expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(UserEntity);
      expect(mockQueryBuilder.set).toHaveBeenCalledWith({
        isVerified: true,
        verificationCode: null,
        verificationCodeExpiresAt: null,
      });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('email = :email', { email });
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });

    it('should set isVerified to false when requested', async () => {
      // Arrange
      mockQueryBuilder.execute.mockResolvedValue({ affected: 1 });

      // Act
      await userRepository.updateUserIsVerified(email, false);

      // Assert
      expect(mockQueryBuilder.set).toHaveBeenCalledWith({
        isVerified: false,
        verificationCode: null,
        verificationCodeExpiresAt: null,
      });
    });

    it('should not throw error when user does not exist', async () => {
      // Arrange
      mockQueryBuilder.execute.mockResolvedValue({ affected: 0 });

      // Act & Assert
      await expect(userRepository.updateUserIsVerified(email, true)).resolves.not.toThrow();
    });
  });

  describe('isUserVerified', () => {
    const email = 'test@example.com';

    it('should return true when user is verified', async () => {
      // Arrange
      const mockUser = createMockCitizen({
        email,
        isVerified: true,
      });

      const mockFindUserByEmail = jest.fn().mockResolvedValue(mockUser);
      (userRepository as any).findUserByEmail = mockFindUserByEmail;

      // Act
      const result = await userRepository.isUserVerified(email);

      // Assert
      expect(mockFindUserByEmail).toHaveBeenCalledWith(email);
      expect(result).toBe(true);
    });

    it('should return false when user is not verified', async () => {
      // Arrange
      const mockUser = createMockCitizen({
        email,
        isVerified: false,
      });

      const mockFindUserByEmail = jest.fn().mockResolvedValue(mockUser);
      (userRepository as any).findUserByEmail = mockFindUserByEmail;

      // Act
      const result = await userRepository.isUserVerified(email);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when user does not exist', async () => {
      // Arrange
      const mockFindUserByEmail = jest.fn().mockResolvedValue(null);
      (userRepository as any).findUserByEmail = mockFindUserByEmail;

      // Act
      const result = await userRepository.isUserVerified(email);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('deleteUnverifiedUsers', () => {
    it('should delete unverified users with expired verification codes', async () => {
      // Arrange
      mockQueryBuilder.delete = jest.fn().mockReturnThis();
      mockQueryBuilder.from = jest.fn().mockReturnThis();

      // Act
      await userRepository.deleteUnverifiedUsers();

      // Assert
      expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.from).toHaveBeenCalledWith(UserEntity);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'isVerified = :verifiedStatus',
        { verifiedStatus: false }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'verificationCodeExpiresAt < NOW()'
      );
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });

    it('should not throw error when no users to delete', async () => {
      // Arrange
      mockQueryBuilder.delete = jest.fn().mockReturnThis();
      mockQueryBuilder.from = jest.fn().mockReturnThis();
      mockQueryBuilder.execute.mockResolvedValue({ affected: 0 });

      // Act & Assert
      await expect(userRepository.deleteUnverifiedUsers()).resolves.not.toThrow();
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      mockQueryBuilder.delete = jest.fn().mockReturnThis();
      mockQueryBuilder.from = jest.fn().mockReturnThis();
      mockQueryBuilder.execute.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(userRepository.deleteUnverifiedUsers()).rejects.toThrow('Database error');
    });
  });

  describe('findUsersByDepartmentRoleIds', () => {
    it('should return users for given department role IDs', async () => {
      // Arrange
      const departmentRoleIds = [1, 2, 3];
      const mockUsers = [
        { id: 1, username: 'user1', departmentRoleId: 1 },
        { id: 2, username: 'user2', departmentRoleId: 2 },
      ];
      mockQueryBuilder.getMany.mockResolvedValue(mockUsers as any);

      // Act
      const result = await userRepository.findUsersByDepartmentRoleIds(departmentRoleIds);

      // Assert
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('user.userRoles', 'userRoles');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('userRoles.departmentRole', 'departmentRole');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('departmentRole.department', 'department');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('departmentRole.role', 'role');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('userRoles.departmentRoleId IN (:...ids)', { ids: departmentRoleIds });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('user.createdAt', 'DESC');
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });

    it('should return empty array when no users found', async () => {
      // Arrange
      const departmentRoleIds = [999];
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      const result = await userRepository.findUsersByDepartmentRoleIds(departmentRoleIds);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle empty department role IDs array', async () => {
      // Arrange
      const departmentRoleIds: number[] = [];
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      const result = await userRepository.findUsersByDepartmentRoleIds(departmentRoleIds);

      // Assert
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('userRoles.departmentRoleId IN (:...ids)', { ids: departmentRoleIds });
      expect(result).toEqual([]);
    });
  });

  describe('findUsersByRoleName', () => {
    it('should return users for given role name', async () => {
      // Arrange
      const roleName = 'Road Maintenance Staff';
      const mockUsers = [
        { id: 1, username: 'user1', departmentRoleId: 1 },
        { id: 2, username: 'user2', departmentRoleId: 2 },
      ];
      mockQueryBuilder.getMany.mockResolvedValue(mockUsers as any);

      // Act
      const result = await userRepository.findUsersByRoleName(roleName);

      // Assert
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('user.userRoles', 'userRoles');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('userRoles.departmentRole', 'departmentRole');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('departmentRole.department', 'department');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('departmentRole.role', 'role');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('role.name = :roleName', { roleName });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('user.createdAt', 'DESC');
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });

    it('should return empty array when no users found', async () => {
      // Arrange
      const roleName = 'Non-existent Role';
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      const result = await userRepository.findUsersByRoleName(roleName);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('findUserByTelegramUsername', () => {
    const telegramUsername = 'testuser_telegram';

    it('should return user when found by telegram username', async () => {
      // Arrange
      const mockUser = createMockCitizen({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        telegramUsername,
      });
      mockQueryBuilder.getOne.mockResolvedValue(mockUser);

      // Act
      const result = await userRepository.findUserByTelegramUsername(telegramUsername);

      // Assert
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('user.userRoles', 'userRoles');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('userRoles.departmentRole', 'departmentRole');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('departmentRole.department', 'department');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('departmentRole.role', 'role');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('user.telegram_username = :telegramUsername', { telegramUsername });
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith('user.passwordHash');
      expect(mockQueryBuilder.getOne).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      // Arrange
      mockQueryBuilder.getOne.mockResolvedValue(null);

      // Act
      const result = await userRepository.findUserByTelegramUsername(telegramUsername);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('clearExpiredTelegramLinkCodes', () => {
    it('should clear expired telegram link codes', async () => {
      // Arrange
      mockQueryBuilder.update.mockReturnThis();
      mockQueryBuilder.set.mockReturnThis();
      mockQueryBuilder.where.mockReturnThis();
      mockQueryBuilder.andWhere.mockReturnThis();

      // Act
      await userRepository.clearExpiredTelegramLinkCodes();

      // Assert
      expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(UserEntity);
      expect(mockQueryBuilder.set).toHaveBeenCalledWith({
        telegramLinkCode: null,
        telegramLinkCodeExpiresAt: null,
      });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('telegramLinkCodeExpiresAt < NOW()');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('telegramLinkCode IS NOT NULL');
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      // Arrange
      mockQueryBuilder.update.mockReturnThis();
      mockQueryBuilder.set.mockReturnThis();
      mockQueryBuilder.where.mockReturnThis();
      mockQueryBuilder.andWhere.mockReturnThis();
      mockQueryBuilder.execute.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(userRepository.clearExpiredTelegramLinkCodes()).rejects.toThrow('Database error');
    });
  });

  describe('findAvailableStaffByRoleId', () => {
    const roleId = 1;

    it('should return available staff member for given role', async () => {
      // Arrange
      const mockStaff = createMockCitizen({
        id: 1,
        username: 'staff1',
      });
      mockQueryBuilder.innerJoinAndSelect.mockReturnThis();
      mockQueryBuilder.leftJoin.mockReturnThis();
      mockQueryBuilder.where.mockReturnThis();
      mockQueryBuilder.groupBy.mockReturnThis();
      mockQueryBuilder.addGroupBy.mockReturnThis();
      mockQueryBuilder.addSelect.mockReturnThis();
      mockQueryBuilder.orderBy.mockReturnThis();
      mockQueryBuilder.addOrderBy.mockReturnThis();
      mockQueryBuilder.getOne.mockResolvedValue(mockStaff);

      // Act
      const result = await userRepository.findAvailableStaffByRoleId(roleId);

      // Assert
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(mockQueryBuilder.innerJoinAndSelect).toHaveBeenCalledWith('user.userRoles', 'userRoles');
      expect(mockQueryBuilder.innerJoinAndSelect).toHaveBeenCalledWith('userRoles.departmentRole', 'dr');
      expect(mockQueryBuilder.innerJoinAndSelect).toHaveBeenCalledWith('dr.role', 'role');
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'reports',
        'r',
        'r.assignee_id = user.id AND r.status IN (:...statuses)',
        { statuses: ['Assigned', 'In Progress', 'Suspended'] }
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('role.id = :roleId', { roleId });
      expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith('user.id');
      expect(mockQueryBuilder.addGroupBy).toHaveBeenCalledWith('userRoles.id');
      expect(mockQueryBuilder.addGroupBy).toHaveBeenCalledWith('dr.id');
      expect(mockQueryBuilder.addGroupBy).toHaveBeenCalledWith('role.id');
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith('COUNT(r.id)', 'report_count');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('report_count', 'ASC');
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith('user.id', 'ASC');
      expect(mockQueryBuilder.getOne).toHaveBeenCalled();
      expect(result).toEqual(mockStaff);
    });

    it('should return null when no available staff found', async () => {
      // Arrange
      mockQueryBuilder.innerJoinAndSelect.mockReturnThis();
      mockQueryBuilder.leftJoin.mockReturnThis();
      mockQueryBuilder.where.mockReturnThis();
      mockQueryBuilder.groupBy.mockReturnThis();
      mockQueryBuilder.addGroupBy.mockReturnThis();
      mockQueryBuilder.addSelect.mockReturnThis();
      mockQueryBuilder.orderBy.mockReturnThis();
      mockQueryBuilder.addOrderBy.mockReturnThis();
      mockQueryBuilder.getOne.mockResolvedValue(null);

      // Act
      const result = await userRepository.findAvailableStaffByRoleId(roleId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findUsersExcludingRoles', () => {
    const excludedRoleNames = ['Admin', 'Super Admin'];

    it('should return users excluding specified roles', async () => {
      // Arrange
      const mockUsers = [
        { id: 1, username: 'user1', departmentRoleId: 1 },
        { id: 2, username: 'user2', departmentRoleId: 2 },
      ];
      mockQueryBuilder.getMany.mockResolvedValue(mockUsers as any);

      // Act
      const result = await userRepository.findUsersExcludingRoles(excludedRoleNames);

      // Assert
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('user.userRoles', 'userRoles');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('userRoles.departmentRole', 'departmentRole');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('departmentRole.department', 'department');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('departmentRole.role', 'role');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('role.name NOT IN (:...excludedRoleNames)', { excludedRoleNames });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('user.createdAt', 'DESC');
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });

    it('should return empty array when no users found', async () => {
      // Arrange
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      const result = await userRepository.findUsersExcludingRoles(excludedRoleNames);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('updateVerificationData', () => {
    const userId = 1;
    const verificationData = {
      verificationCode: '123456',
      verificationCodeExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
    };

    it('should update verification data successfully', async () => {
      // Arrange
      mockRepository.update.mockResolvedValue({ affected: 1 });

      // Act
      await userRepository.updateVerificationData(userId, verificationData);

      // Assert
      expect(mockRepository.update).toHaveBeenCalledWith(userId, {
        verificationCode: verificationData.verificationCode,
        verificationCodeExpiresAt: verificationData.verificationCodeExpiresAt,
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      mockRepository.update.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(userRepository.updateVerificationData(userId, verificationData)).rejects.toThrow('Database error');
    });
  });

  describe('linkTelegramUsername', () => {
    const username = 'testuser';
    const telegramUsername = 'testuser_telegram';

    it('should link telegram username successfully', async () => {
      // Arrange
      const mockUser = createMockCitizen({
        id: 1,
        username,
        telegramUsername: undefined,
      });
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue({ ...mockUser, telegramUsername });

      // Act
      const result = await userRepository.linkTelegramUsername(username, telegramUsername);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { username } });
      expect(mockRepository.save).toHaveBeenCalledWith({ ...mockUser, telegramUsername });
      expect(result).toBe(true);
    });

    it('should return false when user not found', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await userRepository.linkTelegramUsername(username, telegramUsername);

      // Assert
      expect(result).toBe(false);
    });

    it('should throw error when telegram username already linked to another user', async () => {
      // Arrange
      const mockUser = createMockCitizen({ id: 1, username });
      const existingUser = createMockCitizen({ id: 2, username: 'otheruser', telegramUsername });
      mockRepository.findOne
        .mockResolvedValueOnce(mockUser) // First call for username lookup
        .mockResolvedValueOnce(existingUser); // Second call for telegram username check

      // Act & Assert
      await expect(userRepository.linkTelegramUsername(username, telegramUsername)).rejects.toThrow(
        'This Telegram username is already linked to another account.'
      );
    });
  });

  describe('generateTelegramLinkCode', () => {
    const userId = 1;

    it('should generate and save telegram link code', async () => {
      // Arrange
      const mockUser = createMockCitizen({ id: userId });
      const expectedCode = '211110'; // 100000 + (0.123456 * 900000) = 211110.456 -> 211110

      // Mock Math.random and Date
      const originalRandom = Math.random;
      const originalDate = Date;
      const mockNow = 1734870000000; // Fixed timestamp for testing
      Math.random = jest.fn(() => 0.123456); // Will generate 211110
      global.Date = jest.fn(() => new originalDate(mockNow)) as any;
      (global.Date as any).now = jest.fn(() => mockNow);

      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      // Act
      const result = await userRepository.generateTelegramLinkCode(userId);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          telegramLinkCode: '211110',
          telegramLinkCodeExpiresAt: expect.anything(), // Accept any Date object since Date is mocked
        })
      );
      expect(result).toBe(expectedCode);

      // Restore mocks
      Math.random = originalRandom;
      global.Date = originalDate;
    });

    it('should return null when user not found', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await userRepository.generateTelegramLinkCode(userId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('verifyAndLinkTelegram', () => {
    const telegramUsername = 'testuser_telegram';
    const code = '123456';

    it('should successfully verify and link telegram account', async () => {
      // Arrange
      const telegramUsername = 'testuser_telegram';
      const code = '123456';
      const futureDate = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes in the future
      const mockUser = createMockCitizen({
        id: 1,
        username: 'testuser',
        telegramUsername: undefined,
        telegramLinkCode: code,
        telegramLinkCodeExpiresAt: futureDate,
      });

      // Mock the query builder chain
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockUser),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockRepository.findOne.mockResolvedValue(null); // No existing telegram user
      mockRepository.save.mockResolvedValue({
        ...mockUser,
        telegramUsername,
        telegramLinkCode: undefined,
        telegramLinkCodeExpiresAt: undefined,
      });

      // Act
      const result = await userRepository.verifyAndLinkTelegram(telegramUsername, code);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { telegramUsername } });
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith("user");
      expect(mockQueryBuilder.where).toHaveBeenCalledWith("user.telegram_link_code = :code", { code });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "user.telegram_link_code_expires_at > :now",
        expect.objectContaining({ now: expect.any(Date) })
      );
      expect(result.success).toBe(true);
      expect(result.message).toContain('Account linked successfully');
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        telegramUsername,
        telegramLinkCode: undefined,
        telegramLinkCodeExpiresAt: undefined,
      });
    });

    it('should return error when telegram username already linked', async () => {
      // Arrange
      const existingUser = createMockCitizen({
        id: 2,
        username: 'otheruser',
        telegramUsername,
      });

      mockRepository.findOne.mockResolvedValue(existingUser);

      // Act
      const result = await userRepository.verifyAndLinkTelegram(telegramUsername, code);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('already linked to an account');
    });

    it('should return error when code is invalid', async () => {
      // Arrange
      mockRepository.findOne
        .mockResolvedValueOnce(null) // No existing telegram user
        .mockResolvedValueOnce(null); // No user with code

      // Act
      const result = await userRepository.verifyAndLinkTelegram(telegramUsername, code);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid or expired code');
    });

    it('should return error when code is expired', async () => {
      // Arrange
      const telegramUsername = 'testuser_telegram';
      const code = '123456';
      const mockNow = 1734870000000; // Fixed timestamp for testing
      const mockUser = createMockCitizen({
        id: 1,
        telegramLinkCode: code,
        telegramLinkCodeExpiresAt: new Date(mockNow - 60 * 1000), // Past date
      });

      mockRepository.findOne
        .mockResolvedValueOnce(null) // No existing telegram user
        .mockResolvedValueOnce(mockUser); // User with expired code

      // Act
      const result = await userRepository.verifyAndLinkTelegram(telegramUsername, code);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid or expired code');
    });
  });

  describe('unlinkTelegramAccount', () => {
    const userId = 1;

    it('should successfully unlink telegram account', async () => {
      // Arrange
      const mockUser = createMockCitizen({
        id: userId,
        telegramUsername: 'testuser_telegram',
        telegramLinkCode: '123456',
        telegramLinkCodeExpiresAt: new Date(),
      });

      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue({
        ...mockUser,
        telegramUsername: undefined,
        telegramLinkCode: undefined,
        telegramLinkCodeExpiresAt: undefined,
      });

      // Act
      const result = await userRepository.unlinkTelegramAccount(userId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('unlinked successfully');
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        telegramUsername: null,
        telegramLinkCode: null,
        telegramLinkCodeExpiresAt: null,
      });
    });

    it('should return error when user not found', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await userRepository.unlinkTelegramAccount(userId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('User not found');
    });

    it('should return error when no telegram account linked', async () => {
      // Arrange
      const mockUser = createMockCitizen({
        id: userId,
        telegramUsername: undefined,
      });

      mockRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await userRepository.unlinkTelegramAccount(userId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('No Telegram account linked');
    });
  });
});