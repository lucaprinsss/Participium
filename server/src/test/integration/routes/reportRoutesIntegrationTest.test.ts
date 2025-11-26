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
    approveReport: jest.fn((req, res) => res.status(200).json({})),
    rejectReport: jest.fn((req, res) => res.status(200).json({})),
  },
}));
jest.mock('@middleware/reportMiddleware', () => ({
  validateCreateReport: jest.fn((req, res, next) => next()),
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
const mockApproveReport = reportController.approveReport as jest.Mock;
const mockRejectReport = reportController.rejectReport as jest.Mock;
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

    // Mock approveReport controller
    mockApproveReport.mockImplementation((req, res) => {
      const id = parseInt(req.params.id, 10);
      const { category } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid report ID' });
      }
      
      if (id === 999) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      res.status(200).json({
        id,
        title: 'Approved Report',
        status: ReportStatus.ASSIGNED,
        category: category || ReportCategory.ROADS,
        assignee_id: 10,
        message: 'Report approved successfully',
      });
    });

    // Mock rejectReport controller
    mockRejectReport.mockImplementation((req, res) => {
      const id = parseInt(req.params.id, 10);
      const { rejectionReason } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid report ID' });
      }
      
      if (!rejectionReason || rejectionReason.trim().length === 0) {
        return res.status(400).json({ error: 'Rejection reason is required' });
      }
      
      if (id === 999) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      res.status(200).json({
        id,
        title: 'Rejected Report',
        status: ReportStatus.REJECTED,
        rejection_reason: rejectionReason,
        message: 'Report rejected successfully',
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

  // --- PUT /api/reports/:id/approve ---
  describe('PUT /api/reports/:id/approve', () => {
    it('should approve report successfully when PRO provides valid data', async () => {
      const res = await request(app)
        .put('/api/reports/1/approve')
        .set('x-test-user-type', 'PRO')
        .send({ category: ReportCategory.ROADS });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(ReportStatus.ASSIGNED);
      expect(res.body.category).toBe(ReportCategory.ROADS);
      expect(res.body.assignee_id).toBeDefined();
      expect(mockApproveReport).toHaveBeenCalledTimes(1);
    });

    it('should approve report without changing category', async () => {
      const res = await request(app)
        .put('/api/reports/1/approve')
        .set('x-test-user-type', 'PRO')
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(ReportStatus.ASSIGNED);
      expect(mockApproveReport).toHaveBeenCalledTimes(1);
    });

    it('should return 404 if report does not exist', async () => {
      const res = await request(app)
        .put('/api/reports/999/approve')
        .set('x-test-user-type', 'PRO')
        .send({ category: ReportCategory.ROADS });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Report not found');
    });

    it('should return 400 for invalid report ID', async () => {
      const res = await request(app)
        .put('/api/reports/invalid/approve')
        .set('x-test-user-type', 'PRO')
        .send({ category: ReportCategory.ROADS });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid report ID');
    });
  });

  // --- PUT /api/reports/:id/reject ---
  describe('PUT /api/reports/:id/reject', () => {
    it('should reject report successfully when PRO provides rejection reason', async () => {
      const res = await request(app)
        .put('/api/reports/1/reject')
        .set('x-test-user-type', 'PRO')
        .send({ rejectionReason: 'Report does not meet criteria' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(ReportStatus.REJECTED);
      expect(res.body.rejection_reason).toBe('Report does not meet criteria');
      expect(mockRejectReport).toHaveBeenCalledTimes(1);
    });

    it('should return 400 if rejection reason is missing', async () => {
      const res = await request(app)
        .put('/api/reports/1/reject')
        .set('x-test-user-type', 'PRO')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Rejection reason is required');
    });

    it('should return 400 if rejection reason is empty string', async () => {
      const res = await request(app)
        .put('/api/reports/1/reject')
        .set('x-test-user-type', 'PRO')
        .send({ rejectionReason: '' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Rejection reason is required');
    });

    it('should return 400 if rejection reason is only whitespace', async () => {
      const res = await request(app)
        .put('/api/reports/1/reject')
        .set('x-test-user-type', 'PRO')
        .send({ rejectionReason: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Rejection reason is required');
    });

    it('should return 404 if report does not exist', async () => {
      const res = await request(app)
        .put('/api/reports/999/reject')
        .set('x-test-user-type', 'PRO')
        .send({ rejectionReason: 'Invalid report' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Report not found');
    });

    it('should return 400 for invalid report ID', async () => {
      const res = await request(app)
        .put('/api/reports/invalid/reject')
        .set('x-test-user-type', 'PRO')
        .send({ rejectionReason: 'Invalid report' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid report ID');
    });

    it('should handle different rejection reasons', async () => {
      const reasons = [
        'Duplicate report',
        'Insufficient information',
        'Out of jurisdiction',
      ];

      for (const reason of reasons) {
        const res = await request(app)
          .put('/api/reports/1/reject')
          .set('x-test-user-type', 'PRO')
          .send({ rejectionReason: reason });

        expect(res.status).toBe(200);
        expect(res.body.rejection_reason).toBe(reason);
      }

      expect(mockRejectReport).toHaveBeenCalledTimes(3);
    });
  });
});
