"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const supertest_1 = __importDefault(require("supertest"));
const connection_1 = require("@database/connection");
const app_1 = __importDefault(require("../../../app"));
const userEntity_1 = require("@models/entity/userEntity");
const userRepository_1 = require("@repositories/userRepository");
const typeorm_1 = require("typeorm");
const r = () => `_${Math.floor(Math.random() * 1000000)}`;
let TEST_USER_CREDENTIALS;
(0, globals_1.describe)('AuthController Integration Tests', () => {
    let agent;
    let createdUserIds = [];
    // Setup database connection
    (0, globals_1.beforeAll)(async () => {
        if (!connection_1.AppDataSource.isInitialized) {
            await connection_1.AppDataSource.initialize();
        }
    });
    // Final cleanup: Delete all created users
    (0, globals_1.afterAll)(async () => {
        if (createdUserIds.length > 0) {
            await connection_1.AppDataSource.getRepository(userEntity_1.userEntity).delete({ id: (0, typeorm_1.In)(createdUserIds) });
            createdUserIds = [];
        }
        if (connection_1.AppDataSource.isInitialized) {
            await connection_1.AppDataSource.destroy();
        }
    });
    // Cleanup after each test: Delete the user created in beforeEach
    (0, globals_1.afterEach)(async () => {
        if (createdUserIds.length > 0) {
            const repository = connection_1.AppDataSource.getRepository(userEntity_1.userEntity);
            await repository.delete({ id: (0, typeorm_1.In)(createdUserIds) });
            createdUserIds = [];
        }
        jest.restoreAllMocks();
    });
    // Setup before each test: Create a test user and an agent
    (0, globals_1.beforeEach)(async () => {
        TEST_USER_CREDENTIALS = {
            username: `auth_test_user${r()}`,
            password: 'Password123!',
            email: `auth${r()}@test.com`,
            firstName: 'Auth',
            lastName: 'Test',
            role: 'Citizen'
        };
        const user = await userRepository_1.userRepository.createUserWithPassword({
            ...TEST_USER_CREDENTIALS,
            emailNotificationsEnabled: true
        });
        createdUserIds.push(user.id);
        agent = supertest_1.default.agent(app_1.default);
    });
    // --- POST /api/sessions (Login) 
    (0, globals_1.describe)('POST /api/sessions', () => {
        (0, globals_1.it)('should login successfully with valid credentials and return user data (200)', async () => {
            const response = await agent
                .post('/api/sessions')
                .send({
                username: TEST_USER_CREDENTIALS.username,
                password: TEST_USER_CREDENTIALS.password,
            });
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body.username).toBe(TEST_USER_CREDENTIALS.username);
            (0, globals_1.expect)(response.body.password).toBeUndefined();
            (0, globals_1.expect)(response.headers['set-cookie']).toBeDefined();
        });
        (0, globals_1.it)('should fail login with invalid password (401)', async () => {
            const response = await agent
                .post('/api/sessions')
                .send({
                username: TEST_USER_CREDENTIALS.username,
                password: 'WrongPassword!',
            });
            (0, globals_1.expect)(response.status).toBe(401);
            (0, globals_1.expect)(response.body).toEqual({
                code: 401,
                message: 'Invalid credentials',
                name: 'UnauthorizedError',
            });
        });
        (0, globals_1.it)('should fail login with non-existent user (401)', async () => {
            const response = await agent
                .post('/api/sessions')
                .send({
                username: 'nonexistent_user',
                password: 'Password123!',
            });
            (0, globals_1.expect)(response.status).toBe(401);
            (0, globals_1.expect)(response.body).toEqual({
                code: 401,
                message: 'Invalid credentials',
                name: 'UnauthorizedError',
            });
        });
        (0, globals_1.it)('internal server error during login should return 500', async () => {
            const mockError = new Error('Internal server error');
            jest.spyOn(userRepository_1.userRepository, 'findUserByUsername').mockRejectedValue(mockError);
            const response = await agent
                .post('/api/sessions')
                .send({
                username: TEST_USER_CREDENTIALS.username,
                password: TEST_USER_CREDENTIALS.password,
            });
            (0, globals_1.expect)(response.status).toBe(500);
            (0, globals_1.expect)(response.text).toContain(mockError.message);
        });
    });
    // --- GET /api/sessions/current (Get Current User) 
    (0, globals_1.describe)('GET /api/sessions/current', () => {
        (0, globals_1.it)('should fail if not authenticated (401)', async () => {
            const response = await agent.get('/api/sessions/current');
            (0, globals_1.expect)(response.status).toBe(401);
            (0, globals_1.expect)(response.body).toHaveProperty('message', 'Not authenticated');
            (0, globals_1.expect)(response.body).toHaveProperty('name', 'UnauthorizedError');
        });
        (0, globals_1.it)('should return current user if authenticated (200)', async () => {
            await agent
                .post('/api/sessions')
                .send({
                username: TEST_USER_CREDENTIALS.username,
                password: TEST_USER_CREDENTIALS.password,
            });
            const response = await agent.get('/api/sessions/current');
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body.username).toBe(TEST_USER_CREDENTIALS.username);
        });
        (0, globals_1.it)('should return 500 if error occurs while fetching current user', async () => {
            await agent
                .post('/api/sessions')
                .send({
                username: TEST_USER_CREDENTIALS.username,
                password: TEST_USER_CREDENTIALS.password,
            });
            const mockError = new Error('Internal server error');
            jest.spyOn(userRepository_1.userRepository, 'findUserById').mockRejectedValue(mockError);
            const response = await agent.get('/api/sessions/current');
            (0, globals_1.expect)(response.status).toBe(500);
            (0, globals_1.expect)(response.text).toContain(mockError.message);
        });
    });
    // --- DELETE /api/sessions/current (Logout) 
    (0, globals_1.describe)('DELETE /api/sessions/current', () => {
        (0, globals_1.it)('should fail if not authenticated (401)', async () => {
            const response = await agent.delete('/api/sessions/current');
            (0, globals_1.expect)(response.status).toBe(401);
            (0, globals_1.expect)(response.body).toHaveProperty('message', 'Not authenticated');
            (0, globals_1.expect)(response.body).toHaveProperty('name', 'UnauthorizedError');
        });
        (0, globals_1.it)('should logout successfully if authenticated (200) and destroy session', async () => {
            await agent
                .post('/api/sessions')
                .send({
                username: TEST_USER_CREDENTIALS.username,
                password: TEST_USER_CREDENTIALS.password,
            });
            const logoutResponse = await agent.delete('/api/sessions/current');
            (0, globals_1.expect)(logoutResponse.status).toBe(200);
            (0, globals_1.expect)(logoutResponse.body.message).toBe('Logged out successfully');
            const afterLogoutResponse = await agent.get('/api/sessions/current');
            (0, globals_1.expect)(afterLogoutResponse.status).toBe(401);
            (0, globals_1.expect)(afterLogoutResponse.body).toHaveProperty('message', 'Not authenticated');
        });
        (0, globals_1.it)('should return 500 if error occurs during logout', async () => {
            await agent
                .post('/api/sessions')
                .send({
                username: TEST_USER_CREDENTIALS.username,
                password: TEST_USER_CREDENTIALS.password,
            });
            const mockError = new Error('Internal server error');
            jest.spyOn(userRepository_1.userRepository, 'findUserById').mockRejectedValue(mockError);
            const response = await agent.delete('/api/sessions/current');
            (0, globals_1.expect)(response.status).toBe(500);
            (0, globals_1.expect)(response.text).toContain(mockError.message);
        });
    });
});
