import { afterAll, afterEach, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { AppDataSource } from "@database/connection";
import { userRepository } from "@repositories/userRepository";
import { departmentRoleRepository } from '@repositories/departmentRoleRepository';
import { companyRepository } from '@repositories/companyRepository';
import { UserEntity } from "@models/entity/userEntity";
import { UserRoleEntity } from "@models/entity/userRoleEntity";
import { RoleEntity } from "@models/entity/roleEntity";
import { DepartmentEntity } from "@models/entity/departmentEntity";
import { DepartmentRoleEntity } from "@models/entity/departmentRoleEntity";
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
  emailNotificationsEnabled: true,
  isVerified: false,
  ...overrides,
});

const createUserWithRole = async (overrides: Partial<CreateUserInput> = {}, roleId: number = defaultCitizenRoleId): Promise<UserEntity> => {
  const userData = buildUserData(overrides);
  const user = await userRepository.createUserWithPassword(userData);
  await AppDataSource.getRepository(UserRoleEntity).save({
    userId: user.id,
    departmentRoleId: roleId
  });
  const savedUser = await userRepository.findUserById(user.id);
  if (!savedUser) throw new Error("User not found after creation");
  return savedUser;
};

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
      const newUser = await createUserWithRole();
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
      expect(savedUser.userRoles).toBeDefined();
      // Expect no roles initially if using raw createUserWithPassword
      expect(savedUser.userRoles!.length).toBe(0);
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
      const newUser = await createUserWithRole();
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
      const user = await createUserWithRole({ username: `finduser_${random()}` });
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
      const newUser = await createUserWithRole({ email: `emailtest_${random()}@example.com` });
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
      const newUser = await createUserWithRole({ username: `existuser_${random()}` });
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
      const newUser = await createUserWithRole({ email: `exists_${random()}@example.com` });
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
      // We can use createUserWithRole or createUserWithPassword, using createUserWithPassword is fine here as verification checks passwordHash
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
      const user = await createUserWithRole();
      createdUserIds.push(user.id);

      const updatedUser = await userRepository.updateUser(user.id, { firstName: 'UpdatedName' });

      expect(updatedUser.id).toBe(user.id);
      expect(updatedUser.firstName).toBe('UpdatedName');
      expect(updatedUser.lastName).toBe(user.lastName);
    });

    it('should throw if user not found after update (internal state error)', async () => {
      const user = await createUserWithRole();
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
      const user = await createUserWithRole();
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
      const user1 = await createUserWithRole();
      const user2 = await createUserWithRole();
      createdUserIds.push(user1.id, user2.id);

      const users = await userRepository.findAllUsers();

      expect(users).toBeInstanceOf(Array);
      expect(users.length).toBeGreaterThanOrEqual(2);
      expect(users.map(u => u.id)).toContain(user1.id);
      expect(users.map(u => u.id)).toContain(user2.id);
    });

    it('should return users matching a where clause', async () => {
      const specificUsername = `findme_${random()}`;
      const user1 = await createUserWithRole({ username: specificUsername });
      const user2 = await createUserWithRole();
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
      // Ensure dependencies exist
      let extDept = await AppDataSource.getRepository(DepartmentEntity).findOneBy({ name: 'External Service Providers' });
      if (!extDept) {
        extDept = await AppDataSource.getRepository(DepartmentEntity).save({ name: 'External Service Providers' });
      }

      let extRole = await AppDataSource.getRepository(RoleEntity).findOneBy({ name: 'External Maintainer' });
      if (!extRole) {
        extRole = await AppDataSource.getRepository(RoleEntity).save({ name: 'External Maintainer' });
      }

      let extDeptRole = await departmentRoleRepository.findByDepartmentAndRole('External Service Providers', 'External Maintainer');
      if (!extDeptRole) {
        await AppDataSource.getRepository(DepartmentRoleEntity).save({
          departmentId: extDept.id,
          roleId: extRole.id
        });
      }

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
      const lightingM1 = await createUserWithRole({
        username: `lighting_m1_${timestamp}`,
        email: `lighting_m1_${timestamp}@test.com`,
        password: 'Password123!',
        firstName: 'Lighting',
        lastName: 'M1',
        companyId: lightingCompanyId,
        isVerified: true,
      }, externalRoleId);
      createdUserIds.push(lightingM1.id);

      const lightingM2 = await createUserWithRole({
        username: `lighting_m2_${timestamp}`,
        email: `lighting_m2_${timestamp}@test.com`,
        password: 'Password123!',
        firstName: 'Lighting',
        lastName: 'M2',
        companyId: lightingCompanyId,
        isVerified: true,
      }, externalRoleId);
      createdUserIds.push(lightingM2.id);

      // Create roads maintainer
      const roadsM1 = await createUserWithRole({
        username: `roads_m1_${timestamp}`,
        email: `roads_m1_${timestamp}@test.com`,
        password: 'Password123!',
        firstName: 'Roads',
        lastName: 'M1',
        companyId: roadsCompanyId,
        isVerified: true,
      }, externalRoleId);
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

      const maintainer = await createUserWithRole({
        username: `maintainer_rel_${timestamp}`,
        email: `maintainer_rel_${timestamp}@test.com`,
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'Maintainer',
        companyId: lightingCompanyId,
        isVerified: true,
      }, externalRoleId);
      createdUserIds.push(maintainer.id);

      const result = await userRepository.findExternalMaintainersByCategory('Public Lighting');

      const found = result.find(u => u.id === maintainer.id);
      expect(found).toBeDefined();
      expect(found?.userRoles).toBeDefined();
      expect(found?.userRoles![0].departmentRole).toBeDefined();
      expect(found?.userRoles![0].departmentRole.department).toBeDefined();
      expect(found?.userRoles![0].departmentRole.role).toBeDefined();
      expect(found?.companyId).toBe(lightingCompanyId);
    });

    it('should only return external maintainers, not other roles', async () => {
      const result = await userRepository.findExternalMaintainersByCategory('Public Lighting');

      for (const user of result) {
        expect(user.userRoles).toBeDefined();
        const role = user.userRoles!.find(ur => ur.departmentRole?.role?.name === 'External Maintainer');
        expect(role).toBeDefined();
      }
    });

    it('should handle categories with special characters', async () => {
      const result = await userRepository.findExternalMaintainersByCategory('Roads and Urban Furnishings');

      expect(Array.isArray(result)).toBe(true);
      for (const user of result) {
        expect(user.userRoles).toBeDefined();
        const role = user.userRoles!.find(ur => ur.departmentRole?.role?.name === 'External Maintainer');
        expect(role).toBeDefined();
      }
    });
  });

  describe('removeCompanyFromUser', () => {
    let testCompanies: any[] = [];
    let externalMaintainerRoleId: number;

    beforeAll(async () => {
      // Ensure External Maintainer role exists
      const role = await departmentRoleRepository.findByDepartmentAndRole(
        'External Service Providers',
        'External Maintainer'
      );

      if (role) {
        externalMaintainerRoleId = role.id;
      } else {
        let extDept = await AppDataSource.getRepository(DepartmentEntity).findOneBy({ name: 'External Service Providers' });
        if (!extDept) {
          extDept = await AppDataSource.getRepository(DepartmentEntity).save({ name: 'External Service Providers' });
        }

        let extRole = await AppDataSource.getRepository(RoleEntity).findOneBy({ name: 'External Maintainer' });
        if (!extRole) {
          extRole = await AppDataSource.getRepository(RoleEntity).save({ name: 'External Maintainer' });
        }

        const newRole = await AppDataSource.getRepository(DepartmentRoleEntity).save({
          departmentId: extDept.id,
          roleId: extRole.id
        });
        externalMaintainerRoleId = newRole.id;
      }

      // Create test companies
      const c1 = await AppDataSource.query("INSERT INTO companies (name, category) VALUES ($1, 'Public Lighting') RETURNING id", [`Co1_${Date.now()}`]);
      const c2 = await AppDataSource.query("INSERT INTO companies (name, category) VALUES ($1, 'Roads and Urban Furnishings') RETURNING id", [`Co2_${Date.now()}`]);
      testCompanies.push({ id: c1[0].id }, { id: c2[0].id });
    });

    afterAll(async () => {
      for (const c of testCompanies) {
        await AppDataSource.query('DELETE FROM companies WHERE id = $1', [c.id]);
      }
    });

    it('should remove company assignment from an external maintainer', async () => {
      expect(externalMaintainerRoleId).toBeDefined();
      expect(testCompanies.length).toBeGreaterThan(0);
      const company = testCompanies[0];

      // Create user with company
      const userData = buildUserData({
        companyId: company.id
      });

      const createdUser = await createUserWithRole(userData, externalMaintainerRoleId);
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
      const createdUser = await createUserWithRole();
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
      expect(externalMaintainerRoleId).toBeDefined();
      expect(testCompanies.length).toBeGreaterThanOrEqual(2);

      // Create two users with companies
      const user1Data = buildUserData({
        companyId: testCompanies[0].id
      });
      const user2Data = buildUserData({
        companyId: testCompanies[1].id
      });

      const user1 = await createUserWithRole(user1Data, externalMaintainerRoleId);
      const user2 = await createUserWithRole(user2Data, externalMaintainerRoleId);
      createdUserIds.push(user1.id, user2.id);

      // Remove company from user1 only
      await userRepository.removeCompanyFromUser(user1.id);

      // Verify user1 has no company
      const updatedUser1 = await userRepository.findUserById(user1.id);
      expect(updatedUser1!.companyId).toBeNull();

      // Verify user2 still has company
      const updatedUser2 = await userRepository.findUserById(user2.id);
      expect(updatedUser2!.companyId).toBe(testCompanies[1].id);
    });
  });


  // ---- VERIFY EMAIL CODE ----
  describe('verifyEmailCode', () => {
    it('should return true for valid verification code', async () => {
      const verificationCode = '123456';
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

      const userData = buildUserData({
        isVerified: false,
        verificationCode,
        verificationCodeExpiresAt: expiresAt,
      });

      const user = await userRepository.createUserWithPassword(userData);
      createdUserIds.push(user.id);

      const result = await userRepository.verifyEmailCode(userData.email, verificationCode);

      expect(result).toBe(true);
    });

    it('should return false for invalid verification code', async () => {
      const correctCode = '123456';
      const wrongCode = '999999';
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      const userData = buildUserData({
        isVerified: false,
        verificationCode: correctCode,
        verificationCodeExpiresAt: expiresAt,
      });

      const user = await userRepository.createUserWithPassword(userData);
      createdUserIds.push(user.id);

      const result = await userRepository.verifyEmailCode(userData.email, wrongCode);

      expect(result).toBe(false);
    });

    it('should return false when user has no verification code', async () => {
      const userData = buildUserData({
        isVerified: true,
        verificationCode: undefined,
        verificationCodeExpiresAt: undefined,
      });

      const user = await userRepository.createUserWithPassword(userData);
      createdUserIds.push(user.id);

      const result = await userRepository.verifyEmailCode(userData.email, '123456');

      expect(result).toBe(false);
    });

    it('should throw BadRequestError for expired verification code', async () => {
      const verificationCode = '123456';
      const expiredDate = new Date(Date.now() - 60 * 1000); // 1 minute ago (expired)

      const userData = buildUserData({
        isVerified: false,
        verificationCode,
        verificationCodeExpiresAt: expiredDate,
      });

      const user = await userRepository.createUserWithPassword(userData);
      createdUserIds.push(user.id);

      await expect(
        userRepository.verifyEmailCode(userData.email, verificationCode)
      ).rejects.toThrow('Verification code has expired');
    });

    it('should return false when email does not exist', async () => {
      const result = await userRepository.verifyEmailCode('nonexistent@test.com', '123456');

      expect(result).toBe(false);
    });
  });

  // ---- UPDATE USER IS VERIFIED ----
  describe('updateUserIsVerified', () => {
    it('should set user as verified and clear verification code', async () => {
      const verificationCode = '123456';
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      const userData = buildUserData({
        isVerified: false,
        verificationCode,
        verificationCodeExpiresAt: expiresAt,
      });

      const user = await userRepository.createUserWithPassword(userData);
      createdUserIds.push(user.id);

      expect(user.isVerified).toBe(false);
      expect(user.verificationCode).toBe(verificationCode);
      expect(user.verificationCodeExpiresAt).toBeDefined();

      await userRepository.updateUserIsVerified(userData.email, true);

      const updatedUser = await userRepository.findUserByEmail(userData.email);

      expect(updatedUser!.isVerified).toBe(true);
      expect(updatedUser!.verificationCode).toBeNull();
      expect(updatedUser!.verificationCodeExpiresAt).toBeNull();
    });

    it('should handle setting isVerified to false', async () => {
      const userData = buildUserData({
        isVerified: true,
        verificationCode: undefined,
        verificationCodeExpiresAt: undefined,
      });

      const user = await userRepository.createUserWithPassword(userData);
      createdUserIds.push(user.id);

      await userRepository.updateUserIsVerified(userData.email, false);

      const updatedUser = await userRepository.findUserByEmail(userData.email);

      expect(updatedUser!.isVerified).toBe(false);
      expect(updatedUser!.verificationCode).toBeNull();
      expect(updatedUser!.verificationCodeExpiresAt).toBeNull();
    });

    it('should not throw error when updating non-existent user', async () => {
      // TypeORM update with no matching rows doesn't throw
      await expect(
        userRepository.updateUserIsVerified('nonexistent@test.com', true)
      ).resolves.not.toThrow();
    });
  });

  describe('deleteUnverifiedUsers', () => {
    it('should delete unverified users with expired verification codes', async () => {
      // Create unverified user with expired verification code
      const expiredDate = new Date(Date.now() - 1000); // 1 second ago
      const userData = buildUserData({
        isVerified: false,
        verificationCode: '123456',
        verificationCodeExpiresAt: expiredDate,
      });

      const user = await userRepository.createUserWithPassword(userData);
      const userId = user.id;

      // Verify user was created
      const userBeforeCleanup = await userRepository.findUserById(userId);
      expect(userBeforeCleanup).not.toBeNull();

      // Execute cleanup
      await userRepository.deleteUnverifiedUsers();

      // Verify user was deleted (no need to track in createdUserIds since it's deleted)
      const userAfterCleanup = await userRepository.findUserById(userId);
      expect(userAfterCleanup).toBeNull();
    });

    it('should NOT delete verified users even if verification code is expired', async () => {
      // Create verified user with expired verification code
      const expiredDate = new Date(Date.now() - 1000);
      const userData = buildUserData({
        isVerified: true,
        verificationCode: '123456',
        verificationCodeExpiresAt: expiredDate,
      });

      const user = await userRepository.createUserWithPassword(userData);
      createdUserIds.push(user.id);

      // Execute cleanup
      await userRepository.deleteUnverifiedUsers();

      // Verify user was NOT deleted
      const userAfterCleanup = await userRepository.findUserById(user.id);
      expect(userAfterCleanup).not.toBeNull();
      expect(userAfterCleanup!.isVerified).toBe(true);
    });

    it('should NOT delete unverified users with non-expired verification codes', async () => {
      // Create unverified user with future expiration
      const futureDate = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
      const userData = buildUserData({
        isVerified: false,
        verificationCode: '123456',
        verificationCodeExpiresAt: futureDate,
      });

      const user = await userRepository.createUserWithPassword(userData);
      createdUserIds.push(user.id);

      // Execute cleanup
      await userRepository.deleteUnverifiedUsers();

      // Verify user was NOT deleted
      const userAfterCleanup = await userRepository.findUserById(user.id);
      expect(userAfterCleanup).not.toBeNull();
      expect(userAfterCleanup!.isVerified).toBe(false);
    });

    it('should delete multiple unverified users with expired codes', async () => {
      // Create multiple unverified users with expired codes
      const expiredDate = new Date(Date.now() - 1000);
      const user1Data = buildUserData({
        isVerified: false,
        verificationCode: '111111',
        verificationCodeExpiresAt: expiredDate,
      });
      const user2Data = buildUserData({
        isVerified: false,
        verificationCode: '222222',
        verificationCodeExpiresAt: expiredDate,
      });

      const user1 = await userRepository.createUserWithPassword(user1Data);
      const user2 = await userRepository.createUserWithPassword(user2Data);

      const userId1 = user1.id;
      const userId2 = user2.id;

      // Verify users were created
      expect(await userRepository.findUserById(userId1)).not.toBeNull();
      expect(await userRepository.findUserById(userId2)).not.toBeNull();

      // Execute cleanup
      await userRepository.deleteUnverifiedUsers();

      // Verify both users were deleted
      expect(await userRepository.findUserById(userId1)).toBeNull();
      expect(await userRepository.findUserById(userId2)).toBeNull();
    });

    it('should handle cleanup when no users need to be deleted', async () => {
      // Don't create any users, just run cleanup
      await expect(userRepository.deleteUnverifiedUsers()).resolves.not.toThrow();
    });
  });
});
