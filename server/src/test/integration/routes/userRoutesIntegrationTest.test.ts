import request from 'supertest';
import express, { Express } from 'express';
import userRouter from '../../../routes/userRoutes'; 

import UserController from '@controllers/userController';

jest.mock('@controllers/userController');

const app: Express = express();

app.use(express.json());

app.use('/api/users', userRouter);


const mockRegister = UserController.register as jest.Mock;

const mockRegisterRequest = {
  username: 'newuser',
  email: 'new@example.com',
  password: 'password123',
  first_name: 'Test',
  last_name: 'User',
};

const mockUserResponse = {
  id: 'xyz-123-abc',
  username: 'newuser',
  email: 'new@example.com',
  first_name: 'Test',
  last_name: 'User',
};


describe('User Routes Integration Tests (Registration)', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockRegister.mockImplementation((req, res) => {
      const { username, email, password, first_name, last_name } = req.body;

      if (!username || !email || !password || !first_name || !last_name) {
        return res.status(400).json({
          error:
            'All fields are required: username, email, password, first_name, last_name',
        });
      }

      if (username === 'existinguser') {
        return res.status(409).json({ error: 'Username already exists' });
      }

      if (email === 'existing@example.com') {
        return res.status(409).json({ error: 'Email already exists' });
      }

      return res.status(201).json(mockUserResponse);
    });
  });

  // ---  POST /api/users (Register) ---
  describe('POST /api/users', () => {
    it('should register a new user successfully (201) with user data', async () => {
      const res = await request(app)
        .post('/api/users')
        .send(mockRegisterRequest);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(mockUserResponse);
      expect(mockRegister).toHaveBeenCalledTimes(1);
    });

    it('should return 400 if required fields are missing', async () => {
      const incompleteRequest = {
        username: 'test',
        email: 'test@example.com',
      };

      const res = await request(app)
        .post('/api/users')
        .send(incompleteRequest);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/first name|last name|password/i);
    });

    it('should return 409 if username already exists', async () => {
      const conflictRequest = {
        ...mockRegisterRequest,
        username: 'existinguser',
      };

      const res = await request(app)
        .post('/api/users')
        .send(conflictRequest);

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Username already exists');
      expect(mockRegister).toHaveBeenCalledTimes(1);
    });

    it('should return 409 if email already exists', async () => {
      const conflictRequest = {
        ...mockRegisterRequest,
        email: 'existing@example.com', 
      };

      const res = await request(app)
        .post('/api/users')
        .send(conflictRequest);

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Email already exists');
      expect(mockRegister).toHaveBeenCalledTimes(1);
    });
  });
});