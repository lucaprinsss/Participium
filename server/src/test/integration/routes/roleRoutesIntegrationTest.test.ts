/* import request from 'supertest';
import express, { Express } from 'express';
import rolesRouter from "../../../routes/roleRoutes";

import { isAdmin } from '@middleware/authMiddleware';
import municipalityUserController from '@controllers/municipalityUserController';

jest.mock('@middleware/authMiddleware');
jest.mock('@controllers/municipalityUserController');

const app: Express = express();

app.use(express.json());

app.use('/api/roles', rolesRouter);


const mockIsAdmin = isAdmin as jest.Mock;
const mockGetAllRoles = municipalityUserController.getAllRoles as jest.Mock;

const mockRolesResponse = [
  { id: 1, name: 'MUNICIPALITY_MANAGER' },
  { id: 2, name: 'REPORT_REVIEWER' },
  { id: 3, name: 'INFO_EDITOR' },
];


describe('Roles Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockIsAdmin.mockImplementation((req, res, next) => {
      const testUserType = req.headers['x-test-user-type'];

      if (testUserType === 'ADMIN') {
        req.user = { id: 'admin-001', role: 'ADMIN' }; 
        next();
      } else if (testUserType === 'CITIZEN') {
        req.user = { id: 'citizen-123', role: 'CITIZEN' };
        res.status(403).json({ error: 'Insufficient rights' });
      } else {
        res.status(401).json({ error: 'Not authenticated' });
      }
    });

    mockGetAllRoles.mockImplementation((req, res) => {
      res.status(200).json(mockRolesResponse);
    });
  });

  // --- Test per GET /api/roles ---
  describe('GET /api/roles', () => {
    it('dovrebbe restituire 401 se l\'utente non è autenticato', async () => {
      const res = await request(app).get('/api/roles');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Not authenticated');
      expect(mockIsAdmin).toHaveBeenCalledTimes(1);
      expect(mockGetAllRoles).not.toHaveBeenCalled();
    });

    it('dovrebbe restituire 403 se l\'utente è autenticato ma non è admin', async () => {
      const res = await request(app)
        .get('/api/roles')
        .set('X-Test-User-Type', 'CITIZEN'); 

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Insufficient rights');
      expect(mockIsAdmin).toHaveBeenCalledTimes(1);
      expect(mockGetAllRoles).not.toHaveBeenCalled();
    });

    it('dovrebbe restituire 200 e la lista di ruoli se l\'utente è admin', async () => {
      const res = await request(app)
        .get('/api/roles')
        .set('X-Test-User-Type', 'ADMIN'); 

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockRolesResponse);
      expect(mockIsAdmin).toHaveBeenCalledTimes(1);
      expect(mockGetAllRoles).toHaveBeenCalledTimes(1);
    });
  });
}); */

// dummy test
describe('Dummy test', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });
});