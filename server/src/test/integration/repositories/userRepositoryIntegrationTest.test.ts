import { afterAll, afterEach, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { AppDataSource } from "@database/connection";
import { userRepository } from "@repositories/userRepository";
import { userEntity } from "@models/entity/userEntity";
import { In } from 'typeorm'; 

type CreateUserInput = Parameters<typeof userRepository.createUserWithPassword>[0];

const random = () => Math.floor(Math.random() * 1000000);
const buildUserData = (overrides: Partial<CreateUserInput> = {}): CreateUserInput => ({
  username: `testuser_${random()}`,
  firstName: "Test",
  lastName: "User",
  email: `test.user.${random()}@example.com`,
  password: "securePass123",
  departmentRoleId: 1, // Citizen role
  emailNotificationsEnabled: true,
  ...overrides,
});

describe('UserRepository Integration Tests', () => {
  // Array to track created user IDs for cleanup
  let createdUserIds: number[] = [];

  // Database setup
  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });

  // Final cleanup of all created users
  afterAll(async () => {
    if (createdUserIds.length > 0) {
      const repository = AppDataSource.getRepository(userEntity);
      await repository.delete({ id: In(createdUserIds) });
      createdUserIds = [];
    }
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  // Cleanup after each test
  afterEach(async () => {
    if (createdUserIds.length > 0) {
      const repository = AppDataSource.getRepository(userEntity);
      await repository.delete({ id: In(createdUserIds) });
      createdUserIds = [];
    }
    jest.restoreAllMocks();
  });

  // ---- SAVE ----
  describe('save', () => {
    it('should save changes to an existing user entity', async () => {
      const newUser = await userRepository.createUserWithPassword(buildUserData());
      createdUserIds.push(newUser.id);
      
      newUser.firstName = 'ManuallyUpdated';
      
      const savedUser = await userRepository.save(newUser);
      
      expect(savedUser.id).toBe(newUser.id);
      expect(savedUser.firstName).toBe('ManuallyUpdated');
      
      const dbUser = await userRepository.findUserById(newUser.id);
      expect(dbUser?.firstName).toBe('ManuallyUpdated');
    });
  });

  // ---- CREATE USER -----
  describe('createUserWithPassword', () => {

    it('should create a new user with hashed password', async () => {
      const newUser = buildUserData();
      const savedUser = await userRepository.createUserWithPassword(newUser);
      
      createdUserIds.push(savedUser.id);

      expect(savedUser).toBeDefined();
      expect(savedUser.id).toBeGreaterThan(0);
      expect(savedUser.username).toBe(newUser.username);
      expect(savedUser.firstName).toBe(newUser.firstName);
      expect(savedUser.lastName).toBe(newUser.lastName);
      expect(savedUser.email).toBe(newUser.email);
      expect(savedUser.passwordHash).toBeDefined();
      expect(savedUser.passwordHash).not.toContain(newUser.password);
      expect(savedUser.departmentRoleId).toBe(1);
      expect(savedUser.emailNotificationsEnabled).toBe(true);
      expect(savedUser.createdAt).toBeInstanceOf(Date);
    });

    it('should not allow duplicate username', async () => {
      const dynamicUsername = `duplicateUser_${random()}`;
      const newUser = buildUserData({ username: dynamicUsername });
      
      const savedUser = await userRepository.createUserWithPassword(newUser);
      createdUserIds.push(savedUser.id); 

      const duplicate = { ...buildUserData(), username: dynamicUsername };
      await expect(userRepository.createUserWithPassword(duplicate)).rejects.toThrow();
    });

    it('should not allow duplicate email', async () => {
      const dynamicEmail = `duplicate_${random()}@example.com`;
      const newUser = buildUserData({ email: dynamicEmail });

      const savedUser = await userRepository.createUserWithPassword(newUser);
      createdUserIds.push(savedUser.id);

      const duplicate = { ...buildUserData(), email: dynamicEmail };
      await expect(userRepository.createUserWithPassword(duplicate)).rejects.toThrow();
    });

    const requiredFields: Array<keyof CreateUserInput> = ['username', 'firstName', 'lastName', 'email', 'password'];
    for (const field of requiredFields) {
      it(`should throw when ${field} is missing`, async () => {
        const user = buildUserData() as Partial<CreateUserInput>;
        delete user[field];
        await expect(userRepository.createUserWithPassword(user as CreateUserInput)).rejects.toThrow();
      });
    }
  });

  // ---- FIND BY ID ----
  describe('findUserById', () => {
    it('should return user for valid ID', async () => {
      const newUser = await userRepository.createUserWithPassword(buildUserData());
      createdUserIds.push(newUser.id);

      const savedUser = await userRepository.findUserById(newUser.id);
      expect(savedUser).not.toBeNull();
      expect(savedUser?.id).toBe(newUser.id);
    });

    it('should return null for non-existent ID', async () => {
      const savedUser = await userRepository.findUserById(9999999);
      expect(savedUser).toBeNull();
    });

    it('should handle invalid ID type gracefully', async () => {
      await expect(userRepository.findUserById("invalid" as unknown as number)).rejects.toThrow();
    });
  });

  // ---- FIND BY USERNAME ----
  describe('findUserByUsername', () => {
    it('should return user for valid username', async () => {
      const user = await userRepository.createUserWithPassword(buildUserData({ username: `finduser_${random()}` }));
      createdUserIds.push(user.id); 

      const savedUser = await userRepository.findUserByUsername(user.username);
      expect(savedUser).not.toBeNull();
      expect(savedUser?.username).toBe(user.username);
    });

    it('should return null for unknown username', async () => {
      const savedUser = await userRepository.findUserByUsername('unknownuser');
      expect(savedUser).toBeNull();
    });

    it('should return null for missing username', async () => {
      const savedUser = await userRepository.findUserByUsername(undefined as unknown as string);
      expect(savedUser).toBeNull();
    });
  });

  // ---- FIND BY EMAIL ----
  describe('findUserByEmail', () => {
    it('should return user for valid email', async () => {
      const newUser = await userRepository.createUserWithPassword(buildUserData({ email: `emailtest_${random()}@example.com` }));
      createdUserIds.push(newUser.id); 

      const savedUser = await userRepository.findUserByEmail(newUser.email);
      expect(savedUser).not.toBeNull();
      expect(savedUser?.email).toBe(newUser.email);
    });

    it('should return null for non-existent email', async () => {
      const savedUser = await userRepository.findUserByEmail('no@none.com');
      expect(savedUser).toBeNull();
    });

    it('should return null for invalid email type', async () => {
      const savedUser = await userRepository.findUserByEmail(12345 as unknown as string);
      expect(savedUser).toBeNull();
    });
  });

  // ---- EXISTS BY USERNAME ----
  describe('existsUserByUsername', () => {
    it('should return true if username exists', async () => {
      const newUser = await userRepository.createUserWithPassword(buildUserData({ username: `existuser_${random()}` }));
      createdUserIds.push(newUser.id);

      const exist = await userRepository.existsUserByUsername(newUser.username);
      expect(exist).toBe(true);
    });

    it('should return false if username does not exist', async () => {
      const exists = await userRepository.existsUserByUsername('missinguser');
      expect(exists).toBe(false);
    });
  });

  // ---- EXISTS BY EMAIL ----
  describe('existsUserByEmail', () => {
    it('should return true if email exists', async () => {
      const newUser = await userRepository.createUserWithPassword(buildUserData({ email: `exists_${random()}@example.com` }));
      createdUserIds.push(newUser.id); 

      const exists = await userRepository.existsUserByEmail(newUser.email);
      expect(exists).toBe(true);
    });

    it('should return false if email does not exist', async () => {
      const exists = await userRepository.existsUserByEmail('none@example.com');
      expect(exists).toBe(false);
    });
  });

  // ---- VERIFY CREDENTIALS ----
  describe('verifyCredentials', () => {
    it('should verify valid username/password', async () => {
      const data = buildUserData({ username: `loginuser_${random()}`, password: 'validpass' });
      const newUser = await userRepository.createUserWithPassword(data);
      createdUserIds.push(newUser.id); 
      
      const verified = await userRepository.verifyCredentials(data.username, 'validpass');
      expect(verified).not.toBeNull();
      expect(verified?.username).toBe(data.username);
    });

    it('should return null for wrong password', async () => {
      const data = buildUserData({ username: `wrongpass_${random()}`, password: 'correctpass' });
      const newUser = await userRepository.createUserWithPassword(data);
      createdUserIds.push(newUser.id); 
      
      const verified = await userRepository.verifyCredentials(data.username, 'badpass');
      expect(verified).toBeNull();
    });

    it('should return null for non-existent username', async () => {
      const verified = await userRepository.verifyCredentials('nouser', 'password123');
      expect(verified).toBeNull();
    });

    it('should return null if passwordHash is malformed (no colon)', async () => {
      const data = buildUserData();
      const user = await userRepository.createUserWithPassword(data);
      createdUserIds.push(user.id);
      
      user.passwordHash = 'justahashnofsalt';
      await userRepository.save(user);
      
      const verified = await userRepository.verifyCredentials(data.username, data.password);
      expect(verified).toBeNull();
    });
  });

  // ---- UPDATE USER ----
  describe('updateUser', () => {
    it('should update an existing user', async () => {
      const user = await userRepository.createUserWithPassword(buildUserData());
      createdUserIds.push(user.id);
      
      const updatedUser = await userRepository.updateUser(user.id, { firstName: 'UpdatedName' });
      
      expect(updatedUser.id).toBe(user.id);
      expect(updatedUser.firstName).toBe('UpdatedName');
      expect(updatedUser.lastName).toBe(user.lastName); 
    });

    it('should throw if user not found after update (internal state error)', async () => {
      const user = await userRepository.createUserWithPassword(buildUserData());
      createdUserIds.push(user.id);
      
      jest.spyOn(userRepository, 'findUserById').mockResolvedValue(null);
      
      await expect(
        userRepository.updateUser(user.id, { firstName: 'NewName' })
      ).rejects.toThrow('User not found after update');
      
      expect(userRepository.findUserById).toHaveBeenCalledWith(user.id);
    });
  });

  // ---- DELETE USER ----
  describe('deleteUser', () => {
    it('should delete an existing user', async () => {
      const user = await userRepository.createUserWithPassword(buildUserData());
      const id = user.id;
      
      await userRepository.deleteUser(id);
      
      const deletedUser = await userRepository.findUserById(id);
      expect(deletedUser).toBeNull();
    });

    it('should throw an error when deleting a non-existent user', async () => {
      await expect(userRepository.deleteUser(9999999)).rejects.toThrow('User not found');
    });
  });

  // ---- FIND ALL USERS ----
  describe('findAllUsers', () => {
    it('should return an array of all users', async () => {
      const user1 = await userRepository.createUserWithPassword(buildUserData());
      const user2 = await userRepository.createUserWithPassword(buildUserData());
      createdUserIds.push(user1.id, user2.id);
      
      const users = await userRepository.findAllUsers();
      
      expect(users).toBeInstanceOf(Array);
      expect(users.length).toBeGreaterThanOrEqual(2);
      expect(users.map(u => u.id)).toContain(user1.id);
      expect(users.map(u => u.id)).toContain(user2.id);
    });

    it('should return users matching a where clause', async () => {
      const specificUsername = `findme_${random()}`;
      const user1 = await userRepository.createUserWithPassword(buildUserData({ username: specificUsername }));
      const user2 = await userRepository.createUserWithPassword(buildUserData());
      createdUserIds.push(user1.id, user2.id);
      
      const users = await userRepository.findAllUsers({ where: { username: specificUsername } });
      
      expect(users.length).toBe(1);
      expect(users[0].username).toBe(specificUsername);
    });
  });
});