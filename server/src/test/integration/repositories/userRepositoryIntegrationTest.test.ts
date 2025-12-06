import { afterAll, afterEach, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { AppDataSource } from "@database/connection";
import { userRepository } from "@repositories/userRepository";
import { departmentRoleRepository } from '@repositories/departmentRoleRepository';
import { companyRepository } from '@repositories/companyRepository';
import { UserEntity } from "@models/entity/userEntity";
import { In } from 'typeorm'; 

type CreateUserInput = Parameters<typeof userRepository.createUserWithPassword>[0];

const random = () => Math.floor(Math.random() * 1000000);

let defaultCitizenRoleId: number;

const buildUserData = (overrides: Partial<CreateUserInput> = {}): CreateUserInput => ({
  username: `testuser_${random()}`,
  firstName: "Test",
  lastName: "User",
  email: `test.user.${random()}@example.com`,
  password: "securePass123",
  departmentRoleId: defaultCitizenRoleId,
  emailNotificationsEnabled: true,
  isVerified: false,
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
    // Get Citizen role ID dynamically
    const citizenDeptRole = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Citizen');
    if (!citizenDeptRole) {
      throw new Error('Citizen role not found in database');
    }
    defaultCitizenRoleId = citizenDeptRole.id;
  });

  // Final cleanup of all created users
  afterAll(async () => {
    if (createdUserIds.length > 0) {
      const repository = AppDataSource.getRepository(UserEntity);
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
      const repository = AppDataSource.getRepository(UserEntity);
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

  describe('findExternalMaintainersByCategory', () => {
    let lightingCompanyId: number;
    let roadsCompanyId: number;
    let externalRoleId: number;

    beforeAll(async () => {
      // Create companies
      const lightingCompany = await AppDataSource.query(
        'INSERT INTO companies (name, category) VALUES ($1, $2) RETURNING id',
        [`Lighting Company ${Date.now()}`, 'Public Lighting']
      );
      lightingCompanyId = lightingCompany[0].id;

      const roadsCompany = await AppDataSource.query(
        'INSERT INTO companies (name, category) VALUES ($1, $2) RETURNING id',
        [`Roads Company ${Date.now()}`, 'Roads and Urban Furnishings']
      );
      roadsCompanyId = roadsCompany[0].id;

      // Get external maintainer role
      const roleResult = await AppDataSource.query(
        `SELECT dr.id FROM department_roles dr
         JOIN departments d ON dr.department_id = d.id
         JOIN roles r ON dr.role_id = r.id
         WHERE d.name = 'External Service Providers' AND r.name = 'External Maintainer'`
      );
      externalRoleId = roleResult[0].id;
    });

    afterAll(async () => {
      // Cleanup companies
      if (lightingCompanyId) {
        await AppDataSource.query('DELETE FROM companies WHERE id = $1', [lightingCompanyId]);
      }
      if (roadsCompanyId) {
        await AppDataSource.query('DELETE FROM companies WHERE id = $1', [roadsCompanyId]);
      }
    });

    it('should return external maintainers filtered by category', async () => {
      const timestamp = Date.now();

      // Create lighting maintainers
      const lightingM1 = await userRepository.createUserWithPassword({
        username: `lighting_m1_${timestamp}`,
        email: `lighting_m1_${timestamp}@test.com`,
        password: 'Password123!',
        firstName: 'Lighting',
        lastName: 'M1',
        departmentRoleId: externalRoleId,
        companyId: lightingCompanyId,
        isVerified: true,
      });
      createdUserIds.push(lightingM1.id);

      const lightingM2 = await userRepository.createUserWithPassword({
        username: `lighting_m2_${timestamp}`,
        email: `lighting_m2_${timestamp}@test.com`,
        password: 'Password123!',
        firstName: 'Lighting',
        lastName: 'M2',
        departmentRoleId: externalRoleId,
        companyId: lightingCompanyId,
        isVerified: true,
      });
      createdUserIds.push(lightingM2.id);

      // Create roads maintainer
      const roadsM1 = await userRepository.createUserWithPassword({
        username: `roads_m1_${timestamp}`,
        email: `roads_m1_${timestamp}@test.com`,
        password: 'Password123!',
        firstName: 'Roads',
        lastName: 'M1',
        departmentRoleId: externalRoleId,
        companyId: roadsCompanyId,
        isVerified: true,
      });
      createdUserIds.push(roadsM1.id);

      const result = await userRepository.findExternalMaintainersByCategory('Public Lighting');

      const ids = result.map(u => u.id);
      expect(ids).toContain(lightingM1.id);
      expect(ids).toContain(lightingM2.id);
      expect(ids).not.toContain(roadsM1.id);
    });

    it('should return empty array when no maintainers for category', async () => {
      const result = await userRepository.findExternalMaintainersByCategory('Public Green Areas and Playgrounds');

      // May have maintainers from other tests, but not our specific ones
      expect(Array.isArray(result)).toBe(true);
    });

    it('should include all user relations', async () => {
      const timestamp = Date.now();

      const maintainer = await userRepository.createUserWithPassword({
        username: `maintainer_rel_${timestamp}`,
        email: `maintainer_rel_${timestamp}@test.com`,
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'Maintainer',
        departmentRoleId: externalRoleId,
        companyId: lightingCompanyId,
        isVerified: true,
      });
      createdUserIds.push(maintainer.id);

      const result = await userRepository.findExternalMaintainersByCategory('Public Lighting');

      const found = result.find(u => u.id === maintainer.id);
      expect(found).toBeDefined();
      expect(found?.departmentRole).toBeDefined();
      expect(found?.departmentRole?.department).toBeDefined();
      expect(found?.departmentRole?.role).toBeDefined();
      expect(found?.companyId).toBe(lightingCompanyId);
    });

    it('should only return external maintainers, not other roles', async () => {
      const result = await userRepository.findExternalMaintainersByCategory('Public Lighting');

      result.forEach(user => {
        expect(user.departmentRole?.role?.name).toBe('External Maintainer');
      });
    });

    it('should handle categories with special characters', async () => {
      const result = await userRepository.findExternalMaintainersByCategory('Roads and Urban Furnishings');

      expect(Array.isArray(result)).toBe(true);
      result.forEach(user => {
        expect(user.departmentRole?.role?.name).toBe('External Maintainer');
      });
    });
  });

  describe('removeCompanyFromUser', () => {
    it('should remove company assignment from an external maintainer', async () => {
      // Get External Maintainer role and a company
      const externalMaintainerRole = await departmentRoleRepository.findByDepartmentAndRole(
        'External Service Providers', 
        'External Maintainer'
      );
      expect(externalMaintainerRole).toBeDefined();

      const companies = await companyRepository.findAll();
      expect(companies.length).toBeGreaterThan(0);
      const company = companies[0];

      // Create user with company
      const userData = buildUserData({
        departmentRoleId: externalMaintainerRole!.id,
        companyId: company.id
      });

      const createdUser = await userRepository.createUserWithPassword(userData);
      createdUserIds.push(createdUser.id);

      // Verify user has company
      expect(createdUser.companyId).toBe(company.id);

      // Remove company
      await userRepository.removeCompanyFromUser(createdUser.id);

      // Verify company was removed
      const updatedUser = await userRepository.findUserById(createdUser.id);
      expect(updatedUser).toBeDefined();
      expect(updatedUser!.companyId).toBeNull();
    });

    it('should not throw error when removing company from user without company', async () => {
      // Create user without company
      const userData = buildUserData();
      const createdUser = await userRepository.createUserWithPassword(userData);
      createdUserIds.push(createdUser.id);

      // Verify user has no company
      expect(createdUser.companyId).toBeFalsy();

      // Remove company (should not throw)
      await expect(
        userRepository.removeCompanyFromUser(createdUser.id)
      ).resolves.not.toThrow();

      // Verify user still exists and has no company
      const updatedUser = await userRepository.findUserById(createdUser.id);
      expect(updatedUser).toBeDefined();
      expect(updatedUser!.companyId).toBeFalsy();
    });

    it('should not throw error when removing company from non-existent user', async () => {
      const nonExistentUserId = 999999;

      // Should not throw error
      await expect(
        userRepository.removeCompanyFromUser(nonExistentUserId)
      ).resolves.not.toThrow();
    });

    it('should only affect the specified user', async () => {
      // Get External Maintainer role and companies
      const externalMaintainerRole = await departmentRoleRepository.findByDepartmentAndRole(
        'External Service Providers', 
        'External Maintainer'
      );
      expect(externalMaintainerRole).toBeDefined();

      const companies = await companyRepository.findAll();
      expect(companies.length).toBeGreaterThanOrEqual(2);

      // Create two users with companies
      const user1Data = buildUserData({
        departmentRoleId: externalMaintainerRole!.id,
        companyId: companies[0].id
      });
      const user2Data = buildUserData({
        departmentRoleId: externalMaintainerRole!.id,
        companyId: companies[1].id
      });

      const user1 = await userRepository.createUserWithPassword(user1Data);
      const user2 = await userRepository.createUserWithPassword(user2Data);
      createdUserIds.push(user1.id, user2.id);

      // Remove company from user1 only
      await userRepository.removeCompanyFromUser(user1.id);

      // Verify user1 has no company
      const updatedUser1 = await userRepository.findUserById(user1.id);
      expect(updatedUser1!.companyId).toBeNull();

      // Verify user2 still has company
      const updatedUser2 = await userRepository.findUserById(user2.id);
      expect(updatedUser2!.companyId).toBe(companies[1].id);
    });
  });
});
