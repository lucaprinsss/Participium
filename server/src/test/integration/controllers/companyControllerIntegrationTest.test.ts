import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import { AppDataSource } from "@database/connection";
import app from "../../../app";
import { userEntity } from "@models/entity/userEntity";
import { userRepository } from '@repositories/userRepository';
import { departmentRoleRepository } from '@repositories/departmentRoleRepository';
import { In } from 'typeorm';

const r = () => `_${Math.floor(Math.random() * 1000000)}`;

describe('CompanyController Integration Tests', () => {
  let adminAgent: ReturnType<typeof request.agent>;
  let techStaffAgent: ReturnType<typeof request.agent>;
  let createdUserIds: number[] = [];
  let createdCompanyIds: number[] = [];

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });

  afterAll(async () => {
    if (createdUserIds.length > 0) {
      await AppDataSource.getRepository(userEntity).delete({ id: In(createdUserIds) });
    }
    if (createdCompanyIds.length > 0) {
      await AppDataSource.query('DELETE FROM companies WHERE id = ANY($1)', [createdCompanyIds]);
    }
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  afterEach(async () => {
    if (createdUserIds.length > 0) {
      await AppDataSource.getRepository(userEntity).delete({ id: In(createdUserIds) });
      createdUserIds = [];
    }
    if (createdCompanyIds.length > 0) {
      await AppDataSource.query('DELETE FROM companies WHERE id = ANY($1)', [createdCompanyIds]);
      createdCompanyIds = [];
    }
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
      departmentRoleId: adminRole.id,
      emailNotificationsEnabled: true,
      isVerified: true
    });
    createdUserIds.push(adminUser.id);

    adminAgent = request.agent(app);
    await adminAgent.post('/api/sessions').send({
      username: adminUser.username,
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
      departmentRoleId: techStaffRole.id,
      emailNotificationsEnabled: true,
      isVerified: true
    });
    createdUserIds.push(techStaffUser.id);

    techStaffAgent = request.agent(app);
    await techStaffAgent.post('/api/sessions').send({
      username: techStaffUser.username,
      password: 'Password123!'
    });
  });

  describe('POST /api/companies', () => {
    it('should create a new company as admin (201)', async () => {
      const companyData = {
        name: `Test Company ${r()}`,
        category: 'Public Lighting'
      };

      const response = await adminAgent
        .post('/api/companies')
        .send(companyData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(companyData.name);
      expect(response.body.category).toBe(companyData.category);
      expect(response.body).toHaveProperty('created_at');

      createdCompanyIds.push(response.body.id);
    });

    it('should fail to create company without admin role (403)', async () => {
      const companyData = {
        name: `Test Company ${r()}`,
        category: 'Public Lighting'
      };

      const response = await techStaffAgent
        .post('/api/companies')
        .send(companyData);

      expect(response.status).toBe(403);
    });

    it('should fail to create company if not authenticated (401)', async () => {
      const unauthAgent = request.agent(app);
      const companyData = {
        name: `Test Company ${r()}`,
        category: 'Public Lighting'
      };

      const response = await unauthAgent
        .post('/api/companies')
        .send(companyData);

      expect(response.status).toBe(401);
    });

    it('should fail with invalid category (400)', async () => {
      const companyData = {
        name: `Test Company ${r()}`,
        category: 'Invalid Category'
      };

      const response = await adminAgent
        .post('/api/companies')
        .send(companyData);

      expect(response.status).toBe(400);
    });

    it('should fail with duplicate company name (409)', async () => {
      const companyData = {
        name: `Unique Company ${r()}`,
        category: 'Public Lighting'
      };

      // Create first company
      const firstResponse = await adminAgent
        .post('/api/companies')
        .send(companyData);

      expect(firstResponse.status).toBe(201);
      createdCompanyIds.push(firstResponse.body.id);

      // Try to create duplicate
      const secondResponse = await adminAgent
        .post('/api/companies')
        .send(companyData);

      expect(secondResponse.status).toBe(409);
    });
  });

  describe('GET /api/companies', () => {
    it('should get all companies as admin (200)', async () => {
      // Create a test company first
      const companyData = {
        name: `Test Company ${r()}`,
        category: 'Roads and Urban Furnishings'
      };

      const createResponse = await adminAgent
        .post('/api/companies')
        .send(companyData);

      expect(createResponse.status).toBe(201);
      createdCompanyIds.push(createResponse.body.id);

      // Get all companies
      const response = await adminAgent.get('/api/companies');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      const createdCompany = response.body.find((c: any) => c.id === createResponse.body.id);
      expect(createdCompany).toBeDefined();
      expect(createdCompany.name).toBe(companyData.name);
      expect(createdCompany.category).toBe(companyData.category);
    });

    it('should fail to get companies without admin role (403)', async () => {
      const response = await techStaffAgent.get('/api/companies');
      expect(response.status).toBe(403);
    });

    it('should fail to get companies if not authenticated (401)', async () => {
      const unauthAgent = request.agent(app);
      const response = await unauthAgent.get('/api/companies');
      expect(response.status).toBe(401);
    });
  });
});
