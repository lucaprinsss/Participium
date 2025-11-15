"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const connection_1 = require("@database/connection");
const userRepository_1 = require("@repositories/userRepository");
const userEntity_1 = require("@models/entity/userEntity");
const typeorm_1 = require("typeorm");
const random = () => Math.floor(Math.random() * 1000000);
const buildUserData = (overrides = {}) => ({
    username: `testuser_${random()}`,
    firstName: "Test",
    lastName: "User",
    email: `test.user.${random()}@example.com`,
    password: "securePass123",
    departmentRoleId: 1, // Citizen role
    emailNotificationsEnabled: true,
    ...overrides,
});
(0, globals_1.describe)('UserRepository Integration Tests', () => {
    // Array to track created user IDs for cleanup
    let createdUserIds = [];
    // Database setup
    (0, globals_1.beforeAll)(async () => {
        if (!connection_1.AppDataSource.isInitialized) {
            await connection_1.AppDataSource.initialize();
        }
    });
    // Final cleanup of all created users
    (0, globals_1.afterAll)(async () => {
        if (createdUserIds.length > 0) {
            const repository = connection_1.AppDataSource.getRepository(userEntity_1.userEntity);
            await repository.delete({ id: (0, typeorm_1.In)(createdUserIds) });
            createdUserIds = [];
        }
        if (connection_1.AppDataSource.isInitialized) {
            await connection_1.AppDataSource.destroy();
        }
    });
    // Cleanup after each test
    (0, globals_1.afterEach)(async () => {
        if (createdUserIds.length > 0) {
            const repository = connection_1.AppDataSource.getRepository(userEntity_1.userEntity);
            await repository.delete({ id: (0, typeorm_1.In)(createdUserIds) });
            createdUserIds = [];
        }
        globals_1.jest.restoreAllMocks();
    });
    // ---- SAVE ----
    (0, globals_1.describe)('save', () => {
        (0, globals_1.it)('should save changes to an existing user entity', async () => {
            const newUser = await userRepository_1.userRepository.createUserWithPassword(buildUserData());
            createdUserIds.push(newUser.id);
            newUser.firstName = 'ManuallyUpdated';
            const savedUser = await userRepository_1.userRepository.save(newUser);
            (0, globals_1.expect)(savedUser.id).toBe(newUser.id);
            (0, globals_1.expect)(savedUser.firstName).toBe('ManuallyUpdated');
            const dbUser = await userRepository_1.userRepository.findUserById(newUser.id);
            (0, globals_1.expect)(dbUser?.firstName).toBe('ManuallyUpdated');
        });
    });
    // ---- CREATE USER -----
    (0, globals_1.describe)('createUserWithPassword', () => {
        (0, globals_1.it)('should create a new user with hashed password', async () => {
            const newUser = buildUserData();
            const savedUser = await userRepository_1.userRepository.createUserWithPassword(newUser);
            createdUserIds.push(savedUser.id);
            (0, globals_1.expect)(savedUser).toBeDefined();
            (0, globals_1.expect)(savedUser.id).toBeGreaterThan(0);
            (0, globals_1.expect)(savedUser.username).toBe(newUser.username);
            (0, globals_1.expect)(savedUser.firstName).toBe(newUser.firstName);
            (0, globals_1.expect)(savedUser.lastName).toBe(newUser.lastName);
            (0, globals_1.expect)(savedUser.email).toBe(newUser.email);
            (0, globals_1.expect)(savedUser.passwordHash).toBeDefined();
            (0, globals_1.expect)(savedUser.passwordHash).not.toContain(newUser.password);
            (0, globals_1.expect)(savedUser.departmentRoleId).toBe(1);
            (0, globals_1.expect)(savedUser.emailNotificationsEnabled).toBe(true);
            (0, globals_1.expect)(savedUser.createdAt).toBeInstanceOf(Date);
        });
        (0, globals_1.it)('should not allow duplicate username', async () => {
            const dynamicUsername = `duplicateUser_${random()}`;
            const newUser = buildUserData({ username: dynamicUsername });
            const savedUser = await userRepository_1.userRepository.createUserWithPassword(newUser);
            createdUserIds.push(savedUser.id);
            const duplicate = { ...buildUserData(), username: dynamicUsername };
            await (0, globals_1.expect)(userRepository_1.userRepository.createUserWithPassword(duplicate)).rejects.toThrow();
        });
        (0, globals_1.it)('should not allow duplicate email', async () => {
            const dynamicEmail = `duplicate_${random()}@example.com`;
            const newUser = buildUserData({ email: dynamicEmail });
            const savedUser = await userRepository_1.userRepository.createUserWithPassword(newUser);
            createdUserIds.push(savedUser.id);
            const duplicate = { ...buildUserData(), email: dynamicEmail };
            await (0, globals_1.expect)(userRepository_1.userRepository.createUserWithPassword(duplicate)).rejects.toThrow();
        });
        const requiredFields = ['username', 'firstName', 'lastName', 'email', 'password'];
        for (const field of requiredFields) {
            (0, globals_1.it)(`should throw when ${field} is missing`, async () => {
                const user = buildUserData();
                delete user[field];
                await (0, globals_1.expect)(userRepository_1.userRepository.createUserWithPassword(user)).rejects.toThrow();
            });
        }
    });
    // ---- FIND BY ID ----
    (0, globals_1.describe)('findUserById', () => {
        (0, globals_1.it)('should return user for valid ID', async () => {
            const newUser = await userRepository_1.userRepository.createUserWithPassword(buildUserData());
            createdUserIds.push(newUser.id);
            const savedUser = await userRepository_1.userRepository.findUserById(newUser.id);
            (0, globals_1.expect)(savedUser).not.toBeNull();
            (0, globals_1.expect)(savedUser?.id).toBe(newUser.id);
        });
        (0, globals_1.it)('should return null for non-existent ID', async () => {
            const savedUser = await userRepository_1.userRepository.findUserById(9999999);
            (0, globals_1.expect)(savedUser).toBeNull();
        });
        (0, globals_1.it)('should handle invalid ID type gracefully', async () => {
            await (0, globals_1.expect)(userRepository_1.userRepository.findUserById("invalid")).rejects.toThrow();
        });
    });
    // ---- FIND BY USERNAME ----
    (0, globals_1.describe)('findUserByUsername', () => {
        (0, globals_1.it)('should return user for valid username', async () => {
            const user = await userRepository_1.userRepository.createUserWithPassword(buildUserData({ username: `finduser_${random()}` }));
            createdUserIds.push(user.id);
            const savedUser = await userRepository_1.userRepository.findUserByUsername(user.username);
            (0, globals_1.expect)(savedUser).not.toBeNull();
            (0, globals_1.expect)(savedUser?.username).toBe(user.username);
        });
        (0, globals_1.it)('should return null for unknown username', async () => {
            const savedUser = await userRepository_1.userRepository.findUserByUsername('unknownuser');
            (0, globals_1.expect)(savedUser).toBeNull();
        });
        (0, globals_1.it)('should return null for missing username', async () => {
            const savedUser = await userRepository_1.userRepository.findUserByUsername(undefined);
            (0, globals_1.expect)(savedUser).toBeNull();
        });
    });
    // ---- FIND BY EMAIL ----
    (0, globals_1.describe)('findUserByEmail', () => {
        (0, globals_1.it)('should return user for valid email', async () => {
            const newUser = await userRepository_1.userRepository.createUserWithPassword(buildUserData({ email: `emailtest_${random()}@example.com` }));
            createdUserIds.push(newUser.id);
            const savedUser = await userRepository_1.userRepository.findUserByEmail(newUser.email);
            (0, globals_1.expect)(savedUser).not.toBeNull();
            (0, globals_1.expect)(savedUser?.email).toBe(newUser.email);
        });
        (0, globals_1.it)('should return null for non-existent email', async () => {
            const savedUser = await userRepository_1.userRepository.findUserByEmail('no@none.com');
            (0, globals_1.expect)(savedUser).toBeNull();
        });
        (0, globals_1.it)('should return null for invalid email type', async () => {
            const savedUser = await userRepository_1.userRepository.findUserByEmail(12345);
            (0, globals_1.expect)(savedUser).toBeNull();
        });
    });
    // ---- EXISTS BY USERNAME ----
    (0, globals_1.describe)('existsUserByUsername', () => {
        (0, globals_1.it)('should return true if username exists', async () => {
            const newUser = await userRepository_1.userRepository.createUserWithPassword(buildUserData({ username: `existuser_${random()}` }));
            createdUserIds.push(newUser.id);
            const exist = await userRepository_1.userRepository.existsUserByUsername(newUser.username);
            (0, globals_1.expect)(exist).toBe(true);
        });
        (0, globals_1.it)('should return false if username does not exist', async () => {
            const exists = await userRepository_1.userRepository.existsUserByUsername('missinguser');
            (0, globals_1.expect)(exists).toBe(false);
        });
    });
    // ---- EXISTS BY EMAIL ----
    (0, globals_1.describe)('existsUserByEmail', () => {
        (0, globals_1.it)('should return true if email exists', async () => {
            const newUser = await userRepository_1.userRepository.createUserWithPassword(buildUserData({ email: `exists_${random()}@example.com` }));
            createdUserIds.push(newUser.id);
            const exists = await userRepository_1.userRepository.existsUserByEmail(newUser.email);
            (0, globals_1.expect)(exists).toBe(true);
        });
        (0, globals_1.it)('should return false if email does not exist', async () => {
            const exists = await userRepository_1.userRepository.existsUserByEmail('none@example.com');
            (0, globals_1.expect)(exists).toBe(false);
        });
    });
    // ---- VERIFY CREDENTIALS ----
    (0, globals_1.describe)('verifyCredentials', () => {
        (0, globals_1.it)('should verify valid username/password', async () => {
            const data = buildUserData({ username: `loginuser_${random()}`, password: 'validpass' });
            const newUser = await userRepository_1.userRepository.createUserWithPassword(data);
            createdUserIds.push(newUser.id);
            const verified = await userRepository_1.userRepository.verifyCredentials(data.username, 'validpass');
            (0, globals_1.expect)(verified).not.toBeNull();
            (0, globals_1.expect)(verified?.username).toBe(data.username);
        });
        (0, globals_1.it)('should return null for wrong password', async () => {
            const data = buildUserData({ username: `wrongpass_${random()}`, password: 'correctpass' });
            const newUser = await userRepository_1.userRepository.createUserWithPassword(data);
            createdUserIds.push(newUser.id);
            const verified = await userRepository_1.userRepository.verifyCredentials(data.username, 'badpass');
            (0, globals_1.expect)(verified).toBeNull();
        });
        (0, globals_1.it)('should return null for non-existent username', async () => {
            const verified = await userRepository_1.userRepository.verifyCredentials('nouser', 'password123');
            (0, globals_1.expect)(verified).toBeNull();
        });
        (0, globals_1.it)('should return null if passwordHash is malformed (no colon)', async () => {
            const data = buildUserData();
            const user = await userRepository_1.userRepository.createUserWithPassword(data);
            createdUserIds.push(user.id);
            user.passwordHash = 'justahashnofsalt';
            await userRepository_1.userRepository.save(user);
            const verified = await userRepository_1.userRepository.verifyCredentials(data.username, data.password);
            (0, globals_1.expect)(verified).toBeNull();
        });
    });
    // ---- UPDATE USER ----
    (0, globals_1.describe)('updateUser', () => {
        (0, globals_1.it)('should update an existing user', async () => {
            const user = await userRepository_1.userRepository.createUserWithPassword(buildUserData());
            createdUserIds.push(user.id);
            const updatedUser = await userRepository_1.userRepository.updateUser(user.id, { firstName: 'UpdatedName' });
            (0, globals_1.expect)(updatedUser.id).toBe(user.id);
            (0, globals_1.expect)(updatedUser.firstName).toBe('UpdatedName');
            (0, globals_1.expect)(updatedUser.lastName).toBe(user.lastName);
        });
        (0, globals_1.it)('should throw if user not found after update (internal state error)', async () => {
            const user = await userRepository_1.userRepository.createUserWithPassword(buildUserData());
            createdUserIds.push(user.id);
            globals_1.jest.spyOn(userRepository_1.userRepository, 'findUserById').mockResolvedValue(null);
            await (0, globals_1.expect)(userRepository_1.userRepository.updateUser(user.id, { firstName: 'NewName' })).rejects.toThrow('User not found after update');
            (0, globals_1.expect)(userRepository_1.userRepository.findUserById).toHaveBeenCalledWith(user.id);
        });
    });
    // ---- DELETE USER ----
    (0, globals_1.describe)('deleteUser', () => {
        (0, globals_1.it)('should delete an existing user', async () => {
            const user = await userRepository_1.userRepository.createUserWithPassword(buildUserData());
            const id = user.id;
            await userRepository_1.userRepository.deleteUser(id);
            const deletedUser = await userRepository_1.userRepository.findUserById(id);
            (0, globals_1.expect)(deletedUser).toBeNull();
        });
        (0, globals_1.it)('should throw an error when deleting a non-existent user', async () => {
            await (0, globals_1.expect)(userRepository_1.userRepository.deleteUser(9999999)).rejects.toThrow('User not found');
        });
    });
    // ---- FIND ALL USERS ----
    (0, globals_1.describe)('findAllUsers', () => {
        (0, globals_1.it)('should return an array of all users', async () => {
            const user1 = await userRepository_1.userRepository.createUserWithPassword(buildUserData());
            const user2 = await userRepository_1.userRepository.createUserWithPassword(buildUserData());
            createdUserIds.push(user1.id, user2.id);
            const users = await userRepository_1.userRepository.findAllUsers();
            (0, globals_1.expect)(users).toBeInstanceOf(Array);
            (0, globals_1.expect)(users.length).toBeGreaterThanOrEqual(2);
            (0, globals_1.expect)(users.map(u => u.id)).toContain(user1.id);
            (0, globals_1.expect)(users.map(u => u.id)).toContain(user2.id);
        });
        (0, globals_1.it)('should return users matching a where clause', async () => {
            const specificUsername = `findme_${random()}`;
            const user1 = await userRepository_1.userRepository.createUserWithPassword(buildUserData({ username: specificUsername }));
            const user2 = await userRepository_1.userRepository.createUserWithPassword(buildUserData());
            createdUserIds.push(user1.id, user2.id);
            const users = await userRepository_1.userRepository.findAllUsers({ where: { username: specificUsername } });
            (0, globals_1.expect)(users.length).toBe(1);
            (0, globals_1.expect)(users[0].username).toBe(specificUsername);
        });
    });
});
