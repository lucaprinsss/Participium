import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';
import { AppDataSource } from "@database/connection";
import app from "../../../app";
import { UserEntity } from "@models/entity/userEntity";
import { userRepository } from '@repositories/userRepository';
import { departmentRoleRepository } from '@repositories/departmentRoleRepository';
import { departmentService } from '@services/departmentService';
import { In } from 'typeorm';

const r = () => `_${Math.floor(Math.random() * 1000000)}`;

describe('DepartmentController Integration Tests', () => {
    let adminAgent: ReturnType<typeof request.agent>;
    let citizenAgent: ReturnType<typeof request.agent>;
    let techStaffAgent: ReturnType<typeof request.agent>;
    let createdUserIds: number[] = [];

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

    afterEach(async () => {
        if (createdUserIds.length > 0) {
            await AppDataSource.getRepository(UserEntity).delete({ id: In(createdUserIds) });
            createdUserIds = [];
        }
        jest.restoreAllMocks();
    });

    beforeEach(async () => {
        // Create Admin user
        const adminRole = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Administrator');
        if (!adminRole) throw new Error('Admin role not found');

        const adminUser = await userRepository.createUserWithPassword({
            username: `admin${r()}`,
            password: 'Password123!',
            email: `admin${r()}@test.com`,
            firstName: 'Admin',
            lastName: 'User',
            emailNotificationsEnabled: true,
            isVerified: true,
            telegramLinkConfirmed: false,
        });
        createdUserIds.push(adminUser.id);

        // Assign admin role using user_roles table (V5.0 multi-role support)
        await AppDataSource.getRepository('user_roles').save({
            userId: adminUser.id,
            departmentRoleId: adminRole.id
        });

        adminAgent = request.agent(app);
        await adminAgent.post('/api/sessions').send({
            username: adminUser.username,
            password: 'Password123!'
        });

        // Create Citizen user
        const citizenRole = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Citizen');
        if (!citizenRole) throw new Error('Citizen role not found');

        const citizenUser = await userRepository.createUserWithPassword({
            username: `citizen${r()}`,
            password: 'Password123!',
            email: `citizen${r()}@test.com`,
            firstName: 'Citizen',
            lastName: 'User',
            emailNotificationsEnabled: true,
            isVerified: true,
            telegramLinkConfirmed: false,
        });
        createdUserIds.push(citizenUser.id);

        await AppDataSource.getRepository('user_roles').save({
            userId: citizenUser.id,
            departmentRoleId: citizenRole.id
        });

        citizenAgent = request.agent(app);
        await citizenAgent.post('/api/sessions').send({
            username: citizenUser.username,
            password: 'Password123!'
        });

        // Create Technical Staff user
        const techStaffRole = await departmentRoleRepository.findByDepartmentAndRole('Public Lighting Department', 'Electrical staff member');
        if (!techStaffRole) throw new Error('Technical staff role not found');

        const techStaffUser = await userRepository.createUserWithPassword({
            username: `techstaff${r()}`,
            password: 'Password123!',
            email: `techstaff${r()}@test.com`,
            firstName: 'Tech',
            lastName: 'Staff',
            emailNotificationsEnabled: true,
            isVerified: true,
            telegramLinkConfirmed: false,
        });
        createdUserIds.push(techStaffUser.id);

        await AppDataSource.getRepository('user_roles').save({
            userId: techStaffUser.id,
            departmentRoleId: techStaffRole.id
        });

        techStaffAgent = request.agent(app);
        await techStaffAgent.post('/api/sessions').send({
            username: techStaffUser.username,
            password: 'Password123!'
        });
    });

    // --- GET /api/departments (Get Municipality Departments) ---
    describe('GET /api/departments', () => {
        it('should return 200 and departments list if user is admin', async () => {
            const response = await adminAgent.get('/api/departments');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);

            // Each department should have id and name
            response.body.forEach((dept: any) => {
                expect(dept).toHaveProperty('id');
                expect(dept).toHaveProperty('name');
            });
        });

        it('should not include Organization department in the response', async () => {
            const response = await adminAgent.get('/api/departments');

            expect(response.status).toBe(200);
            const departmentNames = response.body.map((dept: any) => dept.name);
            expect(departmentNames).not.toContain('Organization');
        });

        it('should include municipality departments like Water and Sewer Services', async () => {
            const response = await adminAgent.get('/api/departments');

            expect(response.status).toBe(200);
            const departmentNames = response.body.map((dept: any) => dept.name);
            // Expect at least some municipality departments to be present
            expect(departmentNames.some((name: string) =>
                name.includes('Department') || name.includes('Services')
            )).toBe(true);
        });

        it('should fail if not authenticated (401)', async () => {
            const response = await request(app).get('/api/departments');
            expect(response.status).toBe(401);
        });

        it('should fail if authenticated as Citizen (403)', async () => {
            const response = await citizenAgent.get('/api/departments');
            expect(response.status).toBe(403);
        });

        it('should fail if authenticated as non-admin staff (403)', async () => {
            const response = await techStaffAgent.get('/api/departments');
            expect(response.status).toBe(403);
        });

        it('should return 500 if service throws an error', async () => {
            jest.spyOn(departmentService, 'getMunicipalityDepartments').mockRejectedValue(
                new Error('Database connection failed')
            );

            const response = await adminAgent.get('/api/departments');

            expect(response.status).toBe(500);
        });
    });

    // --- GET /api/departments/:id/roles (Get Roles By Department) ---
    describe('GET /api/departments/:id/roles', () => {
        let validDepartmentId: number;

        beforeEach(async () => {
            // Get a valid department ID from the database
            const departments = await departmentService.getMunicipalityDepartments();
            if (departments.length > 0) {
                validDepartmentId = departments[0].id;
            }
        });

        it('should return 200 and roles list if admin and department exists', async () => {
            const response = await adminAgent.get(`/api/departments/${validDepartmentId}/roles`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should return roles with proper structure', async () => {
            const response = await adminAgent.get(`/api/departments/${validDepartmentId}/roles`);

            expect(response.status).toBe(200);
            // If roles exist, check structure
            if (response.body.length > 0) {
                response.body.forEach((role: any) => {
                    expect(role).toHaveProperty('id');
                    expect(role).toHaveProperty('name');
                });
            }
        });

        it('should return 404 if department does not exist', async () => {
            const response = await adminAgent.get('/api/departments/99999/roles');

            expect(response.status).toBe(404);
            expect(response.body.message || response.body.error).toContain('not found');
        });

        it('should return 400 if department ID is not a number', async () => {
            const response = await adminAgent.get('/api/departments/abc/roles');

            expect(response.status).toBe(400);
            expect(response.body.message || response.body.error).toContain('Invalid');
        });

        it('should return 400 if department ID is zero', async () => {
            const response = await adminAgent.get('/api/departments/0/roles');

            expect(response.status).toBe(400);
        });

        it('should return 400 if department ID is negative', async () => {
            const response = await adminAgent.get('/api/departments/-5/roles');

            expect(response.status).toBe(400);
        });

        it('should return 400 if department ID is a decimal', async () => {
            const response = await adminAgent.get('/api/departments/3.14/roles');

            expect(response.status).toBe(400);
        });

        it('should fail if not authenticated (401)', async () => {
            const response = await request(app).get(`/api/departments/${validDepartmentId}/roles`);
            expect(response.status).toBe(401);
        });

        it('should fail if authenticated as Citizen (403)', async () => {
            const response = await citizenAgent.get(`/api/departments/${validDepartmentId}/roles`);
            expect(response.status).toBe(403);
        });

        it('should fail if authenticated as non-admin staff (403)', async () => {
            const response = await techStaffAgent.get(`/api/departments/${validDepartmentId}/roles`);
            expect(response.status).toBe(403);
        });

        it('should return 500 if service throws an error', async () => {
            jest.spyOn(departmentService, 'getRolesByDepartment').mockRejectedValue(
                new Error('Database error')
            );

            const response = await adminAgent.get(`/api/departments/${validDepartmentId}/roles`);

            expect(response.status).toBe(500);
        });
    });
});
