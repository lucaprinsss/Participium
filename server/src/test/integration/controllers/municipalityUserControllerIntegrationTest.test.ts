import { afterAll, beforeAll, beforeEach, describe, expect, it, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import { AppDataSource } from "@database/connection";
import app from "../../../app";
import { UserEntity } from "@models/entity/userEntity";
import { userRepository } from '@repositories/userRepository';
import { departmentRoleRepository } from '@repositories/departmentRoleRepository';
import { RoleUtils } from '@utils/roleUtils';
import { In } from 'typeorm';
import { municipalityUserService } from '@services/municipalityUserService';

const r = () => `_${Math.floor(Math.random() * 1000000)}`;
let ADMIN_CREDENTIALS: any;
let CITIZEN_CREDENTIALS: any;
let EMPLOYEE_PAYLOAD: any;
let createdEmployee: UserEntity;
let createdAdmin: UserEntity; 
let createdCitizen: UserEntity; 
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
            await AppDataSource.getRepository(UserEntity).delete({ id: In(createdUserIds) });
        }
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    });

        beforeEach(async () => {
            // Get dynamic department role IDs
            const adminDeptRole = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Administrator');
            const citizenDeptRole = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Citizen');
            const employeeDeptRole = await departmentRoleRepository.findByDepartmentAndRole('Water and Sewer Services Department', 'Water Network staff member');
    
            if (!adminDeptRole || !citizenDeptRole || !employeeDeptRole) {
                throw new Error('Required department roles not found in database');
            }
    
            ADMIN_CREDENTIALS = {
                username: `admin_user${r()}`,
                password: 'AdminPassword123!',
                email: `admin${r()}@test.com`,
                firstName: 'Admin',
                lastName: 'User',
                departmentRoleId: adminDeptRole.id
            };
            
            CITIZEN_CREDENTIALS = {
                username: `citizen_user${r()}`,
                password: 'CitizenPassword123!',
                email: `citizen${r()}@test.com`,
                firstName: 'Citizen',
                lastName: 'User',
                departmentRoleId: citizenDeptRole.id
            };
            
            EMPLOYEE_PAYLOAD = {
                username: `employee_user${r()}`,
                password: 'EmployeePassword123!',
                email: `employee${r()}@test.com`,
                first_name: 'Employee', 
                last_name: 'User',
                role_name: 'Water Network staff member',
                department_name: 'Water and Sewer Services Department'
            };
    
            createdAdmin = await userRepository.createUserWithPassword({
                ...ADMIN_CREDENTIALS,
                isVerified: true,
                emailNotificationsEnabled: true
            });
            createdCitizen = await userRepository.createUserWithPassword({
                ...CITIZEN_CREDENTIALS,
                isVerified: true,
                emailNotificationsEnabled: true
            });
            createdEmployee = await userRepository.createUserWithPassword({
                username: EMPLOYEE_PAYLOAD.username,
                password: EMPLOYEE_PAYLOAD.password,
                email: EMPLOYEE_PAYLOAD.email,
                firstName: EMPLOYEE_PAYLOAD.first_name, 
                lastName: EMPLOYEE_PAYLOAD.last_name,
                departmentRoleId: employeeDeptRole.id,
                isVerified: true,
                emailNotificationsEnabled: true
            });
    
            createdUserIds.push(createdAdmin.id, createdCitizen.id, createdEmployee.id);
    
            adminAgent = request.agent(app);
            citizenAgent = request.agent(app);
    
            await adminAgent.post('/api/sessions').send({
                username: ADMIN_CREDENTIALS.username,
                password: ADMIN_CREDENTIALS.password
            });
            await citizenAgent.post('/api/sessions').send({
                username: CITIZEN_CREDENTIALS.username,
                password: CITIZEN_CREDENTIALS.password
            });
        });
    afterEach(async () => {
        if (createdUserIds.length > 0) {
            const repository = AppDataSource.getRepository(UserEntity);
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
        });

        it('should fail if authenticated as Citizen (403)', async () => {
            const response = await citizenAgent
                .post('/api/municipality/users')
                .send(EMPLOYEE_PAYLOAD);
            expect(response.status).toBe(403);
        });

        it('should create a new user if authenticated as Admin (201)', async () => {
            const newUserData = {
                username: `new_employee${r()}`,
                password: 'NewEmployee123!',
                email: `new${r()}@employee.com`,
                first_name: 'New',
                last_name: 'Employee',
                role_name: 'Road Maintenance staff member',
                department_name: 'Public Infrastructure and Accessibility Department'
            };
            
            const response = await adminAgent
                .post('/api/municipality/users')
                .send(newUserData);

            expect(response.status).toBe(201);
            expect(response.body.username).toBe(newUserData.username);
            createdUserIds.push(response.body.id);
        });

        it('should return 400 for missing fields', async () => {
            const response = await adminAgent
                .post('/api/municipality/users')
                .send({ username: 'test' });
            expect(response.status).toBe(400);
        });

        it('should return 400 when trying to create a user with CITIZEN role', async () => {
            const citizenPayload = { ...EMPLOYEE_PAYLOAD, role_name: 'Citizen', username: `fail_citizen_${r()}`, email: `fail_citizen_${r()}@test.com` };
            const response = await adminAgent
                .post('/api/municipality/users')
                .send(citizenPayload);
            expect(response.status).toBe(400);
        });

        it('should return 400 when trying to create a user with ADMINISTRATOR role ', async () => {
            const adminPayload = { ...EMPLOYEE_PAYLOAD, role_name: 'Administrator', username: `fail_admin_${r()}`, email: `fail_admin_${r()}@test.com` };
            const response = await adminAgent
                .post('/api/municipality/users')
                .send(adminPayload);
            expect(response.status).toBe(400);
        });

        it('should return 409 if username already exists', async () => {
            const conflictPayload = { 
                ...EMPLOYEE_PAYLOAD, 
                email: `new_${r()}@test.com`, 
                username: createdEmployee.username
            };
            
            const response = await adminAgent
                .post('/api/municipality/users')
                .send(conflictPayload);
            
            expect(response.status).toBe(409);
            expect(response.body.message || response.body.error).toBe('Username already exists');
        });

        it('should return 409 if email already exists', async () => {
            const conflictPayload = { 
                ...EMPLOYEE_PAYLOAD, 
                username: `new_${r()}`, 
                email: createdEmployee.email
            };
            
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
        });

        it('should fail if authenticated as Citizen (403)', async () => {
            const response = await citizenAgent.get('/api/municipality/users');
            expect(response.status).toBe(403);
        });

        it('should return a list of users if authenticated as Admin (200)', async () => {
            const response = await adminAgent.get('/api/municipality/users');
            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
            
            expect(response.body.some((user: any) => user.id === createdEmployee.id)).toBe(true);
            expect(response.body.some((user: any) => user.id === createdCitizen.id)).toBe(false);
        });
        
        it('should return 500 if the service throws an unexpected error', async () => {
            const mockError = new Error('Internal server error');
            jest.spyOn(municipalityUserService, 'getAllMunicipalityUsers').mockRejectedValue(mockError);

            const response = await adminAgent.get('/api/municipality/users');
            
            expect(response.status).toBe(500);
        });
    });

    // --- GET /api/municipality/users/:id (Get User By ID) --------------
    describe('GET /api/municipality/users/:id (Get User By ID)', () => {
        
        it('should fail if not authenticated (401)', async () => {
            const response = await request(app).get(`/api/municipality/users/${createdEmployee.id}`);
            expect(response.status).toBe(401); 
        });

        it('should return the user if authenticated as Admin (200)', async () => {
            const response = await adminAgent.get(`/api/municipality/users/${createdEmployee.id}`);
            expect(response.status).toBe(200);
            expect(response.body.id).toBe(createdEmployee.id);
        });

        it('should fail if authenticated as Citizen (403)', async () => {
            const response = await citizenAgent.get(`/api/municipality/users/${createdEmployee.id}`);
            expect(response.status).toBe(403);
        });

        it('should return 404 for a non-existent user ID', async () => {
            const nonExistentId = 9999999;
            const response = await adminAgent.get(`/api/municipality/users/${nonExistentId}`);
            expect(response.status).toBe(404);
        });
        
        it('should return 400 for an invalid user ID format', async () => {
            const response = await adminAgent.get('/api/municipality/users/abc');
            expect(response.status).toBe(400);
        });

        it('should return 500 if the service throws an unexpected error', async () => {
            const mockError = new Error('Forced DB Error');
            jest.spyOn(municipalityUserService, 'getMunicipalityUserById').mockRejectedValue(mockError);

            const response = await adminAgent.get(`/api/municipality/users/${createdEmployee.id}`);
            
            expect(response.status).toBe(500); 
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
        });

        it('should return 403 if authenticated as Citizen', async () => {
            const response = await citizenAgent
                .put(`/api/municipality/users/${createdEmployee.id}`)
                .send(updatePayload);
            expect(response.status).toBe(403);
        });

        it('should return 400 for an invalid user ID format', async () => {
            const response = await adminAgent
                .put('/api/municipality/users/abc')
                .send(updatePayload);
            expect(response.status).toBe(400);
        });

        it('should return 400 if no update fields are provided', async () => {
            const response = await adminAgent
                .put(`/api/municipality/users/${createdEmployee.id}`)
                .send({}); 
            expect(response.status).toBe(400);
        });

        it('should return 400 when trying to update a CITIZEN user', async () => {
            const response = await adminAgent
                .put(`/api/municipality/users/${createdCitizen.id}`)
                .send({ first_name: 'NewName' });
            expect(response.status).toBe(400);
        });

        it('should return 400 when trying to change a role to CITIZEN', async () => {
            const response = await adminAgent
                .put(`/api/municipality/users/${createdEmployee.id}`)
                .send({ role_name: 'Citizen' });
            expect(response.status).toBe(400);
        });

        it('should return 409 when updating email to an existing one', async () => {
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
        }); 
    });


    // --- PUT /api/municipality/users/:id/role (Assign Role) ------------
    describe('PUT /api/municipality/users/:id/role (Assign Role)', () => {
        const rolePayload = { role_name: 'Department Director', department_name: 'Public Infrastructure and Accessibility Department' };

        it('should fail if not authenticated (401)', async () => {
            const response = await request(app)
                .put(`/api/municipality/users/${createdEmployee.id}/role`)
                .send(rolePayload);
            expect(response.status).toBe(401);
        });

        it('should fail if authenticated as Citizen (403)', async () => {
            const response = await citizenAgent
                .put(`/api/municipality/users/${createdEmployee.id}/role`)
                .send(rolePayload);
            expect(response.status).toBe(403);
        });

        it('should update the role if authenticated as Admin (200)', async () => {
            const response = await adminAgent
                .put(`/api/municipality/users/${createdEmployee.id}/role`)
                .send(rolePayload);
            
            expect(response.status).toBe(200);
            expect(response.body.role_name).toBe('Department Director');
        });

        it('should return 404 for a non-existent user ID', async () => {
            const nonExistentId = 9999999;
            const response = await adminAgent
                .put(`/api/municipality/users/${nonExistentId}/role`)
                .send(rolePayload);
            expect(response.status).toBe(404);
        });

        it('should return 400 for an invalid user ID format', async () => {
            const response = await adminAgent
                .put('/api/municipality/users/abc/role')
                .send(rolePayload);
            expect(response.status).toBe(400);
        });

        it('should return 400 if role is not provided', async () => {
            const response = await adminAgent
                .put(`/api/municipality/users/${createdEmployee.id}/role`)
                .send({});
            expect(response.status).toBe(400);
        });
        
        it('should return 400 for an invalid role string', async () => {
            const response = await adminAgent
                .put(`/api/municipality/users/${createdEmployee.id}/role`)
                .send({ role_name: 'NOT_A_VALID_ROLE' });
            
            expect(response.status).toBe(400);
            expect(response.body.message || response.body.error).toContain('not found');
        });

        it('should return 400 when trying to assign CITIZEN role', async () => {
            const response = await adminAgent
                .put(`/api/municipality/users/${createdEmployee.id}/role`)
                .send({ role_name: 'Citizen' });
            
            expect(response.status).toBe(400);
        });

        it('should return 400 when trying to assign ADMINISTRATOR role', async () => {
            const response = await adminAgent
                .put(`/api/municipality/users/${createdEmployee.id}/role`)
                .send({ role_name: 'Administrator' });

            expect(response.status).toBe(400);
        });

        it('should return 400 when trying to assign a role to a CITIZEN user', async () => {
            const response = await adminAgent
                .put(`/api/municipality/users/${createdCitizen.id}/role`) 
                .send({ role_name: 'Technical Office Staff Member' });

            expect(response.status).toBe(400);
        });
        
        it('should return 500 if the service throws an unexpected error during role update', async () => {
            const mockError = new Error('Forced Role Update Error');
            jest.spyOn(userRepository, 'updateUser').mockRejectedValue(mockError);

            const response = await adminAgent
                .put(`/api/municipality/users/${createdEmployee.id}/role`)
                .send(rolePayload);

            expect(response.status).toBe(500);
        });
    });


    // --- DELETE /api/municipality/users/:id (Delete User) --------------
    describe('DELETE /api/municipality/users/:id (Delete User)', () => {

        it('should fail if not authenticated (401)', async () => {
            const response = await request(app).delete(`/api/municipality/users/${createdEmployee.id}`);
            expect(response.status).toBe(401);
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
        });

        it('should return 403 if authenticated as Citizen', async () => {
            const response = await citizenAgent.delete(`/api/municipality/users/${createdEmployee.id}`);
            expect(response.status).toBe(403);
        });
        
        it('should return 400 for an invalid user ID format', async () => {
            const response = await adminAgent.delete('/api/municipality/users/abc');
            expect(response.status).toBe(400);
        });

        it('should return 400 when trying to delete a CITIZEN user', async () => {
            const response = await adminAgent.delete(`/api/municipality/users/${createdCitizen.id}`);
            expect(response.status).toBe(400);
        });
        
        it('should return 500 if the service throws an unexpected error during deletion', async () => {
            const mockError = new Error('Forced Deletion Error');
            jest.spyOn(userRepository, 'deleteUser').mockRejectedValue(mockError);

            const response = await adminAgent.delete(`/api/municipality/users/${createdEmployee.id}`);
            
            expect(response.status).toBe(500);
        });
    });


    // --- GET /api/roles (Get All Roles) --------------------------------
    describe('GET /api/roles (Get All Roles)', () => {
        
        it('should return municipality roles if authenticated as Admin (200)', async () => {
            const response = await adminAgent.get('/api/roles');
            const expectedRoles = await RoleUtils.getAllMunicipalityRoles();

            expect(response.status).toBe(200);
            expect(response.body).toEqual(expectedRoles);
            
            expect(response.body).toContain('Water Network staff member');
            expect(response.body).toContain('Department Director');
            expect(response.body).not.toContain('Citizen');
            expect(response.body).not.toContain('Administrator');
        });

        it('should return 401 if not authenticated', async () => {
            const response = await request(app).get('/api/roles');
            expect(response.status).toBe(401);
        });

        it('should return 403 if authenticated as Citizen', async () => {
            const response = await citizenAgent.get('/api/roles');
            expect(response.status).toBe(403);
        });

        it('should return 500 if the RoleUtils throws an error', async () => {
            const mockError = new Error('Forced Util Error');
            jest.spyOn(RoleUtils, 'getAllMunicipalityRoles').mockImplementation(() => {
                throw mockError;
            });

            const response = await adminAgent.get('/api/roles');
            
            expect(response.status).toBe(500);
        });
    });

});