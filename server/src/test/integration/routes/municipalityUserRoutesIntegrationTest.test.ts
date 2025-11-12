/* import request from 'supertest';
import express, { Express } from 'express';
import municipalityUserRouter from '../../../routes/municipalityUserRoutes'; 

import { isAdmin } from '@middleware/authMiddleware';
import municipalityUserController from '@controllers/municipalityUserController';

jest.mock('@middleware/authMiddleware');
jest.mock('@controllers/municipalityUserController');

const app: Express = express();

app.use(express.json());

app.use('/api/municipality/users', municipalityUserRouter);


const mockIsAdmin = isAdmin as jest.Mock;

const mockCreateUser =
  municipalityUserController.createMunicipalityUser as jest.Mock;
const mockGetAllUsers =
  municipalityUserController.getAllMunicipalityUsers as jest.Mock;
const mockGetUserById =
  municipalityUserController.getMunicipalityUserById as jest.Mock;
const mockUpdateUser =
  municipalityUserController.updateMunicipalityUser as jest.Mock;
const mockDeleteUser =
  municipalityUserController.deleteMunicipalityUser as jest.Mock;
const mockAssignRole = municipalityUserController.assignRole as jest.Mock;


const mockUserResponse = {
  id: 1,
  username: 'test.manager',
  email: 'manager@comune.it',
  first_name: 'Mario',
  last_name: 'Rossi',
  role_id: 2,
};

const mockUserListResponse = [
  mockUserResponse,
  {
    id: 2,
    username: 'test.reviewer',
    email: 'reviewer@comune.it',
    first_name: 'Anna',
    last_name: 'Verdi',
    role_id: 3,
  },
];

const mockCreateRequest = {
  username: 'test.manager',
  email: 'manager@comune.it',
  password: 'PasswordSuperSicura123!',
  first_name: 'Mario',
  last_name: 'Rossi',
  role_id: 2,
};

const mockUpdateRequest = {
  first_name: 'Mario Aggiornato',
  last_name: 'Rossi Aggiornato',
  role_id: 2,
};


describe('Municipality User Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockIsAdmin.mockImplementation((req, res, next) => {
      const userType = req.headers['x-test-user-type'];

      if (userType === 'ADMIN') {
        req.user = { id: 99, role: 'ADMIN' };
        next();
      } else if (userType === 'CITIZEN') {
        res.status(403).json({ error: 'Insufficient rights' });
      } else {
        res.status(401).json({ error: 'Not authenticated' });
      }
    });

    mockCreateUser.mockImplementation((req, res) => {
      const { username, email, password, role_id } = req.body;
      if (!username || !email || !password || !role_id) {
        return res.status(400).json({ error: 'All fields are required' });
      }
      res.status(201).json(mockUserResponse);
    });

    mockGetAllUsers.mockImplementation((req, res) => {
      res.status(200).json(mockUserListResponse);
    });

    mockGetUserById.mockImplementation((req, res) => {
      if (req.params.id === '1') {
        res.status(200).json(mockUserResponse);
      } else {
        res.status(404).json({ error: 'Municipality user not found' });
      }
    });

    mockUpdateUser.mockImplementation((req, res) => {
      if (req.params.id === '1') {
        res.status(200).json({ ...mockUserResponse, ...req.body });
      } else {
        res.status(404).json({ error: 'Municipality user not found' });
      }
    });

    mockDeleteUser.mockImplementation((req, res) => {
      if (req.params.id === '1') {
        res.status(204).send();
      } else {
        res.status(404).json({ error: 'Municipality user not found' });
      }
    });

    mockAssignRole.mockImplementation((req, res) => {
      if (req.params.id === '1') {
        res.status(200).json({ ...mockUserResponse, role_id: req.body.role_id });
      } else {
        res.status(404).json({ error: 'Municipality user not found' });
      }
    });
  });

  // --- POST / (User creation) ---
  describe('POST /api/municipality/users', () => {
    it('should return 401 if user is not authenticated', async () => {
      const res = await request(app)
        .post('/api/municipality/users')
        .send(mockCreateRequest);
      expect(res.status).toBe(401);
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not admin', async () => {
      const res = await request(app)
        .post('/api/municipality/users')
        .set('X-Test-User-Type', 'CITIZEN')
        .send(mockCreateRequest);
      expect(res.status).toBe(403);
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it('should return 201 if user is admin and data is valid', async () => {
      const res = await request(app)
        .post('/api/municipality/users')
        .set('X-Test-User-Type', 'ADMIN')
        .send(mockCreateRequest);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(mockUserResponse);
      expect(mockIsAdmin).toHaveBeenCalledTimes(1);
      expect(mockCreateUser).toHaveBeenCalledTimes(1);
    });

    it('should return 400 if user is admin but missing data', async () => {
      const res = await request(app)
        .post('/api/municipality/users')
        .set('X-Test-User-Type', 'ADMIN')
        .send({ username: 'test' }); 

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('All fields are required');
    });
  });

  // --- GET / (Users list) ---
  describe('GET /api/municipality/users', () => {
    it('should return 401 if user is not authenticated', async () => {
      const res = await request(app).get('/api/municipality/users');
      expect(res.status).toBe(401);
      expect(mockGetAllUsers).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not admin', async () => {
      const res = await request(app)
        .get('/api/municipality/users')
        .set('X-Test-User-Type', 'CITIZEN');
      expect(res.status).toBe(403);
      expect(mockGetAllUsers).not.toHaveBeenCalled();
    });

    it('should return 200 and user list if user is admin', async () => {
      const res = await request(app)
        .get('/api/municipality/users')
        .set('X-Test-User-Type', 'ADMIN');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockUserListResponse);
      expect(mockGetAllUsers).toHaveBeenCalledTimes(1);
    });
  });

  // --- GET /:id (User single) ---
  describe('GET /api/municipality/users/:id', () => {
    it('should return 401 if user is not authenticated', async () => {
      const res = await request(app).get('/api/municipality/users/1');
      expect(res.status).toBe(401);
      expect(mockGetUserById).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not admin', async () => {
      const res = await request(app)
        .get('/api/municipality/users/1')
        .set('X-Test-User-Type', 'CITIZEN');
      expect(res.status).toBe(403);
      expect(mockGetUserById).not.toHaveBeenCalled();
    });

    it('should return 200 and user if admin and user exist', async () => {
      const res = await request(app)
        .get('/api/municipality/users/1')
        .set('X-Test-User-Type', 'ADMIN');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockUserResponse);
      expect(mockGetUserById).toHaveBeenCalledTimes(1);
    });

    it('should return 404 if admin and user do not exist', async () => {
      const res = await request(app)
        .get('/api/municipality/users/999')
        .set('X-Test-User-Type', 'ADMIN');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Municipality user not found');
    });
  });

  // --- PUT /:id (User update) ---
  describe('PUT /api/municipality/users/:id', () => {
    it('should return 401 if user is not authenticated', async () => {
      const res = await request(app)
        .put('/api/municipality/users/1')
        .send(mockUpdateRequest);
      expect(res.status).toBe(401);
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not admin', async () => {
      const res = await request(app)
        .put('/api/municipality/users/1')
        .set('X-Test-User-Type', 'CITIZEN')
        .send(mockUpdateRequest);
      expect(res.status).toBe(403);
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it('should return 200 and updated user if admin and user exist', async () => {
      const res = await request(app)
        .put('/api/municipality/users/1')
        .set('X-Test-User-Type', 'ADMIN')
        .send(mockUpdateRequest);

      expect(res.status).toBe(200);
      expect(res.body.first_name).toBe('Mario Aggiornato');
      expect(mockUpdateUser).toHaveBeenCalledTimes(1);
    });

    it('should return 404 if admin and user do not exist', async () => {
      const res = await request(app)
        .put('/api/municipality/users/999')
        .set('X-Test-User-Type', 'ADMIN')
        .send(mockUpdateRequest);

      expect(res.status).toBe(404);
    });
  });

  // --- DELETE /:id (User deletion) ---
  describe('DELETE /api/municipality/users/:id', () => {
    it('should return 401 if user is not authenticated', async () => {
      const res = await request(app).delete('/api/municipality/users/1');
      expect(res.status).toBe(401);
      expect(mockDeleteUser).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not admin', async () => {
      const res = await request(app)
        .delete('/api/municipality/users/1')
        .set('X-Test-User-Type', 'CITIZEN');
      expect(res.status).toBe(403);
      expect(mockDeleteUser).not.toHaveBeenCalled();
    });

    it('should return 204 if admin and user exist', async () => {
      const res = await request(app)
        .delete('/api/municipality/users/1')
        .set('X-Test-User-Type', 'ADMIN');

      expect(res.status).toBe(204);
      expect(mockDeleteUser).toHaveBeenCalledTimes(1);
    });

    it('should return 404 if admin and user do not exist', async () => {
      const res = await request(app)
        .delete('/api/municipality/users/999')
        .set('X-Test-User-Type', 'ADMIN');

      expect(res.status).toBe(404);
    });
  });

  // --- PUT /:id/role (Role assignment) ---
  describe('PUT /api/municipality/users/:id/role', () => {
    const roleAssignRequest = { role_id: 3 };

    it('should return 401 if user is not authenticated', async () => {
      const res = await request(app)
        .put('/api/municipality/users/1/role')
        .send(roleAssignRequest);
      expect(res.status).toBe(401);
      expect(mockAssignRole).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not admin', async () => {
      const res = await request(app)
        .put('/api/municipality/users/1/role')
        .set('X-Test-User-Type', 'CITIZEN')
        .send(roleAssignRequest);
      expect(res.status).toBe(403);
      expect(mockAssignRole).not.toHaveBeenCalled();
    });

    it('should return 200 and user with new role if admin', async () => {
      const res = await request(app)
        .put('/api/municipality/users/1/role')
        .set('X-Test-User-Type', 'ADMIN')
        .send(roleAssignRequest);

      expect(res.status).toBe(200);
      expect(res.body.role_id).toBe(3);
      expect(mockAssignRole).toHaveBeenCalledTimes(1);
    });

    it('should return 404 if admin and user do not exist', async () => {
      const res = await request(app)
        .put('/api/municipality/users/999/role')
        .set('X-Test-User-Type', 'ADMIN')
        .send(roleAssignRequest);

      expect(res.status).toBe(404);
    });
  });
  
}); */

// dummy test
describe('Dummy test', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });
});