import { afterAll, afterEach, beforeAll, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import { AppDataSource } from "@database/connection";
import app from "../../../app";
import { userEntity } from "@models/entity/userEntity";
import { RegisterRequest } from '@models/dto/input/RegisterRequest';
import { In } from 'typeorm'; 

const random = () => Math.floor(Math.random() * 1000000);
const buildRegisterPayload = (overrides: Partial<Omit<RegisterRequest, 'role'>> = {}) => ({
  username: `citizen_${random()}`,
  first_name: "Test",
  last_name: "Citizen",
  email: `citizen.${random()}@example.com`,
  password: "securePassword123!",
  ...overrides,
});

describe('UserController Integration Tests', () => {
  // Arrat to track created users for cleanup
  let createdUserIds: number[] = [];

  // Setup before all tests
  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });

  // Cleanup after all tests
  afterAll(async () => {
    if (createdUserIds.length > 0) {
      const repository = AppDataSource.getRepository(userEntity);
      await repository.delete({ id: In(createdUserIds) });
      createdUserIds = [];
    }
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  // Cleanup after each test
  afterEach(async () => {
    if (createdUserIds.length > 0) {
      const repository = AppDataSource.getRepository(userEntity);
      await repository.delete({ id: In(createdUserIds) });
      createdUserIds = [];
    }
  });

  // ---- POST /api/users (Registrazione) -----
  describe('POST /api/users', () => {

    it('should register a new citizen successfully (201)', async () => {
      const newCitizenData = buildRegisterPayload();

      const response = await request(app)
        .post('/api/users')
        .send(newCitizenData);

      expect(response.status).toBe(201);
      expect(response.body).toBeDefined();
      expect(response.body.id).toBeGreaterThan(0);
      
      createdUserIds.push(response.body.id); 
      
      expect(response.body.username).toBe(newCitizenData.username);
      expect(response.body.email).toBe(newCitizenData.email);
      
      expect(response.body.first_name).toBe(newCitizenData.first_name);
      expect(response.body.last_name).toBe(newCitizenData.last_name);

      expect(response.body.role_name).toBe('Citizen');

      expect(response.body.password).toBeUndefined();
      expect(response.body.passwordHash).toBeUndefined();

      const dbUser = await AppDataSource.getRepository(userEntity).findOneBy({ id: response.body.id });
      expect(dbUser).not.toBeNull();
      expect(dbUser?.username).toBe(newCitizenData.username);
    });

    it('should return 400 if required fields are missing', async () => {
      const baseData = buildRegisterPayload();
      const requiredFields: Array<keyof typeof baseData> = ['username', 'email', 'password', 'first_name', 'last_name'];

      for (const field of requiredFields) {
        const invalidData = { ...baseData };
        delete invalidData[field];

        const response = await request(app)
          .post('/api/users')
          .send(invalidData);

        expect(response.status).toBe(400);
        
        expect(response.body.message || response.body.error).toContain('All fields are required: username, email, password, first_name, last_name');
      }
    });

    it('should return 400 for an empty body', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({});

      expect(response.status).toBe(400);
      
      expect(response.body.message || response.body.error).toBe('All fields are required: username, email, password, first_name, last_name');
    });

    it('should return 409 if username already exists', async () => {
      const dynamicUsername = `duplicateUser_${random()}`;
      const existingUserData = buildRegisterPayload({ username: dynamicUsername });

      const res1 = await request(app)
        .post('/api/users')
        .send(existingUserData);
      expect(res1.status).toBe(201);
      createdUserIds.push(res1.body.id);

      const newUserData = buildRegisterPayload({ username: dynamicUsername });
      const response = await request(app)
        .post('/api/users')
        .send(newUserData);

      expect(response.status).toBe(409);
      
      expect(response.body.message || response.body.error).toBe('Username already exists');
    });

    it('should return 409 if email already exists', async () => {
      const dynamicEmail = `duplicate_${random()}@example.com`;
      const existingUserData = buildRegisterPayload({ email: dynamicEmail });

      const res1 = await request(app)
        .post('/api/users')
        .send(existingUserData);
      expect(res1.status).toBe(201);
      createdUserIds.push(res1.body.id);

      const newUserData = buildRegisterPayload({ email: dynamicEmail });
      const response = await request(app)
        .post('/api/users')
        .send(newUserData);

      expect(response.status).toBe(409);

      expect(response.body.message || response.body.error).toBe('Email already exists');
    });

  });
});