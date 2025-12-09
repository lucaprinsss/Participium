import { Request, Response, NextFunction } from 'express';
import { reportController } from '../../../controllers/reportController';
import { reportService } from '../../../services/reportService';
import { ReportStatus } from '../../../models/dto/ReportStatus';
import { ReportCategory } from '../../../models/dto/ReportCategory';
import { UnauthorizedError } from '../../../models/errors/UnauthorizedError';
import { BadRequestError } from '../../../models/errors/BadRequestError';
import { User } from '../../../models/dto/User';

// Mock del service
jest.mock('../../../services/reportService');

describe('ReportController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      params: {},
      query: {},
      body: {},
      user: undefined
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('getCategories', () => {
    it('should get all categories and return 200 status', async () => {
      const categories = [{ id: 1, name: 'Test Category' }];
      (reportService.getAllCategories as jest.Mock).mockResolvedValue(categories);

      await reportController.getCategories(mockRequest as Request, mockResponse as Response, mockNext);

      expect(reportService.getAllCategories).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(categories);
    });

    it('should call next with an error if fetching categories fails', async () => {
      const error = new Error('Fetch failed');
      (reportService.getAllCategories as jest.Mock).mockRejectedValue(error);

      await reportController.getCategories(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('createReport', () => {
    it('should throw UnauthorizedError if user is not authenticated', async () => {
      mockRequest.user = undefined;

      await reportController.createReport(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should create a report and return 201 status', async () => {
      const mockUser = { id: 1 } as User;
      const reportData = { title: 'Test Report', description: 'Test Description' };
      const newReport = { id: 1, ...reportData };
      mockRequest.user = mockUser;
      mockRequest.body = reportData;

      (reportService.createReport as jest.Mock).mockResolvedValue(newReport);

      await reportController.createReport(mockRequest as Request, mockResponse as Response, mockNext);

      expect(reportService.createReport).toHaveBeenCalledWith(reportData, mockUser.id);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(newReport);
    });
  });

  describe('getAllReports', () => {
    describe('authentication checks', () => {
      it('should throw UnauthorizedError when user is not authenticated', async () => {
        mockRequest.user = undefined;

        await reportController.getAllReports(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({ message: 'Not authenticated' })
        );
      });

      it('should call service with userId when user is authenticated', async () => {
        const mockUser = { id: 123, email: 'test@example.com' } as User;
        mockRequest.user = mockUser;

        const mockReports = [{ id: 1, title: 'Test Report' }];
        (reportService.getAllReports as jest.Mock).mockResolvedValue(mockReports);

        await reportController.getAllReports(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(reportService.getAllReports).toHaveBeenCalledWith(123, undefined, undefined);
      });
    });

    describe('status filter validation', () => {
      it('should accept valid PENDING_APPROVAL status', async () => {
        const mockUser = { id: 123 } as User;
        mockRequest.user = mockUser;
        mockRequest.query = { status: ReportStatus.PENDING_APPROVAL };

        const mockReports = [{ id: 1, status: ReportStatus.PENDING_APPROVAL }];
        (reportService.getAllReports as jest.Mock).mockResolvedValue(mockReports);

        await reportController.getAllReports(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(reportService.getAllReports).toHaveBeenCalledWith(
          123,
          ReportStatus.PENDING_APPROVAL,
          undefined
        );
        expect(mockResponse.status).toHaveBeenCalledWith(200);
      });

      it('should accept valid ASSIGNED status', async () => {
        const mockUser = { id: 123 } as User;
        mockRequest.user = mockUser;
        mockRequest.query = { status: ReportStatus.ASSIGNED };

        const mockReports = [{ id: 1, status: ReportStatus.ASSIGNED }];
        (reportService.getAllReports as jest.Mock).mockResolvedValue(mockReports);

        await reportController.getAllReports(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(reportService.getAllReports).toHaveBeenCalledWith(
          123,
          ReportStatus.ASSIGNED,
          undefined
        );
      });

      it('should accept valid REJECTED status', async () => {
        const mockUser = { id: 123 } as User;
        mockRequest.user = mockUser;
        mockRequest.query = { status: ReportStatus.REJECTED };

        (reportService.getAllReports as jest.Mock).mockResolvedValue([]);

        await reportController.getAllReports(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(reportService.getAllReports).toHaveBeenCalledWith(
          123,
          ReportStatus.REJECTED,
          undefined
        );
      });
    });

    describe('category filter validation', () => {
      it('should accept valid ROADS category', async () => {
        const mockUser = { id: 123 } as User;
        mockRequest.user = mockUser;
        mockRequest.query = { category: ReportCategory.ROADS };

        const mockReports = [{ id: 1, category: ReportCategory.ROADS }];
        (reportService.getAllReports as jest.Mock).mockResolvedValue(mockReports);

        await reportController.getAllReports(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(reportService.getAllReports).toHaveBeenCalledWith(
          123,
          undefined,
          ReportCategory.ROADS
        );
      });

      it('should accept valid PUBLIC_LIGHTING category', async () => {
        const mockUser = { id: 123 } as User;
        mockRequest.user = mockUser;
        mockRequest.query = { category: ReportCategory.PUBLIC_LIGHTING };

        (reportService.getAllReports as jest.Mock).mockResolvedValue([]);

        await reportController.getAllReports(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(reportService.getAllReports).toHaveBeenCalledWith(
          123,
          undefined,
          ReportCategory.PUBLIC_LIGHTING
        );
      });
    });

    describe('combined filters', () => {
      it('should handle both status and category filters', async () => {
        const mockUser = { id: 123 } as User;
        mockRequest.user = mockUser;
        mockRequest.query = {
          status: ReportStatus.ASSIGNED,
          category: ReportCategory.ROADS
        };

        const mockReports = [
          { id: 1, status: ReportStatus.ASSIGNED, category: ReportCategory.ROADS }
        ];
        (reportService.getAllReports as jest.Mock).mockResolvedValue(mockReports);

        await reportController.getAllReports(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(reportService.getAllReports).toHaveBeenCalledWith(
          123,
          ReportStatus.ASSIGNED,
          ReportCategory.ROADS
        );
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith(mockReports);
      });

      it('should work without any filters', async () => {
        const mockUser = { id: 123 } as User;
        mockRequest.user = mockUser;
        mockRequest.query = {};

        const mockReports = [{ id: 1 }, { id: 2 }];
        (reportService.getAllReports as jest.Mock).mockResolvedValue(mockReports);

        await reportController.getAllReports(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(reportService.getAllReports).toHaveBeenCalledWith(123, undefined, undefined);
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith(mockReports);
      });
    });

    describe('successful responses', () => {
      it('should return 200 with reports array', async () => {
        const mockUser = { id: 123 } as User;
        mockRequest.user = mockUser;

        const mockReports = [
          { id: 1, title: 'Report 1' },
          { id: 2, title: 'Report 2' }
        ];
        (reportService.getAllReports as jest.Mock).mockResolvedValue(mockReports);

        await reportController.getAllReports(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith(mockReports);
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should return 200 with empty array when no reports found', async () => {
        const mockUser = { id: 123 } as User;
        mockRequest.user = mockUser;

        (reportService.getAllReports as jest.Mock).mockResolvedValue([]);

        await reportController.getAllReports(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith([]);
      });
    });

    describe('error handling', () => {
      it('should call next with error when service throws', async () => {
        const mockUser = { id: 123 } as User;
        mockRequest.user = mockUser;

        const error = new Error('Service error');
        (reportService.getAllReports as jest.Mock).mockRejectedValue(error);

        await reportController.getAllReports(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(error);
        expect(mockResponse.status).not.toHaveBeenCalled();
        expect(mockResponse.json).not.toHaveBeenCalled();
      });
    });
  });

  describe('getMyAssignedReports', () => {
    it('should throw UnauthorizedError if user is not authenticated', async () => {
      mockRequest.user = undefined;

      await reportController.getMyAssignedReports(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should get my assigned reports and return 200 status', async () => {
      const mockUser = { id: 1 } as User;
      const reports = [{ id: 1, title: 'Test Report' }];
      mockRequest.user = mockUser;

      (reportService.getMyAssignedReports as jest.Mock).mockResolvedValue(reports);

      await reportController.getMyAssignedReports(mockRequest as Request, mockResponse as Response, mockNext);

      expect(reportService.getMyAssignedReports).toHaveBeenCalledWith(mockUser.id, undefined);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(reports);
    });

    it('should call next with an error if fetching reports fails', async () => {
      const mockUser = { id: 1 } as User;
      mockRequest.user = mockUser;
      const error = new Error('Fetch failed');
      (reportService.getMyAssignedReports as jest.Mock).mockRejectedValue(error);

      await reportController.getMyAssignedReports(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getAssignedReportsToExternalMaintainer', () => {
    it('should get assigned reports for an external maintainer and return 200 status', async () => {
      const reports = [{ id: 1, title: 'Test Report' }];
      mockRequest.params = { externalMaintainerId: '1' };

      (reportService.getAssignedReportsToExternalMaintainer as jest.Mock).mockResolvedValue(reports);

      await reportController.getAssignedReportsToExternalMaintainer(mockRequest as Request, mockResponse as Response, mockNext);

      expect(reportService.getAssignedReportsToExternalMaintainer).toHaveBeenCalledWith(1, undefined);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(reports);
    });

    it('should call next with an error if fetching reports fails', async () => {
      const error = new Error('Fetch failed');
      mockRequest.params = { externalMaintainerId: '1' };
      (reportService.getAssignedReportsToExternalMaintainer as jest.Mock).mockRejectedValue(error);

      await reportController.getAssignedReportsToExternalMaintainer(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should throw BadRequestError for invalid id', async () => {
      mockRequest.params = { externalMaintainerId: 'invalid' };

      await reportController.getAssignedReportsToExternalMaintainer(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });
  });

  describe('updateReportStatus', () => {
    describe('authentication checks', () => {
      it('should throw UnauthorizedError when user is not authenticated', async () => {
        mockRequest.user = undefined;
        mockRequest.params = { id: '1' };
        mockRequest.body = { status: ReportStatus.ASSIGNED };

        await reportController.updateReportStatus(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({ message: 'Not authenticated' })
        );
      });

      it('should call service with userId when authenticated', async () => {
        const mockUser = { id: 123 } as User;
        mockRequest.user = mockUser;
        mockRequest.params = { id: '1' };
        mockRequest.body = { status: ReportStatus.ASSIGNED };

        const mockReport = { id: 1, status: ReportStatus.ASSIGNED };
        (reportService.updateReportStatus as jest.Mock).mockResolvedValue(mockReport);

        await reportController.updateReportStatus(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(reportService.updateReportStatus).toHaveBeenCalledWith(1, ReportStatus.ASSIGNED, {}, 123);
      });
    });

    describe('parameter parsing', () => {
      it('should parse report ID from params', async () => {
        const mockUser = { id: 123 } as User;
        mockRequest.user = mockUser;
        mockRequest.params = { id: '42' };
        mockRequest.body = { status: ReportStatus.ASSIGNED };

        const mockReport = { id: 42 };
        (reportService.updateReportStatus as jest.Mock).mockResolvedValue(mockReport);

        await reportController.updateReportStatus(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(reportService.updateReportStatus).toHaveBeenCalledWith(42, ReportStatus.ASSIGNED, {}, 123);
      });

      it('should parse status from body', async () => {
        const mockUser = { id: 123 } as User;
        mockRequest.user = mockUser;
        mockRequest.params = { id: '1' };
        mockRequest.body = { status: ReportStatus.ASSIGNED };

        const mockReport = { id: 1 };
        (reportService.updateReportStatus as jest.Mock).mockResolvedValue(mockReport);

        await reportController.updateReportStatus(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(reportService.updateReportStatus).toHaveBeenCalledWith(
          1,
          ReportStatus.ASSIGNED,
          {},
          123
        );
      });

      it('should pass undefined reason when not provided', async () => {
        const mockUser = { id: 123 } as User;
        mockRequest.user = mockUser;
        mockRequest.params = { id: '1' };
        mockRequest.body = { status: ReportStatus.ASSIGNED };

        const mockReport = { id: 1 };
        (reportService.updateReportStatus as jest.Mock).mockResolvedValue(mockReport);

        await reportController.updateReportStatus(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(reportService.updateReportStatus).toHaveBeenCalledWith(1, ReportStatus.ASSIGNED, {}, 123);
      });
    });

    describe('successful approval', () => {
      it('should return 200 with approved report', async () => {
        const mockUser = { id: 123 } as User;
        mockRequest.user = mockUser;
        mockRequest.params = { id: '1' };
        mockRequest.body = { status: ReportStatus.ASSIGNED };

        const mockApprovedReport = {
          id: 1,
          status: ReportStatus.ASSIGNED,
          assigneeId: 50
        };
        (reportService.updateReportStatus as jest.Mock).mockResolvedValue(mockApprovedReport);

        await reportController.updateReportStatus(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith(mockApprovedReport);
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should approve with category change', async () => {
        const mockUser = { id: 123 } as User;
        mockRequest.user = mockUser;
        mockRequest.params = { id: '5' };
        mockRequest.body = { status: ReportStatus.ASSIGNED };

        const mockApprovedReport = {
          id: 5,
          status: ReportStatus.ASSIGNED,
          category: ReportCategory.ROADS
        };
        (reportService.updateReportStatus as jest.Mock).mockResolvedValue(mockApprovedReport);

        await reportController.updateReportStatus(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(reportService.updateReportStatus).toHaveBeenCalledWith(5, ReportStatus.ASSIGNED, {}, 123);
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith(mockApprovedReport);
      });
    });

    describe('error handling', () => {
      it('should call next with error when service throws', async () => {
        const mockUser = { id: 123 } as User;
        mockRequest.user = mockUser;
        mockRequest.params = { id: '1' };
        mockRequest.body = { status: ReportStatus.ASSIGNED };

        const error = new Error('Approval failed');
        (reportService.updateReportStatus as jest.Mock).mockRejectedValue(error);

        await reportController.updateReportStatus(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(error);
        expect(mockResponse.status).not.toHaveBeenCalled();
      });

      it('should handle BadRequestError from service', async () => {
        const mockUser = { id: 123 } as User;
        mockRequest.user = mockUser;
        mockRequest.params = { id: '1' };
        mockRequest.body = { status: ReportStatus.ASSIGNED };

        const error = new BadRequestError('Invalid report status');
        (reportService.updateReportStatus as jest.Mock).mockRejectedValue(error);

        await reportController.updateReportStatus(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(error);
      });
    });
  });

  describe('updateReportStatus', () => {
    describe('authentication checks', () => {
      it('should throw UnauthorizedError when user is not authenticated', async () => {
        mockRequest.user = undefined;
        mockRequest.params = { id: '1' };
        mockRequest.body = { status: ReportStatus.REJECTED, reason: 'Test reason' };

        await reportController.updateReportStatus(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({ message: 'Not authenticated' })
        );
      });

      it('should call service with userId when authenticated', async () => {
        const mockUser = { id: 123 } as User;
        mockRequest.user = mockUser;
        mockRequest.params = { id: '1' };
        mockRequest.body = { status: ReportStatus.REJECTED, reason: 'Test reason' };

        const mockReport = { id: 1, status: ReportStatus.REJECTED };
        (reportService.updateReportStatus as jest.Mock).mockResolvedValue(mockReport);

        await reportController.updateReportStatus(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(reportService.updateReportStatus).toHaveBeenCalledWith(1, ReportStatus.REJECTED, { reason: 'Test reason' }, 123);
      });
    });

    describe('parameter parsing', () => {
      it('should parse report ID from params', async () => {
        const mockUser = { id: 123 } as User;
        mockRequest.user = mockUser;
        mockRequest.params = { id: '99' };
        mockRequest.body = { status: ReportStatus.REJECTED, reason: 'Invalid report' };

        const mockReport = { id: 99 };
        (reportService.updateReportStatus as jest.Mock).mockResolvedValue(mockReport);

        await reportController.updateReportStatus(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(reportService.updateReportStatus).toHaveBeenCalledWith(99, ReportStatus.REJECTED, { reason: 'Invalid report' }, 123);
      });

      it('should parse rejection reason from body', async () => {
        const mockUser = { id: 123 } as User;
        mockRequest.user = mockUser;
        mockRequest.params = { id: '1' };
        mockRequest.body = { status: ReportStatus.REJECTED, reason: 'Duplicate submission' };

        const mockReport = { id: 1 };
        (reportService.updateReportStatus as jest.Mock).mockResolvedValue(mockReport);

        await reportController.updateReportStatus(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(reportService.updateReportStatus).toHaveBeenCalledWith(1, ReportStatus.REJECTED, { reason: 'Duplicate submission' }, 123);
      });

      it('should handle long rejection reasons', async () => {
        const mockUser = { id: 123 } as User;
        mockRequest.user = mockUser;
        mockRequest.params = { id: '1' };
        const longReason = 'This is a very long rejection reason that explains in detail why the report is being rejected. '.repeat(5);
        mockRequest.body = { status: ReportStatus.REJECTED, reason: longReason };

        const mockReport = { id: 1 };
        (reportService.updateReportStatus as jest.Mock).mockResolvedValue(mockReport);

        await reportController.updateReportStatus(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(reportService.updateReportStatus).toHaveBeenCalledWith(1, ReportStatus.REJECTED, { reason: longReason }, 123);
      });
    });

    describe('successful rejection', () => {
      it('should return 200 with rejected report', async () => {
        const mockUser = { id: 123 } as User;
        mockRequest.user = mockUser;
        mockRequest.params = { id: '1' };
        mockRequest.body = { status: ReportStatus.REJECTED, reason: 'Not valid' };

        const mockRejectedReport = {
          id: 1,
          status: ReportStatus.REJECTED,
          rejectionReason: 'Not valid'
        };
        (reportService.updateReportStatus as jest.Mock).mockResolvedValue(mockRejectedReport);

        await reportController.updateReportStatus(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith(mockRejectedReport);
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should handle different rejection reasons', async () => {
        const mockUser = { id: 123 } as User;
        mockRequest.user = mockUser;
        mockRequest.params = { id: '7' };
        mockRequest.body = { status: ReportStatus.REJECTED, reason: 'Location outside boundaries' };

        const mockRejectedReport = {
          id: 7,
          status: ReportStatus.REJECTED,
          rejectionReason: 'Location outside boundaries'
        };
        (reportService.updateReportStatus as jest.Mock).mockResolvedValue(mockRejectedReport);

        await reportController.updateReportStatus(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(reportService.updateReportStatus).toHaveBeenCalledWith(
          7,
          ReportStatus.REJECTED,
          { reason: 'Location outside boundaries' },
          123
        );
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith(mockRejectedReport);
      });
    });

    describe('error handling', () => {
      it('should call next with error when service throws', async () => {
        const mockUser = { id: 123 } as User;
        mockRequest.user = mockUser;
        mockRequest.params = { id: '1' };
        mockRequest.body = { status: ReportStatus.REJECTED, reason: 'Test' };

        const error = new Error('Rejection failed');
        (reportService.updateReportStatus as jest.Mock).mockRejectedValue(error);

        await reportController.updateReportStatus(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(error);
        expect(mockResponse.status).not.toHaveBeenCalled();
      });

      it('should handle BadRequestError from service', async () => {
        const mockUser = { id: 123 } as User;
        mockRequest.user = mockUser;
        mockRequest.params = { id: '1' };
        mockRequest.body = { status: ReportStatus.REJECTED, reason: '' };

        const error = new BadRequestError('Rejection reason is required');
        (reportService.updateReportStatus as jest.Mock).mockRejectedValue(error);

        await reportController.updateReportStatus(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(error);
      });
    });
  });

  describe('assignToExternalMaintainer', () => {
    it('should throw UnauthorizedError if user is not authenticated', async () => {
      mockRequest.user = undefined;

      await reportController.assignToExternalMaintainer(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should assign a report to an external maintainer and return 200 status', async () => {
      const mockUser = { id: 1 } as User;
      const updatedReport = { id: 1, title: 'Test Report', assigneeId: 2 };
      mockRequest.user = mockUser;
      mockRequest.params = { id: '1' };
      mockRequest.body = { externalAssigneeId: 2 };

      (reportService.assignToExternalMaintainer as jest.Mock).mockResolvedValue(updatedReport);

      await reportController.assignToExternalMaintainer(mockRequest as Request, mockResponse as Response, mockNext);

      expect(reportService.assignToExternalMaintainer).toHaveBeenCalledWith(1, 2, 1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedReport);
    });

    it('should call next with an error if assigning fails', async () => {
      const mockUser = { id: 1 } as User;
      const error = new Error('Assign failed');
      mockRequest.user = mockUser;
      mockRequest.params = { id: '1' };
      mockRequest.body = { externalAssigneeId: 2 };
      (reportService.assignToExternalMaintainer as jest.Mock).mockRejectedValue(error);

      await reportController.assignToExternalMaintainer(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should throw BadRequestError for invalid id', async () => {
      const mockUser = { id: 1 } as User;
      mockRequest.user = mockUser;
      mockRequest.params = { id: 'invalid' };

      await reportController.assignToExternalMaintainer(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });
  });
  
  describe('getMapReports', () => {
    // Validation tests removed - validation is now handled by validateMapQuery middleware

    describe('successful requests', () => {
      it('should return map reports without filters', async () => {
        const mockReports = [
          {
            id: 1,
            title: 'Pothole',
            category: ReportCategory.ROADS,
            status: ReportStatus.ASSIGNED,
            location: { latitude: 45, longitude: 7 },
            reporterName: 'John Doe',
            isAnonymous: false,
            createdAt: new Date()
          }
        ];

        (reportService.getMapReports as jest.Mock).mockResolvedValue(mockReports);

        await reportController.getMapReports(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(reportService.getMapReports).toHaveBeenCalledWith({
          zoom: undefined,
          minLat: undefined,
          maxLat: undefined,
          minLng: undefined,
          maxLng: undefined,
          category: undefined
        });
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith(mockReports);
      });

      it('should return map reports with valid zoom level', async () => {
        // Simulate middleware setting validated zoom
        (mockRequest as any).validatedZoom = 15;
        mockRequest.query = { zoom: '15' };

        const mockReports = [
          {
            id: 1,
            title: 'Pothole',
            category: ReportCategory.ROADS,
            status: ReportStatus.ASSIGNED,
            location: { latitude: 45, longitude: 7 },
            reporterName: 'John Doe',
            isAnonymous: false,
            createdAt: new Date()
          }
        ];

        (reportService.getMapReports as jest.Mock).mockResolvedValue(mockReports);

        await reportController.getMapReports(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(reportService.getMapReports).toHaveBeenCalledWith(
          expect.objectContaining({ zoom: 15 })
        );
        expect(mockResponse.status).toHaveBeenCalledWith(200);
      });

      it('should return map reports with valid bounding box', async () => {
        // Simulate middleware setting validated bounding box
        (mockRequest as any).validatedBoundingBox = {
          minLat: 45,
          maxLat: 46,
          minLng: 7,
          maxLng: 8
        };
        mockRequest.query = { 
          minLat: '45.0',
          maxLat: '46.0',
          minLng: '7.0',
          maxLng: '8.0'
        };

        (reportService.getMapReports as jest.Mock).mockResolvedValue([]);

        await reportController.getMapReports(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(reportService.getMapReports).toHaveBeenCalledWith({
          zoom: undefined,
          minLat: 45,
          maxLat: 46,
          minLng: 7,
          maxLng: 8,
          category: undefined
        });
        expect(mockResponse.status).toHaveBeenCalledWith(200);
      });

      it('should return map reports with category filter', async () => {
        mockRequest.query = { category: ReportCategory.ROADS };

        (reportService.getMapReports as jest.Mock).mockResolvedValue([]);

        await reportController.getMapReports(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(reportService.getMapReports).toHaveBeenCalledWith(
          expect.objectContaining({ category: ReportCategory.ROADS })
        );
        expect(mockResponse.status).toHaveBeenCalledWith(200);
      });
    });

    describe('error handling', () => {
      it('should call next with error when service throws', async () => {
        const error = new Error('Service error');
        (reportService.getMapReports as jest.Mock).mockRejectedValue(error);

        await reportController.getMapReports(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(error);
        expect(mockResponse.status).not.toHaveBeenCalled();
      });
    });
  });

  describe('Internal Comments', () => {
    describe('getInternalComments', () => {
      it('should return comments with 200 status', async () => {
        const mockUser = { id: 1 } as User;
        const mockComments = [
          {
            id: 1,
            reportId: 10,
            content: 'Test comment',
            author: {
              id: 1,
              username: 'testuser',
              firstName: 'Test',
              lastName: 'User',
              role: 'Staff'
            },
            createdAt: new Date()
          }
        ];

        mockRequest.user = mockUser;
        mockRequest.params = { id: '10' };
        (reportService.getInternalComments as jest.Mock).mockResolvedValue(mockComments);

        await reportController.getInternalComments(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(reportService.getInternalComments).toHaveBeenCalledWith(10);
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith(mockComments);
      });

      it('should return empty array when no comments exist', async () => {
        const mockUser = { id: 1 } as User;
        mockRequest.user = mockUser;
        mockRequest.params = { id: '10' };
        (reportService.getInternalComments as jest.Mock).mockResolvedValue([]);

        await reportController.getInternalComments(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith([]);
      });

      it('should call next with error if service throws', async () => {
        const mockUser = { id: 1 } as User;
        const error = new Error('Service error');
        mockRequest.user = mockUser;
        mockRequest.params = { id: '10' };
        (reportService.getInternalComments as jest.Mock).mockRejectedValue(error);

        await reportController.getInternalComments(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(error);
        expect(mockResponse.status).not.toHaveBeenCalled();
      });
    });

    describe('addInternalComment', () => {
      it('should throw BadRequestError if content is missing', async () => {
        const mockUser = { id: 1 } as User;
        mockRequest.user = mockUser;
        mockRequest.params = { id: '10' };
        mockRequest.body = {};

        await reportController.addInternalComment(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
        expect(reportService.addInternalComment).not.toHaveBeenCalled();
      });

      it('should add comment and return 201 status', async () => {
        const mockUser = { id: 1 } as User;
        const mockComment = {
          id: 5,
          reportId: 10,
          content: 'New comment',
          author: {
            id: 1,
            username: 'testuser',
            firstName: 'Test',
            lastName: 'User',
            role: 'Staff'
          },
          createdAt: new Date()
        };

        mockRequest.user = mockUser;
        mockRequest.params = { id: '10' };
        mockRequest.body = { content: 'New comment' };
        (reportService.addInternalComment as jest.Mock).mockResolvedValue(mockComment);

        await reportController.addInternalComment(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(reportService.addInternalComment).toHaveBeenCalledWith(10, 1, 'New comment');
        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(mockResponse.json).toHaveBeenCalledWith(mockComment);
      });

      it('should call next with error if service throws', async () => {
        const mockUser = { id: 1 } as User;
        const error = new Error('Service error');
        mockRequest.user = mockUser;
        mockRequest.params = { id: '10' };
        mockRequest.body = { content: 'Test' };
        (reportService.addInternalComment as jest.Mock).mockRejectedValue(error);

        await reportController.addInternalComment(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(error);
        expect(mockResponse.status).not.toHaveBeenCalled();
      });
    });

    describe('deleteInternalComment', () => {
      it('should delete comment and return 204 status', async () => {
        const mockUser = { id: 1 } as User;
        mockRequest.user = mockUser;
        mockRequest.params = { reportId: '10', commentId: '5' };
        (reportService.deleteInternalComment as jest.Mock).mockResolvedValue(undefined);

        await reportController.deleteInternalComment(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(reportService.deleteInternalComment).toHaveBeenCalledWith(10, 5, 1);
        expect(mockResponse.status).toHaveBeenCalledWith(204);
        expect(mockResponse.send).toHaveBeenCalled();
      });

      it('should call next with error if service throws', async () => {
        const mockUser = { id: 1 } as User;
        const error = new Error('Service error');
        mockRequest.user = mockUser;
        mockRequest.params = { reportId: '10', commentId: '5' };
        (reportService.deleteInternalComment as jest.Mock).mockRejectedValue(error);

        await reportController.deleteInternalComment(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(error);
        expect(mockResponse.status).not.toHaveBeenCalled();
      });
    });
  });
});

