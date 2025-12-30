import request from 'supertest';
import app from '../../app';
import { userRepository } from '@repositories/userRepository';
import {
  setupTestDatabase,
  teardownTestDatabase,
  cleanDatabase,
  ensureTestDatabase
} from '../utils/dbTestUtils';
import { AppDataSource } from '@database/connection';

// E2E Tests for Municipality User Controller
//  Uses real PostgreSQL test database with Docker
//  Tests only the functions covered in unit tests

describe('MunicipalityUserController E2E Tests', () => {
  // Helper function to login and get cookies
  const loginAs = async (username: string, password: string) => {
    const response = await request(app)
      .post('/api/sessions')
      .send({ username, password })
      .expect(200);
    return response.headers['set-cookie'];
  };

  // Helper to get department_role_id by role and department names
  const getDepartmentRoleId = async (roleName: string, departmentName: string): Promise<number> => {
    const result = await AppDataSource.query(`
      SELECT dr.id 
      FROM department_roles dr
      JOIN roles r ON dr.role_id = r.id
      JOIN departments d ON dr.department_id = d.id
      WHERE r.name = $1 AND d.name = $2
    `, [roleName, departmentName]);

    if (!result || result.length === 0) {
      throw new Error(`Department role not found for role: ${roleName}, department: ${departmentName}`);
    }

    return result[0].id;
  };

  // Helper function to create valid test data for municipality users
  const getValidMunicipalityUserData = async () => {
    const roleId = await getDepartmentRoleId('Road Maintenance staff member', 'Public Infrastructure and Accessibility Department');
    return {
      username: 'newmuniuser',
      email: 'newmuni@test.com',
      password: 'SecureMuni123!',
      first_name: 'Municipal',
      last_name: 'Officer',
      department_role_ids: [roleId]
    };
  };

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

  describe('POST /api/municipality/users - Create Municipality User', () => {


    it('should create municipality user successfully when authenticated as Admin', async () => {
      // Arrange
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');
      const roadRoleId = await getDepartmentRoleId('Road Maintenance staff member', 'Public Infrastructure and Accessibility Department');

      const userData = {
        username: 'newmuniuser',
        email: 'newmuni@test.com',
        password: 'SecureMuni123!',
        first_name: 'Municipal',
        last_name: 'Officer',
        department_role_ids: [roadRoleId]
      };

      // Act
      const response = await request(app)
        .post('/api/municipality/users')
        .set('Cookie', adminCookies)
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(201);

      // Assert
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('username', userData.username);
      expect(response.body).toHaveProperty('email', userData.email);
      expect(response.body).toHaveProperty('first_name', userData.first_name);
      expect(response.body).toHaveProperty('last_name', userData.last_name);
      expect(response.body).toHaveProperty('roles');
      expect(response.body.roles.some((r: any) => r.role_name === 'Road Maintenance staff member')).toBe(true);
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('passwordHash');

      // Verify user was created in database
      const userExists = await userRepository.existsUserByUsername(userData.username);
      expect(userExists).toBe(true);
    });

    it('should return 401 when not authenticated', async () => {
      // Arrange
      const userData = await getValidMunicipalityUserData();

      // Act
      const response = await request(app)
        .post('/api/municipality/users')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Not authenticated');
    });

    it('should return 403 when authenticated as Citizen', async () => {
      // Arrange
      const citizenCookies = await loginAs('testcitizen', 'TestPass123!');
      const userData = await getValidMunicipalityUserData();

      // Act
      const response = await request(app)
        .post('/api/municipality/users')
        .set('Cookie', citizenCookies)
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(403);

      // Assert
      expect(response.body).toHaveProperty('message');
    });

    it('should return 403 when authenticated as Municipality User', async () => {
      // Arrange
      const municipalityCookies = await loginAs('testmunicipality', 'MuniPass123!');
      const userData = await getValidMunicipalityUserData();

      // Act
      const response = await request(app)
        .post('/api/municipality/users')
        .set('Cookie', municipalityCookies)
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(403);

      // Assert
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 when required fields are missing', async () => {
      // Arrange
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');
      const validData = await getValidMunicipalityUserData();
      const invalidData = {
        username: validData.username,
        email: validData.email,
        // password missing
        first_name: validData.first_name,
        last_name: validData.last_name,
        department_role_ids: validData.department_role_ids
      };

      // Act
      const response = await request(app)
        .post('/api/municipality/users')
        .set('Cookie', adminCookies)
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBeDefined();
    });

    it('should return 400 when trying to create user with Citizen role', async () => {
      // Arrange
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');
      const citizenRoleId = await getDepartmentRoleId('Citizen', 'Organization');
      const validData = await getValidMunicipalityUserData();
      const citizenRoleData = {
        ...validData,
        username: 'citizentest',
        email: 'citizen@test.com',
        department_role_ids: [citizenRoleId]
      };

      // Act
      const response = await request(app)
        .post('/api/municipality/users')
        .set('Cookie', adminCookies)
        .send(citizenRoleData)
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Cannot create a municipality user with Citizen role');
    });

    it('should return 400 when trying to create user with Administrator role', async () => {
      // Arrange
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');
      const adminRoleId = await getDepartmentRoleId('Administrator', 'Organization');
      const validData = await getValidMunicipalityUserData();
      const adminRoleData = {
        ...validData,
        username: 'admintest',
        email: 'admin@test.com',
        department_role_ids: [adminRoleId]
      };

      // Act
      const response = await request(app)
        .post('/api/municipality/users')
        .set('Cookie', adminCookies)
        .send(adminRoleData)
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Cannot create an Administrator through this endpoint');
    });

    it('should return 409 when username already exists', async () => {
      // Arrange
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');
      const userData = await getValidMunicipalityUserData();

      // Create user first
      await request(app)
        .post('/api/municipality/users')
        .set('Cookie', adminCookies)
        .send(userData)
        .expect(201);

      // Act - Try to create with same username
      const duplicateData = {
        ...userData,
        email: 'different@test.com',
      };

      const response = await request(app)
        .post('/api/municipality/users')
        .set('Cookie', adminCookies)
        .send(duplicateData)
        .expect('Content-Type', /json/)
        .expect(409);

      // Assert
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Username already exists');
    });

    it('should return 409 when email already exists', async () => {
      // Arrange
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');
      const userData = await getValidMunicipalityUserData();

      // Create user first
      await request(app)
        .post('/api/municipality/users')
        .set('Cookie', adminCookies)
        .send(userData)
        .expect(201);

      // Act - Try to create with same email (within same test, no cleanup between)
      const duplicateData = {
        ...userData,
        username: 'differentuser',
      };

      const response = await request(app)
        .post('/api/municipality/users')
        .set('Cookie', adminCookies)
        .send(duplicateData)
        .expect('Content-Type', /json/)
        .expect(409);

      // Assert
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Email already exists');
    });
  });

  describe('GET /api/municipality/users - Get All Municipality Users', () => {
    beforeEach(async () => {
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');
      const roadRoleId = await getDepartmentRoleId('Road Maintenance staff member', 'Public Infrastructure and Accessibility Department');
      const waterRoleId = await getDepartmentRoleId('Water Network staff member', 'Water and Sewer Services Department');

      // Create some municipality users for testing
      await request(app)
        .post('/api/municipality/users')
        .set('Cookie', adminCookies)
        .send({
          username: 'muniuser1',
          email: 'muni1@test.com',
          password: 'Pass123!',
          first_name: 'Muni',
          last_name: 'One',
          department_role_ids: [roadRoleId]
        })
        .expect(201);

      await request(app)
        .post('/api/municipality/users')
        .set('Cookie', adminCookies)
        .send({
          username: 'muniuser2',
          email: 'muni2@test.com',
          password: 'Pass123!',
          first_name: 'Muni',
          last_name: 'Two',
          department_role_ids: [waterRoleId]
        })
        .expect(201);
    });

    it('should return all municipality users when authenticated as Admin', async () => {
      // Arrange
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');

      // Act
      const response = await request(app)
        .get('/api/municipality/users')
        .set('Cookie', adminCookies)
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);

      // Verify structure of first user
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('username');
      expect(response.body[0]).toHaveProperty('email');
      expect(response.body[0]).toHaveProperty('first_name');
      expect(response.body[0]).toHaveProperty('last_name');
      expect(response.body[0]).toHaveProperty('roles');
      expect(Array.isArray(response.body[0].roles)).toBe(true);
      expect(response.body[0]).not.toHaveProperty('password');
      expect(response.body[0]).not.toHaveProperty('passwordHash');

      // Verify no Citizen or Administrator users
      for (const user of response.body) {
        const roleNames = user.roles?.map((r: any) => r.role_name) || [];
        expect(roleNames).not.toContain('Citizen');
        expect(roleNames).not.toContain('Administrator');
      }
    });

    it('should return 401 when not authenticated', async () => {
      // Act
      const response = await request(app)
        .get('/api/municipality/users')
        .expect('Content-Type', /json/)
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Not authenticated');
    });

    it('should return 403 when authenticated as Citizen', async () => {
      // Arrange
      const citizenCookies = await loginAs('testcitizen', 'TestPass123!');

      // Act
      const response = await request(app)
        .get('/api/municipality/users')
        .set('Cookie', citizenCookies)
        .expect('Content-Type', /json/)
        .expect(403);

      // Assert
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/municipality/users/:id - Get Municipality User By ID', () => {
    let testUserId: number;

    beforeEach(async () => {
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');
      const roadRoleId = await getDepartmentRoleId('Road Maintenance staff member', 'Public Infrastructure and Accessibility Department');

      // Create a municipality user for testing
      const createResponse = await request(app)
        .post('/api/municipality/users')
        .set('Cookie', adminCookies)
        .send({
          username: 'testmuniuser',
          email: 'testmuni@test.com',
          password: 'Pass123!',
          first_name: 'Test',
          last_name: 'Municipal',
          department_role_ids: [roadRoleId]
        })
        .expect(201);

      testUserId = createResponse.body.id;
    });

    it('should return municipality user by ID when authenticated as Admin', async () => {
      // Arrange
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');

      // Act
      const response = await request(app)
        .get(`/api/municipality/users/${testUserId}`)
        .set('Cookie', adminCookies)
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('id', testUserId);
      expect(response.body).toHaveProperty('username', 'testmuniuser');
      expect(response.body).toHaveProperty('email', 'testmuni@test.com');
      expect(response.body).toHaveProperty('first_name', 'Test');
      expect(response.body).toHaveProperty('last_name', 'Municipal');
      expect(response.body).toHaveProperty('roles');
      expect(response.body.roles.some((r: any) => r.role_name === 'Road Maintenance staff member')).toBe(true);
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('should return 401 when not authenticated', async () => {
      // Act
      const response = await request(app)
        .get(`/api/municipality/users/${testUserId}`)
        .expect('Content-Type', /json/)
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('message');
    });

    it('should return 403 when authenticated as Citizen', async () => {
      // Arrange
      const citizenCookies = await loginAs('testcitizen', 'TestPass123!');

      // Act
      const response = await request(app)
        .get(`/api/municipality/users/${testUserId}`)
        .set('Cookie', citizenCookies)
        .expect('Content-Type', /json/)
        .expect(403);

      // Assert
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for invalid user ID', async () => {
      // Arrange
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');

      // Act
      const response = await request(app)
        .get('/api/municipality/users/invalid')
        .set('Cookie', adminCookies)
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid user ID');
    });

    it('should return 404 for non-existent user ID', async () => {
      // Arrange
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');

      // Act
      const response = await request(app)
        .get('/api/municipality/users/999999')
        .set('Cookie', adminCookies)
        .expect('Content-Type', /json/)
        .expect(404);

      // Assert
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('User not found');
    });
  });

  describe('PUT /api/municipality/users/:id - Update Municipality User', () => {
    let testUserId: number;

    beforeEach(async () => {
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');
      const roadRoleId = await getDepartmentRoleId('Road Maintenance staff member', 'Public Infrastructure and Accessibility Department');

      // Create a municipality user for testing
      const createResponse = await request(app)
        .post('/api/municipality/users')
        .set('Cookie', adminCookies)
        .send({
          username: 'updatetest',
          email: 'update@test.com',
          password: 'Pass123!',
          first_name: 'Original',
          last_name: 'Name',
          department_role_ids: [roadRoleId]
        })
        .expect(201);

      testUserId = createResponse.body.id;
    });

    it('should update municipality user successfully when authenticated as Admin', async () => {
      // Arrange
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');
      const waterRoleId = await getDepartmentRoleId('Water Network staff member', 'Water and Sewer Services Department');
      const updateData = {
        first_name: 'Updated',
        last_name: 'NameChanged',
        email: 'updated@test.com',
        department_role_ids: [waterRoleId]
      };

      // Act
      const response = await request(app)
        .put(`/api/municipality/users/${testUserId}`)
        .set('Cookie', adminCookies)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('id', testUserId);
      expect(response.body).toHaveProperty('first_name', 'Updated');
      expect(response.body).toHaveProperty('last_name', 'NameChanged');
      expect(response.body).toHaveProperty('email', 'updated@test.com');
      expect(response.body).toHaveProperty('roles');
      expect(response.body.roles.some((r: any) => r.role_name === 'Water Network staff member')).toBe(true);
      expect(response.body).toHaveProperty('username', 'updatetest'); // Unchanged
    });

    it('should update only provided fields', async () => {
      // Arrange
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');
      const updateData = {
        email: 'newemail@test.com',
      };

      // Act
      const response = await request(app)
        .put(`/api/municipality/users/${testUserId}`)
        .set('Cookie', adminCookies)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('email', 'newemail@test.com');
      expect(response.body).toHaveProperty('first_name', 'Original'); // Unchanged
      expect(response.body).toHaveProperty('last_name', 'Name'); // Unchanged
    });

    it('should return 401 when not authenticated', async () => {
      // Act
      const response = await request(app)
        .put(`/api/municipality/users/${testUserId}`)
        .send({ first_name: 'Updated' })
        .expect('Content-Type', /json/)
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('message');
    });

    it('should return 403 when authenticated as Citizen', async () => {
      // Arrange
      const citizenCookies = await loginAs('testcitizen', 'TestPass123!');

      // Act
      const response = await request(app)
        .put(`/api/municipality/users/${testUserId}`)
        .set('Cookie', citizenCookies)
        .send({ first_name: 'Updated' })
        .expect('Content-Type', /json/)
        .expect(403);

      // Assert
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 when no fields provided for update', async () => {
      // Arrange
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');

      // Act
      const response = await request(app)
        .put(`/api/municipality/users/${testUserId}`)
        .set('Cookie', adminCookies)
        .send({})
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('At least one field must be provided for update');
    });

    it('should return 400 for invalid user ID', async () => {
      // Arrange
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');

      // Act
      const response = await request(app)
        .put('/api/municipality/users/invalid')
        .set('Cookie', adminCookies)
        .send({ first_name: 'Updated' })
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid user ID');
    });

    it('should return 404 for non-existent user ID', async () => {
      // Arrange
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');

      // Act
      const response = await request(app)
        .put('/api/municipality/users/999999')
        .set('Cookie', adminCookies)
        .send({ first_name: 'Updated' })
        .expect('Content-Type', /json/)
        .expect(404);

      // Assert
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('DELETE /api/municipality/users/:id - Delete Municipality User', () => {
    let testUserId: number;

    beforeEach(async () => {
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');
      const electricalRoleId = await getDepartmentRoleId('Electrical staff member', 'Public Lighting Department');

      // Create a municipality user for testing
      const createResponse = await request(app)
        .post('/api/municipality/users')
        .set('Cookie', adminCookies)
        .send({
          username: 'deletetest',
          email: 'delete@test.com',
          password: 'Pass123!',
          first_name: 'Delete',
          last_name: 'Me',
          department_role_ids: [electricalRoleId]
        })
        .expect(201);

      testUserId = createResponse.body.id;
    });

    it('should delete municipality user successfully when authenticated as Admin', async () => {
      // Arrange
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');

      // Act
      await request(app)
        .delete(`/api/municipality/users/${testUserId}`)
        .set('Cookie', adminCookies)
        .expect(204);

      // Assert - Verify user was deleted
      const userExists = await userRepository.existsUserByUsername('deletetest');
      expect(userExists).toBe(false);
    });

    it('should return 401 when not authenticated', async () => {
      // Act
      const response = await request(app)
        .delete(`/api/municipality/users/${testUserId}`)
        .expect('Content-Type', /json/)
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('message');
    });

    it('should return 403 when authenticated as Citizen', async () => {
      // Arrange
      const citizenCookies = await loginAs('testcitizen', 'TestPass123!');

      // Act
      const response = await request(app)
        .delete(`/api/municipality/users/${testUserId}`)
        .set('Cookie', citizenCookies)
        .expect('Content-Type', /json/)
        .expect(403);

      // Assert
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for invalid user ID', async () => {
      // Arrange
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');

      // Act
      const response = await request(app)
        .delete('/api/municipality/users/invalid')
        .set('Cookie', adminCookies)
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid user ID');
    });

    it('should return 404 for non-existent user ID', async () => {
      // Arrange
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');

      // Act
      const response = await request(app)
        .delete('/api/municipality/users/999999')
        .set('Cookie', adminCookies)
        .expect('Content-Type', /json/)
        .expect(404);

      // Assert
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PUT /api/municipality/users/:id/role - Assign Role', () => {
    let testUserId: number;

    beforeEach(async () => {
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');
      const roadRoleId = await getDepartmentRoleId('Road Maintenance staff member', 'Public Infrastructure and Accessibility Department');

      // Create a municipality user for testing
      const createResponse = await request(app)
        .post('/api/municipality/users')
        .set('Cookie', adminCookies)
        .send({
          username: 'roletest',
          email: 'role@test.com',
          password: 'Pass123!',
          first_name: 'Role',
          last_name: 'Test',
          department_role_ids: [roadRoleId]
        })
        .expect(201);

      testUserId = createResponse.body.id;
    });

    it('should assign role successfully when authenticated as Admin', async () => {
      // Arrange
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');
      const newRole = 'Water Network staff member';
      const newDepartment = 'Water and Sewer Services Department';

      // Act
      const response = await request(app)
        .put(`/api/municipality/users/${testUserId}/role`)
        .set('Cookie', adminCookies)
        .send({ role_name: newRole, department_name: newDepartment })
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('id', testUserId);
      expect(response.body).toHaveProperty('roles');
      expect(response.body.roles.some((r: any) => r.role_name === newRole)).toBe(true);
      expect(response.body).toHaveProperty('username', 'roletest');
    });

    it('should return 401 when not authenticated', async () => {
      // Act
      const response = await request(app)
        .put(`/api/municipality/users/${testUserId}/role`)
        .send({ role_name: 'Road Maintenance staff member', department_name: 'Public Infrastructure and Accessibility Department' })
        .expect('Content-Type', /json/)
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('message');
    });

    it('should return 403 when authenticated as Citizen', async () => {
      // Arrange
      const citizenCookies = await loginAs('testcitizen', 'TestPass123!');

      // Act
      const response = await request(app)
        .put(`/api/municipality/users/${testUserId}/role`)
        .set('Cookie', citizenCookies)
        .send({ role_name: 'Road Maintenance staff member', department_name: 'Public Infrastructure and Accessibility Department' })
        .expect('Content-Type', /json/)
        .expect(403);

      // Assert
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 when role is missing', async () => {
      // Arrange
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');

      // Act
      const response = await request(app)
        .put(`/api/municipality/users/${testUserId}/role`)
        .set('Cookie', adminCookies)
        .send({})
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Missing required field: role_name');
    });

    it('should return 400 for invalid user ID', async () => {
      // Arrange
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');

      // Act
      const response = await request(app)
        .put('/api/municipality/users/invalid/role')
        .set('Cookie', adminCookies)
        .send({ role_name: 'Urban Planning Manager', department_name: 'Urban Planning Department' })
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid user ID');
    });

    it('should return 400 for invalid role value', async () => {
      // Arrange
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');

      // Act
      const response = await request(app)
        .put(`/api/municipality/users/${testUserId}/role`)
        .set('Cookie', adminCookies)
        .send({ role_name: 'InvalidRole' })
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('not found');
    });

    it('should return 404 for non-existent user ID', async () => {
      // Arrange
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');

      // Act
      const response = await request(app)
        .put('/api/municipality/users/999/role')
        .set('Cookie', adminCookies)
        .send({ role_name: 'Road Maintenance staff member', department_name: 'Public Infrastructure and Accessibility Department' })
        .expect('Content-Type', /json/)
        .expect(404);

      // Assert
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/roles - Get All Roles', () => {

    it('should return 401 if not authenticated', async () => {
      // Act
      const response = await request(app)
        .get('/api/roles')
        .expect('Content-Type', /json/)
        .expect(401); // <-- CORREZIONE: Ci aspettiamo 401, non 200

      // Assert
      // L'errore proviene dal middleware 'isAdmin' che usa 'UnauthorizedError'
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Not authenticated');
    });

    it('should return all municipality roles when authenticated as admin', async () => {
      // --- Arrange: Perform login as admin ---
      // (Preso direttamente dal tuo file di esempio AuthController)
      const loginResponse = await request(app)
        .post('/api/sessions')
        .send({
          username: 'testadmin',
          password: 'AdminPass123!',
        })
        .expect(200);

      // Estrai i cookie di sessione
      const cookies = loginResponse.headers['set-cookie'];

      // --- Act: Call the protected route WITH cookies ---
      const response = await request(app)
        .get('/api/roles')
        .set('Cookie', cookies) // <-- CORREZIONE: Aggiungi i cookie di autenticazione
        .expect('Content-Type', /json/)
        .expect(200); // <-- Ora ci aspettiamo 200

      // --- Assert: ---
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Verify contains some municipality roles (string array)
      expect(response.body).toContain('Department Director');
      expect(response.body).toContain('Road Maintenance staff member');
      expect(response.body).toContain('Water Network staff member');
      expect(response.body).toContain('External Maintainer');

      // Verify does NOT contain Citizen or Administrator
      expect(response.body).not.toContain('Citizen');
      expect(response.body).not.toContain('Administrator');
    });

    it('should return 403 if authenticated as non-admin (e.g., Citizen)', async () => {
      const loginResponse = await request(app)
        .post('/api/sessions')
        .send({
          username: 'testcitizen',
          password: 'TestPass123!',
        })
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];

      const response = await request(app)
        .get('/api/roles')
        .set('Cookie', cookies)
        .expect('Content-Type', /json/)
        .expect(403);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/municipality/users - With company_name (External Maintainer)', () => {
    let externalMaintainerData: any;

    beforeEach(async () => {
      const externalRoleId = await getDepartmentRoleId('External Maintainer', 'External Service Providers');
      externalMaintainerData = {
        username: 'newexternal',
        email: 'external@test.com',
        password: 'ExternalPass123!',
        first_name: 'External',
        last_name: 'Worker',
        department_role_ids: [externalRoleId],
        company_name: 'Lighting Solutions SRL'
      };
    });

    it('should create external maintainer with company_name successfully', async () => {
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');

      const response = await request(app)
        .post('/api/municipality/users')
        .set('Cookie', adminCookies)
        .send(externalMaintainerData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('username', externalMaintainerData.username);
      expect(response.body).toHaveProperty('company_name', 'Lighting Solutions SRL');
      expect(response.body).toHaveProperty('roles');
      expect(response.body.roles.some((r: any) => r.role_name === 'External Maintainer')).toBe(true);

      // Verify user was created with company
      const user = await userRepository.findUserByUsername(externalMaintainerData.username);
      expect(user).toBeDefined();
      expect(user?.companyId).toBeDefined();
    });

    it('should create municipality user without company_name for non-External Maintainer', async () => {
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');
      const roadRoleId = await getDepartmentRoleId('Road Maintenance staff member', 'Public Infrastructure and Accessibility Department');
      const { company_name, ...dataWithoutCompany } = externalMaintainerData;

      const response = await request(app)
        .post('/api/municipality/users')
        .set('Cookie', adminCookies)
        .send({
          ...dataWithoutCompany,
          department_role_ids: [roadRoleId]
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).not.toHaveProperty('company_name');
    })

    it('should fail with non-existent company_name (404)', async () => {
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');

      const response = await request(app)
        .post('/api/municipality/users')
        .set('Cookie', adminCookies)
        .send({ ...externalMaintainerData, company_name: 'Non Existent Company XYZ' })
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Company');
    });
  });

  describe('PUT /api/municipality/users/:id - Update with company_name', () => {
    let testUserId: number;

    beforeEach(async () => {
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');
      const externalRoleId = await getDepartmentRoleId('External Maintainer', 'External Service Providers');

      const createResponse = await request(app)
        .post('/api/municipality/users')
        .set('Cookie', adminCookies)
        .send({
          username: 'externalupdate',
          email: 'extupdate@test.com',
          password: 'Pass123!',
          first_name: 'External',
          last_name: 'Update',
          department_role_ids: [externalRoleId],
          company_name: 'EcoWaste Management'
        })
        .expect(201);

      testUserId = createResponse.body.id;
    });

    it('should update external maintainer and change company', async () => {
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');
      const externalRoleId = await getDepartmentRoleId('External Maintainer', 'External Service Providers');

      const response = await request(app)
        .put(`/api/municipality/users/${testUserId}`)
        .set('Cookie', adminCookies)
        .send({
          first_name: 'Updated',
          last_name: 'Name',
          email: 'updated@test.com',
          department_role_ids: [externalRoleId],
          company_name: 'Road Repair Co.'
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('id', testUserId);
      expect(response.body).toHaveProperty('first_name', 'Updated');
      expect(response.body).toHaveProperty('company_name', 'Road Repair Co.');
    });

    it('should update user and remove company when company_name not provided', async () => {
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');
      const roadRoleId = await getDepartmentRoleId('Road Maintenance staff member', 'Public Infrastructure and Accessibility Department');

      const response = await request(app)
        .put(`/api/municipality/users/${testUserId}`)
        .set('Cookie', adminCookies)
        .send({
          first_name: 'Updated',
          last_name: 'NoCompany',
          email: 'nocompany@test.com',
          department_role_ids: [roadRoleId],
          company_name: null  // Explicitly remove company
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('id', testUserId);
      expect(response.body).not.toHaveProperty('company_name');

      // Verify company was removed in database
      const user = await userRepository.findUserById(testUserId);
      expect(user?.companyId).toBeNull();
    });

    it('should fail when updating with non-existent company (404)', async () => {
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');
      const externalRoleId = await getDepartmentRoleId('External Maintainer', 'External Service Providers');

      const response = await request(app)
        .put(`/api/municipality/users/${testUserId}`)
        .set('Cookie', adminCookies)
        .send({
          first_name: 'Updated',
          last_name: 'Name',
          email: 'updated@test.com',
          department_role_ids: [externalRoleId],
          company_name: 'Non Existent Company'
        })
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Company');
    });
  });

  describe('GET /api/municipality/users - List includes company_name', () => {
    beforeEach(async () => {
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');
      const externalRoleId = await getDepartmentRoleId('External Maintainer', 'External Service Providers');

      // Create an external maintainer with company
      await request(app)
        .post('/api/municipality/users')
        .set('Cookie', adminCookies)
        .send({
          username: 'externallist',
          email: 'extlist@test.com',
          password: 'Pass123!',
          first_name: 'List',
          last_name: 'Test',
          department_role_ids: [externalRoleId],
          company_name: 'Lighting Solutions SRL'
        })
        .expect(201);
    });

    it('should return users list with company_name field for external maintainers', async () => {
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');

      const response = await request(app)
        .get('/api/municipality/users')
        .set('Cookie', adminCookies)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      // Find the external maintainer we just created
      const externalUser = response.body.find((u: any) => u.username === 'externallist');
      expect(externalUser).toBeDefined();
      expect(externalUser).toHaveProperty('company_name', 'Lighting Solutions SRL');

      // Verify other users don't have company_name (or it's null/undefined)
      const regularUser = response.body.find((u: any) => u.username === 'testmunicipality');
      expect(regularUser?.company_name).toBeFalsy();
    });
  });

  describe('GET /api/municipality/users/:id - Get single user with company_name', () => {
    let externalUserId: number;

    beforeEach(async () => {
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');
      const externalRoleId = await getDepartmentRoleId('External Maintainer', 'External Service Providers');

      const createResponse = await request(app)
        .post('/api/municipality/users')
        .set('Cookie', adminCookies)
        .send({
          username: 'externalsingle',
          email: 'extsingle@test.com',
          password: 'Pass123!',
          first_name: 'Single',
          last_name: 'External',
          department_role_ids: [externalRoleId],
          company_name: 'EcoWaste Management'
        })
        .expect(201);

      externalUserId = createResponse.body.id;
    });

    it('should return external maintainer with company_name', async () => {
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');

      const response = await request(app)
        .get(`/api/municipality/users/${externalUserId}`)
        .set('Cookie', adminCookies)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('id', externalUserId);
      expect(response.body).toHaveProperty('username', 'externalsingle');
      expect(response.body).toHaveProperty('company_name', 'EcoWaste Management');
    });
  });

  // ============================================
  // V5 NEW ENDPOINTS - Department Roles & Multi-Role Management
  // ============================================

  describe('GET /api/municipality/users/department-roles - Get All Department Roles', () => {

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/api/municipality/users/department-roles')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Not authenticated');
    });

    it('should return 403 if authenticated as Citizen', async () => {
      const citizenCookies = await loginAs('testcitizen', 'TestPass123!');

      const response = await request(app)
        .get('/api/municipality/users/department-roles')
        .set('Cookie', citizenCookies)
        .expect('Content-Type', /json/)
        .expect(403);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Access denied');
    });

    it('should return 403 if authenticated as Municipality Staff', async () => {
      const municipalityCookies = await loginAs('testmunicipality', 'MuniPass123!');

      const response = await request(app)
        .get('/api/municipality/users/department-roles')
        .set('Cookie', municipalityCookies)
        .expect('Content-Type', /json/)
        .expect(403);

      expect(response.body).toHaveProperty('message');
    });

    it('should return all department roles when authenticated as Admin', async () => {
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');

      const response = await request(app)
        .get('/api/municipality/users/department-roles')
        .set('Cookie', adminCookies)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Verify structure of each department role
      for (const dr of response.body) {
        expect(dr).toHaveProperty('id');
        expect(dr).toHaveProperty('department');
        expect(dr).toHaveProperty('role');
        expect(typeof dr.id).toBe('number');
        expect(typeof dr.department).toBe('string');
        expect(typeof dr.role).toBe('string');
      }
    });

    it('should NOT include Citizen or Administrator department roles', async () => {
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');

      const response = await request(app)
        .get('/api/municipality/users/department-roles')
        .set('Cookie', adminCookies)
        .expect(200);

      const roleNames = response.body.map((dr: any) => dr.role);
      expect(roleNames).not.toContain('Citizen');
      expect(roleNames).not.toContain('Administrator');
    });

    it('should include expected municipality department roles', async () => {
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');

      const response = await request(app)
        .get('/api/municipality/users/department-roles')
        .set('Cookie', adminCookies)
        .expect(200);

      const roleNames = response.body.map((dr: any) => dr.role);
      expect(roleNames).toContain('Road Maintenance staff member');
      expect(roleNames).toContain('Water Network staff member');
      expect(roleNames).toContain('External Maintainer');
    });
  });

  describe('PUT /api/municipality/users/:id/roles - Replace All User Roles', () => {
    let testUserId: number;

    beforeEach(async () => {
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');
      const roadRoleId = await getDepartmentRoleId('Road Maintenance staff member', 'Public Infrastructure and Accessibility Department');

      const createResponse = await request(app)
        .post('/api/municipality/users')
        .set('Cookie', adminCookies)
        .send({
          username: 'multiroleuser',
          email: 'multirole@test.com',
          password: 'Pass123!',
          first_name: 'Multi',
          last_name: 'Role',
          department_role_ids: [roadRoleId]
        })
        .expect(201);

      testUserId = createResponse.body.id;
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .put(`/api/municipality/users/${testUserId}/roles`)
        .send({ department_role_ids: [1] })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 403 when authenticated as Citizen', async () => {
      const citizenCookies = await loginAs('testcitizen', 'TestPass123!');

      const response = await request(app)
        .put(`/api/municipality/users/${testUserId}/roles`)
        .set('Cookie', citizenCookies)
        .send({ department_role_ids: [1] })
        .expect('Content-Type', /json/)
        .expect(403);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 when department_role_ids is empty', async () => {
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');

      const response = await request(app)
        .put(`/api/municipality/users/${testUserId}/roles`)
        .set('Cookie', adminCookies)
        .send({ department_role_ids: [] })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 when department_role_ids is not provided', async () => {
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');

      const response = await request(app)
        .put(`/api/municipality/users/${testUserId}/roles`)
        .set('Cookie', adminCookies)
        .send({})
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for invalid department_role_ids', async () => {
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');

      const response = await request(app)
        .put(`/api/municipality/users/${testUserId}/roles`)
        .set('Cookie', adminCookies)
        .send({ department_role_ids: [99999] })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 when trying to assign Citizen role', async () => {
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');
      const citizenRoleId = await getDepartmentRoleId('Citizen', 'Organization');

      const response = await request(app)
        .put(`/api/municipality/users/${testUserId}/roles`)
        .set('Cookie', adminCookies)
        .send({ department_role_ids: [citizenRoleId] })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent user ID', async () => {
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');
      const roadRoleId = await getDepartmentRoleId('Road Maintenance staff member', 'Public Infrastructure and Accessibility Department');

      const response = await request(app)
        .put('/api/municipality/users/999999/roles')
        .set('Cookie', adminCookies)
        .send({ department_role_ids: [roadRoleId] })
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for invalid user ID format', async () => {
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');

      const response = await request(app)
        .put('/api/municipality/users/invalid/roles')
        .set('Cookie', adminCookies)
        .send({ department_role_ids: [1] })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('DELETE /api/municipality/users/:id/roles/:roleId - Remove Single Role', () => {
    let testUserId: number;
    let firstRoleId: number;
    let secondRoleId: number;

    beforeEach(async () => {
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');
      firstRoleId = await getDepartmentRoleId('Road Maintenance staff member', 'Public Infrastructure and Accessibility Department');
      secondRoleId = await getDepartmentRoleId('Water Network staff member', 'Water and Sewer Services Department');

      // Create a user with multiple roles
      const createResponse = await request(app)
        .post('/api/municipality/users')
        .set('Cookie', adminCookies)
        .send({
          username: 'removeroleuser',
          email: 'removerole@test.com',
          password: 'Pass123!',
          first_name: 'Remove',
          last_name: 'Role',
          department_role_ids: [firstRoleId, secondRoleId]
        })
        .expect(201);

      testUserId = createResponse.body.id;
    });

    it('should remove a single role successfully when authenticated as Admin', async () => {
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');

      const response = await request(app)
        .delete(`/api/municipality/users/${testUserId}/roles/${firstRoleId}`)
        .set('Cookie', adminCookies)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('id', testUserId);
      expect(response.body).toHaveProperty('roles');
      expect(response.body.roles.length).toBe(1);

      const roleNames = response.body.roles.map((r: any) => r.role_name);
      expect(roleNames).not.toContain('Road Maintenance staff member');
      expect(roleNames).toContain('Water Network staff member');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .delete(`/api/municipality/users/${testUserId}/roles/${firstRoleId}`)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 403 when authenticated as Citizen', async () => {
      const citizenCookies = await loginAs('testcitizen', 'TestPass123!');

      const response = await request(app)
        .delete(`/api/municipality/users/${testUserId}/roles/${firstRoleId}`)
        .set('Cookie', citizenCookies)
        .expect('Content-Type', /json/)
        .expect(403);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 when trying to remove last role', async () => {
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');

      // First remove one role
      await request(app)
        .delete(`/api/municipality/users/${testUserId}/roles/${firstRoleId}`)
        .set('Cookie', adminCookies)
        .expect(200);

      // Now try to remove the last remaining role
      const response = await request(app)
        .delete(`/api/municipality/users/${testUserId}/roles/${secondRoleId}`)
        .set('Cookie', adminCookies)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('last role');
    });

    it('should return 404 for non-existent user ID', async () => {
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');

      const response = await request(app)
        .delete(`/api/municipality/users/999999/roles/${firstRoleId}`)
        .set('Cookie', adminCookies)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 when role is not assigned to user', async () => {
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');
      const unassignedRoleId = await getDepartmentRoleId('External Maintainer', 'External Service Providers');

      const response = await request(app)
        .delete(`/api/municipality/users/${testUserId}/roles/${unassignedRoleId}`)
        .set('Cookie', adminCookies)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for invalid user ID format', async () => {
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');

      const response = await request(app)
        .delete(`/api/municipality/users/invalid/roles/${firstRoleId}`)
        .set('Cookie', adminCookies)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for invalid role ID format', async () => {
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');

      const response = await request(app)
        .delete(`/api/municipality/users/${testUserId}/roles/invalid`)
        .set('Cookie', adminCookies)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

});
