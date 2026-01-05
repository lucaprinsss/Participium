import request from 'supertest';
import app from '../../app';
import { userRepository } from '@repositories/userRepository';
import { AppDataSource } from '@database/connection';
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
      expect(response.body).toHaveProperty('roles');
      expect(response.body.roles.some((r: any) => r.role_name === 'Citizen')).toBe(true);
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
      expect(response.body.roles.some((r: any) => r.role_name === 'Citizen')).toBe(true);

      // Verify in database
      const user = await userRepository.findUserByUsername(validRegistrationData.username);
      const roleNames = user?.userRoles?.map(ur => ur.departmentRole?.role?.name) || [];
      expect(roleNames).toContain('Citizen');
    });

    it('should allow user to login after registration', async () => {
      // Arrange - Register user
      await request(app)
        .post('/api/users')
        .send(validRegistrationData)
        .expect(201);

      // Verify email
      const user = await userRepository.findUserByEmail(validRegistrationData.email);
      expect(user?.verificationCode).toBeDefined();
      await request(app)
        .post('/api/sessions/verifyEmail')
        .send({
          email: validRegistrationData.email,
          otpCode: user!.verificationCode,
        })
        .expect(200);

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
      expect(response.body.message).toMatch(/username/i);
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
      expect(response.body.message).toMatch(/email/i);
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
      expect(response.body.message).toMatch(/password/i);
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
      expect(response.body.message).toMatch(/first name/i);
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
      expect(response.body.message).toMatch(/last name/i);
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
      expect(response.body.message).toBeDefined();
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
      expect(response.body.message).toBeDefined();
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
      for (const [index, response] of responses.entries()) {
        expect(response.status).toBe(201);
        expect(response.body.username).toBe(users[index].username);
      }

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

      // Verify email
      const user = await userRepository.findUserByEmail(specialData.email);
      expect(user?.verificationCode).toBeDefined();
      await request(app)
        .post('/api/sessions/verifyEmail')
        .send({
          email: specialData.email,
          otpCode: user!.verificationCode,
        })
        .expect(200);

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
      expect(response.body).toHaveProperty('roles');

      // Verify types
      expect(typeof response.body.id).toBe('number');
      expect(typeof response.body.username).toBe('string');
      expect(typeof response.body.email).toBe('string');
      expect(typeof response.body.first_name).toBe('string');
      expect(typeof response.body.last_name).toBe('string');
      expect(Array.isArray(response.body.roles)).toBe(true);

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

      // Step 1.5: Verify email
      const user = await userRepository.findUserByEmail(newUser.email);
      expect(user?.verificationCode).toBeDefined();
      await request(app)
        .post('/api/sessions/verifyEmail')
        .send({
          email: newUser.email,
          otpCode: user!.verificationCode,
        })
        .expect(200);

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
      const loggedOutResponse = await request(app)
        .get('/api/sessions/current')
        .set('Cookie', cookies)
        .expect(401);

      expect(loggedOutResponse.body).toHaveProperty('message');
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

      // Step 3.5: Verify email
      const user = await userRepository.findUserByEmail(newUser.email);
      expect(user?.verificationCode).toBeDefined();
      await request(app)
        .post('/api/sessions/verifyEmail')
        .send({
          email: newUser.email,
          otpCode: user!.verificationCode,
        })
        .expect(200);

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

      // Verify emails for both users
      const dbUser1 = await userRepository.findUserByEmail(user1.email);
      expect(dbUser1?.verificationCode).toBeDefined();
      await request(app)
        .post('/api/sessions/verifyEmail')
        .send({
          email: user1.email,
          otpCode: dbUser1!.verificationCode,
        })
        .expect(200);

      const dbUser2 = await userRepository.findUserByEmail(user2.email);
      expect(dbUser2?.verificationCode).toBeDefined();
      await request(app)
        .post('/api/sessions/verifyEmail')
        .send({
          email: user2.email,
          otpCode: dbUser2!.verificationCode,
        })
        .expect(200);

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

      // Step 3.5: Verify email
      expect(user!.verificationCode).toBeDefined();
      await request(app)
        .post('/api/sessions/verifyEmail')
        .send({
          email: newUser.email,
          otpCode: user!.verificationCode,
        })
        .expect(200);

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
      const wrongPasswordResponse = await request(app)
        .post('/api/sessions')
        .send({
          username: newUser.username,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(wrongPasswordResponse.body).toHaveProperty('message');
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

  describe('GET /api/users/external-maintainers', () => {
    let techStaffCookies: string[];
    let citizenCookies: string[];
    let citizenId: number;

    const TECH_STAFF_USERNAME = 'teststaffmember';
    const TECH_STAFF_PASSWORD = 'StaffPass123!';
    const CITIZEN_USERNAME = 'testcitizen';
    const CITIZEN_PASSWORD = 'TestPass123!';

    const loginAs = async (username: string, password: string): Promise<string[]> => {
      const response = await request(app)
        .post('/api/sessions')
        .send({ username, password })
        .expect(200);
      const cookies = response.headers['set-cookie'];
      return Array.isArray(cookies) ? cookies : [cookies];
    };

    beforeEach(async () => {
      // Verify test users exist, if not reload test data
      const userExists = await userRepository.existsUserByUsername(TECH_STAFF_USERNAME);
      if (!userExists) {
        console.log('Test users not found, reloading test data...');
        const { loadTestData } = await import('../utils/dbTestUtils');
        await loadTestData();
      }

      // Get citizen ID
      const citizenResult = await AppDataSource.query(
        `SELECT id FROM users WHERE username = $1`,
        [CITIZEN_USERNAME]
      );
      if (citizenResult.length > 0) {
        citizenId = citizenResult[0].id;
      }

      // Login users before each test to ensure fresh cookies
      techStaffCookies = await loginAs(TECH_STAFF_USERNAME, TECH_STAFF_PASSWORD);
      citizenCookies = await loginAs(CITIZEN_USERNAME, CITIZEN_PASSWORD);
    });

    it('should get external maintainers by category successfully', async () => {
      const response = await request(app)
        .get('/api/users/external-maintainers')
        .query({ category: 'Public Lighting' })
        .set('Cookie', techStaffCookies)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);

      // Verify structure
      for (const maintainer of response.body) {
        expect(maintainer).toHaveProperty('id');
        expect(maintainer).toHaveProperty('username');
        expect(maintainer).toHaveProperty('email');
        expect(maintainer).toHaveProperty('first_name');
        expect(maintainer).toHaveProperty('last_name');
        expect(maintainer.roles.some((r: any) => r.role_name === 'External Maintainer')).toBe(true);
        expect(maintainer.company_name).toBe('Lighting Solutions SRL');
      }

      // Verify test-data.sql maintainers are included
      const usernames = response.body.map((m: any) => m.username);
      expect(usernames).toContain('testexternal');
      expect(usernames).toContain('testexternal2');
    });

    it('should return empty array for category with no maintainers', async () => {
      const response = await request(app)
        .get('/api/users/external-maintainers')
        .query({ category: 'Sewer System' })
        .set('Cookie', techStaffCookies)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should get waste category maintainers', async () => {
      const response = await request(app)
        .get('/api/users/external-maintainers')
        .query({ category: 'Waste' })
        .set('Cookie', techStaffCookies)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);

      // Verify testexternal3 is in Waste category
      const usernames = response.body.map((m: any) => m.username);
      expect(usernames).toContain('testexternal3');
    });

    it('should return all maintainers with missing category parameter (200)', async () => {
      const response = await request(app)
        .get('/api/users/external-maintainers')
        .set('Cookie', techStaffCookies)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should fail without authentication (401)', async () => {
      const response = await request(app)
        .get('/api/users/external-maintainers')
        .query({ category: 'Public Lighting' })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should fail as citizen (403)', async () => {
      const response = await request(app)
        .get('/api/users/external-maintainers')
        .query({ category: 'Public Lighting' })
        .set('Cookie', citizenCookies)
        .expect(403);

      expect(response.body).toHaveProperty('message');
    });

    it('should return maintainers ordered by last_name', async () => {
      const response = await request(app)
        .get('/api/users/external-maintainers')
        .query({ category: 'Public Lighting' })
        .set('Cookie', techStaffCookies)
        .expect(200);

      const lastNames = response.body.map((m: any) => m.last_name);
      const sortedLastNames = [...lastNames].sort((a, b) => a.localeCompare(b));
      expect(lastNames).toEqual(sortedLastNames);
    });
  });

  describe('GET /api/users/notifications', () => {
    let citizenId: number;
    let citizenCookies: string[];
    let notification1Id: number;
    let notification2Id: number;
    let notification3Id: number;
    let otherUserId: number;

    const CITIZEN_USERNAME = 'testcitizen';
    const CITIZEN_PASSWORD = 'TestPass123!';

    const loginAs = async (username: string, password: string): Promise<string[]> => {
      const response = await request(app)
        .post('/api/sessions')
        .send({ username, password })
        .expect(200);
      const cookies = response.headers['set-cookie'];
      return Array.isArray(cookies) ? cookies : [cookies];
    };

    beforeEach(async () => {
      // Get citizen ID
      const citizenResult = await AppDataSource.query(
        `SELECT id FROM users WHERE username = $1`,
        [CITIZEN_USERNAME]
      );
      citizenId = citizenResult[0].id;

      // Login citizen
      citizenCookies = await loginAs(CITIZEN_USERNAME, CITIZEN_PASSWORD);

      // Get another user ID for testing
      const otherUserResult = await AppDataSource.query(
        `SELECT id FROM users WHERE username = 'testuser' LIMIT 1`
      );
      if (otherUserResult.length > 0) {
        otherUserId = otherUserResult[0].id;
      }

      // Create test notifications for citizen
      const result1 = await AppDataSource.query(
        `INSERT INTO notifications (user_id, content, is_read, created_at)
        VALUES ($1, 'Your report has been updated', false, CURRENT_TIMESTAMP - interval '2 hours')
        RETURNING id`,
        [citizenId]
      );
      notification1Id = result1[0].id;

      const result2 = await AppDataSource.query(
        `INSERT INTO notifications (user_id, content, is_read, created_at)
        VALUES ($1, 'New message on your report', false, CURRENT_TIMESTAMP - interval '1 hour')
        RETURNING id`,
        [citizenId]
      );
      notification2Id = result2[0].id;

      const result3 = await AppDataSource.query(
        `INSERT INTO notifications (user_id, content, is_read, created_at)
        VALUES ($1, 'Report resolved', true, CURRENT_TIMESTAMP - interval '3 hours')
        RETURNING id`,
        [citizenId]
      );
      notification3Id = result3[0].id;
    });

    afterEach(async () => {
      // Clean up notifications
      await AppDataSource.query(`DELETE FROM notifications WHERE user_id = $1`, [citizenId]);
      if (otherUserId) {
        await AppDataSource.query(`DELETE FROM notifications WHERE user_id = $1`, [otherUserId]);
      }
    });

    it('should return all notifications for authenticated user', async () => {
      const response = await request(app)
        .get('/api/users/notifications')
        .set('Cookie', citizenCookies)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);
      
      // Should be ordered by createdAt DESC (most recent first)
      expect(response.body[0].content).toBe('New message on your report');
      expect(response.body[1].content).toBe('Your report has been updated');
      expect(response.body[2].content).toBe('Report resolved');
    });

    it('should filter unread notifications when is_read=false', async () => {
      const response = await request(app)
        .get('/api/users/notifications?is_read=false')
        .set('Cookie', citizenCookies)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body.every((n: any) => n.isRead === false)).toBe(true);
    });

    it('should filter read notifications when is_read=true', async () => {
      const response = await request(app)
        .get('/api/users/notifications?is_read=true')
        .set('Cookie', citizenCookies)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].isRead).toBe(true);
      expect(response.body[0].content).toBe('Report resolved');
    });

    it('should return empty array when user has no notifications', async () => {
      // Clean notifications first
      await AppDataSource.query(`DELETE FROM notifications WHERE user_id = $1`, [citizenId]);

      const response = await request(app)
        .get('/api/users/notifications')
        .set('Cookie', citizenCookies)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/users/notifications')
        .expect(401);

      expect(response.body.name).toBe('UnauthorizedError');
    });

    it('should include notification properties', async () => {
      const response = await request(app)
        .get('/api/users/notifications')
        .set('Cookie', citizenCookies)
        .expect(200);

      expect(response.body.length).toBeGreaterThan(0);
      const notification = response.body[0];
      expect(notification).toHaveProperty('id');
      expect(notification).toHaveProperty('userId');
      expect(notification).toHaveProperty('content');
      expect(notification).toHaveProperty('isRead');
      expect(notification).toHaveProperty('createdAt');
    });

    it('should only return notifications belonging to authenticated user', async () => {
      if (!otherUserId) {
        // Skip if no other user available
        return;
      }

      // Create a notification for another user
      await AppDataSource.query(
        `INSERT INTO notifications (user_id, content, is_read, created_at)
        VALUES ($1, 'Other user notification', false, CURRENT_TIMESTAMP)`,
        [otherUserId]
      );

      const response = await request(app)
        .get('/api/users/notifications')
        .set('Cookie', citizenCookies)
        .expect(200);

      // Should only return 3 notifications (not the one from another user)
      expect(response.body.length).toBe(3);
      expect(response.body.every((n: any) => n.userId === citizenId)).toBe(true);
    });

    it('should handle invalid is_read query parameter', async () => {
      const response = await request(app)
        .get('/api/users/notifications?is_read=invalid')
        .set('Cookie', citizenCookies)
        .expect(200);

      // Should return all notifications when is_read is invalid
      expect(response.body.length).toBe(3);
    });
  });

  describe('PATCH /api/users/notifications/:id', () => {
    let citizenId: number;
    let citizenCookies: string[];
    let notificationId: number;
    let otherUserId: number;
    let otherUserCookies: string[];

    const CITIZEN_USERNAME = 'testcitizen';
    const CITIZEN_PASSWORD = 'TestPass123!';

    const loginAs = async (username: string, password: string): Promise<string[]> => {
      const response = await request(app)
        .post('/api/sessions')
        .send({ username, password })
        .expect(200);
      const cookies = response.headers['set-cookie'];
      return Array.isArray(cookies) ? cookies : [cookies];
    };

    beforeEach(async () => {
      // Get citizen ID
      const citizenResult = await AppDataSource.query(
        `SELECT id FROM users WHERE username = $1`,
        [CITIZEN_USERNAME]
      );
      citizenId = citizenResult[0].id;

      // Login citizen
      citizenCookies = await loginAs(CITIZEN_USERNAME, CITIZEN_PASSWORD);

      const result = await AppDataSource.query(
        `INSERT INTO notifications (user_id, content, is_read, created_at)
        VALUES ($1, 'Test notification', false, CURRENT_TIMESTAMP)
        RETURNING id`,
        [citizenId]
      );
      notificationId = result[0].id;

      // Get another user for ownership tests
      const otherUserResult = await AppDataSource.query(
        `SELECT id FROM users WHERE username = 'testuser' LIMIT 1`
      );
      if (otherUserResult.length > 0) {
        otherUserId = otherUserResult[0].id;
        const loginResponse = await request(app)
          .post('/api/sessions')
          .send({ username: 'testuser', password: 'TestPass123!' })
          .expect(200);
        const cookies = loginResponse.headers['set-cookie'];
        otherUserCookies = Array.isArray(cookies) ? cookies : [cookies];
      }
    });

    afterEach(async () => {
      await AppDataSource.query(`DELETE FROM notifications WHERE user_id = $1`, [citizenId]);
      if (otherUserId) {
        await AppDataSource.query(`DELETE FROM notifications WHERE user_id = $1`, [otherUserId]);
      }
    });

    it('should mark notification as read', async () => {
      const response = await request(app)
        .patch(`/api/users/notifications/${notificationId}`)
        .set('Cookie', citizenCookies)
        .send({ is_read: true })
        .expect(200);

      expect(response.body.id).toBe(notificationId);
      expect(response.body.isRead).toBe(true);
      expect(response.body.content).toBe('Test notification');

      // Verify in database
      const dbResult = await AppDataSource.query(
        `SELECT is_read FROM notifications WHERE id = $1`,
        [notificationId]
      );
      expect(dbResult[0].is_read).toBe(true);
    });

    it('should mark notification as unread', async () => {
      // First mark as read
      await AppDataSource.query(
        `UPDATE notifications SET is_read = true WHERE id = $1`,
        [notificationId]
      );

      const response = await request(app)
        .patch(`/api/users/notifications/${notificationId}`)
        .set('Cookie', citizenCookies)
        .send({ is_read: false })
        .expect(200);

      expect(response.body.isRead).toBe(false);

      // Verify in database
      const dbResult = await AppDataSource.query(
        `SELECT is_read FROM notifications WHERE id = $1`,
        [notificationId]
      );
      expect(dbResult[0].is_read).toBe(false);
    });

    it('should return 403 when trying to update another user\'s notification', async () => {
      if (!otherUserId || !otherUserCookies) {
        // Skip if no other user available
        return;
      }

      // Create notification for another user
      const otherResult = await AppDataSource.query(
        `INSERT INTO notifications (user_id, content, is_read, created_at)
        VALUES ($1, 'Other user notification', false, CURRENT_TIMESTAMP)
        RETURNING id`,
        [otherUserId]
      );
      const otherNotificationId = otherResult[0].id;

      const response = await request(app)
        .patch(`/api/users/notifications/${otherNotificationId}`)
        .set('Cookie', citizenCookies)
        .send({ is_read: true })
        .expect(403);

      expect(response.body.message).toContain('own notifications');
    });

    it('should return 404 for non-existent notification', async () => {
      const response = await request(app)
        .patch('/api/users/notifications/999999')
        .set('Cookie', citizenCookies)
        .send({ is_read: true })
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('should return 400 for invalid notification ID format', async () => {
      const response = await request(app)
        .patch('/api/users/notifications/invalid')
        .set('Cookie', citizenCookies)
        .send({ is_read: true })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should return 400 for negative notification ID', async () => {
      const response = await request(app)
        .patch('/api/users/notifications/-1')
        .set('Cookie', citizenCookies)
        .send({ is_read: true })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should return 400 for decimal notification ID', async () => {
      const response = await request(app)
        .patch('/api/users/notifications/1.5')
        .set('Cookie', citizenCookies)
        .send({ is_read: true })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .patch(`/api/users/notifications/${notificationId}`)
        .send({ is_read: true })
        .expect(401);

      expect(response.body.name).toBe('UnauthorizedError');
    });

    it('should handle truthy values for is_read', async () => {
      const response = await request(app)
        .patch(`/api/users/notifications/${notificationId}`)
        .set('Cookie', citizenCookies)
        .send({ is_read: 1 })
        .expect(200);

      expect(response.body.isRead).toBe(true);
    });

    it('should handle falsy values for is_read', async () => {
      const response = await request(app)
        .patch(`/api/users/notifications/${notificationId}`)
        .set('Cookie', citizenCookies)
        .send({ is_read: 0 })
        .expect(200);

      expect(response.body.isRead).toBe(false);
    });

    it('should preserve other notification fields when updating', async () => {
      const response = await request(app)
        .patch(`/api/users/notifications/${notificationId}`)
        .set('Cookie', citizenCookies)
        .send({ is_read: true })
        .expect(200);

      expect(response.body.userId).toBe(citizenId);
      expect(response.body.content).toBe('Test notification');
      expect(response.body.createdAt).toBeDefined();
    });

    it('should allow technical staff to update their own notifications', async () => {
      // Create notification for technician
      const techResult = await AppDataSource.query(
        `SELECT id FROM users WHERE username = 'teststaffmember' LIMIT 1`
      );
      const techId = techResult[0]?.id;
      
      if (!techId) {
        // Skip if tech user not available
        return;
      }

      const techNotifResult = await AppDataSource.query(
        `INSERT INTO notifications (user_id, content, is_read, created_at)
        VALUES ($1, 'Staff notification', false, CURRENT_TIMESTAMP)
        RETURNING id`,
        [techId]
      );
      const techNotifId = techNotifResult[0].id;

      const techLoginResponse = await request(app)
        .post('/api/sessions')
        .send({ username: 'teststaffmember', password: 'StaffPass123!' })
        .expect(200);
      const techCookies = techLoginResponse.headers['set-cookie'];

      const response = await request(app)
        .patch(`/api/users/notifications/${techNotifId}`)
        .set('Cookie', techCookies)
        .send({ is_read: true })
        .expect(200);

      expect(response.body.isRead).toBe(true);

      // Cleanup
      await AppDataSource.query(`DELETE FROM notifications WHERE id = $1`, [techNotifId]);
    });
  });
});
