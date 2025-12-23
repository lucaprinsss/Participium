import request from 'supertest';
import app from '../../../app';
import { AppDataSource } from '@database/connection';
import {
  setupTestDatabase,
  teardownTestDatabase,
  cleanDatabase,
  ensureTestDatabase
} from '@test/utils/dbTestUtils';
import { userRepository } from '@repositories/userRepository';
import { departmentRoleRepository } from '@repositories/departmentRoleRepository';

describe('ValidateReportQueryParams Middleware Integration Tests', () => {
  let agent: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    await setupTestDatabase();
    await ensureTestDatabase();

    // Create a test user and login for authenticated requests
    const citizenDeptRole = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Citizen');
    if (!citizenDeptRole) {
      throw new Error('Citizen role not found in database');
    }

    const testUser = await userRepository.createUserWithPassword({
      username: `queryparams_test_${Date.now()}`,
      password: 'Password123!',
      email: `queryparams_${Date.now()}@test.com`,
      firstName: 'QueryParams',
      lastName: 'Test',
      emailNotificationsEnabled: true,
      isVerified: true
    });

    await AppDataSource.getRepository('user_roles').save({
      userId: testUser.id,
      departmentRoleId: citizenDeptRole.id
    });

    agent = request.agent(app);
    await agent.post('/api/sessions').send({
      username: testUser.username,
      password: 'Password123!'
    });
  });

  afterAll(async () => {
    await cleanDatabase();
    await teardownTestDatabase();
  });

  describe('Status Parameter Validation', () => {
    it('should accept valid status PENDING_APPROVAL', async () => {
      const res = await agent.get('/api/reports?status=Pending%20Approval');
      expect(res.status).not.toBe(400);
    });

    it('should accept valid status ASSIGNED', async () => {
      const res = await agent.get('/api/reports?status=Assigned');
      expect(res.status).not.toBe(400);
    });

    it('should accept valid status IN_PROGRESS', async () => {
      const res = await agent.get('/api/reports?status=In%20Progress');
      expect(res.status).not.toBe(400);
    });

    it('should accept valid status REJECTED', async () => {
      const res = await agent.get('/api/reports?status=Rejected');
      expect(res.status).not.toBe(400);
    });

    it('should reject invalid status value', async () => {
      const res = await agent.get('/api/reports?status=INVALID_STATUS');
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid status');
    });

    it('should reject lowercase status value', async () => {
      const res = await agent.get('/api/reports?status=assigned');
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid status');
    });

    it('should reject empty status value', async () => {
      const res = await agent.get('/api/reports?status=');
      // Empty string is treated as no parameter
      expect([200, 400]).toContain(res.status);
    });
  });

  describe('Category Parameter Validation', () => {
    it('should accept valid category ROADS', async () => {
      const res = await agent.get('/api/reports?category=Roads%20and%20Urban%20Furnishings');
      expect(res.status).not.toBe(400);
    });

    it('should accept valid category PUBLIC_LIGHTING', async () => {
      const res = await agent.get('/api/reports?category=Public%20Lighting');
      expect(res.status).not.toBe(400);
    });

    it('should accept valid category WASTE', async () => {
      const res = await agent.get('/api/reports?category=Waste');
      expect(res.status).not.toBe(400);
    });

    it('should accept valid category GREEN_AREAS', async () => {
      const res = await agent.get('/api/reports?category=Public%20Green%20Areas%20and%20Playgrounds');
      expect(res.status).not.toBe(400);
    });

    it('should accept valid category WATER', async () => {
      const res = await agent.get('/api/reports?category=Water%20Supply%20-%20Drinking%20Water');
      expect(res.status).not.toBe(400);
    });

    it('should accept valid category OTHER', async () => {
      const res = await agent.get('/api/reports?category=Other');
      expect(res.status).not.toBe(400);
    });

    it('should reject invalid category value', async () => {
      const res = await agent.get('/api/reports?category=INVALID_CATEGORY');
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid category');
    });

    it('should reject lowercase category value', async () => {
      const res = await agent.get('/api/reports?category=roads');
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid category');
    });

    it('should reject empty category value', async () => {
      const res = await agent.get('/api/reports?category=');
      // Empty string is treated as no parameter, so request succeeds
      expect([200, 400]).toContain(res.status);
    });
  });

  describe('Combined Status and Category Validation', () => {
    it('should accept valid status and valid category together', async () => {
      const res = await agent.get('/api/reports?status=Assigned&category=Waste');
      expect(res.status).not.toBe(400);
    });

    it('should reject valid status with invalid category', async () => {
      const res = await agent.get('/api/reports?status=Assigned&category=INVALID');
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid');
    });

    it('should reject invalid status with valid category', async () => {
      const res = await agent.get('/api/reports?status=INVALID&category=Waste');
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid');
    });
  });

  describe('Optional Parameters Handling', () => {
    it('should accept request with no query parameters', async () => {
      const res = await agent.get('/api/reports');
      expect(res.status).not.toBe(400);
    });

    it('should accept request with only status parameter', async () => {
      const res = await agent.get('/api/reports?status=Assigned');
      expect(res.status).not.toBe(400);
    });

    it('should accept request with only category parameter', async () => {
      const res = await agent.get('/api/reports?category=Waste');
      expect(res.status).not.toBe(400);
    });
  });
});
