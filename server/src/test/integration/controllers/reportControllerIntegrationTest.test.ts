import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import { AppDataSource } from "@database/connection";
import app from "../../../app";
import { userEntity } from "@models/entity/userEntity";
import { reportEntity } from "@models/entity/reportEntity";
import { userRepository } from '@repositories/userRepository';
import { departmentRoleRepository } from '@repositories/departmentRoleRepository';
import { In } from 'typeorm';


import { Request, Response, NextFunction } from 'express';
import { reportService } from '../../../services/reportService';
import { ReportStatus } from '../../../models/dto/ReportStatus';
import { ReportCategory } from '../../../models/dto/ReportCategory';
import { reportController } from '@controllers/reportController';

const r = () => `_${Math.floor(Math.random() * 1000000)}`;

let TEST_USER_CREDENTIALS: any;
let TEST_USER_ID: number;

describe('ReportController Integration Tests', () => {

  let agent: ReturnType<typeof request.agent>;
  let createdUserIds: number[] = [];
  let createdReportIds: number[] = [];

  // Setup database connection
  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });

  // Final cleanup
  afterAll(async () => {
    if (createdReportIds.length > 0) {
      await AppDataSource.getRepository(reportEntity).delete({ id: In(createdReportIds) });
      createdReportIds = [];
    }
    if (createdUserIds.length > 0) {
      await AppDataSource.getRepository(userEntity).delete({ id: In(createdUserIds) });
      createdUserIds = [];
    }
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  // Cleanup after each test
  afterEach(async () => {
    // Delete reports first due to foreign key constraints
    if (createdReportIds.length > 0) {
      await AppDataSource.getRepository(reportEntity).delete({ id: In(createdReportIds) });
      createdReportIds = [];
    }
    if (createdUserIds.length > 0) {
      await AppDataSource.getRepository(userEntity).delete({ id: In(createdUserIds) });
      createdUserIds = [];
    }
    jest.restoreAllMocks();
  });

  // Setup before each test
  beforeEach(async () => {
    // 1. Create a Citizen user
    const citizenDeptRole = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Citizen');
    if (!citizenDeptRole) {
      throw new Error('Citizen role not found in database');
    }

    TEST_USER_CREDENTIALS = {
      username: `report_test_user${r()}`,
      password: 'Password123!',
      email: `report${r()}@test.com`,
      firstName: 'Report',
      lastName: 'Test',
      departmentRoleId: citizenDeptRole.id
    };

    const user = await userRepository.createUserWithPassword({
      ...TEST_USER_CREDENTIALS,
      emailNotificationsEnabled: true
    });

    createdUserIds.push(user.id);
    TEST_USER_ID = user.id;

    // 2. Login to get session
    agent = request.agent(app);
    await agent.post('/api/sessions').send({
      username: TEST_USER_CREDENTIALS.username,
      password: TEST_USER_CREDENTIALS.password,
    });
  });

  describe('POST /api/reports', () => {
    it('should create a new report successfully (201)', async () => {
      const reportData = {
        title: 'Integration Test Report',
        description: 'This is a test report created by integration test',
        category: ReportCategory.ROADS,
        location: {
          latitude: 45.0703,
          longitude: 7.6869
        },
        photos: ['data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='],
        isAnonymous: false
      };

      const response = await agent
        .post('/api/reports')
        .send(reportData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(reportData.title);
      expect(response.body.status).toBe(ReportStatus.PENDING_APPROVAL);

      createdReportIds.push(response.body.id);
    });

    it('should fail with invalid data (400)', async () => {
       const invalidData = {
        title: 'Short', // Too short (min 5 usually, but check model)
        description: 'Desc',
        category: 'INVALID_CATEGORY',
        // Missing location and photos
      };

      const response = await agent
        .post('/api/reports')
        .send(invalidData);

      expect(response.status).toBe(400);
    });
    
    it('should fail if not authenticated (401)', async () => {
      const unauthAgent = request.agent(app);
      const reportData = {
        title: 'Unauth Report',
        description: 'This should fail',
        category: ReportCategory.ROADS,
        location: { latitude: 45.0703, longitude: 7.6869 },
        photos: ['data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='],
      };

      const response = await unauthAgent
        .post('/api/reports')
        .send(reportData);
        
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/reports', () => {
    it('should return all reports for the user (200)', async () => {
       // Create a report first via API to ensure it exists
       const reportData = {
        title: 'Report for Get',
        description: 'Description for get',
        category: ReportCategory.WASTE,
        location: { latitude: 45.0703, longitude: 7.6869 },
        photos: ['data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='],
      };
      
      const createRes = await agent.post('/api/reports').send(reportData);
      expect(createRes.status).toBe(201);
      createdReportIds.push(createRes.body.id);

      // Manually update status to allow Citizen to see it (Citizen cannot see PENDING_APPROVAL)
      await AppDataSource.getRepository(reportEntity).update(createRes.body.id, { status: ReportStatus.ASSIGNED });

      const response = await agent.get('/api/reports');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      const found = response.body.find((r: any) => r.id === createRes.body.id);
      expect(found).toBeDefined();
      expect(found.title).toBe(reportData.title);
    });

    it('should fail if not authenticated (401)', async () => {
      const unauthAgent = request.agent(app);
      const response = await unauthAgent.get('/api/reports');
      expect(response.status).toBe(401);
    });
  });
});

describe('ReportController Integration Tests - getMyAssignedReports', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;
  let mockGetMyAssignedReports: jest.SpyInstance;

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

    mockGetMyAssignedReports = jest.spyOn(reportService, 'getMyAssignedReports');
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

      mockGetMyAssignedReports.mockResolvedValue(mockReports);

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

      mockGetMyAssignedReports.mockResolvedValue(mockReports);

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

      mockGetMyAssignedReports.mockResolvedValue(mockReports);

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

      mockGetMyAssignedReports.mockResolvedValue(mockReports);

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
      mockGetMyAssignedReports.mockResolvedValue([]);

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
      mockGetMyAssignedReports.mockRejectedValue(serviceError);

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

      mockGetMyAssignedReports.mockResolvedValue(mockReports);

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

      mockGetMyAssignedReports.mockResolvedValue(mockReports);

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

        mockGetMyAssignedReports.mockResolvedValue([]);

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

      mockGetMyAssignedReports.mockResolvedValue([]);

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

      mockGetMyAssignedReports.mockResolvedValue(serviceResponse);

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
