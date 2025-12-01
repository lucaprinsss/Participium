jest.mock('@middleware/authMiddleware', () => ({
  requireRole: jest.fn(() => (req: any, res: any, next: any) => {
    const userType = req.headers['x-test-user-type'];
    if (userType === 'ADMIN') {
      req.user = { id: 99, role: 'ADMIN' };
      return next();
    }
    if (userType === 'CITIZEN') {
      return res.status(403).json({ error: 'Insufficient rights' });
    }
    return res.status(401).json({ error: 'Not authenticated' });
  }),
  isLoggedIn: jest.fn(() => (req: any, res: any, next: any) => {
    const userType = req.headers['x-test-user-type'];
    if (userType) {
      return next();
    }
    return res.status(401).json({ error: 'Not authenticated' });
  }),
}));
jest.mock('@controllers/departmentController');
jest.mock('@middleware/validateId', () => ({
  validateId: jest.fn(() => (req: any, res: any, next: any) => {
    const { id } = req.params;
    const numericId = Number(id);
    if (
      id.includes('.') ||
      Number.isNaN(numericId) ||
      numericId <= 0 ||
      !Number.isInteger(numericId)
    ) {
      return res.status(400).json({ message: 'Invalid department ID. Must be a positive integer.' });
    }
    next();
  }),
}));

import request from 'supertest';
import express, { Express } from 'express';
import departmentRouter from '../../../routes/departmentRoutes';

import { requireRole } from '@middleware/authMiddleware';
import departmentController from '@controllers/departmentController';



const app: Express = express();

app.use(express.json());

app.use('/api/departments', departmentRouter);

const mockRequireRole = requireRole as jest.Mock;

const mockGetMunicipalityDepartments =
  departmentController.getMunicipalityDepartments as jest.Mock;
const mockGetRolesByDepartment =
  departmentController.getRolesByDepartment as jest.Mock;

const mockDepartmentsResponse = [
  {
    id: 1,
    name: 'Urban Planning',
    description: 'Urban planning and development',
  },
  {
    id: 2,
    name: 'Public Works',
    description: 'Infrastructure and maintenance',
  },
  {
    id: 3,
    name: 'Environment',
    description: 'Environmental protection',
  },
];

const mockRolesResponse = [
  {
    id: 1,
    name: 'Manager',
    description: 'Department manager',
  },
  {
    id: 2,
    name: 'Technician',
    description: 'Technical staff',
  },
];

describe('Department Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockRequireRole.mockImplementation((role: string) => {
      return (req: any, res: any, next: any) => {
        const userType = req.headers['x-test-user-type'];

        if (userType === 'ADMIN') {
          req.user = { id: 99, role: 'ADMIN' };
          next();
        } else if (userType === 'CITIZEN') {
          res.status(403).json({ error: 'Insufficient rights' });
        } else {
          res.status(401).json({ error: 'Not authenticated' });
        }
      };
    });

    mockGetMunicipalityDepartments.mockImplementation((req, res) => {
      res.status(200).json(mockDepartmentsResponse);
    });

    mockGetRolesByDepartment.mockImplementation((req, res) => {
      const id = Number.parseInt(req.params.id, 10);
      
      if (id === 1) {
        res.status(200).json(mockRolesResponse);
      } else if (id === 999) {
        res.status(404).json({ error: 'Department with ID 999 not found' });
      } else {
        res.status(200).json([]);
      }
    });
  });

  // --- GET /api/departments (Get all municipality departments) ---
  describe('GET /api/departments', () => {
    it('should return 200 and departments list if user is admin', async () => {
      const res = await request(app)
        .get('/api/departments')
        .set('X-Test-User-Type', 'ADMIN');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockDepartmentsResponse);
      expect(res.body).toHaveLength(3);
      expect(mockGetMunicipalityDepartments).toHaveBeenCalledTimes(1);
    });

    it('should not include Organization department', async () => {
      const res = await request(app)
        .get('/api/departments')
        .set('X-Test-User-Type', 'ADMIN');

      expect(res.status).toBe(200);
      const departmentNames = res.body.map((dept: any) => dept.name);
      expect(departmentNames).not.toContain('Organization');
    });
  });

  // --- GET /api/departments/:id/roles (Get roles by department) ---
  describe('GET /api/departments/:id/roles', () => {
    it('should return 200 and roles list if admin and department exists', async () => {
      const res = await request(app)
        .get('/api/departments/1/roles')
        .set('X-Test-User-Type', 'ADMIN');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockRolesResponse);
      expect(res.body).toHaveLength(2);
      expect(mockGetRolesByDepartment).toHaveBeenCalledTimes(1);
    });

    it('should return 404 if admin and department does not exist', async () => {
      const res = await request(app)
        .get('/api/departments/999/roles')
        .set('X-Test-User-Type', 'ADMIN');

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Department with ID 999 not found');
    });

    it('should return 200 and empty array if department has no roles', async () => {
      const res = await request(app)
        .get('/api/departments/5/roles')
        .set('X-Test-User-Type', 'ADMIN');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should return 400 if department ID is not a number', async () => {
      const res = await request(app)
        .get('/api/departments/abc/roles')
        .set('X-Test-User-Type', 'ADMIN');

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid department ID');
    });

    it('should return 400 if department ID is zero', async () => {
      const res = await request(app)
        .get('/api/departments/0/roles')
        .set('X-Test-User-Type', 'ADMIN');

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid department ID');
    });

    it('should return 400 if department ID is negative', async () => {
      const res = await request(app)
        .get('/api/departments/-5/roles')
        .set('X-Test-User-Type', 'ADMIN');

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid department ID');
    });

    it('should return 400 if department ID is a decimal', async () => {
      const res = await request(app)
        .get('/api/departments/3.14/roles')
        .set('X-Test-User-Type', 'ADMIN');

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid department ID');
    });
  });
});
