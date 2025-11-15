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
const typeorm_1 = require("typeorm");
const random = () => Math.floor(Math.random() * 1000000);
const buildRegisterPayload = (overrides = {}) => ({
    username: `citizen_${random()}`,
    first_name: "Test",
    last_name: "Citizen",
    email: `citizen.${random()}@example.com`,
    password: "securePassword123!",
    ...overrides,
});
(0, globals_1.describe)('UserController Integration Tests', () => {
    // Arrat to track created users for cleanup
    let createdUserIds = [];
    // Setup before all tests
    (0, globals_1.beforeAll)(async () => {
        if (!connection_1.AppDataSource.isInitialized) {
            await connection_1.AppDataSource.initialize();
        }
    });
    // Cleanup after all tests
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
    });
    // ---- POST /api/users (Registrazione) -----
    (0, globals_1.describe)('POST /api/users', () => {
        (0, globals_1.it)('should register a new citizen successfully (201)', async () => {
            const newCitizenData = buildRegisterPayload();
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/users')
                .send(newCitizenData);
            (0, globals_1.expect)(response.status).toBe(201);
            (0, globals_1.expect)(response.body).toBeDefined();
            (0, globals_1.expect)(response.body.id).toBeGreaterThan(0);
            createdUserIds.push(response.body.id);
            (0, globals_1.expect)(response.body.username).toBe(newCitizenData.username);
            (0, globals_1.expect)(response.body.email).toBe(newCitizenData.email);
            (0, globals_1.expect)(response.body.first_name).toBe(newCitizenData.first_name);
            (0, globals_1.expect)(response.body.last_name).toBe(newCitizenData.last_name);
            (0, globals_1.expect)(response.body.role).toBe('Citizen');
            (0, globals_1.expect)(response.body.password).toBeUndefined();
            (0, globals_1.expect)(response.body.passwordHash).toBeUndefined();
            const dbUser = await connection_1.AppDataSource.getRepository(userEntity_1.userEntity).findOneBy({ id: response.body.id });
            (0, globals_1.expect)(dbUser).not.toBeNull();
            (0, globals_1.expect)(dbUser?.username).toBe(newCitizenData.username);
        });
        (0, globals_1.it)('should return 400 if required fields are missing', async () => {
            const baseData = buildRegisterPayload();
            const requiredFields = ['username', 'email', 'password', 'first_name', 'last_name'];
            for (const field of requiredFields) {
                const invalidData = { ...baseData };
                delete invalidData[field];
                const response = await (0, supertest_1.default)(app_1.default)
                    .post('/api/users')
                    .send(invalidData);
                (0, globals_1.expect)(response.status).toBe(400);
                (0, globals_1.expect)(response.body.message || response.body.error).toContain('All fields are required: username, email, password, first_name, last_name');
            }
        });
        (0, globals_1.it)('should return 400 for an empty body', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/users')
                .send({});
            (0, globals_1.expect)(response.status).toBe(400);
            (0, globals_1.expect)(response.body.message || response.body.error).toBe('All fields are required: username, email, password, first_name, last_name');
        });
        (0, globals_1.it)('should return 409 if username already exists', async () => {
            const dynamicUsername = `duplicateUser_${random()}`;
            const existingUserData = buildRegisterPayload({ username: dynamicUsername });
            const res1 = await (0, supertest_1.default)(app_1.default)
                .post('/api/users')
                .send(existingUserData);
            (0, globals_1.expect)(res1.status).toBe(201);
            createdUserIds.push(res1.body.id);
            const newUserData = buildRegisterPayload({ username: dynamicUsername });
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/users')
                .send(newUserData);
            (0, globals_1.expect)(response.status).toBe(409);
            (0, globals_1.expect)(response.body.message || response.body.error).toBe('Username already exists');
        });
        (0, globals_1.it)('should return 409 if email already exists', async () => {
            const dynamicEmail = `duplicate_${random()}@example.com`;
            const existingUserData = buildRegisterPayload({ email: dynamicEmail });
            const res1 = await (0, supertest_1.default)(app_1.default)
                .post('/api/users')
                .send(existingUserData);
            (0, globals_1.expect)(res1.status).toBe(201);
            createdUserIds.push(res1.body.id);
            const newUserData = buildRegisterPayload({ email: dynamicEmail });
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/users')
                .send(newUserData);
            (0, globals_1.expect)(response.status).toBe(409);
            (0, globals_1.expect)(response.body.message || response.body.error).toBe('Email already exists');
        });
    });
});
