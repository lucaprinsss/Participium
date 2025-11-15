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
const roleUtils_1 = require("@utils/roleUtils");
const typeorm_1 = require("typeorm");
const municipalityUserService_1 = require("@services/municipalityUserService");
const r = () => `_${Math.floor(Math.random() * 1000000)}`;
let ADMIN_CREDENTIALS;
let CITIZEN_CREDENTIALS;
let EMPLOYEE_PAYLOAD;
let createdEmployee;
let createdAdmin;
let createdCitizen;
let createdUserIds = [];
(0, globals_1.describe)('MunicipalityUserController Integration Tests', () => {
    let adminAgent;
    let citizenAgent;
    (0, globals_1.beforeAll)(async () => {
        if (!connection_1.AppDataSource.isInitialized) {
            await connection_1.AppDataSource.initialize();
        }
    });
    (0, globals_1.afterAll)(async () => {
        if (createdUserIds.length > 0) {
            await connection_1.AppDataSource.getRepository(userEntity_1.userEntity).delete({ id: (0, typeorm_1.In)(createdUserIds) });
        }
        if (connection_1.AppDataSource.isInitialized) {
            await connection_1.AppDataSource.destroy();
        }
    });
    (0, globals_1.beforeEach)(async () => {
        ADMIN_CREDENTIALS = {
            username: `admin_user${r()}`,
            password: 'AdminPassword123!',
            email: `admin${r()}@test.com`,
            firstName: 'Admin',
            lastName: 'User',
            role: 'Administrator'
        };
        CITIZEN_CREDENTIALS = {
            username: `citizen_user${r()}`,
            password: 'CitizenPassword123!',
            email: `citizen${r()}@test.com`,
            firstName: 'Citizen',
            lastName: 'User',
            role: 'Citizen'
        };
        EMPLOYEE_PAYLOAD = {
            username: `employee_user${r()}`,
            password: 'EmployeePassword123!',
            email: `employee${r()}@test.com`,
            first_name: 'Employee',
            last_name: 'User',
            role: 'Technical Office Staff Member'
        };
        createdAdmin = await userRepository_1.userRepository.createUserWithPassword({
            ...ADMIN_CREDENTIALS,
            emailNotificationsEnabled: true
        });
        createdCitizen = await userRepository_1.userRepository.createUserWithPassword({
            ...CITIZEN_CREDENTIALS,
            emailNotificationsEnabled: true
        });
        createdEmployee = await userRepository_1.userRepository.createUserWithPassword({
            username: EMPLOYEE_PAYLOAD.username,
            password: EMPLOYEE_PAYLOAD.password,
            email: EMPLOYEE_PAYLOAD.email,
            firstName: EMPLOYEE_PAYLOAD.first_name,
            lastName: EMPLOYEE_PAYLOAD.last_name,
            departmentRoleId: 3, // Technical Office Staff Member or similar municipality role
            emailNotificationsEnabled: true
        });
        createdUserIds.push(createdAdmin.id, createdCitizen.id, createdEmployee.id);
        adminAgent = supertest_1.default.agent(app_1.default);
        citizenAgent = supertest_1.default.agent(app_1.default);
        await adminAgent.post('/api/sessions').send({
            username: ADMIN_CREDENTIALS.username,
            password: ADMIN_CREDENTIALS.password
        });
        await citizenAgent.post('/api/sessions').send({
            username: CITIZEN_CREDENTIALS.username,
            password: CITIZEN_CREDENTIALS.password
        });
    });
    (0, globals_1.afterEach)(async () => {
        if (createdUserIds.length > 0) {
            const repository = connection_1.AppDataSource.getRepository(userEntity_1.userEntity);
            await repository.delete({ id: (0, typeorm_1.In)(createdUserIds) });
            createdUserIds = [];
        }
        adminAgent = null;
        citizenAgent = null;
        createdEmployee = null;
        createdAdmin = null;
        createdCitizen = null;
        globals_1.jest.restoreAllMocks();
    });
    // --- POST /api/municipality/users (Create User) --------------------
    (0, globals_1.describe)('POST /api/municipality/users (Create User)', () => {
        (0, globals_1.it)('should fail if not authenticated (401)', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/municipality/users')
                .send(EMPLOYEE_PAYLOAD);
            (0, globals_1.expect)(response.status).toBe(401);
        });
        (0, globals_1.it)('should fail if authenticated as Citizen (403)', async () => {
            const response = await citizenAgent
                .post('/api/municipality/users')
                .send(EMPLOYEE_PAYLOAD);
            (0, globals_1.expect)(response.status).toBe(403);
        });
        (0, globals_1.it)('should create a new user if authenticated as Admin (201)', async () => {
            const newUserData = {
                ...EMPLOYEE_PAYLOAD,
                username: `new_employee${r()}`,
                email: `new${r()}@employee.com`
            };
            const response = await adminAgent
                .post('/api/municipality/users')
                .send(newUserData);
            (0, globals_1.expect)(response.status).toBe(201);
            (0, globals_1.expect)(response.body.username).toBe(newUserData.username);
            createdUserIds.push(response.body.id);
        });
        (0, globals_1.it)('should return 400 for missing fields', async () => {
            const response = await adminAgent
                .post('/api/municipality/users')
                .send({ username: 'test' });
            (0, globals_1.expect)(response.status).toBe(400);
        });
        (0, globals_1.it)('should return 400 when trying to create a user with CITIZEN role', async () => {
            const citizenPayload = { ...EMPLOYEE_PAYLOAD, role: 'Citizen', username: `fail_citizen_${r()}`, email: `fail_citizen_${r()}@test.com` };
            const response = await adminAgent
                .post('/api/municipality/users')
                .send(citizenPayload);
            (0, globals_1.expect)(response.status).toBe(400);
        });
        (0, globals_1.it)('should return 400 when trying to create a user with ADMINISTRATOR role ', async () => {
            const adminPayload = { ...EMPLOYEE_PAYLOAD, role: 'Administrator', username: `fail_admin_${r()}`, email: `fail_admin_${r()}@test.com` };
            const response = await adminAgent
                .post('/api/municipality/users')
                .send(adminPayload);
            (0, globals_1.expect)(response.status).toBe(400);
        });
        (0, globals_1.it)('should return 409 if username already exists', async () => {
            const conflictPayload = {
                ...EMPLOYEE_PAYLOAD,
                email: `new_${r()}@test.com`,
                username: createdEmployee.username
            };
            const response = await adminAgent
                .post('/api/municipality/users')
                .send(conflictPayload);
            (0, globals_1.expect)(response.status).toBe(409);
            (0, globals_1.expect)(response.body.message || response.body.error).toBe('Username already exists');
        });
        (0, globals_1.it)('should return 409 if email already exists', async () => {
            const conflictPayload = {
                ...EMPLOYEE_PAYLOAD,
                username: `new_${r()}`,
                email: createdEmployee.email
            };
            const response = await adminAgent
                .post('/api/municipality/users')
                .send(conflictPayload);
            (0, globals_1.expect)(response.status).toBe(409);
            (0, globals_1.expect)(response.body.message || response.body.error).toBe('Email already exists');
        });
        (0, globals_1.it)('should return 500 if the service throws an unexpected error', async () => {
            const mockError = new Error('Internal server error');
            globals_1.jest.spyOn(municipalityUserService_1.municipalityUserService, 'createMunicipalityUser').mockRejectedValue(mockError);
            const response = await adminAgent
                .post('/api/municipality/users')
                .send(EMPLOYEE_PAYLOAD);
            (0, globals_1.expect)(response.status).toBe(500);
            (0, globals_1.expect)(response.body.message || response.body.error).toBe(mockError.message);
        });
    });
    // --- GET /api/municipality/users (Get All Users) -------------------
    (0, globals_1.describe)('GET /api/municipality/users (Get All Users)', () => {
        (0, globals_1.it)('should fail if not authenticated (401)', async () => {
            const response = await (0, supertest_1.default)(app_1.default).get('/api/municipality/users');
            (0, globals_1.expect)(response.status).toBe(401);
        });
        (0, globals_1.it)('should fail if authenticated as Citizen (403)', async () => {
            const response = await citizenAgent.get('/api/municipality/users');
            (0, globals_1.expect)(response.status).toBe(403);
        });
        (0, globals_1.it)('should return a list of users if authenticated as Admin (200)', async () => {
            const response = await adminAgent.get('/api/municipality/users');
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body).toBeInstanceOf(Array);
            (0, globals_1.expect)(response.body.some((user) => user.id === createdEmployee.id)).toBe(true);
            (0, globals_1.expect)(response.body.some((user) => user.id === createdCitizen.id)).toBe(false);
        });
        (0, globals_1.it)('should return 500 if the service throws an unexpected error', async () => {
            const mockError = new Error('Internal server error');
            globals_1.jest.spyOn(municipalityUserService_1.municipalityUserService, 'getAllMunicipalityUsers').mockRejectedValue(mockError);
            const response = await adminAgent.get('/api/municipality/users');
            (0, globals_1.expect)(response.status).toBe(500);
        });
    });
    // --- GET /api/municipality/users/:id (Get User By ID) --------------
    (0, globals_1.describe)('GET /api/municipality/users/:id (Get User By ID)', () => {
        (0, globals_1.it)('should fail if not authenticated (401)', async () => {
            const response = await (0, supertest_1.default)(app_1.default).get(`/api/municipality/users/${createdEmployee.id}`);
            (0, globals_1.expect)(response.status).toBe(401);
        });
        (0, globals_1.it)('should return the user if authenticated as Admin (200)', async () => {
            const response = await adminAgent.get(`/api/municipality/users/${createdEmployee.id}`);
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body.id).toBe(createdEmployee.id);
        });
        (0, globals_1.it)('should fail if authenticated as Citizen (403)', async () => {
            const response = await citizenAgent.get(`/api/municipality/users/${createdEmployee.id}`);
            (0, globals_1.expect)(response.status).toBe(403);
        });
        (0, globals_1.it)('should return 404 for a non-existent user ID', async () => {
            const nonExistentId = 9999999;
            const response = await adminAgent.get(`/api/municipality/users/${nonExistentId}`);
            (0, globals_1.expect)(response.status).toBe(404);
        });
        (0, globals_1.it)('should return 400 for an invalid user ID format', async () => {
            const response = await adminAgent.get('/api/municipality/users/abc');
            (0, globals_1.expect)(response.status).toBe(400);
        });
        (0, globals_1.it)('should return 500 if the service throws an unexpected error', async () => {
            const mockError = new Error('Forced DB Error');
            globals_1.jest.spyOn(municipalityUserService_1.municipalityUserService, 'getMunicipalityUserById').mockRejectedValue(mockError);
            const response = await adminAgent.get(`/api/municipality/users/${createdEmployee.id}`);
            (0, globals_1.expect)(response.status).toBe(500);
        });
        (0, globals_1.it)('should return 404 if user found is a CITIZEN', async () => {
            const response = await adminAgent.get(`/api/municipality/users/${createdCitizen.id}`);
            (0, globals_1.expect)(response.status).toBe(404);
            (0, globals_1.expect)(response.body.message || response.body.error).toBe('Municipality user not found');
        });
    });
    // --- PUT /api/municipality/users/:id (Update User) -----------------
    (0, globals_1.describe)('PUT /api/municipality/users/:id (Update User)', () => {
        const updatePayload = { first_name: 'UpdatedName' };
        (0, globals_1.it)('should fail if not authenticated (401)', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .put(`/api/municipality/users/${createdEmployee.id}`)
                .send(updatePayload);
            (0, globals_1.expect)(response.status).toBe(401);
        });
        (0, globals_1.it)('should update the user if authenticated as Admin (200)', async () => {
            const response = await adminAgent
                .put(`/api/municipality/users/${createdEmployee.id}`)
                .send(updatePayload);
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body.first_name).toBe('UpdatedName');
        });
        (0, globals_1.it)('should return 404 for a non-existent user ID', async () => {
            const nonExistentId = 9999999;
            const response = await adminAgent
                .put(`/api/municipality/users/${nonExistentId}`)
                .send(updatePayload);
            (0, globals_1.expect)(response.status).toBe(404);
        });
        (0, globals_1.it)('should return 403 if authenticated as Citizen', async () => {
            const response = await citizenAgent
                .put(`/api/municipality/users/${createdEmployee.id}`)
                .send(updatePayload);
            (0, globals_1.expect)(response.status).toBe(403);
        });
        (0, globals_1.it)('should return 400 for an invalid user ID format', async () => {
            const response = await adminAgent
                .put('/api/municipality/users/abc')
                .send(updatePayload);
            (0, globals_1.expect)(response.status).toBe(400);
        });
        (0, globals_1.it)('should return 400 if no update fields are provided', async () => {
            const response = await adminAgent
                .put(`/api/municipality/users/${createdEmployee.id}`)
                .send({});
            (0, globals_1.expect)(response.status).toBe(400);
        });
        (0, globals_1.it)('should return 400 when trying to update a CITIZEN user', async () => {
            const response = await adminAgent
                .put(`/api/municipality/users/${createdCitizen.id}`)
                .send({ first_name: 'NewName' });
            (0, globals_1.expect)(response.status).toBe(400);
        });
        (0, globals_1.it)('should return 400 when trying to change a role to CITIZEN', async () => {
            const response = await adminAgent
                .put(`/api/municipality/users/${createdEmployee.id}`)
                .send({ role: 'Citizen' });
            (0, globals_1.expect)(response.status).toBe(400);
        });
        (0, globals_1.it)('should return 409 when updating email to an existing one', async () => {
            const response = await adminAgent
                .put(`/api/municipality/users/${createdEmployee.id}`)
                .send({ email: createdCitizen.email });
            (0, globals_1.expect)(response.status).toBe(409);
            (0, globals_1.expect)(response.body.message || response.body.error).toBe('Email already exists');
        });
        (0, globals_1.it)('should return 500 if the service throws an unexpected error during update', async () => {
            const mockError = new Error('Forced Update Error');
            globals_1.jest.spyOn(userRepository_1.userRepository, 'updateUser').mockRejectedValue(mockError);
            const response = await adminAgent
                .put(`/api/municipality/users/${createdEmployee.id}`)
                .send({ first_name: 'ErrorTest' });
            (0, globals_1.expect)(response.status).toBe(500);
        });
    });
    // --- PUT /api/municipality/users/:id/role (Assign Role) ------------
    (0, globals_1.describe)('PUT /api/municipality/users/:id/role (Assign Role)', () => {
        const rolePayload = { role: 'Municipal Administrator' };
        (0, globals_1.it)('should fail if not authenticated (401)', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .put(`/api/municipality/users/${createdEmployee.id}/role`)
                .send(rolePayload);
            (0, globals_1.expect)(response.status).toBe(401);
        });
        (0, globals_1.it)('should fail if authenticated as Citizen (403)', async () => {
            const response = await citizenAgent
                .put(`/api/municipality/users/${createdEmployee.id}/role`)
                .send(rolePayload);
            (0, globals_1.expect)(response.status).toBe(403);
        });
        (0, globals_1.it)('should update the role if authenticated as Admin (200)', async () => {
            const response = await adminAgent
                .put(`/api/municipality/users/${createdEmployee.id}/role`)
                .send(rolePayload);
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body.role).toBe('Municipal Administrator');
        });
        (0, globals_1.it)('should return 404 for a non-existent user ID', async () => {
            const nonExistentId = 9999999;
            const response = await adminAgent
                .put(`/api/municipality/users/${nonExistentId}/role`)
                .send(rolePayload);
            (0, globals_1.expect)(response.status).toBe(404);
        });
        (0, globals_1.it)('should return 400 for an invalid user ID format', async () => {
            const response = await adminAgent
                .put('/api/municipality/users/abc/role')
                .send(rolePayload);
            (0, globals_1.expect)(response.status).toBe(400);
        });
        (0, globals_1.it)('should return 400 if role is not provided', async () => {
            const response = await adminAgent
                .put(`/api/municipality/users/${createdEmployee.id}/role`)
                .send({});
            (0, globals_1.expect)(response.status).toBe(400);
        });
        (0, globals_1.it)('should return 400 for an invalid role string', async () => {
            const response = await adminAgent
                .put(`/api/municipality/users/${createdEmployee.id}/role`)
                .send({ role: 'NOT_A_VALID_ROLE' });
            (0, globals_1.expect)(response.status).toBe(400);
            (0, globals_1.expect)(response.body.message || response.body.error).toBe('Invalid role specified');
        });
        (0, globals_1.it)('should return 400 when trying to assign CITIZEN role', async () => {
            const response = await adminAgent
                .put(`/api/municipality/users/${createdEmployee.id}/role`)
                .send({ role: 'Citizen' });
            (0, globals_1.expect)(response.status).toBe(400);
        });
        (0, globals_1.it)('should return 400 when trying to assign ADMINISTRATOR role', async () => {
            const response = await adminAgent
                .put(`/api/municipality/users/${createdEmployee.id}/role`)
                .send({ role: 'Administrator' });
            (0, globals_1.expect)(response.status).toBe(400);
        });
        (0, globals_1.it)('should return 400 when trying to assign a role to a CITIZEN user', async () => {
            const response = await adminAgent
                .put(`/api/municipality/users/${createdCitizen.id}/role`)
                .send({ role: 'Technical Office Staff Member' });
            (0, globals_1.expect)(response.status).toBe(400);
        });
        (0, globals_1.it)('should return 500 if the service throws an unexpected error during role update', async () => {
            const mockError = new Error('Forced Role Update Error');
            globals_1.jest.spyOn(userRepository_1.userRepository, 'updateUser').mockRejectedValue(mockError);
            const response = await adminAgent
                .put(`/api/municipality/users/${createdEmployee.id}/role`)
                .send(rolePayload);
            (0, globals_1.expect)(response.status).toBe(500);
        });
    });
    // --- DELETE /api/municipality/users/:id (Delete User) --------------
    (0, globals_1.describe)('DELETE /api/municipality/users/:id (Delete User)', () => {
        (0, globals_1.it)('should fail if not authenticated (401)', async () => {
            const response = await (0, supertest_1.default)(app_1.default).delete(`/api/municipality/users/${createdEmployee.id}`);
            (0, globals_1.expect)(response.status).toBe(401);
        });
        (0, globals_1.it)('should delete the user if authenticated as Admin (204)', async () => {
            const deleteResponse = await adminAgent.delete(`/api/municipality/users/${createdEmployee.id}`);
            (0, globals_1.expect)(deleteResponse.status).toBe(204);
            createdUserIds = createdUserIds.filter(id => id !== createdEmployee.id);
            const getResponse = await adminAgent.get(`/api/municipality/users/${createdEmployee.id}`);
            (0, globals_1.expect)(getResponse.status).toBe(404);
        });
        (0, globals_1.it)('should return 404 when deleting a non-existent user ID', async () => {
            const nonExistentId = 9999999;
            const response = await adminAgent.delete(`/api/municipality/users/${nonExistentId}`);
            (0, globals_1.expect)(response.status).toBe(404);
        });
        (0, globals_1.it)('should return 403 if authenticated as Citizen', async () => {
            const response = await citizenAgent.delete(`/api/municipality/users/${createdEmployee.id}`);
            (0, globals_1.expect)(response.status).toBe(403);
        });
        (0, globals_1.it)('should return 400 for an invalid user ID format', async () => {
            const response = await adminAgent.delete('/api/municipality/users/abc');
            (0, globals_1.expect)(response.status).toBe(400);
        });
        (0, globals_1.it)('should return 400 when trying to delete a CITIZEN user', async () => {
            const response = await adminAgent.delete(`/api/municipality/users/${createdCitizen.id}`);
            (0, globals_1.expect)(response.status).toBe(400);
        });
        (0, globals_1.it)('should return 500 if the service throws an unexpected error during deletion', async () => {
            const mockError = new Error('Forced Deletion Error');
            globals_1.jest.spyOn(userRepository_1.userRepository, 'deleteUser').mockRejectedValue(mockError);
            const response = await adminAgent.delete(`/api/municipality/users/${createdEmployee.id}`);
            (0, globals_1.expect)(response.status).toBe(500);
        });
    });
    // --- GET /api/roles (Get All Roles) --------------------------------
    (0, globals_1.describe)('GET /api/roles (Get All Roles)', () => {
        (0, globals_1.it)('should return municipality roles if authenticated as Admin (200)', async () => {
            const response = await adminAgent.get('/api/roles');
            const expectedRoles = roleUtils_1.RoleUtils.getAllMunicipalityRoles();
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body).toEqual(expectedRoles);
            (0, globals_1.expect)(response.body).toContain('Technical Office Staff Member');
            (0, globals_1.expect)(response.body).not.toContain('Citizen');
        });
        (0, globals_1.it)('should return 401 if not authenticated', async () => {
            const response = await (0, supertest_1.default)(app_1.default).get('/api/roles');
            (0, globals_1.expect)(response.status).toBe(401);
        });
        (0, globals_1.it)('should return 403 if authenticated as Citizen', async () => {
            const response = await citizenAgent.get('/api/roles');
            (0, globals_1.expect)(response.status).toBe(403);
        });
        (0, globals_1.it)('should return 500 if the RoleUtils throws an error', async () => {
            const mockError = new Error('Forced Util Error');
            globals_1.jest.spyOn(roleUtils_1.RoleUtils, 'getAllMunicipalityRoles').mockImplementation(() => {
                throw mockError;
            });
            const response = await adminAgent.get('/api/roles');
            (0, globals_1.expect)(response.status).toBe(500);
        });
    });
});
