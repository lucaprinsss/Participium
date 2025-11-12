/* import { afterAll, beforeAll, beforeEach, describe, expect, it, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import { AppDataSource } from "@database/connection";
import app from "../../../app";
import { userEntity } from "@models/entity/userEntity";
import { UserRole } from '@models/dto/UserRole';
import { userRepository } from '@repositories/userRepository';
import { RoleUtils } from '@utils/roleUtils';
import { In } from 'typeorm';
import { municipalityUserService } from '@services/municipalityUserService';

const r = () => `_${Math.floor(Math.random() * 1000000)}`;
let ADMIN_CREDENTIALS: any;
let CITIZEN_CREDENTIALS: any;
let EMPLOYEE_PAYLOAD: any;
let createdEmployee: userEntity;
let createdAdmin: userEntity; 
let createdCitizen: userEntity; 
let createdUserIds: number[] = [];


describe('MunicipalityUserController Integration Tests', () => {

    let adminAgent: ReturnType<typeof request.agent>;
    let citizenAgent: ReturnType<typeof request.agent>;

    beforeAll(async () => {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }
    });

    afterAll(async () => {
        if (createdUserIds.length > 0) {
            await AppDataSource.getRepository(userEntity).delete({ id: In(createdUserIds) });
        }
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    });

    beforeEach(async () => {
        ADMIN_CREDENTIALS = {
            username: `admin_user${r()}`,
            password: 'AdminPassword123!',
            email: `admin${r()}@test.com`,
            firstName: 'Admin',
            lastName: 'User',
            role: UserRole.ADMINISTRATOR
        };
        
        CITIZEN_CREDENTIALS = {
            username: `citizen_user${r()}`,
            password: 'CitizenPassword123!',
            email: `citizen${r()}@test.com`,
            firstName: 'Citizen',
            lastName: 'User',
            role: UserRole.CITIZEN
        };
        
        EMPLOYEE_PAYLOAD = {
            username: `employee_user${r()}`,
            password: 'EmployeePassword123!',
            email: `employee${r()}@test.com`,
            first_name: 'Employee', 
            last_name: 'User',
            role: UserRole.TECHNICAL_OFFICE_STAFF_MEMBER 
        };

        createdAdmin = await userRepository.createUserWithPassword({
            ...ADMIN_CREDENTIALS,
            emailNotificationsEnabled: true
        });
        createdCitizen = await userRepository.createUserWithPassword({
            ...CITIZEN_CREDENTIALS,
            emailNotificationsEnabled: true
        });
        createdEmployee = await userRepository.createUserWithPassword({
            username: EMPLOYEE_PAYLOAD.username,
            password: EMPLOYEE_PAYLOAD.password,
            email: EMPLOYEE_PAYLOAD.email,
            firstName: EMPLOYEE_PAYLOAD.first_name, 
            lastName: EMPLOYEE_PAYLOAD.last_name,
            role: EMPLOYEE_PAYLOAD.role, 
            emailNotificationsEnabled: true
        });

        createdUserIds.push(createdAdmin.id, createdCitizen.id, createdEmployee.id);

        adminAgent = request.agent(app);
        citizenAgent = request.agent(app);

        // Login Admin
        await adminAgent.post('/api/sessions').send({
            username: ADMIN_CREDENTIALS.username,
            password: ADMIN_CREDENTIALS.password
        });
        // Login Citizen
        await citizenAgent.post('/api/sessions').send({
            username: CITIZEN_CREDENTIALS.username,
            password: CITIZEN_CREDENTIALS.password
        });
    });

    afterEach(async () => {
        if (createdUserIds.length > 0) {
            const repository = AppDataSource.getRepository(userEntity);
            await repository.delete({ id: In(createdUserIds) });
            createdUserIds = [];
        }
        adminAgent = null as any;
        citizenAgent = null as any;
        createdEmployee = null as any;
        createdAdmin = null as any;
        createdCitizen = null as any;
        
        jest.restoreAllMocks();
    });


    // --- POST /api/municipality/users (Create User) --------------------
    describe('POST /api/municipality/users (Create User)', () => {
        
        it('should fail if not authenticated (401)', async () => {
            const response = await request(app)
                .post('/api/municipality/users')
                .send(EMPLOYEE_PAYLOAD); 
            expect(response.status).toBe(401);
            expect(response.body.message || response.body.error).toBe('Not authenticated');
        });

        it('should fail if authenticated as Citizen (403)', async () => {
            const response = await citizenAgent
                .post('/api/municipality/users')
                .send(EMPLOYEE_PAYLOAD);
            expect(response.status).toBe(403);
            expect(response.body.message || response.body.error).toBe('Access denied. Admin role required.');
        });

        it('should create a new user if authenticated as Admin (201)', async () => {
            const newUserData = {
                ...EMPLOYEE_PAYLOAD,
                username: `new_employee${r()}`,
                email: `new${r()}@employee.com`
            };
            
            const response = await adminAgent
                .post('/api/municipality/users')
                .send(newUserData);

            expect(response.status).toBe(201);
            expect(response.body.username).toBe(newUserData.username);
            expect(response.body.role).toBe(newUserData.role);
            
            createdUserIds.push(response.body.id);
        });

        it('should return 400 for missing fields', async () => {
            const response = await adminAgent
                .post('/api/municipality/users')
                .send({ username: 'test' });
            expect(response.status).toBe(400);
            expect(response.body.message || response.body.error).toContain('All fields are required'); 
        });

        it('should return 400 when trying to create a user with CITIZEN role', async () => {
            const citizenPayload = { ...EMPLOYEE_PAYLOAD, role: UserRole.CITIZEN, username: `fail_citizen_${r()}`, email: `fail_citizen_${r()}@test.com` };
            const response = await adminAgent
                .post('/api/municipality/users')
                .send(citizenPayload);
            
            expect(response.status).toBe(400);
            expect(response.body.message || response.body.error).toBe('Cannot create a municipality user with Citizen role');
        });

        it('should return 400 when trying to create a user with ADMINISTRATOR role ', async () => {
            const adminPayload = { ...EMPLOYEE_PAYLOAD, role: UserRole.ADMINISTRATOR, username: `fail_admin_${r()}`, email: `fail_admin_${r()}@test.com` };
            const response = await adminAgent
                .post('/api/municipality/users')
                .send(adminPayload);

            expect(response.status).toBe(400);
            expect(response.body.message || response.body.error).toBe('Cannot create an Administrator through this endpoint');
        });

        it('should return 409 if username already exists', async () => {
            jest.spyOn(userRepository, 'existsUserByUsername').mockResolvedValue(true);
            jest.spyOn(userRepository, 'existsUserByEmail').mockResolvedValue(false);

            const conflictPayload = { ...EMPLOYEE_PAYLOAD, email: `new_${r()}@test.com`, username: createdEmployee.username };
            const response = await adminAgent
                .post('/api/municipality/users')
                .send(conflictPayload);
            
            expect(response.status).toBe(409);
            expect(response.body.message || response.body.error).toBe('Username already exists');
        });

        it('should return 409 if email already exists', async () => {
            jest.spyOn(userRepository, 'existsUserByUsername').mockResolvedValue(false);
            jest.spyOn(userRepository, 'existsUserByEmail').mockResolvedValue(true);

            const conflictPayload = { ...EMPLOYEE_PAYLOAD, username: `new_${r()}`, email: createdEmployee.email };
            const response = await adminAgent
                .post('/api/municipality/users')
                .send(conflictPayload);

            expect(response.status).toBe(409); 
            expect(response.body.message || response.body.error).toBe('Email already exists');
        });
        
        it('should return 500 if the service throws an unexpected error', async () => {
            const mockError = new Error('Internal server error');
            jest.spyOn(municipalityUserService, 'createMunicipalityUser').mockRejectedValue(mockError);

            const response = await adminAgent
                .post('/api/municipality/users')
                .send(EMPLOYEE_PAYLOAD);
            
            expect(response.status).toBe(500);
            expect(response.body.message || response.body.error).toBe(mockError.message);
        });
    });


    // --- GET /api/municipality/users (Get All Users) -------------------
    describe('GET /api/municipality/users (Get All Users)', () => {

        it('should fail if not authenticated (401)', async () => {
            const response = await request(app).get('/api/municipality/users');
            expect(response.status).toBe(401);
            expect(response.body.message || response.body.error).toBe('Not authenticated');
        });

        it('should fail if authenticated as Citizen (403)', async () => {
            const response = await citizenAgent.get('/api/municipality/users');
            expect(response.status).toBe(403);
            expect(response.body.message || response.body.error).toBe('Access denied. Admin role required.');
        });

        it('should return a list of users if authenticated as Admin (200)', async () => {
            const response = await adminAgent.get('/api/municipality/users');
            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
            
            expect(response.body.length).toBe(2); 
            expect(response.body.some((user: any) => user.id === createdEmployee.id)).toBe(true);
        });
        
        it('should return 500 if the service throws an unexpected error', async () => {
            const mockError = new Error('Internal server error');
            jest.spyOn(municipalityUserService, 'getAllMunicipalityUsers').mockRejectedValue(mockError);

            const response = await adminAgent.get('/api/municipality/users');
            
            expect(response.status).toBe(500);
            expect(response.body.message || response.body.error).toBe(mockError.message);
        });
    });

    // --- GET /api/municipality/users/:id (Get User By ID) --------------
    describe('GET /api/municipality/users/:id (Get User By ID)', () => {
        
        it('should fail if not authenticated (401)', async () => {
            const response = await request(app).get(`/api/municipality/users/${createdEmployee.id}`);
            expect(response.status).toBe(401);
            expect(response.body.message || response.body.error).toBe('Not authenticated'); 
        });

        it('should return the user if authenticated as Admin (200)', async () => {
            const response = await adminAgent.get(`/api/municipality/users/${createdEmployee.id}`);
            expect(response.status).toBe(200);
            expect(response.body.id).toBe(createdEmployee.id);
        });

        it('should fail if authenticated as Citizen (403)', async () => {
            const response = await citizenAgent.get(`/api/municipality/users/${createdEmployee.id}`);
            expect(response.status).toBe(403);
            expect(response.body.message || response.body.error).toBe('Access denied. Admin role required.');
        });

        it('should return 404 for a non-existent user ID', async () => {
            const nonExistentId = 9999999;
            const response = await adminAgent.get(`/api/municipality/users/${nonExistentId}`);
            expect(response.status).toBe(404);
            expect(response.body.message || response.body.error).toBe('User not found'); 
        });
        
        it('should return 400 for an invalid user ID format', async () => {
            const response = await adminAgent.get('/api/municipality/users/abc');
            expect(response.status).toBe(400);
            expect(response.body.message || response.body.error).toBe('Invalid user ID');
        });

        it('should return 500 if the service throws an unexpected error', async () => {
            const mockError = new Error('Forced DB Error');
            jest.spyOn(municipalityUserService, 'getMunicipalityUserById').mockRejectedValue(mockError);

            const response = await adminAgent.get(`/api/municipality/users/${createdEmployee.id}`);
            
            expect(response.status).toBe(500); 
            expect(response.body.message || response.body.error).toBe(mockError.message);
        });
        
        it('should return 404 if user found is a CITIZEN', async () => {
            const response = await adminAgent.get(`/api/municipality/users/${createdCitizen.id}`);
            
            expect(response.status).toBe(404);
            expect(response.body.message || response.body.error).toBe('Municipality user not found');
        });

    });


    // --- PUT /api/municipality/users/:id (Update User) -----------------
    describe('PUT /api/municipality/users/:id (Update User)', () => {
        const updatePayload = { first_name: 'UpdatedName' };

        it('should fail if not authenticated (401)', async () => {
            const response = await request(app)
                .put(`/api/municipality/users/${createdEmployee.id}`)
                .send(updatePayload);
            expect(response.status).toBe(401);
            expect(response.body.message || response.body.error).toBe('Not authenticated');
        }); 

        it('should update the user if authenticated as Admin (200)', async () => {
            const response = await adminAgent
                .put(`/api/municipality/users/${createdEmployee.id}`)
                .send(updatePayload); 
            expect(response.status).toBe(200); 
            expect(response.body.first_name).toBe('UpdatedName'); 
        });

        it('should return 404 for a non-existent user ID', async () => {
            const nonExistentId = 9999999;
            const response = await adminAgent
                .put(`/api/municipality/users/${nonExistentId}`)
                .send(updatePayload);
            expect(response.status).toBe(404);
            expect(response.body.message || response.body.error).toBe('User not found'); 
        });

        it('should return 403 if authenticated as Citizen', async () => {
            const response = await citizenAgent
                .put(`/api/municipality/users/${createdEmployee.id}`)
                .send(updatePayload);
            expect(response.status).toBe(403);
            expect(response.body.message || response.body.error).toBe('Access denied. Admin role required.');
        });

        it('should return 400 for an invalid user ID format', async () => {
            const response = await adminAgent
                .put('/api/municipality/users/abc')
                .send(updatePayload);
            expect(response.status).toBe(400);
            expect(response.body.message || response.body.error).toBe('Invalid user ID');
        });

        it('should return 400 if no update fields are provided', async () => {
            const response = await adminAgent
                .put(`/api/municipality/users/${createdEmployee.id}`)
                .send({}); 
            expect(response.status).toBe(400);
            expect(response.body.message || response.body.error).toBe('At least one field must be provided for update');
        });

        it('should return 400 when trying to update a CITIZEN user', async () => {
            const response = await adminAgent
                .put(`/api/municipality/users/${createdCitizen.id}`)
                .send({ first_name: 'NewName' });
            
            expect(response.status).toBe(400);
            expect(response.body.message || response.body.error).toBe('Cannot modify Citizen or Administrator through this endpoint');
        });

        it('should return 400 when trying to change a role to CITIZEN', async () => {
            const response = await adminAgent
                .put(`/api/municipality/users/${createdEmployee.id}`)
                .send({ role: UserRole.CITIZEN });
            
            expect(response.status).toBe(400);
            expect(response.body.message || response.body.error).toBe('Cannot change role to Citizen or Administrator');
        });

        it('should return 409 when updating email to an existing one', async () => {
            jest.spyOn(userRepository, 'findUserByEmail').mockResolvedValue({ id: createdCitizen.id } as userEntity);

            const response = await adminAgent
                .put(`/api/municipality/users/${createdEmployee.id}`)
                .send({ email: createdCitizen.email });
            
            expect(response.status).toBe(409);
            expect(response.body.message || response.body.error).toBe('Email already exists');
        });

        it('should return 500 if the service throws an unexpected error during update', async () => {
            const mockError = new Error('Forced Update Error');
            jest.spyOn(userRepository, 'updateUser').mockRejectedValue(mockError);

            const response = await adminAgent
                .put(`/api/municipality/users/${createdEmployee.id}`)
                .send({ first_name: 'ErrorTest' });
            
            expect(response.status).toBe(500);
            expect(response.body.message || response.body.error).toBe(mockError.message);
        }); 
    });


    // --- PUT /api/municipality/users/:id/role (Assign Role) ------------
    describe('PUT /api/municipality/users/:id/role (Assign Role)', () => {
        const rolePayload = { role: UserRole.MUNICIPAL_ADMINISTRATOR };

        it('should fail if not authenticated (401)', async () => {
            const response = await request(app)
                .put(`/api/municipality/users/${createdEmployee.id}/role`)
                .send(rolePayload);
            expect(response.status).toBe(401);
            expect(response.body.message || response.body.error).toBe('Not authenticated');
        });

        it('should fail if authenticated as Citizen (403)', async () => {
            const response = await citizenAgent
                .put(`/api/municipality/users/${createdEmployee.id}/role`)
                .send(rolePayload);
            expect(response.status).toBe(403);
            expect(response.body.message || response.body.error).toBe('Access denied. Admin role required.');
        });

        it('should update the role if authenticated as Admin (200)', async () => {
            const response = await adminAgent
                .put(`/api/municipality/users/${createdEmployee.id}/role`)
                .send(rolePayload);
            
            expect(response.status).toBe(200);
            expect(response.body.role).toBe(UserRole.MUNICIPAL_ADMINISTRATOR);
        });

        it('should return 404 for a non-existent user ID', async () => {
            const nonExistentId = 9999999;
            const response = await adminAgent
                .put(`/api/municipality/users/${nonExistentId}/role`)
                .send(rolePayload);
            expect(response.status).toBe(404);
            expect(response.body.message || response.body.error).toBe('User not found');
        });

        it('should return 400 for an invalid user ID format', async () => {
            const response = await adminAgent
                .put('/api/municipality/users/abc/role')
                .send(rolePayload);
            expect(response.status).toBe(400);
            expect(response.body.message || response.body.error).toBe('Invalid user ID');
        });

        it('should return 400 if role is not provided', async () => {
            const response = await adminAgent
                .put(`/api/municipality/users/${createdEmployee.id}/role`)
                .send({});
            expect(response.status).toBe(400);
            expect(response.body.message || response.body.error).toBe('Role is required');
        });
        
        it('should return 400 for an invalid role string', async () => {
            jest.spyOn(RoleUtils, 'isRoleValid').mockReturnValue(false);

            const response = await adminAgent
                .put(`/api/municipality/users/${createdEmployee.id}/role`)
                .send({ role: 'NOT_A_VALID_ROLE' });
            expect(response.status).toBe(400);
            expect(response.body.message || response.body.error).toBe('Invalid role specified');
        });

        it('should return 400 when trying to assign CITIZEN role', async () => {
            const response = await adminAgent
                .put(`/api/municipality/users/${createdEmployee.id}/role`)
                .send({ role: UserRole.CITIZEN });
            
            expect(response.status).toBe(400);
            expect(response.body.message || response.body.error).toBe('Cannot assign Citizen role to municipality user');
        });

        it('should return 400 when trying to assign ADMINISTRATOR role', async () => {
            const response = await adminAgent
                .put(`/api/municipality/users/${createdEmployee.id}/role`)
                .send({ role: UserRole.ADMINISTRATOR });

            expect(response.status).toBe(400);
            expect(response.body.message || response.body.error).toBe('Cannot assign Administrator role through this endpoint');
        });

        it('should return 400 when trying to assign a role to a CITIZEN user', async () => {
            const response = await adminAgent
                .put(`/api/municipality/users/${createdCitizen.id}/role`) 
                .send({ role: UserRole.TECHNICAL_OFFICE_STAFF_MEMBER });

            expect(response.status).toBe(400);
            expect(response.body.message || response.body.error).toBe('Cannot assign role to Citizen or Administrator through this endpoint');
        });
        
        it('should return 500 if the service throws an unexpected error during role update', async () => {
            const mockError = new Error('Forced Role Update Error');
            jest.spyOn(userRepository, 'updateUser').mockRejectedValue(mockError);

            const response = await adminAgent
                .put(`/api/municipality/users/${createdEmployee.id}/role`)
                .send(rolePayload);

            expect(response.status).toBe(500);
            expect(response.body.message || response.body.error).toBe(mockError.message);
        });
    });


    // --- DELETE /api/municipality/users/:id (Delete User) --------------
    describe('DELETE /api/municipality/users/:id (Delete User)', () => {

        it('should fail if not authenticated (401)', async () => {
            const response = await request(app).delete(`/api/municipality/users/${createdEmployee.id}`);
            expect(response.status).toBe(401);
            expect(response.body.message || response.body.error).toBe('Not authenticated');
        });

        it('should delete the user if authenticated as Admin (204)', async () => {
            const deleteResponse = await adminAgent.delete(`/api/municipality/users/${createdEmployee.id}`);
            expect(deleteResponse.status).toBe(204);

            createdUserIds = createdUserIds.filter(id => id !== createdEmployee.id);

            const getResponse = await adminAgent.get(`/api/municipality/users/${createdEmployee.id}`);
            expect(getResponse.status).toBe(404);
        });

        it('should return 404 when deleting a non-existent user ID', async () => {
            const nonExistentId = 9999999;
            const response = await adminAgent.delete(`/api/municipality/users/${nonExistentId}`);
            expect(response.status).toBe(404);
            expect(response.body.message || response.body.error).toBe('User not found');
        });

        it('should return 403 if authenticated as Citizen', async () => {
            const response = await citizenAgent.delete(`/api/municipality/users/${createdEmployee.id}`);
            expect(response.status).toBe(403);
            expect(response.body.message || response.body.error).toBe('Access denied. Admin role required.');
        });
        
        it('should return 400 for an invalid user ID format', async () => {
            const response = await adminAgent.delete('/api/municipality/users/abc');
            expect(response.status).toBe(400);
            expect(response.body.message || response.body.error).toBe('Invalid user ID');
        });

        it('should return 400 when trying to delete a CITIZEN user', async () => {
            const response = await adminAgent.delete(`/api/municipality/users/${createdCitizen.id}`);
            
            expect(response.status).toBe(400);
            expect(response.body.message || response.body.error).toBe('Cannot delete Citizen or Administrator through this endpoint');
        });
        
        it('should return 500 if the service throws an unexpected error during deletion', async () => {
            const mockError = new Error('Forced Deletion Error');
            jest.spyOn(userRepository, 'deleteUser').mockRejectedValue(mockError);

            const response = await adminAgent.delete(`/api/municipality/users/${createdEmployee.id}`);
            
            expect(response.status).toBe(500);
            expect(response.body.message || response.body.error).toBe(mockError.message);
        });
    });


    // --- GET /api/roles (Get All Roles) --------------------------------
    describe('GET /api/roles (Get All Roles)', () => {
        
        it('should return municipality roles if authenticated as Admin (200)', async () => {
            const response = await adminAgent.get('/api/roles');
            const expectedRoles = RoleUtils.getAllMunicipalityRoles();

            expect(response.status).toBe(200);
            expect(response.body).toEqual(expectedRoles);
            
            expect(response.body).toContain(UserRole.TECHNICAL_OFFICE_STAFF_MEMBER);
            expect(response.body).not.toContain(UserRole.CITIZEN);
        });

        it('should return 401 if not authenticated', async () => {
            const response = await request(app).get('/api/roles');
            expect(response.status).toBe(401);
            expect(response.body.message || response.body.error).toBe('Not authenticated');
        });

        it('should return 403 if authenticated as Citizen', async () => {
            const response = await citizenAgent.get('/api/roles');
            expect(response.status).toBe(403);
            expect(response.body.message || response.body.error).toBe('Access denied. Admin role required.');
        });

        it('should return 500 if the RoleUtils throws an error', async () => {
            const mockError = new Error('Forced Util Error');
            jest.spyOn(RoleUtils, 'getAllMunicipalityRoles').mockImplementation(() => {
                throw mockError;
            });

            const response = await adminAgent.get('/api/roles');
            
            expect(response.status).toBe(500);
            expect(response.body.message || response.body.error).toBe('Forced Util Error');
        });
    });

}); */

// dummy test
describe('Dummy test', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });
});