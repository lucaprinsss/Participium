import request from 'supertest';
import app from '../../app';
import { AppDataSource } from '@database/connection';
import { userRepository } from '@repositories/userRepository';
import { UserRole } from '@models/dto/UserRole';
import { 
  setupTestDatabase, 
  teardownTestDatabase, 
  cleanDatabase,
  ensureTestDatabase 
} from '../utils/dbTestUtils';

/**
 * E2E Tests for Municipality User Controller
 * Uses real PostgreSQL test database with Docker
 * Tests only the functions covered in unit tests
 */
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

  // Clean dynamic data before each test
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('POST /api/municipality/users - Create Municipality User', () => {
    const validMunicipalityUserData = {
      username: 'newmuniuser',
      email: 'newmuni@test.com',
      password: 'SecureMuni123!',
      first_name: 'Municipal',
      last_name: 'Officer',
      role: UserRole.MUNICIPAL_PUBLIC_RELATIONS_OFFICER,
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
      expect(response.body).toHaveProperty('role', UserRole.MUNICIPAL_PUBLIC_RELATIONS_OFFICER);
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
      expect(response.body.message).toContain('Admin role required');
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
        role: validMunicipalityUserData.role,
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
      expect(response.body.message).toContain('All fields are required');
      expect(response.body.message).toContain('password');
    });

    it('should return 400 when trying to create user with Citizen role', async () => {
      // Arrange
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');
      const citizenRoleData = {
        ...validMunicipalityUserData,
        username: 'citizentest',
        email: 'citizen@test.com',
        role: UserRole.CITIZEN,
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
        role: UserRole.ADMINISTRATOR,
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
          role: UserRole.TECHNICAL_OFFICE_STAFF_MEMBER,
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
          role: UserRole.URBAN_PLANNING_MANAGER,
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
      expect(response.body[0]).toHaveProperty('role');
      expect(response.body[0]).not.toHaveProperty('password');
      expect(response.body[0]).not.toHaveProperty('passwordHash');

      // Verify no Citizen or Administrator users
      response.body.forEach((user: any) => {
        expect(user.role).not.toBe(UserRole.CITIZEN);
        expect(user.role).not.toBe(UserRole.ADMINISTRATOR);
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
      expect(response.body.message).toContain('Admin role required');
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
          role: UserRole.INFRASTRUCTURE_MANAGER,
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
      expect(response.body).toHaveProperty('role', UserRole.INFRASTRUCTURE_MANAGER);
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
          role: UserRole.MAINTENANCE_STAFF_MEMBER,
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
        role: UserRole.PUBLIC_GREEN_SPACES_MANAGER,
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
      expect(response.body).toHaveProperty('role', UserRole.PUBLIC_GREEN_SPACES_MANAGER);
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
          last_name: 'Test',
          role: UserRole.PRIVATE_BUILDING_MANAGER,
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
          role: UserRole.MUNICIPAL_PUBLIC_RELATIONS_OFFICER,
        })
        .expect(201);

      testUserId = createResponse.body.id;
    });

    it('should assign role successfully when authenticated as Admin', async () => {
      // Arrange
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');
      const newRole = UserRole.URBAN_PLANNING_MANAGER;

      // Act
      const response = await request(app)
        .put(`/api/municipality/users/${testUserId}/role`)
        .set('Cookie', adminCookies)
        .send({ role: newRole })
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('id', testUserId);
      expect(response.body).toHaveProperty('role', newRole);
      expect(response.body).toHaveProperty('username', 'roletest');
    });

    it('should return 401 when not authenticated', async () => {
      // Act
      const response = await request(app)
        .put(`/api/municipality/users/${testUserId}/role`)
        .send({ role: UserRole.TECHNICAL_OFFICE_STAFF_MEMBER })
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
        .send({ role: UserRole.TECHNICAL_OFFICE_STAFF_MEMBER })
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
      expect(response.body.message).toContain('Role is required');
    });

    it('should return 400 for invalid user ID', async () => {
      // Arrange
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');

      // Act
      const response = await request(app)
        .put('/api/municipality/users/invalid/role')
        .set('Cookie', adminCookies)
        .send({ role: UserRole.INFRASTRUCTURE_MANAGER })
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
        .send({ role: 'InvalidRole' })
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid role specified');
    });

    it('should return 404 for non-existent user ID', async () => {
      // Arrange
      const adminCookies = await loginAs('testadmin', 'AdminPass123!');

      // Act
      const response = await request(app)
        .put('/api/municipality/users/999999/role')
        .set('Cookie', adminCookies)
        .send({ role: UserRole.INFRASTRUCTURE_MANAGER })
        .expect('Content-Type', /json/)
        .expect(404);

      // Assert
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/roles - Get All Roles', () => {
    it('should return all municipality roles', async () => {
      // Act
      const response = await request(app)
        .get('/api/roles')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Verify contains municipality roles
      expect(response.body).toContain(UserRole.MUNICIPAL_PUBLIC_RELATIONS_OFFICER);
      expect(response.body).toContain(UserRole.MUNICIPAL_ADMINISTRATOR);
      expect(response.body).toContain(UserRole.TECHNICAL_OFFICE_STAFF_MEMBER);
      expect(response.body).toContain(UserRole.URBAN_PLANNING_MANAGER);
      expect(response.body).toContain(UserRole.PRIVATE_BUILDING_MANAGER);
      expect(response.body).toContain(UserRole.INFRASTRUCTURE_MANAGER);
      expect(response.body).toContain(UserRole.MAINTENANCE_STAFF_MEMBER);
      expect(response.body).toContain(UserRole.PUBLIC_GREEN_SPACES_MANAGER);

      // Verify does NOT contain Citizen or Administrator
      expect(response.body).not.toContain(UserRole.CITIZEN);
      expect(response.body).not.toContain(UserRole.ADMINISTRATOR);
    });

    it('should be accessible without authentication', async () => {
      // Act
      const response = await request(app)
        .get('/api/roles')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
