jest.mock('@middleware/authMiddleware', () => {
  const original = jest.requireActual('@middleware/authMiddleware');
  return {
    ...original,
    isLoggedIn: jest.fn((req, res, next) => next()),
    requireRole: jest.fn(() => (req: any, res: any, next: any) => next()),
  };
});

jest.mock('@controllers/reportController', () => ({
  reportController: {
    createReport: jest.fn((req, res) => res.status(201).json({})),
    getAllReports: jest.fn((req, res) => res.status(200).json([])),
    getCategories: jest.fn((req, res) => res.status(200).json([])),
    getMapReports: jest.fn((req, res) => res.status(200).json([])),
    getMyAssignedReports: jest.fn((req, res) => res.status(200).json([])),
    getAssignedReportsToExternalMaintainer: jest.fn((req, res) => res.status(200).json([])),
    updateReportStatus: jest.fn((req, res) => res.status(200).json({})),
  },
}));
jest.mock('@middleware/reportMiddleware', () => ({
  validateCreateReport: jest.fn((req, res, next) => next()),
  validateReportUpdate: jest.fn((req, res, next) => next()),
}));
jest.mock('@middleware/validateId', () => ({
  validateId: jest.fn(() => (req: any, res: any, next: any) => {
    // Support both id and externalMaintainerId
    const paramId = req.params.externalMaintainerId ?? req.params.id;
    const numericId = Number(paramId);
    if (
      !paramId ||
      paramId.includes('.') ||
      Number.isNaN(numericId) ||
      numericId <= 0 ||
      !Number.isInteger(numericId)
    ) {
      return res.status(400).json({ message: 'Invalid ID. Must be a positive integer.' });
    }
    return next();
  }),
}));
jest.mock('@middleware/validateMapQuery', () => ({
  validateMapQuery: jest.fn((req, res, next) => next()),
}));
jest.mock('@middleware/validateReportQueryParams', () => ({
  validateReportStatus: jest.fn((req, res, next) => next()),
  validateReportCategory: jest.fn((req, res, next) => next()),
}));

import request from 'supertest';
import express, { Express } from 'express';
import reportRouter from '@routes/reportRoutes';

import { isLoggedIn, requireRole } from '@middleware/authMiddleware';
import { reportController } from '@controllers/reportController';
import { validateCreateReport } from '@middleware/reportMiddleware';
import { ReportStatus } from '@dto/ReportStatus';
import { ReportCategory } from '@dto/ReportCategory';

import { UserRole } from '@dto/UserRole';

const app: Express = express();

app.use(express.json());
app.use('/api/reports', reportRouter);

const mockIsLoggedIn = isLoggedIn as jest.Mock;
const mockRequireRole = requireRole as jest.Mock;
const mockValidateCreateReport = validateCreateReport as jest.Mock;

const mockGetAllReports = reportController.getAllReports as jest.Mock;
const mockUpdateReportStatus = reportController.updateReportStatus as jest.Mock;
const mockCreateReport = reportController.createReport as jest.Mock;
const mockGetCategories = reportController.getCategories as jest.Mock;
const mockGetAssignedReportsToExternalMaintainer = reportController.getAssignedReportsToExternalMaintainer as jest.Mock;

const mockReportsResponse = [
  {
    id: 1,
    title: 'Pothole on Main Street',
    status: ReportStatus.PENDING_APPROVAL,
    category: ReportCategory.ROADS,
  },
  {
    id: 2,
    title: 'Broken street light',
    status: ReportStatus.ASSIGNED,
    category: ReportCategory.PUBLIC_LIGHTING,
  },
];

describe('Report Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock validateCreateReport middleware
    mockValidateCreateReport.mockImplementation((req: any, res: any, next: any) => {
      next();
    });

    // Mock createReport controller
    mockCreateReport.mockImplementation((req, res) => {
      res.status(201).json({ id: 1, message: 'Report created' });
    });

    // Mock getCategories controller
    mockGetCategories.mockImplementation((req, res) => {
      res.status(200).json(['Roads', 'Public Lighting', 'Green Areas']);
    });

    // Mock isLoggedIn middleware
    mockIsLoggedIn.mockImplementation((req: any, res: any, next: any) => {
      const userType = req.headers['x-test-user-type'];

      const roleMap: { [key: string]: UserRole } = {
        PRO: UserRole.PUBLIC_RELATIONS_OFFICER,
        TECHNICIAN: UserRole.TECHNICAL_ASSISTANT,
        TECHNICAL_MANAGER: UserRole.TECHNICAL_MANAGER,
        EXTERNAL_MAINTAINER: UserRole.EXTERNAL_MAINTAINER,
        CITIZEN: UserRole.CITIZEN,
      };
      
      const role = roleMap[userType];

      if (role) {
        const userIdMap: { [key: string]: number } = {
          'PRO': 1,
          'CITIZEN': 2,
          'TECHNICIAN': 3,
          'TECHNICAL_MANAGER': 4,
          'EXTERNAL_MAINTAINER': 8,
        };
        req.user = {
          id: userIdMap[userType] || 1,
          departmentRole: {
            role: {
              name: role,
            },
          },
        };
        next();
      } else {
        res.status(401).json({ error: 'Not authenticated' });
      }
    });

    // Mock requireRole middleware - returns a middleware function
    mockRequireRole.mockImplementation((roles: string | string[]) => {
      return (req: any, res: any, next: any) => {
        const userType = req.headers['x-test-user-type'];
        if (!userType) return res.status(401).json({ error: 'Not authenticated' });
        const rolesArray = Array.isArray(roles) ? roles : [roles];
        const roleMap: { [key: string]: string[] } = {
          PRO: [UserRole.PUBLIC_RELATIONS_OFFICER],
          TECHNICIAN: [UserRole.TECHNICAL_ASSISTANT],
          TECHNICAL_MANAGER: [UserRole.TECHNICAL_MANAGER],
          EXTERNAL_MAINTAINER: [UserRole.EXTERNAL_MAINTAINER],
          CITIZEN: [UserRole.CITIZEN],
        };
        const userRoles = roleMap[userType] || [];
        if (rolesArray.some(role => userRoles.includes(role))) {
          req.user = { id: 1, role: userType };
          return next();
        }
        return res.status(403).json({ error: 'Insufficient rights' });
      };
    });

    // Mock getAllReports controller
    mockGetAllReports.mockImplementation((req, res) => {
      const { status, category } = req.query;
      
      let filteredReports = [...mockReportsResponse];
      
      if (status) {
        filteredReports = filteredReports.filter(r => r.status === status);
      }
      
      if (category) {
        filteredReports = filteredReports.filter(r => r.category === category);
      }
      
      res.status(200).json(filteredReports);
    });

    // Mock updateReportStatus controller
    mockUpdateReportStatus.mockImplementation((req, res) => {
        try {
          const id = Number.parseInt(req.params.id, 10);
          const { newStatus, ...body } = req.body;
          if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid report ID' });
          if (id === 999) return res.status(404).json({ error: 'Report not found' });
          if (!newStatus) return res.status(400).json({ error: 'Status is required' });
          if (newStatus === ReportStatus.REJECTED && (!body.reason || body.reason.trim().length === 0)) {
            return res.status(400).json({ error: 'Rejection reason is required' });
          }
          if (newStatus === ReportStatus.RESOLVED) {
            let currentStatus = ReportStatus.ASSIGNED;
            if (id === 2) currentStatus = ReportStatus.IN_PROGRESS;
            if (id === 3) currentStatus = ReportStatus.SUSPENDED;
            if (id === 4) currentStatus = ReportStatus.PENDING_APPROVAL;
            const allowedCurrentStatuses = [ReportStatus.ASSIGNED, ReportStatus.IN_PROGRESS, ReportStatus.SUSPENDED];
            if (!allowedCurrentStatuses.includes(currentStatus as ReportStatus)) {
              return res.status(400).json({ error: `Cannot resolve a report with status ${currentStatus}.` });
            }
            const allowedRoles = ['TECHNICIAN', 'TECHNICAL_MANAGER', 'EXTERNAL_MAINTAINER'];
            const userType = req.headers['x-test-user-type'];
            if (!allowedRoles.includes(userType)) {
              return res.status(403).json({ error: 'Unauthorized' });
            }
            return res.status(200).json({
              id,
              title: 'Resolved Report',
              status: ReportStatus.RESOLVED,
              resolutionNotes: body.resolutionNotes || null,
              message: 'Report resolved successfully',
            });
          }
          return res.status(200).json({
            id,
            title: 'Updated Report',
            status: newStatus,
            rejection_reason: body.reason,
            message: 'Report status updated successfully',
          });
        } catch (err) {
          return res.status(500).json({ error: 'Internal server error' });
        }
    });
  });

  // --- GET /api/reports (getAllReports) ---
  describe('GET /api/reports', () => {
    it('should return all reports for authenticated user', async () => {
      const res = await request(app)
        .get('/api/reports')
        .set('x-test-user-type', 'PRO');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(mockGetAllReports).toHaveBeenCalledTimes(1);
    });

    it('should filter reports by status=PENDING_APPROVAL', async () => {
      const res = await request(app)
        .get('/api/reports')
        .query({ status: ReportStatus.PENDING_APPROVAL })
        .set('x-test-user-type', 'PRO');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].status).toBe(ReportStatus.PENDING_APPROVAL);
      expect(mockGetAllReports).toHaveBeenCalledTimes(1);
    });

    it('should filter reports by category', async () => {
      const res = await request(app)
        .get('/api/reports')
        .query({ category: ReportCategory.ROADS })
        .set('x-test-user-type', 'PRO');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].category).toBe(ReportCategory.ROADS);
    });

    it('should filter by both status and category', async () => {
      const res = await request(app)
        .get('/api/reports')
        .query({ 
          status: ReportStatus.PENDING_APPROVAL,
          category: ReportCategory.ROADS 
        })
        .set('x-test-user-type', 'PRO');

      expect(res.status).toBe(200);
      expect(mockGetAllReports).toHaveBeenCalledTimes(1);
    });
  });


  // --- PUT /api/reports/:id/status ---
  describe('PUT /api/reports/:id/status', () => {
    it('should approve report successfully when PRO provides valid data', async () => {
      const res = await request(app)
        .put('/api/reports/1/status')
        .set('x-test-user-type', 'PRO')
        .send({ newStatus: ReportStatus.ASSIGNED });

      expect(res.status).toBe(200);
      expect(mockUpdateReportStatus).toHaveBeenCalledTimes(1);
    });

    it('should reject report successfully when PRO provides rejection reason', async () => {
      const res = await request(app)
        .put('/api/reports/1/status')
        .set('x-test-user-type', 'PRO')
        .send({ newStatus: ReportStatus.REJECTED, reason: 'Report does not meet criteria' });

      expect(res.status).toBe(200);
      expect(mockUpdateReportStatus).toHaveBeenCalledTimes(1);
    });

    it('should resolve report successfully when Technician provides valid data', async () => {
        const res = await request(app)
            .put('/api/reports/1/status')
            .set('x-test-user-type', 'TECHNICIAN')
            .send({ newStatus: ReportStatus.RESOLVED });

        expect(res.status).toBe(200);
        expect(mockUpdateReportStatus).toHaveBeenCalledTimes(1);
    });

    it('should return 400 if status is missing', async () => {
      const res = await request(app)
        .put('/api/reports/1/status')
        .set('x-test-user-type', 'PRO')
        .send({ reason: 'Report does not meet criteria' });

      expect(res.status).toBe(400);
    });

    it('should return 400 if reason is missing for rejected status', async () => {
        const res = await request(app)
            .put('/api/reports/1/status')
            .set('x-test-user-type', 'PRO')
            .send({ newStatus: ReportStatus.REJECTED });

        expect(res.status).toBe(400);
    });

    it('should return 404 if report does not exist', async () => {
        const res = await request(app)
            .put('/api/reports/999/status')
            .set('x-test-user-type', 'PRO')
            .send({ newStatus: ReportStatus.ASSIGNED });

        expect(res.status).toBe(404);
    });
    
    it('should return 400 for invalid report ID', async () => {
        const res = await request(app)
            .put('/api/reports/invalid/status')
            .set('x-test-user-type', 'PRO')
            .send({ newStatus: ReportStatus.ASSIGNED });

        expect(res.status).toBe(400);
    });
  });

  // --- GET /api/reports/assigned/external/:externalMaintainerId ---
  describe('GET /api/reports/assigned/external/:externalMaintainerId', () => {
    beforeEach(() => {
      mockGetAssignedReportsToExternalMaintainer.mockImplementation((req, res) => {
        try {
          const externalMaintainerId = Number.parseInt(req.params.externalMaintainerId, 10);
          const { status } = req.query;
          if (Number.isNaN(externalMaintainerId) || externalMaintainerId <= 0 || !Number.isInteger(externalMaintainerId)) {
            return res.status(400).json({ error: 'Invalid external maintainer ID' });
          }
          if (externalMaintainerId === 999) return res.status(200).json([]);
          const assignedReports = [
            {
              id: 10,
              title: 'Water leak on Via Milano',
              status: ReportStatus.ASSIGNED,
              category: ReportCategory.WATER_SUPPLY,
              externalAssigneeId: 8,
              assigneeId: null,
            },
            {
              id: 11,
              title: 'Broken water main',
              status: ReportStatus.IN_PROGRESS,
              category: ReportCategory.WATER_SUPPLY,
              externalAssigneeId: 8,
              assigneeId: null,
            },
          ];
          let filteredReports = assignedReports.filter(r => r.externalAssigneeId === externalMaintainerId);
          if (status) filteredReports = filteredReports.filter(r => r.status === status);
          return res.status(200).json(filteredReports);
        } catch (err) {
          return res.status(500).json({ error: 'Internal server error' });
        }
      });
    });

    it('should return reports assigned to external maintainer for staff members', async () => {
      const res = await request(app)
        .get('/api/reports/assigned/external/8')
        .set('x-test-user-type', 'PRO');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].externalAssigneeId).toBe(8);
      expect(mockGetAssignedReportsToExternalMaintainer).toHaveBeenCalledTimes(1);
    });

    it('should filter reports by status for external maintainer', async () => {
      const res = await request(app)
        .get('/api/reports/assigned/external/8')
        .query({ status: ReportStatus.ASSIGNED })
        .set('x-test-user-type', 'PRO');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].status).toBe(ReportStatus.ASSIGNED);
      expect(mockGetAssignedReportsToExternalMaintainer).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when external maintainer has no assigned reports', async () => {
      const res = await request(app)
        .get('/api/reports/assigned/external/999')
        .set('x-test-user-type', 'PRO');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(0);
      expect(mockGetAssignedReportsToExternalMaintainer).toHaveBeenCalledTimes(1);
    });

    it('should return 400 for invalid external maintainer ID', async () => {
      const res = await request(app)
        .get('/api/reports/assigned/external/invalid')
        .set('x-test-user-type', 'PRO');

      expect(res.status).toBe(400);
    });

    it('should return 400 for negative external maintainer ID', async () => {
      const res = await request(app)
        .get('/api/reports/assigned/external/-1')
        .set('x-test-user-type', 'PRO');

      expect(res.status).toBe(400);
    });

    it('should return 400 for float external maintainer ID', async () => {
      const res = await request(app)
        .get('/api/reports/assigned/external/8.5')
        .set('x-test-user-type', 'PRO');

      expect(res.status).toBe(400);
    });
  });
  });

  // --- PUT /api/reports/:id/status (RESOLVED status) ---
  describe('(RESOLVED status)', () => {
    it('should resolve report from ASSIGNED status by technical staff', async () => {
      const res = await request(app)
        .put('/api/reports/1/status')
        .set('x-test-user-type', 'TECHNICIAN')
        .send({ 
          newStatus: ReportStatus.RESOLVED,
          resolutionNotes: 'Issue fixed successfully'
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(ReportStatus.RESOLVED);
      expect(res.body.resolutionNotes).toBe('Issue fixed successfully');
      expect(mockUpdateReportStatus).toHaveBeenCalledTimes(1);
    });

    it('should resolve report from IN_PROGRESS status', async () => {
      const res = await request(app)
        .put('/api/reports/2/status')
        .set('x-test-user-type', 'TECHNICIAN')
        .send({ 
          newStatus: ReportStatus.RESOLVED 
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(ReportStatus.RESOLVED);
      expect(mockUpdateReportStatus).toHaveBeenCalledTimes(1);
    });

    it('should resolve report from SUSPENDED status', async () => {
      const res = await request(app)
        .put('/api/reports/3/status')
        .set('x-test-user-type', 'TECHNICIAN')
        .send({ 
          newStatus: ReportStatus.RESOLVED 
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(ReportStatus.RESOLVED);
      expect(mockUpdateReportStatus).toHaveBeenCalledTimes(1);
    });

    it('should resolve report with resolution notes', async () => {
      const resolutionNotes = 'Pothole filled and road surface repaired on 2025-12-03';
      const res = await request(app)
        .put('/api/reports/1/status')
        .set('x-test-user-type', 'TECHNICIAN')
        .send({ 
          newStatus: ReportStatus.RESOLVED,
          resolutionNotes
        });

      expect(res.status).toBe(200);
      expect(res.body.resolutionNotes).toBe(resolutionNotes);
      expect(mockUpdateReportStatus).toHaveBeenCalledTimes(1);
    });

    it('should allow external maintainer to resolve report', async () => {
      const res = await request(app)
        .put('/api/reports/1/status')
        .set('x-test-user-type', 'EXTERNAL_MAINTAINER')
        .send({ 
          newStatus: ReportStatus.RESOLVED,
          resolutionNotes: 'Repaired by external team'
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(ReportStatus.RESOLVED);
      expect(mockUpdateReportStatus).toHaveBeenCalledTimes(1);
    });

    it('should allow technical manager to resolve report', async () => {
      const res = await request(app)
        .put('/api/reports/1/status')
        .set('x-test-user-type', 'TECHNICAL_MANAGER')
        .send({ 
          newStatus: ReportStatus.RESOLVED 
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(ReportStatus.RESOLVED);
      expect(mockUpdateReportStatus).toHaveBeenCalledTimes(1);
    });

    it('should return 400 when trying to resolve report from PENDING_APPROVAL status', async () => {
      const res = await request(app)
        .put('/api/reports/4/status')
        .set('x-test-user-type', 'TECHNICIAN')
        .send({ 
          newStatus: ReportStatus.RESOLVED 
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Cannot resolve a report with status');
    });

    it('should return 403 when citizen tries to resolve report', async () => {
      const res = await request(app)
        .put('/api/reports/1/status')
        .set('x-test-user-type', 'CITIZEN')
        .send({ 
          newStatus: ReportStatus.RESOLVED 
        });

      expect(res.status).toBe(403);
    });

    it('should return 403 when PRO tries to resolve report', async () => {
      const res = await request(app)
        .put('/api/reports/1/status')
        .set('x-test-user-type', 'PRO')
        .send({ 
          newStatus: ReportStatus.RESOLVED 
        });

      expect(res.status).toBe(403);
    });

    it('should return 404 if report does not exist', async () => {
      const res = await request(app)
        .put('/api/reports/999/status')
        .set('x-test-user-type', 'TECHNICIAN')
        .send({ 
          newStatus: ReportStatus.RESOLVED 
        });

      expect(res.status).toBe(404);
    });
  });
