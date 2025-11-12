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

 // E2E Tests for User Controller
 // Uses real PostgreSQL test database with Docker
 // Tests the complete user registration flow

 describe('UserController E2E Tests', () => {
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

  describe('POST /api/users - Register Citizen', () => {
    const validRegistrationData = {
      username: 'newcitizen',
      email: 'newcitizen@example.com',
      password: 'SecurePass123!',
      first_name: 'New',
      last_name: 'Citizen',
    };

    it('should register a new citizen successfully', async () => {
      // Act
      const response = await request(app)
        .post('/api/users')
        .send(validRegistrationData)
        .expect('Content-Type', /json/)
        .expect(201);

      // Assert
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('username', validRegistrationData.username);
      expect(response.body).toHaveProperty('email', validRegistrationData.email);
      expect(response.body).toHaveProperty('first_name', validRegistrationData.first_name);
      expect(response.body).toHaveProperty('last_name', validRegistrationData.last_name);
      expect(response.body).toHaveProperty('role', 'Citizen');
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('passwordHash');

      // Verify user was created in database
      const userExists = await userRepository.existsUserByUsername(validRegistrationData.username);
      expect(userExists).toBe(true);
    });

    it('should create user with hashed password in database', async () => {
      // Act
      await request(app)
        .post('/api/users')
        .send(validRegistrationData)
        .expect(201);

      // Assert - Verify password is hashed
      const user = await userRepository.findUserByUsername(validRegistrationData.username);
      expect(user).not.toBeNull();
      expect(user?.passwordHash).toBeDefined();
      expect(user?.passwordHash).not.toBe(validRegistrationData.password);
      expect(user?.passwordHash).toContain(':'); // salt:hash format
      
      // Verify hash format: salt(32 hex chars) : hash(128 hex chars)
      const [salt, hash] = user!.passwordHash.split(':');
      expect(salt).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(hash).toHaveLength(128); // 64 bytes = 128 hex chars
    });

    it('should set role as CITIZEN by default', async () => {
      // Act
      const response = await request(app)
        .post('/api/users')
        .send(validRegistrationData)
        .expect(201);

      // Assert
      expect(response.body.role).toBe('Citizen');

      // Verify in database
      const user = await userRepository.findUserByUsername(validRegistrationData.username);
      expect(user?.role).toBe('Citizen');
    });

    it('should allow user to login after registration', async () => {
      // Arrange - Register user
      await request(app)
        .post('/api/users')
        .send(validRegistrationData)
        .expect(201);

      // Act - Try to login
      const loginResponse = await request(app)
        .post('/api/sessions')
        .send({
          username: validRegistrationData.username,
          password: validRegistrationData.password,
        })
        .expect(200);

      // Assert
      expect(loginResponse.body.username).toBe(validRegistrationData.username);
      expect(loginResponse.headers['set-cookie']).toBeDefined();
    });

    it('should return 400 for missing username', async () => {
      // Arrange
      const invalidData = {
        email: validRegistrationData.email,
        password: validRegistrationData.password,
        first_name: validRegistrationData.first_name,
        last_name: validRegistrationData.last_name,
        // username missing
      };

      // Act
      const response = await request(app)
        .post('/api/users')
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('All fields are required');
      expect(response.body.message).toContain('username');
    });

    it('should return 400 for missing email', async () => {
      // Arrange
      const invalidData = {
        username: validRegistrationData.username,
        password: validRegistrationData.password,
        first_name: validRegistrationData.first_name,
        last_name: validRegistrationData.last_name,
        // email missing
      };

      // Act
      const response = await request(app)
        .post('/api/users')
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('All fields are required');
      expect(response.body.message).toContain('email');
    });

    it('should return 400 for missing password', async () => {
      // Arrange
      const invalidData = {
        username: validRegistrationData.username,
        email: validRegistrationData.email,
        first_name: validRegistrationData.first_name,
        last_name: validRegistrationData.last_name,
        // password missing
      };

      // Act
      const response = await request(app)
        .post('/api/users')
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('All fields are required');
      expect(response.body.message).toContain('password');
    });

    it('should return 400 for missing first_name', async () => {
      // Arrange
      const invalidData = {
        username: validRegistrationData.username,
        email: validRegistrationData.email,
        password: validRegistrationData.password,
        last_name: validRegistrationData.last_name,
        // first_name missing
      };

      // Act
      const response = await request(app)
        .post('/api/users')
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('All fields are required');
      expect(response.body.message).toContain('first_name');
    });

    it('should return 400 for missing last_name', async () => {
      // Arrange
      const invalidData = {
        username: validRegistrationData.username,
        email: validRegistrationData.email,
        password: validRegistrationData.password,
        first_name: validRegistrationData.first_name,
        // last_name missing
      };

      // Act
      const response = await request(app)
        .post('/api/users')
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('All fields are required');
      expect(response.body.message).toContain('last_name');
    });

    it('should return 400 for empty string username', async () => {
      // Arrange
      const invalidData = {
        ...validRegistrationData,
        username: '',
      };

      // Act
      const response = await request(app)
        .post('/api/users')
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('All fields are required');
    });

    it('should return 400 for empty string email', async () => {
      // Arrange
      const invalidData = {
        ...validRegistrationData,
        email: '',
      };

      // Act
      const response = await request(app)
        .post('/api/users')
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('All fields are required');
    });

    it('should return 409 when username already exists (with pre-loaded user)', async () => {
      // Arrange - testcitizen already exists from test-data.sql
      const duplicateData = {
        username: 'testcitizen', // Pre-loaded user
        email: 'different.email@example.com',
        password: 'SecurePass123!',
        first_name: 'Test',
        last_name: 'Duplicate',
      };

      // Act
      const response = await request(app)
        .post('/api/users')
        .send(duplicateData)
        .expect('Content-Type', /json/)
        .expect(409);

      // Assert
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Username already exists');
    });

    it('should return 409 when username already exists (with dynamically created user)', async () => {
      // Arrange - Create first user
      await request(app)
        .post('/api/users')
        .send(validRegistrationData)
        .expect(201);

      // Act - Try to create user with same username
      const duplicateData = {
        ...validRegistrationData,
        email: 'different.email@example.com', // Different email
      };

      const response = await request(app)
        .post('/api/users')
        .send(duplicateData)
        .expect('Content-Type', /json/)
        .expect(409);

      // Assert
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Username already exists');
    });

    it('should return 409 when email already exists (with pre-loaded user)', async () => {
      // Arrange - testcitizen@example.com already exists from test-data.sql
      const duplicateData = {
        username: 'different_username',
        email: 'testcitizen@example.com', // Pre-loaded email
        password: 'SecurePass123!',
        first_name: 'Test',
        last_name: 'Duplicate',
      };

      // Act
      const response = await request(app)
        .post('/api/users')
        .send(duplicateData)
        .expect('Content-Type', /json/)
        .expect(409);

      // Assert
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Email already exists');
    });

    it('should return 409 when email already exists (with dynamically created user)', async () => {
      // Arrange - Create first user
      await request(app)
        .post('/api/users')
        .send(validRegistrationData)
        .expect(201);

      // Act - Try to create user with same email
      const duplicateData = {
        ...validRegistrationData,
        username: 'different_username', // Different username
      };

      const response = await request(app)
        .post('/api/users')
        .send(duplicateData)
        .expect('Content-Type', /json/)
        .expect(409);

      // Assert
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Email already exists');
    });

    it('should handle multiple concurrent registrations', async () => {
      // Arrange - Create multiple users simultaneously
      const users = [
        { ...validRegistrationData, username: 'concurrent_user_1', email: 'concurrent1@example.com' },
        { ...validRegistrationData, username: 'concurrent_user_2', email: 'concurrent2@example.com' },
        { ...validRegistrationData, username: 'concurrent_user_3', email: 'concurrent3@example.com' },
      ];

      // Act - Create users concurrently
      const promises = users.map(user =>
        request(app)
          .post('/api/users')
          .send(user)
      );

      const responses = await Promise.all(promises);

      // Assert - All should succeed
      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
        expect(response.body.username).toBe(users[index].username);
      });

      // Wait for database transactions to fully commit (increased for reliability in concurrent writes)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify all users exist in database
      for (const user of users) {
        const exists = await userRepository.existsUserByUsername(user.username);
        expect(exists).toBe(true);
      }
    });

    it('should not expose sensitive data in response', async () => {
      // Act
      const response = await request(app)
        .post('/api/users')
        .send(validRegistrationData)
        .expect(201);

      // Assert - Sensitive fields should not be present
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('passwordHash');
      expect(response.body).not.toHaveProperty('salt');
    });

    it('should handle special characters in username', async () => {
      // Arrange
      const specialData = {
        ...validRegistrationData,
        username: 'citizen_with-special.chars',
      };

      // Act
      const response = await request(app)
        .post('/api/users')
        .send(specialData)
        .expect(201);

      // Assert
      expect(response.body.username).toBe(specialData.username);

      // Verify can login with special chars username
      const loginResponse = await request(app)
        .post('/api/sessions')
        .send({
          username: specialData.username,
          password: specialData.password,
        })
        .expect(200);

      expect(loginResponse.body.username).toBe(specialData.username);
    });

    it('should handle special characters in names', async () => {
      // Arrange
      const specialData = {
        ...validRegistrationData,
        first_name: "Jean-Paul",
        last_name: "O'Brien",
      };

      // Act
      const response = await request(app)
        .post('/api/users')
        .send(specialData)
        .expect(201);

      // Assert
      expect(response.body.first_name).toBe(specialData.first_name);
      expect(response.body.last_name).toBe(specialData.last_name);
    });

    it('should handle long username within limits', async () => {
      // Arrange - Most systems allow up to 50-255 chars
      const longData = {
        ...validRegistrationData,
        username: 'citizen_' + 'a'.repeat(40), // 48 chars total
      };

      // Act
      const response = await request(app)
        .post('/api/users')
        .send(longData)
        .expect(201);

      // Assert
      expect(response.body.username).toBe(longData.username);
    });

    it('should return all required fields in response with correct types', async () => {
      // Act
      const response = await request(app)
        .post('/api/users')
        .send(validRegistrationData)
        .expect(201);

      // Assert - Check all expected fields are present
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('username');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('first_name');
      expect(response.body).toHaveProperty('last_name');
      expect(response.body).toHaveProperty('role');
      
      // Verify types
      expect(typeof response.body.id).toBe('number');
      expect(typeof response.body.username).toBe('string');
      expect(typeof response.body.email).toBe('string');
      expect(typeof response.body.first_name).toBe('string');
      expect(typeof response.body.last_name).toBe('string');
      expect(typeof response.body.role).toBe('string');
      
      // Verify values match input
      expect(response.body.username).toBe(validRegistrationData.username);
      expect(response.body.email).toBe(validRegistrationData.email);
      expect(response.body.first_name).toBe(validRegistrationData.first_name);
      expect(response.body.last_name).toBe(validRegistrationData.last_name);
    });

    it('should create unique user IDs for each registration', async () => {
      // Arrange
      const user1Data = {
        username: 'unique_user_1',
        email: 'unique1@example.com',
        password: 'SecurePass123!',
        first_name: 'Unique',
        last_name: 'One',
      };

      const user2Data = {
        username: 'unique_user_2',
        email: 'unique2@example.com',
        password: 'SecurePass123!',
        first_name: 'Unique',
        last_name: 'Two',
      };

      // Act
      const response1 = await request(app)
        .post('/api/users')
        .send(user1Data)
        .expect(201);

      const response2 = await request(app)
        .post('/api/users')
        .send(user2Data)
        .expect(201);

      // Assert - IDs should be different
      expect(response1.body.id).not.toBe(response2.body.id);
      expect(typeof response1.body.id).toBe('number');
      expect(typeof response2.body.id).toBe('number');
    });

    it('should set emailNotificationsEnabled to true by default', async () => {
      // Act
      await request(app)
        .post('/api/users')
        .send(validRegistrationData)
        .expect(201);

      // Assert - Check in database (response might not include this field)
      const user = await userRepository.findUserByUsername(validRegistrationData.username);
      expect(user?.emailNotificationsEnabled).toBe(true);
    });
  });

  describe('Complete Registration and Authentication Flow', () => {
    const newUser = {
      username: 'flow_test_user',
      email: 'flow.test@example.com',
      password: 'FlowTest123!',
      first_name: 'Flow',
      last_name: 'Test',
    };

    it('should complete full registration → login → access protected route → logout flow', async () => {
      // Step 1: Register
      const registerResponse = await request(app)
        .post('/api/users')
        .send(newUser)
        .expect(201);

      expect(registerResponse.body.username).toBe(newUser.username);
      const userId = registerResponse.body.id;

      // Step 2: Login
      const loginResponse = await request(app)
        .post('/api/sessions')
        .send({
          username: newUser.username,
          password: newUser.password,
        })
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(loginResponse.body.id).toBe(userId);

      // Step 3: Access protected route
      const currentUserResponse = await request(app)
        .get('/api/sessions/current')
        .set('Cookie', cookies)
        .expect(200);

      expect(currentUserResponse.body.username).toBe(newUser.username);
      expect(currentUserResponse.body.email).toBe(newUser.email);
      expect(currentUserResponse.body.id).toBe(userId);

      // Step 4: Logout
      const logoutResponse = await request(app)
        .delete('/api/sessions/current')
        .set('Cookie', cookies)
        .expect(200);

      expect(logoutResponse.body.message).toContain('Logged out');

      // Step 5: Verify cannot access protected route after logout
      await request(app)
        .get('/api/sessions/current')
        .set('Cookie', cookies)
        .expect(401);
    });

    it('should not allow duplicate registration with same credentials', async () => {
      // Step 1: First registration
      await request(app)
        .post('/api/users')
        .send(newUser)
        .expect(201);

      // Step 2: Try duplicate registration (same username)
      await request(app)
        .post('/api/users')
        .send(newUser)
        .expect(409);

      // Step 3: Try duplicate registration (same email, different username)
      const duplicateEmail = {
        ...newUser,
        username: 'different_username',
      };

      await request(app)
        .post('/api/users')
        .send(duplicateEmail)
        .expect(409);

      // Step 4: Verify original user can still login
      const loginResponse = await request(app)
        .post('/api/sessions')
        .send({
          username: newUser.username,
          password: newUser.password,
        })
        .expect(200);

      expect(loginResponse.body.username).toBe(newUser.username);
    });

    it('should maintain separate sessions for different users', async () => {
      // Arrange - Create two users
      const user1 = {
        username: 'session_user_1',
        email: 'session1@example.com',
        password: 'SessionPass1!',
        first_name: 'Session',
        last_name: 'One',
      };

      const user2 = {
        username: 'session_user_2',
        email: 'session2@example.com',
        password: 'SessionPass2!',
        first_name: 'Session',
        last_name: 'Two',
      };

      await request(app).post('/api/users').send(user1).expect(201);
      await request(app).post('/api/users').send(user2).expect(201);

      // Act - Login both users
      const login1 = await request(app)
        .post('/api/sessions')
        .send({ username: user1.username, password: user1.password })
        .expect(200);

      const login2 = await request(app)
        .post('/api/sessions')
        .send({ username: user2.username, password: user2.password })
        .expect(200);

      const cookies1 = login1.headers['set-cookie'];
      const cookies2 = login2.headers['set-cookie'];

      // Assert - Each session should return correct user
      const current1 = await request(app)
        .get('/api/sessions/current')
        .set('Cookie', cookies1)
        .expect(200);

      const current2 = await request(app)
        .get('/api/sessions/current')
        .set('Cookie', cookies2)
        .expect(200);

      expect(current1.body.username).toBe(user1.username);
      expect(current2.body.username).toBe(user2.username);
      expect(current1.body.id).not.toBe(current2.body.id);
    });

    it('should verify password is correctly hashed and verifiable', async () => {
      // Step 1: Register user
      await request(app)
        .post('/api/users')
        .send(newUser)
        .expect(201);

      // Step 2: Retrieve user from database
      const user = await userRepository.findUserByUsername(newUser.username);
      expect(user).not.toBeNull();

      // Step 3: Verify password hash format
      expect(user!.passwordHash).toContain(':');
      const [salt, hash] = user!.passwordHash.split(':');
      expect(salt).toHaveLength(32);
      expect(hash).toHaveLength(128);

      // Step 4: Verify password is verifiable (can login)
      const loginResponse = await request(app)
        .post('/api/sessions')
        .send({
          username: newUser.username,
          password: newUser.password,
        })
        .expect(200);

      expect(loginResponse.body.username).toBe(newUser.username);

      // Step 5: Verify wrong password fails
      await request(app)
        .post('/api/sessions')
        .send({
          username: newUser.username,
          password: 'WrongPassword123!',
        })
        .expect(401);
    });
  });

  describe('Integration with Pre-loaded Test Users', () => {
    it('should not conflict with pre-loaded test users', async () => {
      // Arrange - Verify pre-loaded users exist
      const testCitizenExists = await userRepository.existsUserByUsername('testcitizen');
      const testMunicipalityExists = await userRepository.existsUserByUsername('testmunicipality');
      const testAdminExists = await userRepository.existsUserByUsername('testadmin');

      expect(testCitizenExists).toBe(true);
      expect(testMunicipalityExists).toBe(true);
      expect(testAdminExists).toBe(true);

      // Act - Create new user
      const newUser = {
        username: 'integration_user',
        email: 'integration@example.com',
        password: 'IntegrationPass123!',
        first_name: 'Integration',
        last_name: 'User',
      };

      const response = await request(app)
        .post('/api/users')
        .send(newUser)
        .expect(201);

      // Assert - New user created successfully
      expect(response.body.username).toBe(newUser.username);

      // Verify pre-loaded users still exist
      expect(await userRepository.existsUserByUsername('testcitizen')).toBe(true);
      expect(await userRepository.existsUserByUsername('testmunicipality')).toBe(true);
      expect(await userRepository.existsUserByUsername('testadmin')).toBe(true);
    });

    it('should not be able to register with pre-loaded usernames', async () => {
      // Act - Try to register with pre-loaded username
      const duplicateUsername = {
        username: 'testcitizen', // Pre-loaded user
        email: 'newemail@example.com',
        password: 'NewPass123!',
        first_name: 'New',
        last_name: 'User',
      };

      const response = await request(app)
        .post('/api/users')
        .send(duplicateUsername)
        .expect(409);

      // Assert
      expect(response.body.message).toContain('Username already exists');
    });

    it('should not be able to register with pre-loaded emails', async () => {
      // Act - Try to register with pre-loaded email
      const duplicateEmail = {
        username: 'newusername',
        email: 'testcitizen@example.com', // Pre-loaded email
        password: 'NewPass123!',
        first_name: 'New',
        last_name: 'User',
      };

      const response = await request(app)
        .post('/api/users')
        .send(duplicateEmail)
        .expect(409);

      // Assert
      expect(response.body.message).toContain('Email already exists');
    });
  });
});
