jest.mock('@services/reportService');
jest.mock('@middleware/authMiddleware');

import { Request, Response, NextFunction } from 'express';
import { reportService } from '../../../services/reportService';
import { ReportStatus } from '../../../models/dto/ReportStatus';
import { ReportCategory } from '../../../models/dto/ReportCategory';
import { reportController } from '@controllers/reportController';

describe('ReportController Integration Tests - getMyAssignedReports', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock response
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    // Setup mock next function
    mockNext = jest.fn();

    // Setup mock request with authenticated user
    mockRequest = {
      user: {
        id: 50,
        username: 'technician1',
        role: 'Electrical staff member',
        departmentRoleId: 5,
      },
      query: {},
    };
  });

  describe('GET /api/reports/my-assigned - Success Cases', () => {
    it('should return all assigned reports without status filter', async () => {
      // Arrange
      const mockReports = [
        {
          id: 1,
          title: 'Light damage on Via Roma',
          description: 'Light needs repair',
          category: ReportCategory.PUBLIC_LIGHTING,
          status: ReportStatus.ASSIGNED,
          location: { latitude: 45.0703393, longitude: 7.6869005 },
          createdAt: new Date('2024-01-01'),
          assigneeId: 50,
        },
        {
          id: 2,
          title: 'Broken street light',
          description: 'Light not working',
          category: ReportCategory.PUBLIC_LIGHTING,
          status: ReportStatus.IN_PROGRESS,
          location: { latitude: 45.0692403, longitude: 7.6932941 },
          createdAt: new Date('2024-01-02'),
          assigneeId: 50,
        },
        {
          id: 3,
          title: 'Light maintenance needed',
          description: 'Light needs maintenance',
          category: ReportCategory.PUBLIC_LIGHTING,
          status: ReportStatus.RESOLVED,
          location: { latitude: 45.0625748, longitude: 7.6782069 },
          createdAt: new Date('2024-01-03'),
          assigneeId: 50,
        },
      ];

      (reportService.getMyAssignedReports as jest.Mock).mockResolvedValue(mockReports);

      // Act
      await reportController.getMyAssignedReports(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(reportService.getMyAssignedReports).toHaveBeenCalledWith(50, undefined);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockReports);
      expect(mockReports).toHaveLength(3);
    });

    it('should return only ASSIGNED reports when status filter is provided', async () => {
      // Arrange
      mockRequest.query = { status: ReportStatus.ASSIGNED };

      const mockReports = [
        {
          id: 1,
          title: 'Road damage',
          status: ReportStatus.ASSIGNED,
          assigneeId: 50,
        },
        {
          id: 4,
          title: 'Graffiti removal',
          status: ReportStatus.ASSIGNED,
          assigneeId: 50,
        },
      ];

      (reportService.getMyAssignedReports as jest.Mock).mockResolvedValue(mockReports);

      // Act
      await reportController.getMyAssignedReports(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(reportService.getMyAssignedReports).toHaveBeenCalledWith(
        50,
        ReportStatus.ASSIGNED
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockReports);
      expect(mockReports.every(r => r.status === ReportStatus.ASSIGNED)).toBe(true);
    });

    it('should return only IN_PROGRESS reports when status filter is IN_PROGRESS', async () => {
      // Arrange
      mockRequest.query = { status: ReportStatus.IN_PROGRESS };

      const mockReports = [
        {
          id: 2,
          title: 'Street light repair',
          status: ReportStatus.IN_PROGRESS,
          assigneeId: 50,
        },
      ];

      (reportService.getMyAssignedReports as jest.Mock).mockResolvedValue(mockReports);

      // Act
      await reportController.getMyAssignedReports(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(reportService.getMyAssignedReports).toHaveBeenCalledWith(
        50,
        ReportStatus.IN_PROGRESS
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockReports);
    });

    it('should return only RESOLVED reports when status filter is RESOLVED', async () => {
      // Arrange
      mockRequest.query = { status: ReportStatus.RESOLVED };

      const mockReports = [
        {
          id: 3,
          title: 'Park maintenance',
          status: ReportStatus.RESOLVED,
          assigneeId: 50,
        },
        {
          id: 5,
          title: 'Waste collection',
          status: ReportStatus.RESOLVED,
          assigneeId: 50,
        },
      ];

      (reportService.getMyAssignedReports as jest.Mock).mockResolvedValue(mockReports);

      // Act
      await reportController.getMyAssignedReports(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(reportService.getMyAssignedReports).toHaveBeenCalledWith(
        50,
        ReportStatus.RESOLVED
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockReports);
      expect(mockReports.every(r => r.status === ReportStatus.RESOLVED)).toBe(true);
    });

    it('should return empty array when user has no assigned reports', async () => {
      // Arrange
      (reportService.getMyAssignedReports as jest.Mock).mockResolvedValue([]);

      // Act
      await reportController.getMyAssignedReports(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(reportService.getMyAssignedReports).toHaveBeenCalledWith(50, undefined);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith([]);
    });
  });

  describe('GET /api/reports/my-assigned - Error Cases', () => {
    it('should call next with error if user is not authenticated', async () => {
      // Arrange
      mockRequest.user = undefined;

      // Act
      await reportController.getMyAssignedReports(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockNext.mock.calls[0][0].message).toContain('Not authenticated');
      expect(reportService.getMyAssignedReports).not.toHaveBeenCalled();
    });

    it('should call next with error if service throws an error', async () => {
      // Arrange
      const serviceError = new Error('Database connection error');
      (reportService.getMyAssignedReports as jest.Mock).mockRejectedValue(serviceError);

      // Act
      await reportController.getMyAssignedReports(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(reportService.getMyAssignedReports).toHaveBeenCalledWith(50, undefined);
      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(statusMock).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/reports/my-assigned - Edge Cases', () => {
    it('should handle user with different role (still technical staff)', async () => {
      // Arrange
      mockRequest.user = {
        id: 75,
        username: 'technician2',
        role: 'Recycling Program staff member',
        departmentRoleId: 6,
      };

      const mockReports = [
        {
          id: 10,
          title: 'Another report',
          assigneeId: 75,
        },
      ];

      (reportService.getMyAssignedReports as jest.Mock).mockResolvedValue(mockReports);

      // Act
      await reportController.getMyAssignedReports(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(reportService.getMyAssignedReports).toHaveBeenCalledWith(75, undefined);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockReports);
    });

    it('should handle large number of assigned reports', async () => {
      // Arrange
      const mockReports = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        title: `Report ${i + 1}`,
        assigneeId: 50,
        status: ReportStatus.ASSIGNED,
      }));

      (reportService.getMyAssignedReports as jest.Mock).mockResolvedValue(mockReports);

      // Act
      await reportController.getMyAssignedReports(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockReports);
      expect(mockReports).toHaveLength(100);
    });

    it('should accept valid status values only', async () => {
      // Test all valid status values
      const validStatuses = [
        ReportStatus.ASSIGNED,
        ReportStatus.IN_PROGRESS,
        ReportStatus.RESOLVED,
      ];

      for (const status of validStatuses) {
        jest.clearAllMocks();
        mockRequest.query = { status };

        (reportService.getMyAssignedReports as jest.Mock).mockResolvedValue([]);

        await reportController.getMyAssignedReports(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(reportService.getMyAssignedReports).toHaveBeenCalledWith(50, status);
        expect(statusMock).toHaveBeenCalledWith(200);
      }
    });
  });

  describe('GET /api/reports/my-assigned - Service Integration', () => {
    it('should call service with correct userId from authenticated user', async () => {
      // Arrange
      mockRequest.user = {
        id: 123,
        username: 'test.user',
        role: 'Electrical staff member',
        departmentRoleId: 5,
      };

      (reportService.getMyAssignedReports as jest.Mock).mockResolvedValue([]);

      // Act
      await reportController.getMyAssignedReports(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(reportService.getMyAssignedReports).toHaveBeenCalledTimes(1);
      expect(reportService.getMyAssignedReports).toHaveBeenCalledWith(123, undefined);
    });

    it('should pass status filter to service when provided', async () => {
      // Arrange
      mockRequest.query = { status: ReportStatus.IN_PROGRESS };

      (reportService.getMyAssignedReports as jest.Mock).mockResolvedValue([]);

      // Act
      await reportController.getMyAssignedReports(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(reportService.getMyAssignedReports).toHaveBeenCalledWith(
        50,
        ReportStatus.IN_PROGRESS
      );
    });

    it('should return exactly what service returns', async () => {
      // Arrange
      const serviceResponse = [
        { id: 1, title: 'Test 1' },
        { id: 2, title: 'Test 2' },
      ];

      (reportService.getMyAssignedReports as jest.Mock).mockResolvedValue(serviceResponse);

      // Act
      await reportController.getMyAssignedReports(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(jsonMock).toHaveBeenCalledWith(serviceResponse);
    });
  });
});