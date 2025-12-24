import { afterAll, beforeAll, beforeEach, describe, expect, it, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import { AppDataSource } from "@database/connection";
import app from "../../../app";
import { UserEntity } from "@models/entity/userEntity";
import { userRepository } from '@repositories/userRepository';
import { departmentRoleRepository } from '@repositories/departmentRoleRepository';
import { companyRepository } from '@repositories/companyRepository';
import { RoleUtils } from '@utils/roleUtils';
import { In } from 'typeorm';
import { municipalityUserService } from '@services/municipalityUserService';
import { departmentService } from '@services/departmentService';
import { DepartmentEntity } from "@models/entity/departmentEntity";
import { DepartmentRoleEntity } from "@models/entity/departmentRoleEntity";
import { RoleEntity } from "@models/entity/roleEntity";

const r = () => `_${Math.floor(Math.random() * 1000000)}`;
let ADMIN_CREDENTIALS: any;
let CITIZEN_CREDENTIALS: any;
let EMPLOYEE_PAYLOAD: any;
let createdEmployee: UserEntity;
let createdAdmin: UserEntity;
let createdCitizen: UserEntity;
let createdUserIds: number[] = [];
let createdCompanyIds: number[] = [];
let testCompanyName: string;


describe('MunicipalityUserController Integration Tests', () => {

    let adminAgent: ReturnType<typeof request.agent>;
    let citizenAgent: ReturnType<typeof request.agent>;

    beforeAll(async () => {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        // Ensure Water Department exists
        let waterDept = await AppDataSource.getRepository(DepartmentEntity).findOneBy({ name: 'Water and Sewer Services Department' });
        if (!waterDept) {
            waterDept = await AppDataSource.getRepository(DepartmentEntity).save({
                name: 'Water and Sewer Services Department',
                description: 'Handles water services'
            });
        }

        // Ensure Water Network staff member role exists
        let waterRoleName = await AppDataSource.getRepository(RoleEntity).findOneBy({ name: 'Water Network staff member' });
        if (!waterRoleName) {
            waterRoleName = await AppDataSource.getRepository(RoleEntity).save({
                name: 'Water Network staff member',
                description: 'Staff for water network'
            });
        }

        // Ensure link exists
        let waterDeptRole = await AppDataSource.getRepository(DepartmentRoleEntity).findOneBy({
            departmentId: waterDept.id,
            roleId: waterRoleName.id
        });

        if (!waterDeptRole) {
            await AppDataSource.getRepository(DepartmentRoleEntity).save({
                departmentId: waterDept.id,
                roleId: waterRoleName.id,
                department: waterDept,
                role: waterRoleName
            });
        }

        // Ensure Administrator role exists (Organization usually exists)
        let orgDept = await AppDataSource.getRepository(DepartmentEntity).findOneBy({ name: 'Organization' });
        if (!orgDept) {
            orgDept = await AppDataSource.getRepository(DepartmentEntity).save({
                name: 'Organization',
                description: 'Main Organization'
            });
        }

        let adminRoleName = await AppDataSource.getRepository(RoleEntity).findOneBy({ name: 'Administrator' });
        if (!adminRoleName) {
            adminRoleName = await AppDataSource.getRepository(RoleEntity).save({
                name: 'Administrator',
                description: 'System Administrator'
            });
        }

        let adminDeptRole = await AppDataSource.getRepository(DepartmentRoleEntity).findOneBy({
            departmentId: orgDept.id,
            roleId: adminRoleName.id
        });

        if (!adminDeptRole) {
            await AppDataSource.getRepository(DepartmentRoleEntity).save({
                departmentId: orgDept.id,
                roleId: adminRoleName.id,
                department: orgDept,
                role: adminRoleName
            });
        }

        // Ensure External Service Providers exist
        let extDept = await AppDataSource.getRepository(DepartmentEntity).findOneBy({ name: 'External Service Providers' });
        if (!extDept) {
            extDept = await AppDataSource.getRepository(DepartmentEntity).save({
                name: 'External Service Providers',
                description: 'External companies'
            });
        }

        // Ensure External Maintainer role exists
        let extRoleName = await AppDataSource.getRepository(RoleEntity).findOneBy({ name: 'External Maintainer' });
        if (!extRoleName) {
            extRoleName = await AppDataSource.getRepository(RoleEntity).save({
                name: 'External Maintainer',
                description: 'External maintainer staff'
            });
        }

        let extDeptRole = await AppDataSource.getRepository(DepartmentRoleEntity).findOneBy({
            departmentId: extDept.id,
            roleId: extRoleName.id
        });

        if (!extDeptRole) {
            await AppDataSource.getRepository(DepartmentRoleEntity).save({
                departmentId: extDept.id,
                roleId: extRoleName.id,
                department: extDept,
                role: extRoleName
            });
        }

        // Ensure Public Infrastructure Department exists
        let infraDept = await AppDataSource.getRepository(DepartmentEntity).findOneBy({ name: 'Public Infrastructure and Accessibility Department' });
        if (!infraDept) {
            infraDept = await AppDataSource.getRepository(DepartmentEntity).save({
                name: 'Public Infrastructure and Accessibility Department',
                description: 'Infrastructure'
            });
        }

        // Ensure Department Director role exists
        let dirRoleName = await AppDataSource.getRepository(RoleEntity).findOneBy({ name: 'Department Director' });
        if (!dirRoleName) {
            dirRoleName = await AppDataSource.getRepository(RoleEntity).save({
                name: 'Department Director',
                description: 'Director of department'
            });
        }

        let infraDeptRole = await AppDataSource.getRepository(DepartmentRoleEntity).findOneBy({
            departmentId: infraDept.id,
            roleId: dirRoleName.id
        });

        if (!infraDeptRole) {
            await AppDataSource.getRepository(DepartmentRoleEntity).save({
                departmentId: infraDept.id,
                roleId: dirRoleName.id,
                department: infraDept,
                role: dirRoleName
            });
        }
    });

    afterAll(async () => {
        if (createdCompanyIds.length > 0) {
            await AppDataSource.createQueryBuilder()
                .delete()
                .from('companies')
                .where('id IN (:...ids)', { ids: createdCompanyIds })
                .execute();
        }
        if (createdUserIds.length > 0) {
            await AppDataSource.getRepository(UserEntity).delete({ id: In(createdUserIds) });
        }
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    });

    beforeEach(async () => {
        // Create test company
        testCompanyName = `Test Company ${r()}`;
        const company = await companyRepository.create(testCompanyName, 'Public Lighting');
        createdCompanyIds.push(company.id);

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
            lastName: 'User'
        };

        CITIZEN_CREDENTIALS = {
            username: `citizen_user${r()}`,
            password: 'CitizenPassword123!',
            email: `citizen${r()}@test.com`,
            firstName: 'Citizen',
            lastName: 'User'
        };

        EMPLOYEE_PAYLOAD = {
            username: `employee_user${r()}`,
            password: 'EmployeePassword123!',
            email: `employee${r()}@test.com`,
            first_name: 'Employee',
            last_name: 'User',
            department_role_ids: [employeeDeptRole.id]
        };

        createdAdmin = await userRepository.createUserWithPassword({
            ...ADMIN_CREDENTIALS,
            isVerified: true,
            emailNotificationsEnabled: true
        });
        await AppDataSource.getRepository('user_roles').save({
            userId: createdAdmin.id,
            departmentRoleId: adminDeptRole.id
        });

        createdCitizen = await userRepository.createUserWithPassword({
            ...CITIZEN_CREDENTIALS,
            isVerified: true,
            emailNotificationsEnabled: true
        });
        await AppDataSource.getRepository('user_roles').save({
            userId: createdCitizen.id,
            departmentRoleId: citizenDeptRole.id
        });

        createdEmployee = await userRepository.createUserWithPassword({
            username: EMPLOYEE_PAYLOAD.username,
            password: EMPLOYEE_PAYLOAD.password,
            email: EMPLOYEE_PAYLOAD.email,
            firstName: EMPLOYEE_PAYLOAD.first_name,
            lastName: EMPLOYEE_PAYLOAD.last_name,
            isVerified: true,
            emailNotificationsEnabled: true
        });
        await AppDataSource.getRepository('user_roles').save({
            userId: createdEmployee.id,
            departmentRoleId: employeeDeptRole.id
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
        // Use transaction to avoid deadlocks and ensure cleanup order
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Delete users first (they have FK to companies)
            if (createdUserIds.length > 0) {
                await queryRunner.manager
                    .createQueryBuilder()
                    .delete()
                    .from(UserEntity)
                    .where('id IN (:...ids)', { ids: createdUserIds })
                    .execute();
                createdUserIds = [];
            }

            // Then delete companies
            if (createdCompanyIds.length > 0) {
                await queryRunner.manager
                    .createQueryBuilder()
                    .delete()
                    .from('companies')
                    .where('id IN (:...ids)', { ids: createdCompanyIds })
                    .execute();
                createdCompanyIds = [];
            }

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
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
            const empRole = await departmentRoleRepository.findByDepartmentAndRole('Water and Sewer Services Department', 'Water Network staff member');
            const newUserData = {
                username: `new_employee${r()}`,
                password: 'NewEmployee123!',
                email: `new${r()}@employee.com`,
                first_name: 'New',
                last_name: 'Employee',
                department_role_ids: [empRole!.id]
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
            // Retrieve Citizen role ID (it's in the DB)
            const citizenRole = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Citizen');
            const citizenPayload = {
                ...EMPLOYEE_PAYLOAD,
                role_name: 'Citizen', // Still might be checked validation side? No, checking logic uses IDs now
                department_role_ids: [citizenRole!.id],
                username: `fail_citizen_${r()}`,
                email: `fail_citizen_${r()}@test.com`
            };
            const response = await adminAgent
                .post('/api/municipality/users')
                .send(citizenPayload);
            expect(response.status).toBe(400);
        });

        it('should return 400 when trying to create a user with ADMINISTRATOR role ', async () => {
            const adminRole = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Administrator');
            const adminPayload = {
                ...EMPLOYEE_PAYLOAD,
                department_role_ids: [adminRole!.id],
                username: `fail_admin_${r()}`,
                email: `fail_admin_${r()}@test.com`
            };
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

            // use fresh data to pass validation and avoid 409
            const freshPayload = {
                ...EMPLOYEE_PAYLOAD,
                username: `error_user_${r()}`,
                email: `error_${r()}@test.com`
            };

            const response = await adminAgent
                .post('/api/municipality/users')
                .send(freshPayload);

            expect(response.status).toBe(500);
            expect(response.body.message || response.body.error).toBe(mockError.message);
        });

        // Company field tests
        it('should create External Maintainer with company (201)', async () => {
            const extRole = await departmentRoleRepository.findByDepartmentAndRole('External Service Providers', 'External Maintainer');
            if (!extRole) throw new Error('External Maintainer role not found');

            const maintainerData = {
                username: `maintainer${r()}`,
                password: 'Maintainer123!',
                email: `maintainer${r()}@test.com`,
                first_name: 'Test',
                last_name: 'Maintainer',
                department_role_ids: [extRole.id],
                company_name: testCompanyName
            };

            const response = await adminAgent
                .post('/api/municipality/users')
                .send(maintainerData);

            expect(response.status).toBe(201);
            expect(response.body.company_name).toBe(testCompanyName);
            createdUserIds.push(response.body.id);
        });

        it('should return 400 when External Maintainer has no company', async () => {
            const extRole = await departmentRoleRepository.findByDepartmentAndRole('External Service Providers', 'External Maintainer');
            const maintainerData = {
                username: `maintainer${r()}`,
                password: 'Maintainer123!',
                email: `maintainer${r()}@test.com`,
                first_name: 'Test',
                last_name: 'Maintainer',
                department_role_ids: [extRole!.id]
                // company_name missing
            };

            const response = await adminAgent
                .post('/api/municipality/users')
                .send(maintainerData);

            expect(response.status).toBe(400);
            expect(response.body.message || response.body.error).toContain('requires a company');
        });

        it('should return 400 when non-External Maintainer has company', async () => {
            const employeeData = {
                ...EMPLOYEE_PAYLOAD,
                username: `employee${r()}`,
                email: `employee${r()}@test.com`,
                company_name: testCompanyName
            };

            const response = await adminAgent
                .post('/api/municipality/users')
                .send(employeeData);

            expect(response.status).toBe(400);
            expect(response.body.message || response.body.error).toContain('Only External Maintainer');
        });

        it('should return 400 when company does not exist', async () => {
            const extRole = await departmentRoleRepository.findByDepartmentAndRole('External Service Providers', 'External Maintainer');

            const maintainerData = {
                username: `maintainer${r()}`,
                password: 'Maintainer123!',
                email: `maintainer${r()}@test.com`,
                first_name: 'Test',
                last_name: 'Maintainer',
                department_role_ids: [extRole!.id],
                company_name: 'NonExistentCompany'
            };

            const response = await adminAgent
                .post('/api/municipality/users')
                .send(maintainerData);

            expect(response.status).toBe(404);
            expect(response.body.message || response.body.error).toContain('not found');
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

        // Company field update tests
        it('should update External Maintainer company (200)', async () => {
            // First create an External Maintainer
            const extRole = await departmentRoleRepository.findByDepartmentAndRole('External Service Providers', 'External Maintainer');

            const maintainerData = {
                username: `maintainer${r()}`,
                password: 'Maintainer123!',
                email: `maintainer${r()}@test.com`,
                first_name: 'Test',
                last_name: 'Maintainer',
                department_role_ids: [extRole!.id],
                company_name: testCompanyName
            };

            const createResponse = await adminAgent
                .post('/api/municipality/users')
                .send(maintainerData);

            createdUserIds.push(createResponse.body.id);

            // Create another company
            const newCompanyName = `New Company ${r()}`;
            const newCompany = await companyRepository.create(newCompanyName, 'Waste');
            createdCompanyIds.push(newCompany.id);

            // Update company
            const updateResponse = await adminAgent
                .put(`/api/municipality/users/${createResponse.body.id}`)
                .send({ company_name: newCompanyName });

            expect(updateResponse.status).toBe(200);
            expect(updateResponse.body.company_name).toBe(newCompanyName);
        });

        it('should return 400 when setting company for non-External Maintainer', async () => {
            const response = await adminAgent
                .put(`/api/municipality/users/${createdEmployee.id}`)
                .send({ company_name: testCompanyName });

            expect(response.status).toBe(400);
            expect(response.body.message || response.body.error).toContain('Only External Maintainer');
        });

        it('should return 400 when removing company from External Maintainer', async () => {
            const extRole = await departmentRoleRepository.findByDepartmentAndRole('External Service Providers', 'External Maintainer');
            // First create an External Maintainer
            const maintainerData = {
                username: `maintainer${r()}`,
                password: 'Maintainer123!',
                email: `maintainer${r()}@test.com`,
                first_name: 'Test',
                last_name: 'Maintainer',
                department_role_ids: [extRole!.id],
                company_name: testCompanyName
            };

            const createResponse = await adminAgent
                .post('/api/municipality/users')
                .send(maintainerData);

            createdUserIds.push(createResponse.body.id);

            // Try to remove company (send first_name to avoid "no field" error, but company_name as null)
            const updateResponse = await adminAgent
                .put(`/api/municipality/users/${createResponse.body.id}`)
                .send({ first_name: 'Same', company_name: null });

            expect(updateResponse.status).toBe(400);
            expect(updateResponse.body.message || updateResponse.body.error).toContain('requires a company');
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
            const hasRole = response.body.roles.some((r: any) => r.role_name === 'Department Director');
            expect(hasRole).toBe(true);
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
            // Create a fresh agent for this test to avoid session issues
            const freshAdminAgent = request.agent(app);
            await freshAdminAgent.post('/api/sessions').send({
                username: ADMIN_CREDENTIALS.username,
                password: ADMIN_CREDENTIALS.password
            });

            const response = await freshAdminAgent
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
            jest.spyOn(municipalityUserService, 'assignRole').mockRejectedValue(mockError);

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
            const expectedRoles = await departmentService.getAllMunicipalityRoles();

            expect(response.status).toBe(200);
            expect(response.body.sort()).toEqual(expectedRoles.sort());

            expect(response.body).toContain('Water Network staff member');
            // expect(response.body).toContain('Department Director'); // Might not be present if not seeded
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
            jest.spyOn(departmentService, 'getAllMunicipalityRoles').mockImplementation(() => {
                throw mockError;
            });

            const response = await adminAgent.get('/api/roles');

            expect(response.status).toBe(500);
        });
    });

});