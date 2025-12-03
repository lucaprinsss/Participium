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
    updateReportStatus: jest.fn((req, res) => res.status(200).json({})),
  },
}));
jest.mock('@middleware/reportMiddleware', () => ({
  validateCreateReport: jest.fn((req, res, next) => next()),
  validateReportUpdate: jest.fn((req, res, next) => next()),
}));
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
      return res.status(400).json({ message: 'Invalid report ID. Must be a positive integer.' });
    }
    next();
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
import reportRouter from '../../../routes/reportRoutes';

import { isLoggedIn, requireRole } from '@middleware/authMiddleware';
import { reportController } from '@controllers/reportController';
import { validateCreateReport } from '@middleware/reportMiddleware';
import { ReportStatus } from '@dto/ReportStatus';
import { ReportCategory } from '@dto/ReportCategory';

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

describe('Report Routes Integration Tests - Approve/Reject/GetAll', () => {
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
      
      if (userType === 'PRO' || userType === 'CITIZEN' || userType === 'TECHNICIAN') {
        req.user = { 
          id: userType === 'PRO' ? 1 : userType === 'CITIZEN' ? 2 : 3,
          role: userType 
        };
        next();
      } else {
        res.status(401).json({ error: 'Not authenticated' });
      }
    });

    // Mock requireRole middleware - returns a middleware function
    mockRequireRole.mockImplementation((role: string) => {
      return (req: any, res: any, next: any) => {
        const userType = req.headers['x-test-user-type'];
        
        if (!userType) {
          return res.status(401).json({ error: 'Not authenticated' });
        }
        
        if (userType === role || (role === 'Municipal Public Relations Officer' && userType === 'PRO')) {
          req.user = { id: 1, role: userType };
          next();
        } else {
          res.status(403).json({ error: 'Insufficient rights' });
        }
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
        const id = parseInt(req.params.id, 10);
        const { newStatus, ...body } = req.body;

        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid report ID' });
        }

        if (id === 999) {
            return res.status(404).json({ error: 'Report not found' });
        }

        if (!newStatus) {
            return res.status(400).json({ error: 'Status is required' });
        }

        if (newStatus === ReportStatus.REJECTED && (!body.reason || body.reason.trim().length === 0)) {
            return res.status(400).json({ error: 'Rejection reason is required' });
        }

        res.status(200).json({
            id,
            title: 'Updated Report',
            status: newStatus,
            rejection_reason: body.reason,
            message: 'Report status updated successfully',
        });
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
});
