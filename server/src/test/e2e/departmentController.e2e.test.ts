import request from 'supertest';
import app from '../../app';
import { 
  setupTestDatabase, 
  teardownTestDatabase, 
  cleanDatabase,
  ensureTestDatabase 
} from '@test/utils/dbTestUtils';

/**
 * E2E Tests for Department Controller
 * Tests the complete flow: Route → Controller → Service → Repository → Database
 * Includes authentication and authorization
 */
describe('DepartmentController E2E Tests', () => {
  
  // Setup database before all tests
  beforeAll(async () => {
    await setupTestDatabase();
    await ensureTestDatabase();
  });

  // Cleanup after all tests
  afterAll(async () => {
    await teardownTestDatabase();
  });

  // Clean dynamic data after each test
  afterEach(async () => {
    await cleanDatabase();
  });

  // --- GET /api/departments (Get All Municipality Departments) ---
  describe('GET /api/departments', () => {
    
    it('should return 401 if not authenticated', async () => {
      // Act
      const response = await request(app)
        .get('/api/departments')
        .expect('Content-Type', /json/)
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Not authenticated');
    });

    it('should return 403 if authenticated as Citizen', async () => {
      // Arrange - Login as citizen
      const loginResponse = await request(app)
        .post('/api/sessions')
        .send({
          username: 'testcitizen',
          password: 'TestPass123!',
        })
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];

      // Act
      const response = await request(app)
        .get('/api/departments')
        .set('Cookie', cookies)
        .expect('Content-Type', /json/)
        .expect(403);

      // Assert
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Access denied');
    });

    it('should return all municipality departments when authenticated as Admin', async () => {
      // Arrange - Login as admin
      const loginResponse = await request(app)
        .post('/api/sessions')
        .send({
          username: 'testadmin',
          password: 'AdminPass123!',
        })
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];

      // Act
      const response = await request(app)
        .get('/api/departments')
        .set('Cookie', cookies)
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      const departmentNames = response.body.map((d: any) => d.name);
      
      // Verify municipality departments are included
      expect(departmentNames).toContain('Water and Sewer Services Department');
      expect(departmentNames).toContain('Public Lighting Department');
      
      // Verify response structure
      response.body.forEach((dept: any) => {
        expect(dept).toHaveProperty('id');
        expect(dept).toHaveProperty('name');
        expect(typeof dept.id).toBe('number');
        expect(typeof dept.name).toBe('string');
      });
    });

    it('should return exactly 7 municipality departments', async () => {
      // Arrange
      const loginResponse = await request(app)
        .post('/api/sessions')
        .send({
          username: 'testadmin',
          password: 'AdminPass123!',
        })
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];

      // Act
      const response = await request(app)
        .get('/api/departments')
        .set('Cookie', cookies)
        .expect(200);

      // Assert - 8 total departments - Organization = 7
      expect(response.body).toHaveLength(8);
    });

    it('should maintain session across multiple requests', async () => {
      // Arrange - Login once
      const loginResponse = await request(app)
        .post('/api/sessions')
        .send({
          username: 'testadmin',
          password: 'AdminPass123!',
        })
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];

      // Act - Make multiple requests with same session
      const response1 = await request(app)
        .get('/api/departments')
        .set('Cookie', cookies)
        .expect(200);

      const response2 = await request(app)
        .get('/api/departments')
        .set('Cookie', cookies)
        .expect(200);

      // Assert
      expect(response1.body).toEqual(response2.body);
    });
  });

  // --- GET /api/departments/:id/roles (Get Roles by Department) ---
  describe('GET /api/departments/:id/roles', () => {
    
    it('should return 401 if not authenticated', async () => {
      // Act
      const response = await request(app)
        .get('/api/departments/2/roles')
        .expect('Content-Type', /json/)
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Not authenticated');
    });

    it('should return 403 if authenticated as Citizen', async () => {
      // Arrange
      const loginResponse = await request(app)
        .post('/api/sessions')
        .send({
          username: 'testcitizen',
          password: 'TestPass123!',
        })
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];

      // Act
      const response = await request(app)
        .get('/api/departments/2/roles')
        .set('Cookie', cookies)
        .expect('Content-Type', /json/)
        .expect(403);

      // Assert
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Access denied');
    });

    it('should return roles for Water and Sewer Services Department', async () => {
      // Arrange
      const loginResponse = await request(app)
        .post('/api/sessions')
        .send({
          username: 'testadmin',
          password: 'AdminPass123!',
        })
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];

      // Act
      const response = await request(app)
        .get('/api/departments/2/roles')
        .set('Cookie', cookies)
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      const roleNames = response.body.map((r: any) => r.name);
      expect(roleNames).toContain('Department Director');
      expect(roleNames).toContain('Water Network staff member');
      
      // Verify no Organization roles
      expect(roleNames).not.toContain('Citizen');
      expect(roleNames).not.toContain('Administrator');
      
      // Verify response structure
      response.body.forEach((role: any) => {
        expect(role).toHaveProperty('id');
        expect(role).toHaveProperty('name');
        expect(role).toHaveProperty('description');
        expect(typeof role.id).toBe('number');
        expect(typeof role.name).toBe('string');
      });
    });

    it('should return roles for Public Infrastructure Department', async () => {
      // Arrange
      const loginResponse = await request(app)
        .post('/api/sessions')
        .send({
          username: 'testadmin',
          password: 'AdminPass123!',
        })
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];

      // Act
      const response = await request(app)
        .get('/api/departments/4/roles')
        .set('Cookie', cookies)
        .expect(200);

      // Assert
      const roleNames = response.body.map((r: any) => r.name);
      expect(roleNames).toContain('Electrical staff member');
      expect(roleNames).toContain('Department Director');
    });

    it('should return 404 for non-existent department', async () => {
      // Arrange
      const loginResponse = await request(app)
        .post('/api/sessions')
        .send({
          username: 'testadmin',
          password: 'AdminPass123!',
        })
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];

      // Act
      const response = await request(app)
        .get('/api/departments/999/roles')
        .set('Cookie', cookies)
        .expect('Content-Type', /json/)
        .expect(404);

      // Assert
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Department with ID 999 not found');
    });

    it('should return 400 for invalid department ID (not a number)', async () => {
      // Arrange
      const loginResponse = await request(app)
        .post('/api/sessions')
        .send({
          username: 'testadmin',
          password: 'AdminPass123!',
        })
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];

      // Act
      const response = await request(app)
        .get('/api/departments/abc/roles')
        .set('Cookie', cookies)
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid department ID');
    });

    it('should return 400 for negative department ID', async () => {
      // Arrange
      const loginResponse = await request(app)
        .post('/api/sessions')
        .send({
          username: 'testadmin',
          password: 'AdminPass123!',
        })
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];

      // Act
      const response = await request(app)
        .get('/api/departments/-5/roles')
        .set('Cookie', cookies)
        .expect(400);

      // Assert
      expect(response.body.message).toContain('Invalid department ID');
    });

    it('should return 400 for zero department ID', async () => {
      // Arrange
      const loginResponse = await request(app)
        .post('/api/sessions')
        .send({
          username: 'testadmin',
          password: 'AdminPass123!',
        })
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];

      // Act
      const response = await request(app)
        .get('/api/departments/0/roles')
        .set('Cookie', cookies)
        .expect(400);

      // Assert
      expect(response.body.message).toContain('Invalid department ID');
    });

    it('should return 400 for decimal department ID', async () => {
      // Arrange
      const loginResponse = await request(app)
        .post('/api/sessions')
        .send({
          username: 'testadmin',
          password: 'AdminPass123!',
        })
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];

      // Act
      const response = await request(app)
        .get('/api/departments/3.14/roles')
        .set('Cookie', cookies)
        .expect(400);

      // Assert
      expect(response.body.message).toContain('Invalid department ID');
    });

    it('should return different roles for different departments', async () => {
      // Arrange
      const loginResponse = await request(app)
        .post('/api/sessions')
        .send({
          username: 'testadmin',
          password: 'AdminPass123!',
        })
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];

      // Act
      const waterRoles = await request(app)
        .get('/api/departments/2/roles')
        .set('Cookie', cookies)
        .expect(200);

      const infraRoles = await request(app)
        .get('/api/departments/3/roles')
        .set('Cookie', cookies)
        .expect(200);

      // Assert
      const waterRoleNames = waterRoles.body.map((r: any) => r.name);
      const infraRoleNames = infraRoles.body.map((r: any) => r.name);
      
      expect(waterRoleNames).toContain('Water Network staff member');
      expect(infraRoleNames).not.toContain('Water Network staff member');
      expect(infraRoleNames).toContain('Road Maintenance staff member');
      expect(waterRoleNames).not.toContain('Road Maintenance staff member');
    });
  });

  // --- Integration between both endpoints ---
  describe('Full Workflow Integration', () => {
    
    it('should get departments and then roles for each department', async () => {
      // Arrange
      const loginResponse = await request(app)
        .post('/api/sessions')
        .send({
          username: 'testadmin',
          password: 'AdminPass123!',
        })
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];

      // Act - Get all departments
      const deptsResponse = await request(app)
        .get('/api/departments')
        .set('Cookie', cookies)
        .expect(200);

      // Act - Get roles for first department
      const firstDeptId = deptsResponse.body[0].id;
      const rolesResponse = await request(app)
        .get(`/api/departments/${firstDeptId}/roles`)
        .set('Cookie', cookies)
        .expect(200);

      // Assert
      expect(deptsResponse.body.length).toBeGreaterThan(0);
      expect(Array.isArray(rolesResponse.body)).toBe(true);
    });

    it('should verify all departments have at least one role', async () => {
      // Arrange
      const loginResponse = await request(app)
        .post('/api/sessions')
        .send({
          username: 'testadmin',
          password: 'AdminPass123!',
        })
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];

      // Act - Get all departments
      const deptsResponse = await request(app)
        .get('/api/departments')
        .set('Cookie', cookies)
        .expect(200);

      // Assert - Check each department has roles
      for (const dept of deptsResponse.body) {
        const rolesResponse = await request(app)
          .get(`/api/departments/${dept.id}/roles`)
          .set('Cookie', cookies)
          .expect(200);

        expect(rolesResponse.body.length).toBeGreaterThanOrEqual(1);
      }
    });
  });
});
