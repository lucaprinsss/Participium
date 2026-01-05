import request from 'supertest';
import app from '../../app';
import {
  setupTestDatabase,
  teardownTestDatabase,
  ensureTestDatabase
} from '@test/utils/dbTestUtils';
import { AppDataSource } from '@database/connection';
import { ReportCategory } from '@models/dto/ReportCategory';

describe('CompanyController E2E Tests', () => {
  let adminCookies: string[];
  let citizenCookies: string[];

  const ADMIN_USERNAME = 'testadmin';
  const ADMIN_PASSWORD = 'AdminPass123!';
  const CITIZEN_USERNAME = 'testcitizen';
  const CITIZEN_PASSWORD = 'TestPass123!';

  // Helper function to login and get cookies
  const loginAs = async (username: string, password: string): Promise<string[]> => {
    const response = await request(app)
      .post('/api/sessions')
      .send({ username, password })
      .expect(200);
    const cookies = response.headers['set-cookie'];
    return Array.isArray(cookies) ? cookies : [cookies];
  };

  beforeAll(async () => {
    await setupTestDatabase();
    await ensureTestDatabase();

    adminCookies = await loginAs(ADMIN_USERNAME, ADMIN_PASSWORD);
    citizenCookies = await loginAs(CITIZEN_USERNAME, CITIZEN_PASSWORD);
  });

  afterAll(async () => {
    await teardownTestDatabase();
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  afterEach(async () => {
    // Clean up only dynamically created test companies, not the ones from test-data.sql
    await AppDataSource.query(`DELETE FROM companies WHERE name LIKE 'Test Company%'`);
  });

  describe('POST /api/companies', () => {
    it('should create a new company as admin (201)', async () => {
      const newCompany = {
        name: 'Test Company New',
        category: ReportCategory.SEWER_SYSTEM
      };

      const response = await request(app)
        .post('/api/companies')
        .set('Cookie', adminCookies)
        .send(newCompany)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newCompany.name);
      expect(response.body.category).toBe(newCompany.category);
      expect(response.body).toHaveProperty('created_at');
    });

    it('should fail with invalid category (400)', async () => {
      const invalidCompany = {
        name: 'Test Company Invalid',
        category: 'INVALID_CATEGORY'
      };

      const response = await request(app)
        .post('/api/companies')
        .set('Cookie', adminCookies)
        .send(invalidCompany)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid category');
    });

    it('should fail with duplicate company name (409)', async () => {
      // Try to create a company with the same name as one from test-data.sql
      const duplicateCompany = {
        name: 'Lighting Solutions SRL',
        category: ReportCategory.PUBLIC_LIGHTING
      };

      const response = await request(app)
        .post('/api/companies')
        .set('Cookie', adminCookies)
        .send(duplicateCompany)
        .expect('Content-Type', /json/)
        .expect(409);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('already exists');
    });

    it('should fail without authentication (401)', async () => {
      const newCompany = {
        name: 'Test Company Unauth',
        category: ReportCategory.ROADS
      };

      const response = await request(app)
        .post('/api/companies')
        .send(newCompany)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should fail as non-admin user (403)', async () => {
      const newCompany = {
        name: 'Test Company Forbidden',
        category: ReportCategory.OTHER
      };

      const response = await request(app)
        .post('/api/companies')
        .set('Cookie', citizenCookies)
        .send(newCompany)
        .expect(403);

      expect(response.body).toHaveProperty('message');
    });

    it('should fail with missing required fields (400)', async () => {
      const invalidCompany = {
        name: 'Test Company No Category'
        // missing category
      };

      const response = await request(app)
        .post('/api/companies')
        .set('Cookie', adminCookies)
        .send(invalidCompany)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/companies', () => {
    it('should get all companies as admin (200)', async () => {
      const response = await request(app)
        .get('/api/companies')
        .set('Cookie', adminCookies)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(3);
      
      // Verify structure
      for (const company of response.body) {
        expect(company).toHaveProperty('id');
        expect(company).toHaveProperty('name');
        expect(company).toHaveProperty('category');
        expect(company).toHaveProperty('created_at');
      }

      // Verify test-data.sql companies are included
      const companyNames = response.body.map((c: any) => c.name);
      expect(companyNames).toContain('Lighting Solutions SRL');
      expect(companyNames).toContain('EcoWaste Management');
      expect(companyNames).toContain('Road Repair Co.');
    });

    it('should fail without authentication (401)', async () => {
      const response = await request(app)
        .get('/api/companies')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should fail as non-admin user (403)', async () => {
      const response = await request(app)
        .get('/api/companies')
        .set('Cookie', citizenCookies)
        .expect(403);

      expect(response.body).toHaveProperty('message');
    });

    it('should return companies ordered by name', async () => {
      const response = await request(app)
        .get('/api/companies')
        .set('Cookie', adminCookies)
        .expect(200);

      const names = response.body.map((c: any) => c.name);
      const sortedNames = [...names].sort((a, b) => a.localeCompare(b));
      expect(names).toEqual(sortedNames);
    });
  });
});
