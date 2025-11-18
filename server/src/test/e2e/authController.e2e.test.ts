import request from 'supertest';
import app from '../../app';
import { AppDataSource } from '@database/connection';
import { userRepository } from '@repositories/userRepository';
import { 
  setupTestDatabase, 
  teardownTestDatabase, 
  cleanDatabase,
  ensureTestDatabase 
} from '../utils/dbTestUtils';


 // E2E Tests for Authentication Controller
 // Uses real PostgreSQL test database with Docker
describe('AuthController E2E Tests', () => {
  // Setup database before all tests
  beforeAll(async () => {
    await setupTestDatabase();
    await ensureTestDatabase();
  });

  // Cleanup after all tests
  afterAll(async () => {
    await teardownTestDatabase();
  });

  // Clean dynamic data after each test (not before) to avoid race conditions
  afterEach(async () => {
    await cleanDatabase();
  });

  describe('POST /api/sessions - Login with Pre-loaded Test Users', () => {
    it('should login successfully with testcitizen user', async () => {
      // Arrange - User già presente da test-data.sql
      const testUser = {
        username: 'testcitizen',
        password: 'TestPass123!',
      };

      // Act
      const response = await request(app)
        .post('/api/sessions')
        .send(testUser)
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('username', 'testcitizen');
      expect(response.body).toHaveProperty('email', 'testcitizen@example.com');
      expect(response.body).toHaveProperty('first_name', 'Test');
      expect(response.body).toHaveProperty('last_name', 'Citizen');
      expect(response.body).toHaveProperty('role_name', 'Citizen');
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('passwordHash');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should login successfully with testmunicipality user', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .send({
          username: 'testmunicipality',
          password: 'MuniPass123!',
        })
        .expect(200);

      expect(response.body.username).toBe('testmunicipality');
      expect(response.body.role_name).toBe('Department Director');
    });

    it('should login successfully with testadmin user', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .send({
          username: 'testadmin',
          password: 'AdminPass123!',
        })
        .expect(200);

      expect(response.body.username).toBe('testadmin');
      expect(response.body.role_name).toBe('Administrator');
    });

    it('should return 401 with invalid username', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .send({
          username: 'nonexistent_user',
          password: 'TestPass123!',
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid');
    });

    it('should return 401 with invalid password', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .send({
          username: 'testcitizen',
          password: 'WrongPassword123!',
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/sessions - Login with Dynamically Created User', () => {
    let dynamicUser: {
      username: string;
      email: string;
      password: string;
      first_name: string;
      last_name: string;
    };

    beforeEach(async () => {
      // Create user dynamically for this test
      dynamicUser = {
        username: 'dynamic_test_user',
        email: 'dynamic@example.com',
        password: 'DynamicPass123!',
        first_name: 'Dynamic',
        last_name: 'User',
      };

      await userRepository.createUserWithPassword({
        username: dynamicUser.username,
        email: dynamicUser.email,
        password: dynamicUser.password,
        firstName: dynamicUser.first_name,
        lastName: dynamicUser.last_name,
        departmentRoleId: 1, // Citizen role - ID should match test database
      });
    });

    it('should login with dynamically created user', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .send({
          username: dynamicUser.username,
          password: dynamicUser.password,
        })
        .expect(200);

      expect(response.body.username).toBe(dynamicUser.username);
      expect(response.body.email).toBe(dynamicUser.email);
    });
  });

  describe('GET /api/sessions/current - Get Current User', () => {
    it('should return current user data when authenticated', async () => {
      // Arrange - Login first
      const loginResponse = await request(app)
        .post('/api/sessions')
        .send({
          username: 'testcitizen',
          password: 'TestPass123!',
        })
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];

      // Act - Get current user
      const response = await request(app)
        .get('/api/sessions/current')
        .set('Cookie', cookies)
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('username', 'testcitizen');
      expect(response.body).toHaveProperty('email', 'testcitizen@example.com');
      expect(response.body).toHaveProperty('first_name', 'Test');
      expect(response.body).toHaveProperty('last_name', 'Citizen');
      expect(response.body).toHaveProperty('role_name', 'Citizen');
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('should return 401 when not authenticated', async () => {
      // Act - Try to get current user without login
      const response = await request(app)
        .get('/api/sessions/current')
        .expect('Content-Type', /json/)
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Not authenticated');
    });

    it('should return 401 with invalid session cookie', async () => {
      // Act
      const response = await request(app)
        .get('/api/sessions/current')
        .set('Cookie', ['connect.sid=invalid-session-id'])
        .expect('Content-Type', /json/)
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('message');
    });

    it('should return same user data across multiple requests', async () => {
      // Arrange - Login
      const loginResponse = await request(app)
        .post('/api/sessions')
        .send({
          username: 'testcitizen',
          password: 'TestPass123!',
        })
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];

      // Act - Multiple requests
      const response1 = await request(app)
        .get('/api/sessions/current')
        .set('Cookie', cookies)
        .expect(200);

      const response2 = await request(app)
        .get('/api/sessions/current')
        .set('Cookie', cookies)
        .expect(200);

      // Assert
      expect(response1.body.id).toBe(response2.body.id);
      expect(response1.body.username).toBe(response2.body.username);
    });
  });

  describe('DELETE /api/sessions/current - Logout', () => {
    it('should logout successfully when authenticated', async () => {
      // Arrange - Login first
      const loginResponse = await request(app)
        .post('/api/sessions')
        .send({
          username: 'testcitizen',
          password: 'TestPass123!',
        })
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];

      // Act - Logout
      const response = await request(app)
        .delete('/api/sessions/current')
        .set('Cookie', cookies)
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Logged out successfully');
    });

    it('should clear session cookie on logout', async () => {
      // Arrange - Login
      const loginResponse = await request(app)
        .post('/api/sessions')
        .send({
          username: 'testcitizen',
          password: 'TestPass123!',
        })
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];

      // Act - Logout
      const logoutResponse = await request(app)
        .delete('/api/sessions/current')
        .set('Cookie', cookies)
        .expect(200);

      // Assert - Cookie should be cleared
      const setCookieHeader = logoutResponse.headers['set-cookie'];
      if (setCookieHeader) {
        expect(setCookieHeader[0]).toContain('connect.sid');
      }
    });

    it('should not be able to access protected routes after logout', async () => {
      // Arrange - Login
      const loginResponse = await request(app)
        .post('/api/sessions')
        .send({
          username: 'testcitizen',
          password: 'TestPass123!',
        })
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];

      // Act - Logout
      await request(app)
        .delete('/api/sessions/current')
        .set('Cookie', cookies)
        .expect(200);

      // Assert - Try to access protected route
      await request(app)
        .get('/api/sessions/current')
        .set('Cookie', cookies)
        .expect(401);
    });

    it('should return 401 when trying to logout without authentication', async () => {
      // Act
      const response = await request(app)
        .delete('/api/sessions/current')
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('message');
    });

    it('should handle logout with invalid session gracefully', async () => {
      // Act
      await request(app)
        .delete('/api/sessions/current')
        .set('Cookie', ['connect.sid=invalid-session'])
        .expect(401);
    });
  });

  describe('Complete Authentication Flow', () => {
    it('should complete full login → get user → logout flow', async () => {
      // Step 1: Login
      const loginResponse = await request(app)
        .post('/api/sessions')
        .send({
          username: 'testcitizen',
          password: 'TestPass123!',
        })
        .expect(200);

      expect(loginResponse.body.username).toBe('testcitizen');
      const cookies = loginResponse.headers['set-cookie'];

      // Step 2: Get current user
      const getCurrentResponse = await request(app)
        .get('/api/sessions/current')
        .set('Cookie', cookies)
        .expect(200);

      expect(getCurrentResponse.body.username).toBe('testcitizen');

      // Step 3: Logout
      const logoutResponse = await request(app)
        .delete('/api/sessions/current')
        .set('Cookie', cookies)
        .expect(200);

      expect(logoutResponse.body.message).toContain('Logged out');

      // Step 4: Verify cannot access protected route
      await request(app)
        .get('/api/sessions/current')
        .set('Cookie', cookies)
        .expect(401);
    });

    it('should handle multiple login sessions for same user', async () => {
      // Act - Create two sessions
      const session1 = await request(app)
        .post('/api/sessions')
        .send({
          username: 'testcitizen',
          password: 'TestPass123!',
        })
        .expect(200);

      const session2 = await request(app)
        .post('/api/sessions')
        .send({
          username: 'testcitizen',
          password: 'TestPass123!',
        })
        .expect(200);

      const cookies1 = session1.headers['set-cookie'];
      const cookies2 = session2.headers['set-cookie'];

      // Assert - Both sessions should work independently
      await request(app)
        .get('/api/sessions/current')
        .set('Cookie', cookies1)
        .expect(200);

      await request(app)
        .get('/api/sessions/current')
        .set('Cookie', cookies2)
        .expect(200);
    });
  });
});
