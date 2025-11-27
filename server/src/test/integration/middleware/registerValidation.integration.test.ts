import request from 'supertest';
import app from '../../../app';
import { 
  setupTestDatabase, 
  teardownTestDatabase, 
  cleanDatabase,
  ensureTestDatabase 
} from '@test/utils/dbTestUtils';

describe('Register Validation Middleware Integration Tests', () => {
  const endpoint = '/api/users';

  beforeAll(async () => {
    await setupTestDatabase();
    await ensureTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  describe('Field Validation', () => {
    it('should return 400 if first_name is missing', async () => {
      const user = { 
        last_name: 'Rossi', 
        email: 'test@example.com', 
        username: 'testuser', 
        password: 'Password123!', 
        confirmPassword: 'Password123!' 
      };
      const res = await request(app).post(endpoint).send(user);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/first name/i);
    });

    it('should return 400 if last_name is missing', async () => {
      const user = { 
        first_name: 'Mario', 
        email: 'test@example.com', 
        username: 'testuser', 
        password: 'Password123!', 
        confirmPassword: 'Password123!' 
      };
      const res = await request(app).post(endpoint).send(user);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/last name/i);
    });

    it('should return 400 if email is missing', async () => {
      const user = { 
        first_name: 'Mario', 
        last_name: 'Rossi', 
        username: 'testuser', 
        password: 'Password123!', 
        confirmPassword: 'Password123!' 
      };
      const res = await request(app).post(endpoint).send(user);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/email/i);
    });

    it('should return 400 if username is missing', async () => {
      const user = { 
        first_name: 'Mario', 
        last_name: 'Rossi', 
        email: 'test@example.com', 
        password: 'Password123!', 
        confirmPassword: 'Password123!' 
      };
      const res = await request(app).post(endpoint).send(user);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/username/i);
    });

    it('should return 400 if password is missing', async () => {
      const user = { 
        first_name: 'Mario', 
        last_name: 'Rossi', 
        email: 'test@example.com', 
        username: 'testuser',
        confirmPassword: 'Password123!' 
      };
      const res = await request(app).post(endpoint).send(user);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/password/i);
    });
  });

  describe('Email Validation', () => {
    it('should return 400 for invalid email format', async () => {
      const user = { 
        first_name: 'Mario', 
        last_name: 'Rossi', 
        email: 'invalidemail', 
        username: 'testuser', 
        password: 'Password123!', 
        confirmPassword: 'Password123!' 
      };
      const res = await request(app).post(endpoint).send(user);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/valid email/i);
    });

    it('should return 400 for email without domain', async () => {
      const user = { 
        first_name: 'Mario', 
        last_name: 'Rossi', 
        email: 'test@', 
        username: 'testuser', 
        password: 'Password123!', 
        confirmPassword: 'Password123!' 
      };
      const res = await request(app).post(endpoint).send(user);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/valid email/i);
    });
  });

  describe('Username Validation', () => {
    it('should return 400 if username is too short', async () => {
      const user = { 
        first_name: 'Mario', 
        last_name: 'Rossi', 
        email: 'test@example.com', 
        username: 'ab', 
        password: 'Password123!', 
        confirmPassword: 'Password123!' 
      };
      const res = await request(app).post(endpoint).send(user);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/at least 3 characters/i);
    });

    it('should accept username with exactly 3 characters', async () => {
      const user = { 
        first_name: 'Mario', 
        last_name: 'Rossi', 
        email: 'test' + Date.now() + '@example.com', 
        username: 'abc' + Date.now(), 
        password: 'Password123!', 
        confirmPassword: 'Password123!' 
      };
      const res = await request(app).post(endpoint).send(user);
      expect(res.status).toBe(201);
    });
  });

  describe('Password Validation', () => {
    it('should return 400 if password is too short', async () => {
      const user = { 
        first_name: 'Mario', 
        last_name: 'Rossi', 
        email: 'test@example.com', 
        username: 'testuser', 
        password: '12345', 
        confirmPassword: '12345' 
      };
      const res = await request(app).post(endpoint).send(user);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/at least 6 characters/i);
    });

    it('should return 400 if passwords do not match', async () => {
      const user = { 
        first_name: 'Mario', 
        last_name: 'Rossi', 
        email: 'test@example.com', 
        username: 'testuser', 
        password: 'Password123!', 
        confirmPassword: 'Different123!' 
      };
      const res = await request(app).post(endpoint).send(user);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/passwords do not match/i);
    });

    it('should accept password with exactly 6 characters', async () => {
      const user = { 
        first_name: 'Mario', 
        last_name: 'Rossi', 
        email: 'test' + Date.now() + '@example.com', 
        username: 'user' + Date.now(), 
        password: '123456', 
        confirmPassword: '123456' 
      };
      const res = await request(app).post(endpoint).send(user);
      expect(res.status).toBe(201);
    });
  });

  describe('Empty String Validation', () => {
    it('should return 400 for empty string first_name', async () => {
      const user = { 
        first_name: '   ', 
        last_name: 'Rossi', 
        email: 'test@example.com', 
        username: 'testuser', 
        password: 'Password123!', 
        confirmPassword: 'Password123!' 
      };
      const res = await request(app).post(endpoint).send(user);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/first name/i);
    });

    it('should return 400 for empty string last_name', async () => {
      const user = { 
        first_name: 'Mario', 
        last_name: '   ', 
        email: 'test@example.com', 
        username: 'testuser', 
        password: 'Password123!', 
        confirmPassword: 'Password123!' 
      };
      const res = await request(app).post(endpoint).send(user);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/last name/i);
    });

    it('should return 400 for empty string email', async () => {
      const user = { 
        first_name: 'Mario', 
        last_name: 'Rossi', 
        email: '   ', 
        username: 'testuser', 
        password: 'Password123!', 
        confirmPassword: 'Password123!' 
      };
      const res = await request(app).post(endpoint).send(user);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/email/i);
    });
  });

  describe('Successful Registration', () => {
    it('should successfully register with valid data', async () => {
      const user = { 
        first_name: 'Mario', 
        last_name: 'Rossi', 
        email: 'mario.rossi' + Date.now() + '@example.com', 
        username: 'mariorossi' + Date.now(), 
        password: 'Password123!', 
        confirmPassword: 'Password123!' 
      };
      const res = await request(app).post(endpoint).send(user);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.username).toBe(user.username);
      expect(res.body.email).toBe(user.email);
    });
  });
});
