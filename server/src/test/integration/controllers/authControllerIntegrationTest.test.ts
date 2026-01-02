import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import { AppDataSource } from "@database/connection";
import app from "../../../app";
import { UserEntity } from "@models/entity/userEntity";
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
      await AppDataSource.getRepository(UserEntity).delete({ id: In(createdUserIds) });
      createdUserIds = [];
    }
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  // Cleanup after each test: Delete the user created in beforeEach
  afterEach(async () => {
    if (createdUserIds.length > 0) {
      const repository = AppDataSource.getRepository(UserEntity);
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
      emailNotificationsEnabled: true,
      isVerified: true
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

  // --- POST /api/sessions/verifyEmail (Email Verification)
  describe('POST /api/sessions/verifyEmail', () => {
    let unverifiedUser: {
      id: number;
      username: string;
      email: string;
      password: string;
      verificationCode: string;
    };

    beforeEach(async () => {
      const citizenDeptRole = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Citizen');
      if (!citizenDeptRole) {
        throw new Error('Citizen role not found in database');
      }

      const testCode = '123456';
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

      const userData = {
        username: `unverified${r()}`,
        email: `unverified${r()}@test.com`,
        password: 'UnverifiedPass123!',
        firstName: 'Unverified',
        lastName: 'User',
        departmentRoleId: citizenDeptRole.id,
        isVerified: false,
        verificationCode: testCode,
        verificationCodeExpiresAt: expiresAt,
        telegramLinkConfirmed: false,
      };

      const user = await userRepository.createUserWithPassword(userData);
      createdUserIds.push(user.id);

      unverifiedUser = {
        id: user.id,
        username: userData.username,
        email: userData.email,
        password: userData.password,
        verificationCode: testCode,
      };
    });

    it('should verify email successfully with valid code (200)', async () => {
      const response = await agent
        .post('/api/sessions/verifyEmail')
        .send({
          email: unverifiedUser.email,
          otpCode: unverifiedUser.verificationCode,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Email verified successfully');

      // Verify user can now login
      const loginResponse = await agent
        .post('/api/sessions')
        .send({
          username: unverifiedUser.username,
          password: unverifiedUser.password,
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.username).toBe(unverifiedUser.username);
    });

    it('should return 400 when email is missing', async () => {
      const response = await agent
        .post('/api/sessions/verifyEmail')
        .send({
          otpCode: '123456',
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 400,
        message: 'Email and verification code are required.',
        name: 'BadRequestError',
      });
    });

    it('should return 400 when verification code is missing', async () => {
      const response = await agent
        .post('/api/sessions/verifyEmail')
        .send({
          email: unverifiedUser.email,
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 400,
        message: 'Email and verification code are required.',
        name: 'BadRequestError',
      });
    });

    it('should return 400 with invalid code format (not 6 digits)', async () => {
      const response1 = await agent
        .post('/api/sessions/verifyEmail')
        .send({
          email: unverifiedUser.email,
          otpCode: '12345', // Only 5 digits
        });

      expect(response1.status).toBe(400);
      expect(response1.body).toEqual({
        code: 400,
        message: 'Verification code must be exactly 6 digits',
        name: 'BadRequestError',
      });

      const response2 = await agent
        .post('/api/sessions/verifyEmail')
        .send({
          email: unverifiedUser.email,
          otpCode: '12345A', // Contains letter
        });

      expect(response2.status).toBe(400);
      expect(response2.body.message).toContain('must be exactly 6 digits');
    });

    it('should return 404 when email does not exist', async () => {
      const response = await agent
        .post('/api/sessions/verifyEmail')
        .send({
          email: 'nonexistent@test.com',
          otpCode: '123456',
        });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        code: 404,
        message: 'No account found with this email address.',
        name: 'NotFoundError',
      });
    });

    it('should return 400 with incorrect verification code', async () => {
      const response = await agent
        .post('/api/sessions/verifyEmail')
        .send({
          email: unverifiedUser.email,
          otpCode: '999999', // Wrong code
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 400,
        message: 'Invalid verification code',
        name: 'BadRequestError',
      });
    });

    it('should return 400 when trying to verify already verified email', async () => {
      // First verify the email
      await agent
        .post('/api/sessions/verifyEmail')
        .send({
          email: unverifiedUser.email,
          otpCode: unverifiedUser.verificationCode,
        });

      // Try to verify again
      const response = await agent
        .post('/api/sessions/verifyEmail')
        .send({
          email: unverifiedUser.email,
          otpCode: unverifiedUser.verificationCode,
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        code: 400,
        message: 'Email is already verified.',
        name: 'BadRequestError',
      });
    });

    it('should return 400 with expired verification code', async () => {
      const citizenDeptRole = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Citizen');
      const expiredDate = new Date(Date.now() - 60 * 1000); // 1 minute ago (expired)
      const expiredCode = '654321';

      const expiredUserData = {
        username: `expired${r()}`,
        email: `expired${r()}@test.com`,
        password: 'ExpiredPass123!',
        firstName: 'Expired',
        lastName: 'User',
        departmentRoleId: citizenDeptRole!.id,
        isVerified: false,
        verificationCode: expiredCode,
        verificationCodeExpiresAt: expiredDate,
      telegramLinkConfirmed: false,
      };

      const expiredUser = await userRepository.createUserWithPassword(expiredUserData);
      createdUserIds.push(expiredUser.id);

      const response = await agent
        .post('/api/sessions/verifyEmail')
        .send({
          email: expiredUserData.email,
          otpCode: expiredCode,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('expired');
    });

    it('should prevent login before email verification', async () => {
      const response = await agent
        .post('/api/sessions')
        .send({
          username: unverifiedUser.username,
          password: unverifiedUser.password,
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        code: 401,
        message: 'Email not verified. Please verify your email before logging in.',
        name: 'UnauthorizedError',
      });
    });

    it('should handle internal server error gracefully (500)', async () => {
      const mockError = new Error('Database connection failed');
      jest.spyOn(userRepository, 'verifyEmailCode').mockRejectedValue(mockError);

      const response = await agent
        .post('/api/sessions/verifyEmail')
        .send({
          email: unverifiedUser.email,
          otpCode: unverifiedUser.verificationCode,
        });

      expect(response.status).toBe(500);
      expect(response.text).toContain(mockError.message);
    });
  });

});