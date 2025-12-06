import request from 'supertest';
import app from '../../app';
import { userRepository } from '@repositories/userRepository';
import {
  setupTestDatabase,
  teardownTestDatabase,
  cleanDatabase,
  ensureTestDatabase
} from '../utils/dbTestUtils';

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
    const validMunicipalityUserData = {
      username: 'newmuniuser',
      email: 'newmuni@test.com',
      password: 'SecureMuni123!',
      first_name: 'Municipal',
      last_name: 'Officer',
      role_name: 'Road Maintenance staff member',
      department_name: 'Public Infrastructure and Accessibility Department'
    };

    it('should create municipality user successfully when authenticated as Admin', async () => {
      // Arrange
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');

      // Act
      const response = await request(app)
        .post('/api/municipality/users')
        .set('Cookie', adminCookies)
        .send(validMunicipalityUserData)
        .expect('Content-Type', /json/)
        .expect(201);

      // Assert
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('username', validMunicipalityUserData.username);
      expect(response.body).toHaveProperty('email', validMunicipalityUserData.email);
      expect(response.body).toHaveProperty('first_name', validMunicipalityUserData.first_name);
      expect(response.body).toHaveProperty('last_name', validMunicipalityUserData.last_name);
      expect(response.body).toHaveProperty('role_name', 'Road Maintenance staff member');
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('passwordHash');

      // Verify user was created in database
      const userExists = await userRepository.existsUserByUsername(validMunicipalityUserData.username);
      expect(userExists).toBe(true);
    });

    it('should return 401 when not authenticated', async () => {
      // Act
      const response = await request(app)
        .post('/api/municipality/users')
        .send(validMunicipalityUserData)
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
        .post('/api/municipality/users')
        .set('Cookie', citizenCookies)
        .send(validMunicipalityUserData)
        .expect('Content-Type', /json/)
        .expect(403);

      // Assert
      expect(response.body).toHaveProperty('message');
    });

    it('should return 403 when authenticated as Municipality User', async () => {
      // Arrange
      const municipalityCookies = await loginAs('testmunicipality', 'MuniPass123!');

      // Act
      const response = await request(app)
        .post('/api/municipality/users')
        .set('Cookie', municipalityCookies)
        .send(validMunicipalityUserData)
        .expect('Content-Type', /json/)
        .expect(403);

      // Assert
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 when required fields are missing', async () => {
      // Arrange
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');
      const invalidData = {
        username: validMunicipalityUserData.username,
        email: validMunicipalityUserData.email,
        // password missing
        first_name: validMunicipalityUserData.first_name,
        last_name: validMunicipalityUserData.last_name,
        role_name: validMunicipalityUserData.role_name,
        department_name: validMunicipalityUserData.department_name
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
      const citizenRoleData = {
        ...validMunicipalityUserData,
        username: 'citizentest',
        email: 'citizen@test.com',
        role_name: 'Citizen',
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
      const adminRoleData = {
        ...validMunicipalityUserData,
        username: 'admintest',
        email: 'admin@test.com',
        role_name: 'Administrator',
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

      // Create user first
      await request(app)
        .post('/api/municipality/users')
        .set('Cookie', adminCookies)
        .send(validMunicipalityUserData)
        .expect(201);

      // Act - Try to create with same username
      const duplicateData = {
        ...validMunicipalityUserData,
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

      // Create user first
      await request(app)
        .post('/api/municipality/users')
        .set('Cookie', adminCookies)
        .send(validMunicipalityUserData)
        .expect(201);

      // Act - Try to create with same email
      const duplicateData = {
        ...validMunicipalityUserData,
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
          role_name: 'Road Maintenance staff member', department_name: 'Public Infrastructure and Accessibility Department',
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
          role_name: 'Traffic management staff member', department_name: 'Mobility and Traffic Management Department',
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
      expect(response.body[0]).toHaveProperty('role_name');
      expect(response.body[0]).not.toHaveProperty('password');
      expect(response.body[0]).not.toHaveProperty('passwordHash');

      // Verify no Citizen or Administrator users
      response.body.forEach((user: any) => {
        expect(user.role).not.toBe('Citizen');
        expect(user.role).not.toBe('Administrator');
      });
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
          role_name: 'Road Maintenance staff member', department_name: 'Public Infrastructure and Accessibility Department',
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
      expect(response.body).toHaveProperty('role_name', 'Road Maintenance staff member');
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
          role_name: 'Building Maintenance staff member', department_name: 'General Services Department',
        })
        .expect(201);

      testUserId = createResponse.body.id;
    });

    it('should update municipality user successfully when authenticated as Admin', async () => {
      // Arrange
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');
      const updateData = {
        first_name: 'Updated',
        last_name: 'NameChanged',
        email: 'updated@test.com',
        role_name: 'Parks Maintenance staff member', department_name: 'Parks, Green Areas and Recreation Department',
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
      expect(response.body).toHaveProperty('role_name', 'Parks Maintenance staff member');
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
          role_name: 'Parks Maintenance staff member', department_name: 'Parks, Green Areas and Recreation Department',
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
          role_name: 'Road Maintenance staff member', department_name: 'Public Infrastructure and Accessibility Department',
        })
        .expect(201);

      testUserId = createResponse.body.id;
    });

    it('should assign role successfully when authenticated as Admin', async () => {
      // Arrange
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');
      const newRole = 'Traffic management staff member';
      const newDepartment = 'Mobility and Traffic Management Department';

      // Act
      const response = await request(app)
        .put(`/api/municipality/users/${testUserId}/role`)
        .set('Cookie', adminCookies)
        .send({ role_name: newRole, department_name: newDepartment })
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('id', testUserId);
      expect(response.body).toHaveProperty('role_name', newRole);
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
      // --- Arrange: Esegui il login come admin ---
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

      // --- Act: Chiama la rotta protetta CON i cookie ---
      const response = await request(app)
        .get('/api/roles')
        .set('Cookie', cookies) // <-- CORREZIONE: Aggiungi i cookie di autenticazione
        .expect('Content-Type', /json/)
        .expect(200); // <-- Ora ci aspettiamo 200

      // --- Assert: ---
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Verify contains municipality roles (string array)
      expect(response.body).toContain('Customer Service staff member');
      expect(response.body).toContain('Department Director');
      expect(response.body).toContain('Road Maintenance staff member');
      expect(response.body).toContain('Traffic management staff member');
      expect(response.body).toContain('Parks Maintenance staff member');
      expect(response.body).toContain('Road Maintenance staff member');
      expect(response.body).toContain('Building Maintenance staff member');
      expect(response.body).toContain('Parks Maintenance staff member');

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
    const externalMaintainerData = {
      username: 'newexternal',
      email: 'external@test.com',
      password: 'ExternalPass123!',
      first_name: 'External',
      last_name: 'Worker',
      role_name: 'External Maintainer',
      department_name: 'External Service Providers',
      company_name: 'Lighting Solutions SRL'
    };

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
      expect(response.body).toHaveProperty('role_name', 'External Maintainer');

      // Verify user was created with company
      const user = await userRepository.findUserByUsername(externalMaintainerData.username);
      expect(user).toBeDefined();
      expect(user?.companyId).toBeDefined();
    });

    it('should create municipality user without company_name for non-External Maintainer', async () => {
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');
      const { company_name, ...dataWithoutCompany } = externalMaintainerData;

      const response = await request(app)
        .post('/api/municipality/users')
        .set('Cookie', adminCookies)
        .send({ 
          ...dataWithoutCompany, 
          role_name: 'Road Maintenance staff member',
          department_name: 'Public Infrastructure and Accessibility Department'
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

      const createResponse = await request(app)
        .post('/api/municipality/users')
        .set('Cookie', adminCookies)
        .send({
          username: 'externalupdate',
          email: 'extupdate@test.com',
          password: 'Pass123!',
          first_name: 'External',
          last_name: 'Update',
          role_name: 'External Maintainer',
          department_name: 'External Service Providers',
          company_name: 'EcoWaste Management'
        })
        .expect(201);

      testUserId = createResponse.body.id;
    });

    it('should update external maintainer and change company', async () => {
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');

      const response = await request(app)
        .put(`/api/municipality/users/${testUserId}`)
        .set('Cookie', adminCookies)
        .send({
          first_name: 'Updated',
          last_name: 'Name',
          email: 'updated@test.com',
          role_name: 'External Maintainer',
          department_name: 'External Service Providers',
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

      const response = await request(app)
        .put(`/api/municipality/users/${testUserId}`)
        .set('Cookie', adminCookies)
        .send({
          first_name: 'Updated',
          last_name: 'NoCompany',
          email: 'nocompany@test.com',
          role_name: 'Road Maintenance staff member',
          department_name: 'Public Infrastructure and Accessibility Department',
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

      const response = await request(app)
        .put(`/api/municipality/users/${testUserId}`)
        .set('Cookie', adminCookies)
        .send({
          first_name: 'Updated',
          last_name: 'Name',
          email: 'updated@test.com',
          role_name: 'External Maintainer',
          department_name: 'External Service Providers',
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
          role_name: 'External Maintainer',
          department_name: 'External Service Providers',
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

      const createResponse = await request(app)
        .post('/api/municipality/users')
        .set('Cookie', adminCookies)
        .send({
          username: 'externalsingle',
          email: 'extsingle@test.com',
          password: 'Pass123!',
          first_name: 'Single',
          last_name: 'External',
          role_name: 'External Maintainer',
          department_name: 'External Service Providers',
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

});
