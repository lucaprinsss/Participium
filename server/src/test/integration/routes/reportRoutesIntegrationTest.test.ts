jest.mock('@middleware/authMiddleware', () => ({
  isLoggedIn: jest.fn((req, res, next) => {
    const userType = req.headers['x-test-user-type'];
    if (!userType) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Re-import SystemRoles here to avoid hoisting issues
    const { SystemRoles } = jest.requireActual('@dto/UserRole');

    const roleMap: { [key: string]: string } = {
      PRO: SystemRoles.PUBLIC_RELATIONS_OFFICER,
      TECHNICIAN: 'Water Network staff member',
      TECHNICAL_MANAGER: 'Road Maintenance staff member',
      EXTERNAL_MAINTAINER: SystemRoles.EXTERNAL_MAINTAINER,
      CITIZEN: SystemRoles.CITIZEN,
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
        userRoles: [
          {
            departmentRole: {
              role: {
                name: role,
              },
            },
          }
        ],
      };
      next();
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  }),
  requireRole: jest.fn(() => (req: any, res: any, next: any) => next()),
  requireTechnicalStaffOrRole: jest.fn((additionalRoles: string[] = []) => {
    return (req: any, res: any, next: any) => {
      const userType = req.headers['x-test-user-type'];
      if (!userType) return res.status(401).json({ error: 'Not authenticated' });

      // Re-import SystemRoles here to avoid hoisting issues
      const { SystemRoles, isTechnicalStaff: isTechStaff } = jest.requireActual('@dto/UserRole');

      const roleMap: { [key: string]: string } = {
        PRO: SystemRoles.PUBLIC_RELATIONS_OFFICER,
        TECHNICIAN: 'Water Network staff member',
        TECHNICAL_MANAGER: 'Road Maintenance staff member',
        EXTERNAL_MAINTAINER: SystemRoles.EXTERNAL_MAINTAINER,
        CITIZEN: SystemRoles.CITIZEN,
      };

      const userRole = roleMap[userType];
      if (!userRole) {
        return res.status(403).json({ error: 'Insufficient rights' });
      }

      // Check if user is technical staff OR has one of the additional roles
      const hasAccess = isTechStaff(userRole) || additionalRoles.includes(userRole);
      if (hasAccess) {
        const userIdMap: { [key: string]: number } = {
          'PRO': 1,
          'CITIZEN': 2,
          'TECHNICIAN': 3,
          'TECHNICAL_MANAGER': 4,
          'EXTERNAL_MAINTAINER': 8,
        };
        req.user = {
          id: userIdMap[userType] || 1,
          userRoles: [{ departmentRole: { role: { name: userRole } } }]
        };
        return next();
      }

      return res.status(403).json({ error: 'Insufficient rights' });
    };
  }),
}));

jest.mock('@controllers/reportController', () => ({
  reportController: {
    createReport: jest.fn((req, res) => res.status(201).json({})),
    getAllReports: jest.fn((req, res) => res.status(200).json([])),
    getCategories: jest.fn((req, res) => res.status(200).json([])),
    getMapReports: jest.fn((req, res) => res.status(200).json([])),
    getMyReports: jest.fn((req, res) => res.status(200).json([])),
    getMyAssignedReports: jest.fn((req, res) => res.status(200).json([])),
    getAssignedReportsToExternalMaintainer: jest.fn((req, res) => res.status(200).json([])),
    updateReportStatus: jest.fn((req, res) => res.status(200).json({})),
    assignToExternalMaintainer: jest.fn((req, res) => res.status(200).json({})),
    getInternalComments: jest.fn((req, res) => res.status(200).json([])),
    addInternalComment: jest.fn((req, res) => res.status(201).json({})),
    deleteInternalComment: jest.fn((req, res) => res.status(204).send()),
    getMessages: jest.fn((req, res) => res.status(200).json([])),
    sendMessage: jest.fn((req, res) => res.status(201).json({})),
    getReportByAddress: jest.fn((req, res) => res.status(200).json([])),
  },
}));
jest.mock('@middleware/reportMiddleware', () => ({
  validateCreateReport: jest.fn((req, res, next) => next()),
  validateReportUpdate: jest.fn((req, res, next) => next()),
}));
jest.mock('@middleware/validateId', () => ({
  validateId: jest.fn((paramName: string = 'id', resourceName: string = 'resource') => (req: any, res: any, next: any) => {
    const paramId = req.params[paramName];
    const numericId = Number(paramId);
    if (
      !paramId ||
      paramId.includes('.') ||
      Number.isNaN(numericId) ||
      numericId <= 0 ||
      !Number.isInteger(numericId)
    ) {
      return res.status(400).json({ message: `Invalid ${resourceName} ID. Must be a positive integer.` });
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

import { isLoggedIn, requireRole, requireTechnicalStaffOrRole } from '@middleware/authMiddleware';
import { reportController } from '@controllers/reportController';
import { validateCreateReport } from '@middleware/reportMiddleware';
import { ReportStatus } from '@dto/ReportStatus';
import { ReportCategory } from '@dto/ReportCategory';

import { SystemRoles, isTechnicalStaff } from '@dto/UserRole';

const app: Express = express();

app.use(express.json());
app.use('/api/reports', reportRouter);

const mockIsLoggedIn = isLoggedIn as jest.Mock;
const mockRequireRole = requireRole as jest.Mock;
const mockRequireTechnicalStaffOrRole = requireTechnicalStaffOrRole as jest.Mock;
const mockValidateCreateReport = validateCreateReport as jest.Mock;

const mockGetAllReports = reportController.getAllReports as jest.Mock;
const mockUpdateReportStatus = reportController.updateReportStatus as jest.Mock;
const mockCreateReport = reportController.createReport as jest.Mock;
const mockGetCategories = reportController.getCategories as jest.Mock;
const mockGetAssignedReportsToExternalMaintainer = reportController.getAssignedReportsToExternalMaintainer as jest.Mock;
const mockGetReportByAddress = reportController.getReportByAddress as jest.Mock;

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

      const roleMap: { [key: string]: string } = {
        PRO: SystemRoles.PUBLIC_RELATIONS_OFFICER,
        TECHNICIAN: 'Sewer System staff member',
        TECHNICAL_MANAGER: 'Road Maintenance staff member',
        EXTERNAL_MAINTAINER: SystemRoles.EXTERNAL_MAINTAINER,
        CITIZEN: SystemRoles.CITIZEN,
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
          userRoles: [
            {
              departmentRole: {
                role: {
                  name: role,
                },
              },
            }
          ],
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
          PRO: [SystemRoles.PUBLIC_RELATIONS_OFFICER],
          TECHNICIAN: ['Sewer System staff member'],
          TECHNICAL_MANAGER: ['Road Maintenance staff member'],
          EXTERNAL_MAINTAINER: [SystemRoles.EXTERNAL_MAINTAINER],
          CITIZEN: [SystemRoles.CITIZEN],
        };
        const userRoles = roleMap[userType] || [];
        if (rolesArray.some(role => userRoles.includes(role))) {
          req.user = { id: 1, role: userType };
          return next();
        }
        return res.status(403).json({ error: 'Insufficient rights' });
      };
    });

    // Mock requireTechnicalStaffOrRole middleware - returns a middleware function
    mockRequireTechnicalStaffOrRole.mockImplementation((additionalRoles: string[] = []) => {
      return (req: any, res: any, next: any) => {
        const userType = req.headers['x-test-user-type'];
        if (!userType) return res.status(401).json({ error: 'Not authenticated' });

        const roleMap: { [key: string]: string } = {
          PRO: SystemRoles.PUBLIC_RELATIONS_OFFICER,
          TECHNICIAN: 'Sewer System staff member',
          TECHNICAL_MANAGER: 'Road Maintenance staff member',
          EXTERNAL_MAINTAINER: SystemRoles.EXTERNAL_MAINTAINER,
          CITIZEN: SystemRoles.CITIZEN,
        };

        const userRole = roleMap[userType];
        if (!userRole) {
          return res.status(403).json({ error: 'Insufficient rights' });
        }

        // Check if user is technical staff OR has one of the additional roles
        const hasAccess = isTechnicalStaff(userRole) || additionalRoles.includes(userRole);
        if (hasAccess) {
          req.user = { id: 1, userRoles: [{ departmentRole: { role: { name: userRole } } }] };
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
    it('should return all reports', async () => {
      const res = await request(app)
        .get('/api/reports');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(mockGetAllReports).toHaveBeenCalledTimes(1);
    });

    it('should filter reports by status=PENDING_APPROVAL', async () => {
      const res = await request(app)
        .get('/api/reports')
        .set('x-test-user-type', 'CITIZEN')
        .query({ status: ReportStatus.PENDING_APPROVAL });

      expect(res.status).toBe(200); // Now authenticated, returns reports (filtered by service)
      expect(mockGetAllReports).toHaveBeenCalledTimes(1);
    });

    it('should filter reports by category', async () => {
      const res = await request(app)
        .get('/api/reports')
        .query({ category: ReportCategory.ROADS });

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

      expect(res.status).toBe(200); // Should succeed because PRO can see PENDING_APPROVAL
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

describe('Internal Comments Routes', () => {
  const mockGetInternalComments = reportController.getInternalComments as jest.Mock;
  const mockAddInternalComment = reportController.addInternalComment as jest.Mock;
  const mockDeleteInternalComment = reportController.deleteInternalComment as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock getInternalComments controller
    mockGetInternalComments.mockImplementation((req, res) => {
      const reportId = Number.parseInt(req.params.id, 10);
      if (reportId === 999) {
        return res.status(404).json({ error: 'Report not found' });
      }
      const mockComments = [
        {
          id: 1,
          reportId,
          content: 'First internal comment',
          author: {
            id: 1,
            username: 'tech1',
            firstName: 'John',
            lastName: 'Doe',
            role: 'Sewer System staff member'
          },
          createdAt: new Date('2024-01-15T10:00:00Z')
        },
        {
          id: 2,
          reportId,
          content: 'Second internal comment',
          author: {
            id: 2,
            username: 'external1',
            firstName: 'Jane',
            lastName: 'Smith',
            role: 'External Maintainer'
          },
          createdAt: new Date('2024-01-15T11:00:00Z')
        }
      ];
      res.status(200).json(mockComments);
    });

    // Mock addInternalComment controller
    mockAddInternalComment.mockImplementation((req, res) => {
      const reportId = Number.parseInt(req.params.id, 10);
      const { content } = req.body;

      if (reportId === 999) {
        return res.status(404).json({ error: 'Report not found' });
      }
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: 'Content is required' });
      }
      if (content.length > 2000) {
        return res.status(400).json({ error: 'Content must be at most 2000 characters' });
      }

      const newComment = {
        id: 3,
        reportId,
        content,
        author: {
          id: req.user?.id || 1,
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          role: 'Sewer System staff member'
        },
        createdAt: new Date()
      };
      res.status(201).json(newComment);
    });

    // Mock deleteInternalComment controller
    mockDeleteInternalComment.mockImplementation((req, res) => {
      const reportId = Number.parseInt(req.params.reportId, 10);
      const commentId = Number.parseInt(req.params.commentId, 10);

      if (reportId === 999) {
        return res.status(404).json({ error: 'Report not found' });
      }
      if (commentId === 999) {
        return res.status(404).json({ error: 'Comment not found' });
      }
      if (commentId === 888) {
        return res.status(403).json({ error: 'You can only delete your own comments' });
      }

      res.status(204).send();
    });
  });

  describe('GET /api/reports/:id/internal-comments', () => {
    it('should return internal comments for technical staff', async () => {
      const res = await request(app)
        .get('/api/reports/1/internal-comments')
        .set('x-test-user-type', 'TECHNICIAN');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
      expect(res.body[0]).toHaveProperty('content');
      expect(res.body[0]).toHaveProperty('author');
      expect(mockGetInternalComments).toHaveBeenCalledTimes(1);
    });

    it('should return internal comments for PRO', async () => {
      const res = await request(app)
        .get('/api/reports/1/internal-comments')
        .set('x-test-user-type', 'PRO');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(mockGetInternalComments).toHaveBeenCalledTimes(1);
    });

    it('should return internal comments for external maintainer', async () => {
      const res = await request(app)
        .get('/api/reports/1/internal-comments')
        .set('x-test-user-type', 'EXTERNAL_MAINTAINER');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(mockGetInternalComments).toHaveBeenCalledTimes(1);
    });

    it('should return 403 for citizen', async () => {
      const res = await request(app)
        .get('/api/reports/1/internal-comments')
        .set('x-test-user-type', 'CITIZEN');

      expect(res.status).toBe(403);
      expect(mockGetInternalComments).not.toHaveBeenCalled();
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .get('/api/reports/1/internal-comments');

      expect(res.status).toBe(401);
      expect(mockGetInternalComments).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid report ID', async () => {
      const res = await request(app)
        .get('/api/reports/invalid/internal-comments')
        .set('x-test-user-type', 'TECHNICIAN');

      expect(res.status).toBe(400);
      expect(mockGetInternalComments).not.toHaveBeenCalled();
    });

    it('should return 404 if report not found', async () => {
      const res = await request(app)
        .get('/api/reports/999/internal-comments')
        .set('x-test-user-type', 'TECHNICIAN');

      expect(res.status).toBe(404);
      expect(mockGetInternalComments).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /api/reports/:id/internal-comments', () => {
    it('should add internal comment as technical staff', async () => {
      const res = await request(app)
        .post('/api/reports/1/internal-comments')
        .set('x-test-user-type', 'TECHNICIAN')
        .send({ content: 'New internal comment from tech staff' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('content', 'New internal comment from tech staff');
      expect(res.body).toHaveProperty('author');
      expect(mockAddInternalComment).toHaveBeenCalledTimes(1);
    });

    it('should add internal comment as PRO', async () => {
      const res = await request(app)
        .post('/api/reports/1/internal-comments')
        .set('x-test-user-type', 'PRO')
        .send({ content: 'PRO internal note' });

      expect(res.status).toBe(201);
      expect(mockAddInternalComment).toHaveBeenCalledTimes(1);
    });

    it('should add internal comment as external maintainer', async () => {
      const res = await request(app)
        .post('/api/reports/1/internal-comments')
        .set('x-test-user-type', 'EXTERNAL_MAINTAINER')
        .send({ content: 'External maintainer update' });

      expect(res.status).toBe(201);
      expect(mockAddInternalComment).toHaveBeenCalledTimes(1);
    });

    it('should return 400 if content is missing', async () => {
      const res = await request(app)
        .post('/api/reports/1/internal-comments')
        .set('x-test-user-type', 'TECHNICIAN')
        .send({});

      expect(res.status).toBe(400);
      expect(mockAddInternalComment).toHaveBeenCalledTimes(1);
    });

    it('should return 400 if content is empty', async () => {
      const res = await request(app)
        .post('/api/reports/1/internal-comments')
        .set('x-test-user-type', 'TECHNICIAN')
        .send({ content: '   ' });

      expect(res.status).toBe(400);
      expect(mockAddInternalComment).toHaveBeenCalledTimes(1);
    });

    it('should return 400 if content is too long', async () => {
      const longContent = 'a'.repeat(2001);
      const res = await request(app)
        .post('/api/reports/1/internal-comments')
        .set('x-test-user-type', 'TECHNICIAN')
        .send({ content: longContent });

      expect(res.status).toBe(400);
      expect(mockAddInternalComment).toHaveBeenCalledTimes(1);
    });

    it('should return 403 for citizen', async () => {
      const res = await request(app)
        .post('/api/reports/1/internal-comments')
        .set('x-test-user-type', 'CITIZEN')
        .send({ content: 'Should not work' });

      expect(res.status).toBe(403);
      expect(mockAddInternalComment).not.toHaveBeenCalled();
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post('/api/reports/1/internal-comments')
        .send({ content: 'Should not work' });

      expect(res.status).toBe(401);
      expect(mockAddInternalComment).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid report ID', async () => {
      const res = await request(app)
        .post('/api/reports/abc/internal-comments')
        .set('x-test-user-type', 'TECHNICIAN')
        .send({ content: 'Test comment' });

      expect(res.status).toBe(400);
      expect(mockAddInternalComment).not.toHaveBeenCalled();
    });

    it('should return 404 if report not found', async () => {
      const res = await request(app)
        .post('/api/reports/999/internal-comments')
        .set('x-test-user-type', 'TECHNICIAN')
        .send({ content: 'Test comment' });

      expect(res.status).toBe(404);
      expect(mockAddInternalComment).toHaveBeenCalledTimes(1);
    });
  });

  describe('DELETE /api/reports/:reportId/internal-comments/:commentId', () => {
    it('should delete own comment as technical staff', async () => {
      const res = await request(app)
        .delete('/api/reports/1/internal-comments/1')
        .set('x-test-user-type', 'TECHNICIAN');

      expect(res.status).toBe(204);
      expect(mockDeleteInternalComment).toHaveBeenCalledTimes(1);
    });

    it('should delete own comment as PRO', async () => {
      const res = await request(app)
        .delete('/api/reports/1/internal-comments/2')
        .set('x-test-user-type', 'PRO');

      expect(res.status).toBe(204);
      expect(mockDeleteInternalComment).toHaveBeenCalledTimes(1);
    });

    it('should delete own comment as external maintainer', async () => {
      const res = await request(app)
        .delete('/api/reports/1/internal-comments/3')
        .set('x-test-user-type', 'EXTERNAL_MAINTAINER');

      expect(res.status).toBe(204);
      expect(mockDeleteInternalComment).toHaveBeenCalledTimes(1);
    });

    it('should return 403 when trying to delete someone else comment', async () => {
      const res = await request(app)
        .delete('/api/reports/1/internal-comments/888')
        .set('x-test-user-type', 'TECHNICIAN');

      expect(res.status).toBe(403);
      expect(mockDeleteInternalComment).toHaveBeenCalledTimes(1);
    });

    it('should return 403 for citizen', async () => {
      const res = await request(app)
        .delete('/api/reports/1/internal-comments/1')
        .set('x-test-user-type', 'CITIZEN');

      expect(res.status).toBe(403);
      expect(mockDeleteInternalComment).not.toHaveBeenCalled();
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .delete('/api/reports/1/internal-comments/1');

      expect(res.status).toBe(401);
      expect(mockDeleteInternalComment).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid report ID', async () => {
      const res = await request(app)
        .delete('/api/reports/invalid/internal-comments/1')
        .set('x-test-user-type', 'TECHNICIAN');

      expect(res.status).toBe(400);
      expect(mockDeleteInternalComment).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid comment ID', async () => {
      const res = await request(app)
        .delete('/api/reports/1/internal-comments/invalid')
        .set('x-test-user-type', 'TECHNICIAN');

      expect(res.status).toBe(400);
      expect(mockDeleteInternalComment).not.toHaveBeenCalled();
    });

    it('should return 404 if report not found', async () => {
      const res = await request(app)
        .delete('/api/reports/999/internal-comments/1')
        .set('x-test-user-type', 'TECHNICIAN');

      expect(res.status).toBe(404);
      expect(mockDeleteInternalComment).toHaveBeenCalledTimes(1);
    });

    it('should return 404 if comment not found', async () => {
      const res = await request(app)
        .delete('/api/reports/1/internal-comments/999')
        .set('x-test-user-type', 'TECHNICIAN');

      expect(res.status).toBe(404);
      expect(mockDeleteInternalComment).toHaveBeenCalledTimes(1);
    });
  });
});