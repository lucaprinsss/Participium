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
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
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
      it('should throw BadRequestError for invalid status', async () => {
        const mockUser = { id: 123 } as User;
        mockRequest.user = mockUser;
        mockRequest.query = { status: 'INVALID_STATUS' };

        await reportController.getAllReports(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({ 
            message: expect.stringContaining('Invalid status') 
          })
        );
      });

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
      it('should throw BadRequestError for invalid category', async () => {
        const mockUser = { id: 123 } as User;
        mockRequest.user = mockUser;
        mockRequest.query = { category: 'INVALID_CATEGORY' };

        await reportController.getAllReports(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({ 
            message: expect.stringContaining('Invalid category') 
          })
        );
      });

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

  describe('approveReport', () => {
    describe('authentication checks', () => {
      it('should throw UnauthorizedError when user is not authenticated', async () => {
        mockRequest.user = undefined;
        mockRequest.params = { id: '1' };
        mockRequest.body = {};

        await reportController.approveReport(
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
        mockRequest.body = {};

        const mockReport = { id: 1, status: ReportStatus.ASSIGNED };
        (reportService.approveReport as jest.Mock).mockResolvedValue(mockReport);

        await reportController.approveReport(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(reportService.approveReport).toHaveBeenCalledWith(1, 123, undefined);
      });
    });

    describe('parameter parsing', () => {
      it('should parse report ID from params', async () => {
        const mockUser = { id: 123 } as User;
        mockRequest.user = mockUser;
        mockRequest.params = { id: '42' };
        mockRequest.body = {};

        const mockReport = { id: 42 };
        (reportService.approveReport as jest.Mock).mockResolvedValue(mockReport);

        await reportController.approveReport(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(reportService.approveReport).toHaveBeenCalledWith(42, 123, undefined);
      });

      it('should parse category from body when provided', async () => {
        const mockUser = { id: 123 } as User;
        mockRequest.user = mockUser;
        mockRequest.params = { id: '1' };
        mockRequest.body = { category: ReportCategory.PUBLIC_LIGHTING };

        const mockReport = { id: 1 };
        (reportService.approveReport as jest.Mock).mockResolvedValue(mockReport);

        await reportController.approveReport(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(reportService.approveReport).toHaveBeenCalledWith(
          1,
          123,
          ReportCategory.PUBLIC_LIGHTING
        );
      });

      it('should pass undefined category when not provided', async () => {
        const mockUser = { id: 123 } as User;
        mockRequest.user = mockUser;
        mockRequest.params = { id: '1' };
        mockRequest.body = {};

        const mockReport = { id: 1 };
        (reportService.approveReport as jest.Mock).mockResolvedValue(mockReport);

        await reportController.approveReport(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(reportService.approveReport).toHaveBeenCalledWith(1, 123, undefined);
      });
    });

    describe('successful approval', () => {
      it('should return 200 with approved report', async () => {
        const mockUser = { id: 123 } as User;
        mockRequest.user = mockUser;
        mockRequest.params = { id: '1' };
        mockRequest.body = {};

        const mockApprovedReport = {
          id: 1,
          status: ReportStatus.ASSIGNED,
          assigneeId: 50
        };
        (reportService.approveReport as jest.Mock).mockResolvedValue(mockApprovedReport);

        await reportController.approveReport(
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
        mockRequest.body = { category: ReportCategory.ROADS };

        const mockApprovedReport = {
          id: 5,
          status: ReportStatus.ASSIGNED,
          category: ReportCategory.ROADS
        };
        (reportService.approveReport as jest.Mock).mockResolvedValue(mockApprovedReport);

        await reportController.approveReport(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(reportService.approveReport).toHaveBeenCalledWith(5, 123, ReportCategory.ROADS);
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith(mockApprovedReport);
      });
    });

    describe('error handling', () => {
      it('should call next with error when service throws', async () => {
        const mockUser = { id: 123 } as User;
        mockRequest.user = mockUser;
        mockRequest.params = { id: '1' };
        mockRequest.body = {};

        const error = new Error('Approval failed');
        (reportService.approveReport as jest.Mock).mockRejectedValue(error);

        await reportController.approveReport(
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
        mockRequest.body = {};

        const error = new BadRequestError('Invalid report status');
        (reportService.approveReport as jest.Mock).mockRejectedValue(error);

        await reportController.approveReport(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(error);
      });
    });
  });

  describe('rejectReport', () => {
    describe('authentication checks', () => {
      it('should throw UnauthorizedError when user is not authenticated', async () => {
        mockRequest.user = undefined;
        mockRequest.params = { id: '1' };
        mockRequest.body = { rejectionReason: 'Test reason' };

        await reportController.rejectReport(
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
        mockRequest.body = { rejectionReason: 'Test reason' };

        const mockReport = { id: 1, status: ReportStatus.REJECTED };
        (reportService.rejectReport as jest.Mock).mockResolvedValue(mockReport);

        await reportController.rejectReport(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(reportService.rejectReport).toHaveBeenCalledWith(1, 'Test reason', 123);
      });
    });

    describe('parameter parsing', () => {
      it('should parse report ID from params', async () => {
        const mockUser = { id: 123 } as User;
        mockRequest.user = mockUser;
        mockRequest.params = { id: '99' };
        mockRequest.body = { rejectionReason: 'Invalid report' };

        const mockReport = { id: 99 };
        (reportService.rejectReport as jest.Mock).mockResolvedValue(mockReport);

        await reportController.rejectReport(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(reportService.rejectReport).toHaveBeenCalledWith(99, 'Invalid report', 123);
      });

      it('should parse rejection reason from body', async () => {
        const mockUser = { id: 123 } as User;
        mockRequest.user = mockUser;
        mockRequest.params = { id: '1' };
        mockRequest.body = { rejectionReason: 'Duplicate submission' };

        const mockReport = { id: 1 };
        (reportService.rejectReport as jest.Mock).mockResolvedValue(mockReport);

        await reportController.rejectReport(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(reportService.rejectReport).toHaveBeenCalledWith(1, 'Duplicate submission', 123);
      });

      it('should handle long rejection reasons', async () => {
        const mockUser = { id: 123 } as User;
        mockRequest.user = mockUser;
        mockRequest.params = { id: '1' };
        const longReason = 'This is a very long rejection reason that explains in detail why the report is being rejected. '.repeat(5);
        mockRequest.body = { rejectionReason: longReason };

        const mockReport = { id: 1 };
        (reportService.rejectReport as jest.Mock).mockResolvedValue(mockReport);

        await reportController.rejectReport(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(reportService.rejectReport).toHaveBeenCalledWith(1, longReason, 123);
      });
    });

    describe('successful rejection', () => {
      it('should return 200 with rejected report', async () => {
        const mockUser = { id: 123 } as User;
        mockRequest.user = mockUser;
        mockRequest.params = { id: '1' };
        mockRequest.body = { rejectionReason: 'Not valid' };

        const mockRejectedReport = {
          id: 1,
          status: ReportStatus.REJECTED,
          rejectionReason: 'Not valid'
        };
        (reportService.rejectReport as jest.Mock).mockResolvedValue(mockRejectedReport);

        await reportController.rejectReport(
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
        mockRequest.body = { rejectionReason: 'Location outside boundaries' };

        const mockRejectedReport = {
          id: 7,
          status: ReportStatus.REJECTED,
          rejectionReason: 'Location outside boundaries'
        };
        (reportService.rejectReport as jest.Mock).mockResolvedValue(mockRejectedReport);

        await reportController.rejectReport(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(reportService.rejectReport).toHaveBeenCalledWith(
          7,
          'Location outside boundaries',
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
        mockRequest.body = { rejectionReason: 'Test' };

        const error = new Error('Rejection failed');
        (reportService.rejectReport as jest.Mock).mockRejectedValue(error);

        await reportController.rejectReport(
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
        mockRequest.body = { rejectionReason: '' };

        const error = new BadRequestError('Rejection reason is required');
        (reportService.rejectReport as jest.Mock).mockRejectedValue(error);

        await reportController.rejectReport(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(error);
      });
    });
  });

  describe('getMapReports', () => {
    describe('validation', () => {
      it('should reject invalid zoom level (too low)', async () => {
        mockRequest.query = { zoom: '0' };

        await reportController.getMapReports(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({ message: 'Zoom level must be between 1 and 20' })
        );
      });

      it('should reject invalid zoom level (too high)', async () => {
        mockRequest.query = { zoom: '21' };

        await reportController.getMapReports(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({ message: 'Zoom level must be between 1 and 20' })
        );
      });

      it('should reject incomplete bounding box (only minLat)', async () => {
        mockRequest.query = { minLat: '45.0' };

        await reportController.getMapReports(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({ 
            message: 'Bounding box requires all parameters: minLat, maxLat, minLng, maxLng' 
          })
        );
      });

      it('should reject invalid latitude range', async () => {
        mockRequest.query = { 
          minLat: '-91',
          maxLat: '45.0',
          minLng: '7.0',
          maxLng: '8.0'
        };

        await reportController.getMapReports(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({ message: 'minLat must be between -90 and 90' })
        );
      });

      it('should reject invalid longitude range', async () => {
        mockRequest.query = { 
          minLat: '45.0',
          maxLat: '46.0',
          minLng: '-181',
          maxLng: '8.0'
        };

        await reportController.getMapReports(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({ message: 'minLng must be between -180 and 180' })
        );
      });

      it('should reject when minLat >= maxLat', async () => {
        mockRequest.query = { 
          minLat: '46.0',
          maxLat: '45.0',
          minLng: '7.0',
          maxLng: '8.0'
        };

        await reportController.getMapReports(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({ message: 'minLat must be less than maxLat' })
        );
      });

      it('should reject when minLng >= maxLng', async () => {
        mockRequest.query = { 
          minLat: '45.0',
          maxLat: '46.0',
          minLng: '8.0',
          maxLng: '7.0'
        };

        await reportController.getMapReports(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({ message: 'minLng must be less than maxLng' })
        );
      });
    });

    describe('successful requests', () => {
      it('should return map reports without filters', async () => {
        const mockReports = [
          {
            id: 1,
            title: 'Pothole',
            category: ReportCategory.ROADS,
            status: ReportStatus.ASSIGNED,
            location: { latitude: 45.0, longitude: 7.0 },
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
        mockRequest.query = { zoom: '15' };

        const mockReports = [
          {
            id: 1,
            title: 'Pothole',
            category: ReportCategory.ROADS,
            status: ReportStatus.ASSIGNED,
            location: { latitude: 45.0, longitude: 7.0 },
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
          minLat: 45.0,
          maxLat: 46.0,
          minLng: 7.0,
          maxLng: 8.0,
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
});

