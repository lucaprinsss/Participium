import request from 'supertest';
import express, { Express } from 'express';
import rolesRouter from "../../../routes/roleRoutes";

jest.mock('@middleware/authMiddleware', () => ({
  requireRole: jest.fn(() => (req: any, res: any, next: any) => next()),
}));
jest.mock('@controllers/municipalityUserController');

import { requireRole } from '@middleware/authMiddleware';
import municipalityUserController from '@controllers/municipalityUserController';

jest.mock('@middleware/authMiddleware', () => ({
  requireRole: jest.fn(() => (req: any, res: any, next: any) => {
    const testUserType = req.headers['x-test-user-type'];
    if (testUserType === 'ADMIN') {
      req.user = { id: 'admin-001', role: 'ADMIN' };
      return next();
    }
    if (testUserType === 'CITIZEN') {
      return res.status(403).json({ error: 'Insufficient rights' });
    }
    return res.status(401).json({ error: 'Not authenticated' });
  }),
  isLoggedIn: jest.fn(() => (req: any, res: any, next: any) => {
    const testUserType = req.headers['x-test-user-type'];
    if (testUserType) {
      return next();
    }
    return res.status(401).json({ error: 'Not authenticated' });
  }),
}));
jest.mock('@controllers/municipalityUserController');

const app: Express = express();

app.use(express.json());

app.use('/api/roles', rolesRouter);


const mockRequireRole = requireRole as jest.Mock;
const mockGetAllRoles = municipalityUserController.getAllRoles as jest.Mock;

const mockRolesResponse = [
  { id: 1, name: 'MUNICIPALITY_MANAGER' },
  { id: 2, name: 'REPORT_REVIEWER' },
  { id: 3, name: 'INFO_EDITOR' },
];


describe('Roles Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockRequireRole.mockImplementation((role: string) => {
      return (req: any, res: any, next: any) => {
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
      };
    });

    mockGetAllRoles.mockImplementation((req, res) => {
      res.status(200).json(mockRolesResponse);
    });
  });

  // --- Tests for GET /api/roles ---
  describe('GET /api/roles', () => {
    it('dovrebbe restituire 200 e la lista di ruoli se l\'utente è admin', async () => {
      const res = await request(app)
        .get('/api/roles')
        .set('X-Test-User-Type', 'ADMIN'); 

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockRolesResponse);
      expect(mockGetAllRoles).toHaveBeenCalledTimes(1);
    });
  });
});
