import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import { AppDataSource } from "@database/connection";
import app from "../../../app";
import { userEntity } from "@models/entity/userEntity";
import { userRepository } from '@repositories/userRepository';
import { departmentRoleRepository } from '@repositories/departmentRoleRepository';
import { In } from 'typeorm';

const r = () => `_${Math.floor(Math.random() * 1000000)}`;

let TEST_USER_CREDENTIALS: any;

describe('AuthController Integration Tests', () => {

  let agent: ReturnType<typeof request.agent>;
  let createdUserIds: number[] = [];

  // Setup database connection
  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });

  // Final cleanup: Delete all created users
  afterAll(async () => {
    if (createdUserIds.length > 0) {
      await AppDataSource.getRepository(userEntity).delete({ id: In(createdUserIds) });
      createdUserIds = [];
    }
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  // Cleanup after each test: Delete the user created in beforeEach
  afterEach(async () => {
    if (createdUserIds.length > 0) {
      const repository = AppDataSource.getRepository(userEntity);
      await repository.delete({ id: In(createdUserIds) });
      createdUserIds = [];
    }
    jest.restoreAllMocks();
  });

  // Setup before each test: Create a test user and an agent
  beforeEach(async () => {
    // Get dynamic department role ID for Citizen
    const citizenDeptRole = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Citizen');
    if (!citizenDeptRole) {
      throw new Error('Citizen role not found in database');
    }

    TEST_USER_CREDENTIALS = {
      username: `auth_test_user${r()}`,
      password: 'Password123!',
      email: `auth${r()}@test.com`,
      firstName: 'Auth',
      lastName: 'Test',
      departmentRoleId: citizenDeptRole.id
    };

    const user = await userRepository.createUserWithPassword({
      ...TEST_USER_CREDENTIALS,
      emailNotificationsEnabled: true
    });

    createdUserIds.push(user.id);

    agent = request.agent(app);
  });

  // --- POST /api/sessions (Login) 
  describe('POST /api/sessions', () => {

    it('should login successfully with valid credentials and return user data (200)', async () => {
      const response = await agent
        .post('/api/sessions')
        .send({
          username: TEST_USER_CREDENTIALS.username,
          password: TEST_USER_CREDENTIALS.password,
        });

      expect(response.status).toBe(200);
      expect(response.body.username).toBe(TEST_USER_CREDENTIALS.username);
      expect(response.body.password).toBeUndefined();
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should fail login with invalid password (401)', async () => {
      const response = await agent
        .post('/api/sessions')
        .send({
          username: TEST_USER_CREDENTIALS.username,
          password: 'WrongPassword!',
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        code: 401,
        message: 'Invalid credentials',
        name: 'UnauthorizedError',
      });
    });

    it('should fail login with non-existent user (401)', async () => {
      const response = await agent
        .post('/api/sessions')
        .send({
          username: 'nonexistent_user',
          password: 'Password123!',
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        code: 401,
        message: 'Invalid credentials',
        name: 'UnauthorizedError',
      });
    });

    it('internal server error during login should return 500', async () => {
      const mockError = new Error('Internal server error');

      // Mock verifyCredentials instead of findUserByUsername to avoid interfering with Passport
      jest.spyOn(userRepository, 'verifyCredentials').mockRejectedValue(mockError);

      const response = await agent
        .post('/api/sessions')
        .send({
          username: TEST_USER_CREDENTIALS.username,
          password: TEST_USER_CREDENTIALS.password,
        });

      expect(response.status).toBe(500);
      expect(response.text).toContain(mockError.message);
    });

  });

  // --- GET /api/sessions/current (Get Current User) 
  describe('GET /api/sessions/current', () => {

    it('should fail if not authenticated (401)', async () => {
      const response = await agent.get('/api/sessions/current');
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Not authenticated');
      expect(response.body).toHaveProperty('name', 'UnauthorizedError');
    });

    it('should return current user if authenticated (200)', async () => {
      await agent
        .post('/api/sessions')
        .send({
          username: TEST_USER_CREDENTIALS.username,
          password: TEST_USER_CREDENTIALS.password,
        });

      const response = await agent.get('/api/sessions/current');
      expect(response.status).toBe(200);
      expect(response.body.username).toBe(TEST_USER_CREDENTIALS.username);
    });

  });


  // --- DELETE /api/sessions/current (Logout) 
  describe('DELETE /api/sessions/current', () => {

    it('should fail if not authenticated (401)', async () => {
      const response = await agent.delete('/api/sessions/current');
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Not authenticated');
      expect(response.body).toHaveProperty('name', 'UnauthorizedError');
    });

    it('should logout successfully if authenticated (200) and destroy session', async () => {
      await agent
        .post('/api/sessions')
        .send({
          username: TEST_USER_CREDENTIALS.username,
          password: TEST_USER_CREDENTIALS.password,
        });

      const logoutResponse = await agent.delete('/api/sessions/current');
      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body.message).toBe('Logged out successfully');

      const afterLogoutResponse = await agent.get('/api/sessions/current');
      expect(afterLogoutResponse.status).toBe(401);
      expect(afterLogoutResponse.body).toHaveProperty('message', 'Not authenticated');
    });

  });

});