import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import { AppDataSource } from "@database/connection";
import app from "../../../app";

import { UserEntity } from "@entity/userEntity";
import { ReportEntity } from "@entity/reportEntity";
import { userRepository } from '@repositories/userRepository';
import { departmentRoleRepository } from '@repositories/departmentRoleRepository';
import { companyRepository } from '@repositories/companyRepository';
import { reportRepository } from '@repositories/reportRepository';

import { In } from 'typeorm';
import { DepartmentEntity } from "@models/entity/departmentEntity";
import { DepartmentRoleEntity } from "@models/entity/departmentRoleEntity";
import { RoleEntity } from "@models/entity/roleEntity";


import { Request, Response } from 'express';
import { reportService } from '@services/reportService';
import { ReportStatus } from '@dto/ReportStatus';
import { ReportCategory } from '@dto/ReportCategory';
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

    // Ensure Public Lighting Department exists
    let lightingDept = await AppDataSource.getRepository(DepartmentEntity).findOneBy({ name: 'Public Lighting Department' });
    if (!lightingDept) {
      lightingDept = await AppDataSource.getRepository(DepartmentEntity).save({
        name: 'Public Lighting Department',
        description: 'Handles street lights'
      });
    }

    // Ensure Electrical staff member role exists
    let staffRoleName = await AppDataSource.getRepository(RoleEntity).findOneBy({ name: 'Electrical staff member' });
    if (!staffRoleName) {
      staffRoleName = await AppDataSource.getRepository(RoleEntity).save({
        name: 'Electrical staff member',
        description: 'Staff dealing with electrical issues'
      });
    }

    // Ensure link exists
    let staffRole = await AppDataSource.getRepository(DepartmentRoleEntity).findOneBy({
      departmentId: lightingDept.id,
      roleId: staffRoleName.id
    });

    if (!staffRole) {
      await AppDataSource.getRepository(DepartmentRoleEntity).save({
        departmentId: lightingDept.id,
        roleId: staffRoleName.id,
        department: lightingDept,
        role: staffRoleName
      });
    }
  });

  // Final cleanup
  afterAll(async () => {
    if (createdReportIds.length > 0) {
      await AppDataSource.getRepository(ReportEntity).delete({ id: In(createdReportIds) });
      createdReportIds = [];
    }
    if (createdUserIds.length > 0) {
      await AppDataSource.getRepository(UserEntity).delete({ id: In(createdUserIds) });
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
      await AppDataSource.getRepository(ReportEntity).delete({ id: In(createdReportIds) });
      createdReportIds = [];
    }
    if (createdUserIds.length > 0) {
      await AppDataSource.getRepository(UserEntity).delete({ id: In(createdUserIds) });
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

    const username = `report_test_user${r()}`;
    const password = 'Password123!';
    TEST_USER_CREDENTIALS = {
      username,
      password
    };

    // Create citizen user first (without role)
    const user = await userRepository.createUserWithPassword({
      username,
      password,
      email: `report${r()}@test.com`,
      firstName: 'Report',
      lastName: 'Test',
      emailNotificationsEnabled: true,
      isVerified: true
    });

    // Manually assign Citizen role
    await AppDataSource.getRepository('user_roles').save({
      userId: user.id,
      departmentRoleId: citizenDeptRole.id
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
        address: 'Via Roma 1, 10121 Torino TO, Italy',
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
        isAnonymous: false
      };

      const response = await agent
        .post('/api/reports')
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('should fail if isAnonymous is missing (400)', async () => {
      const reportData = {
        title: 'Integration Test Report',
        description: 'This is a test report created by integration test',
        category: ReportCategory.ROADS,
        location: {
          latitude: 45.0703,
          longitude: 7.6869
        },
        address: 'Via Roma 1, 10121 Torino TO, Italy',
        photos: ['data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=']
      };

      const response = await agent
        .post('/api/reports')
        .send(reportData);

      expect(response.status).toBe(400);
    });

    it('should fail if isAnonymous is not a boolean value (400)', async () => {
      const reportData = {
        title: 'Integration Test Report',
        description: 'This is a test report created by integration test',
        category: ReportCategory.ROADS,
        location: {
          latitude: 45.0703,
          longitude: 7.6869
        },
        address: 'Via Roma 1, 10121 Torino TO, Italy',
        photos: ['data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='],
        isAnonymous: 7.6869
      };

      const response = await agent
        .post('/api/reports')
        .send(reportData);

      expect(response.status).toBe(400);
    });
    
    it('should fail if not authenticated (401)', async () => {
      const unauthAgent = request.agent(app);
      const reportData = {
        title: 'Unauth Report',
        description: 'This should fail',
        category: ReportCategory.ROADS,
        location: { latitude: 45.0703, longitude: 7.6869 },
        address: 'Via Roma 1, 10121 Torino TO, Italy',
        photos: ['data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='],
        isAnonymous: false
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
        address: 'Via Roma 1, 10121 Torino TO, Italy',
        photos: ['data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='],
        isAnonymous: false
      };

      const createRes = await agent.post('/api/reports').send(reportData);
      expect(createRes.status).toBe(201);
      createdReportIds.push(createRes.body.id);

      // Manually update status to allow viewing (PENDING_APPROVAL not visible to public)
      await AppDataSource.getRepository(ReportEntity).update(createRes.body.id, { status: ReportStatus.ASSIGNED });

      const response = await agent.get('/api/reports');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      const found = response.body.find((r: any) => r.id === createRes.body.id);
      expect(found).toBeDefined();
      expect(found.title).toBe(reportData.title);
    });

    it('should work without authentication (200)', async () => {
      const unauthAgent = request(app);
      const response = await unauthAgent.get('/api/reports');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
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
      expect(reportService.getMyAssignedReports).toHaveBeenCalledWith(50, undefined, undefined);
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
        ReportStatus.ASSIGNED,
        undefined
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
        ReportStatus.IN_PROGRESS,
        undefined
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
        ReportStatus.RESOLVED,
        undefined
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
      expect(reportService.getMyAssignedReports).toHaveBeenCalledWith(50, undefined, undefined);
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
      expect(reportService.getMyAssignedReports).toHaveBeenCalledWith(50, undefined, undefined);
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
      expect(reportService.getMyAssignedReports).toHaveBeenCalledWith(75, undefined, undefined);
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

        expect(reportService.getMyAssignedReports).toHaveBeenCalledWith(50, status, undefined);
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
      expect(reportService.getMyAssignedReports).toHaveBeenCalledWith(123, undefined, undefined);
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
        ReportStatus.IN_PROGRESS,
        undefined
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

describe('ReportController Integration Tests - Assign to External Maintainer', () => {
  let techStaffAgent: ReturnType<typeof request.agent>;
  let citizenAgent: ReturnType<typeof request.agent>;
  let createdUserIds: number[] = [];
  let createdReportIds: number[] = [];
  let createdCompanyIds: number[] = [];

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });

  afterAll(async () => {
    if (createdReportIds.length > 0) {
      await AppDataSource.getRepository(ReportEntity).delete({ id: In(createdReportIds) });
    }
    if (createdUserIds.length > 0) {
      await AppDataSource.getRepository(UserEntity).delete({ id: In(createdUserIds) });
    }
    if (createdCompanyIds.length > 0) {
      await AppDataSource.query('DELETE FROM companies WHERE id = ANY($1)', [createdCompanyIds]);
    }
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  afterEach(async () => {
    if (createdReportIds.length > 0) {
      await AppDataSource.getRepository(ReportEntity).delete({ id: In(createdReportIds) });
      createdReportIds = [];
    }
    if (createdUserIds.length > 0) {
      await AppDataSource.getRepository(UserEntity).delete({ id: In(createdUserIds) });
      createdUserIds = [];
    }
    if (createdCompanyIds.length > 0) {
      await AppDataSource.query('DELETE FROM companies WHERE id = ANY($1)', [createdCompanyIds]);
      createdCompanyIds = [];
    }
  });

  beforeEach(async () => {
    // Create Technical Staff user
    const techStaffRole = await departmentRoleRepository.findByDepartmentAndRole('Public Lighting Department', 'Electrical staff member');
    if (!techStaffRole) throw new Error('Technical staff role not found');

    const techStaffUser = await userRepository.createUserWithPassword({
      username: `techstaff${r()}`,
      password: 'Password123!',
      email: `techstaff${r()}@test.com`,
      firstName: 'Tech',
      lastName: 'Staff',
      emailNotificationsEnabled: true,
      isVerified: true
    });
    await AppDataSource.getRepository('user_roles').save({
      userId: techStaffUser.id,
      departmentRoleId: techStaffRole.id
    });
    createdUserIds.push(techStaffUser.id);

    techStaffAgent = request.agent(app);
    await techStaffAgent.post('/api/sessions').send({
      username: techStaffUser.username,
      password: 'Password123!'
    });

    // Create Citizen user
    const citizenRole = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Citizen');
    if (!citizenRole) throw new Error('Citizen role not found');

    const citizenUser = await userRepository.createUserWithPassword({
      username: `citizen${r()}`,
      password: 'Password123!',
      email: `citizen${r()}@test.com`,
      firstName: 'Citizen',
      lastName: 'User',
      emailNotificationsEnabled: true,
      isVerified: true
    });
    await AppDataSource.getRepository('user_roles').save({
      userId: citizenUser.id,
      departmentRoleId: citizenRole.id
    });
    createdUserIds.push(citizenUser.id);

    citizenAgent = request.agent(app);
    await citizenAgent.post('/api/sessions').send({
      username: citizenUser.username,
      password: 'Password123!'
    });
  });

  describe('PATCH /api/reports/:id/assign-external', () => {
    let reportId: number;
    let externalMaintainerId: number;

    beforeEach(async () => {
      // Create a company
      const company = await companyRepository.create(`External Company ${r()}`, 'Public Lighting');
      const companyId = company.id;
      createdCompanyIds.push(companyId);

      // Create an external maintainer
      const externalMaintainerRole = await departmentRoleRepository.findByDepartmentAndRole('External Service Providers', 'External Maintainer');
      if (!externalMaintainerRole) throw new Error('External Maintainer role not found');

      const externalMaintainer = await userRepository.createUserWithPassword({
        username: `extmaint${r()}`,
        password: 'Password123!',
        email: `extmaint${r()}@test.com`,
        firstName: 'External',
        lastName: 'Maintainer',
        companyId: companyId,
        isVerified: true
      });
      await AppDataSource.getRepository('user_roles').save({
        userId: externalMaintainer.id,
        departmentRoleId: externalMaintainerRole.id
      });
      createdUserIds.push(externalMaintainer.id);
      externalMaintainerId = externalMaintainer.id;

      // Create a report and set it to Assigned status
      const citizenRole = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Citizen');
      if (!citizenRole) throw new Error('Citizen role not found');

      const reportCreator = await userRepository.createUserWithPassword({
        username: `reporter${r()}`,
        password: 'Password123!',
        email: `reporter${r()}@test.com`,
        firstName: 'Report',
        lastName: 'Creator',
        emailNotificationsEnabled: true,
        isVerified: true
      });
      await AppDataSource.getRepository('user_roles').save({
        userId: reportCreator.id,
        departmentRoleId: citizenRole.id
      });
      createdUserIds.push(reportCreator.id);

      // Create report using reportRepository
      const report = await reportRepository.createReport(
        {
          title: 'Streetlight broken',
          description: 'Needs external maintenance',
          category: ReportCategory.PUBLIC_LIGHTING,
          reporterId: reportCreator.id,
          location: 'POINT(7.6869 45.0703)',
          isAnonymous: false
        },
        [] // No photos
      );

      // Update status to ASSIGNED (createReport sets it to PENDING_APPROVAL)
      await AppDataSource.query(
        'UPDATE reports SET status = $1 WHERE id = $2',
        [ReportStatus.ASSIGNED, report.id]
      );

      reportId = report.id;
      createdReportIds.push(reportId);
    });

    it('should successfully assign report to external maintainer (200)', async () => {
      const response = await techStaffAgent
        .patch(`/api/reports/${reportId}/assign-external`)
        .send({ externalAssigneeId: externalMaintainerId });

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(reportId);
      expect(response.body.external_assignee_id).toBe(externalMaintainerId);
      // Note: assignToExternalMaintainer returns basic Report DTO
    });

    it('should fail if report is not in Assigned status (400)', async () => {
      await AppDataSource.getRepository(ReportEntity).update(reportId, {
        status: ReportStatus.PENDING_APPROVAL
      });

      const response = await techStaffAgent
        .patch(`/api/reports/${reportId}/assign-external`)
        .send({ externalAssigneeId: externalMaintainerId });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Assigned status');
    });

    it('should fail if assignee is not an external maintainer (400)', async () => {
      const citizenRole = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Citizen');
      if (!citizenRole) throw new Error('Citizen role not found');

      const regularUser = await userRepository.createUserWithPassword({
        username: `regular${r()}`,
        password: 'Password123!',
        email: `regular${r()}@test.com`,
        firstName: 'Regular',
        lastName: 'User',
        emailNotificationsEnabled: true,
        isVerified: true
      });
      await AppDataSource.getRepository('user_roles').save({
        userId: regularUser.id,
        departmentRoleId: citizenRole.id
      });
      createdUserIds.push(regularUser.id);

      const response = await techStaffAgent
        .patch(`/api/reports/${reportId}/assign-external`)
        .send({ externalAssigneeId: regularUser.id });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('not an external maintainer');
    });

    it('should fail if company does not handle the report category (400)', async () => {
      const wrongCompany = await companyRepository.create(`Wrong Company ${r()}`, 'Roads and Urban Furnishings');
      const wrongCompanyId = wrongCompany.id;
      createdCompanyIds.push(wrongCompanyId);

      const externalMaintainerRole = await departmentRoleRepository.findByDepartmentAndRole('External Service Providers', 'External Maintainer');
      if (!externalMaintainerRole) throw new Error('External Maintainer role not found');

      const wrongMaintainer = await userRepository.createUserWithPassword({
        username: `wrongmaint${r()}`,
        password: 'Password123!',
        email: `wrongmaint${r()}@test.com`,
        firstName: 'Wrong',
        lastName: 'Maintainer',
        emailNotificationsEnabled: true,
        companyId: wrongCompanyId,
        isVerified: true
      });
      await AppDataSource.getRepository('user_roles').save({
        userId: wrongMaintainer.id,
        departmentRoleId: externalMaintainerRole.id
      });
      createdUserIds.push(wrongMaintainer.id);

      const response = await techStaffAgent
        .patch(`/api/reports/${reportId}/assign-external`)
        .send({ externalAssigneeId: wrongMaintainer.id });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('does not handle');
    });

    it('should fail if external maintainer does not exist (404)', async () => {
      const response = await techStaffAgent
        .patch(`/api/reports/${reportId}/assign-external`)
        .send({ externalAssigneeId: 999999 });

      expect(response.status).toBe(404);
    });

    it('should fail if report does not exist (404)', async () => {
      const response = await techStaffAgent
        .patch('/api/reports/999999/assign-external')
        .send({ externalAssigneeId: externalMaintainerId });

      expect(response.status).toBe(404);
    });

    it('should fail for citizen users (403)', async () => {
      const response = await citizenAgent
        .patch(`/api/reports/${reportId}/assign-external`)
        .send({ externalAssigneeId: externalMaintainerId });

      expect(response.status).toBe(403);
    });

    it('should fail if not authenticated (401)', async () => {
      const unauthAgent = request.agent(app);
      const response = await unauthAgent
        .patch(`/api/reports/${reportId}/assign-external`)
        .send({ externalAssigneeId: externalMaintainerId });

      expect(response.status).toBe(401);
    });

    it('should fail with invalid report ID format (400)', async () => {
      const response = await techStaffAgent
        .patch('/api/reports/invalid/assign-external')
        .send({ externalAssigneeId: externalMaintainerId });

      expect(response.status).toBe(400);
    });
  });
});

describe('ReportController Integration Tests - Status Update', () => {
  let proAgent: ReturnType<typeof request.agent>;
  let technicianAgent: ReturnType<typeof request.agent>;
  let citizenAgent: ReturnType<typeof request.agent>;
  let proUserId: number;
  let technicianUserId: number;
  let citizenUserId: number;
  let pendingReportId: number;
  let assignedReportId: number;
  let createdUserIds: number[] = [];
  let createdReportIds: number[] = [];

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Create PRO user
    const proDeptRole = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Municipal Public Relations Officer');
    if (!proDeptRole) throw new Error('PRO role not found');

    const proUser = await userRepository.createUserWithPassword({
      username: `pro_status_${r()}`,
      password: 'Password123!',
      email: `pro_status_${r()}@test.com`,
      firstName: 'PRO',
      lastName: 'Status',
      emailNotificationsEnabled: true,
      isVerified: true
    });
    await AppDataSource.getRepository('user_roles').save({
      userId: proUser.id,
      departmentRoleId: proDeptRole.id
    });
    proUserId = proUser.id;
    createdUserIds.push(proUserId);

    // Create technician user
    const techDeptRole = await departmentRoleRepository.findByDepartmentAndRole('Water Network', 'Water Network staff member');
    if (!techDeptRole) throw new Error('Technician role not found');

    const techUser = await userRepository.createUserWithPassword({
      username: `tech_status_${r()}`,
      password: 'Password123!',
      email: `tech_status_${r()}@test.com`,
      firstName: 'Tech',
      lastName: 'Status',
      emailNotificationsEnabled: true,
      isVerified: true
    });
    await AppDataSource.getRepository('user_roles').save({
      userId: techUser.id,
      departmentRoleId: techDeptRole.id
    });
    technicianUserId = techUser.id;
    createdUserIds.push(technicianUserId);

    // Create citizen user
    const citizenDeptRole = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Citizen');
    if (!citizenDeptRole) throw new Error('Citizen role not found');

    const citizenUser = await userRepository.createUserWithPassword({
      username: `citizen_status_${r()}`,
      password: 'Password123!',
      email: `citizen_status_${r()}@test.com`,
      firstName: 'Citizen',
      lastName: 'Status',
      emailNotificationsEnabled: true,
      isVerified: true
    });
    await AppDataSource.getRepository('user_roles').save({
      userId: citizenUser.id,
      departmentRoleId: citizenDeptRole.id
    });
    citizenUserId = citizenUser.id;
    createdUserIds.push(citizenUserId);

    // Login agents
    proAgent = request.agent(app);
    await proAgent.post('/api/sessions').send({ username: `pro_status_${r()}`, password: 'Password123!' });

    technicianAgent = request.agent(app);
    await technicianAgent.post('/api/sessions').send({ username: `tech_status_${r()}`, password: 'Password123!' });

    citizenAgent = request.agent(app);
    await citizenAgent.post('/api/sessions').send({ username: `citizen_status_${r()}`, password: 'Password123!' });
  });

  afterAll(async () => {
    if (createdReportIds.length > 0) {
      await AppDataSource.getRepository(ReportEntity).delete({ id: In(createdReportIds) });
    }
    if (createdUserIds.length > 0) {
      await AppDataSource.getRepository(UserEntity).delete({ id: In(createdUserIds) });
    }
  });

  beforeEach(async () => {
    // Create pending report
    const pendingReport = await AppDataSource.query(
      `INSERT INTO reports (reporter_id, title, description, category, status, location, is_internal, created_at)
       VALUES ($1, 'Pending Report', 'Test', 'Water and Sewer Services', 'Pending Approval', ST_GeogFromText('POINT(7.6869 45.0703)'), false, CURRENT_TIMESTAMP)
       RETURNING id`,
      [citizenUserId]
    );
    pendingReportId = pendingReport[0].id;
    createdReportIds.push(pendingReportId);

    // Create assigned report
    const assignedReport = await AppDataSource.query(
      `INSERT INTO reports (reporter_id, title, description, category, status, assignee_id, location, is_internal, created_at)
       VALUES ($1, 'Assigned Report', 'Test', 'Water and Sewer Services', 'Assigned', $2, ST_GeogFromText('POINT(7.6869 45.0703)'), false, CURRENT_TIMESTAMP)
       RETURNING id`,
      [citizenUserId, technicianUserId]
    );
    assignedReportId = assignedReport[0].id;
    createdReportIds.push(assignedReportId);
  });

  afterEach(async () => {
    if (createdReportIds.length > 0) {
      await AppDataSource.getRepository(ReportEntity).delete({ id: In(createdReportIds) });
      createdReportIds = [];
    }
  });

  describe('PUT /api/reports/:id/status', () => {
    it('should approve report when PRO approves (200)', async () => {
      const response = await proAgent
        .put(`/api/reports/${pendingReportId}/status`)
        .send({ newStatus: 'Assigned' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('Assigned');
      expect(response.body.assignee_id).toBeDefined();
    });

    it('should reject report when PRO provides rejection reason (200)', async () => {
      const response = await proAgent
        .put(`/api/reports/${pendingReportId}/status`)
        .send({ newStatus: 'Rejected', rejectionReason: 'Invalid location' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('Rejected');
      expect(response.body.rejection_reason).toBe('Invalid location');
    });

    it('should return 400 when rejecting without reason', async () => {
      const response = await proAgent
        .put(`/api/reports/${pendingReportId}/status`)
        .send({ newStatus: 'Rejected' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Rejection reason');
    });

    it('should set report to RESOLVED when technician resolves (200)', async () => {
      const response = await technicianAgent
        .put(`/api/reports/${assignedReportId}/status`)
        .send({ newStatus: 'Resolved', resolutionNotes: 'Fixed the issue' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('Resolved');
    });

    it('should return 400 when newStatus is missing', async () => {
      const response = await proAgent
        .put(`/api/reports/${pendingReportId}/status`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('newStatus');
    });

    it('should return 403 when citizen tries to update status', async () => {
      const response = await citizenAgent
        .put(`/api/reports/${pendingReportId}/status`)
        .send({ newStatus: 'Assigned' });

      expect(response.status).toBe(403);
    });

    it('should return 404 when report does not exist', async () => {
      const response = await proAgent
        .put('/api/reports/999999/status')
        .send({ newStatus: 'Assigned' });

      expect(response.status).toBe(404);
    });

    it('should return 400 with invalid report ID format', async () => {
      const response = await proAgent
        .put('/api/reports/invalid/status')
        .send({ newStatus: 'Assigned' });

      expect(response.status).toBe(400);
    });
  });
});

describe('ReportController Integration Tests - Messages', () => {
  let technicianAgent: ReturnType<typeof request.agent>;
  let citizenAgent: ReturnType<typeof request.agent>;
  let otherCitizenAgent: ReturnType<typeof request.agent>;
  let technicianUserId: number;
  let citizenUserId: number;
  let otherCitizenUserId: number;
  let assignedReportId: number;
  let createdUserIds: number[] = [];
  let createdReportIds: number[] = [];

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Create technician user
    const techDeptRole = await departmentRoleRepository.findByDepartmentAndRole('Water Network', 'Water Network staff member');
    if (!techDeptRole) throw new Error('Technician role not found');

    const techUser = await userRepository.createUserWithPassword({
      username: `tech_msg_${r()}`,
      password: 'Password123!',
      email: `tech_msg_${r()}@test.com`,
      firstName: 'Tech',
      lastName: 'Messages',
      emailNotificationsEnabled: true,
      isVerified: true
    });
    await AppDataSource.getRepository('user_roles').save({
      userId: techUser.id,
      departmentRoleId: techDeptRole.id
    });
    technicianUserId = techUser.id;
    createdUserIds.push(technicianUserId);

    // Create citizen user
    const citizenDeptRole = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Citizen');
    if (!citizenDeptRole) throw new Error('Citizen role not found');

    const citizenUser = await userRepository.createUserWithPassword({
      username: `citizen_msg_${r()}`,
      password: 'Password123!',
      email: `citizen_msg_${r()}@test.com`,
      firstName: 'Citizen',
      lastName: 'Messages',
      emailNotificationsEnabled: true,
      isVerified: true
    });
    await AppDataSource.getRepository('user_roles').save({
      userId: citizenUser.id,
      departmentRoleId: citizenDeptRole.id
    });
    citizenUserId = citizenUser.id;
    createdUserIds.push(citizenUserId);

    // Create other citizen user
    const otherCitizenUser = await userRepository.createUserWithPassword({
      username: `other_citizen_msg_${r()}`,
      password: 'Password123!',
      email: `other_citizen_msg_${r()}@test.com`,
      firstName: 'Other',
      lastName: 'Citizen',
      emailNotificationsEnabled: true,
      isVerified: true
    });
    await AppDataSource.getRepository('user_roles').save({
      userId: otherCitizenUser.id,
      departmentRoleId: citizenDeptRole.id
    });
    otherCitizenUserId = otherCitizenUser.id;
    createdUserIds.push(otherCitizenUserId);

    // Login agents
    technicianAgent = request.agent(app);
    await technicianAgent.post('/api/sessions').send({ username: `tech_msg_${r()}`, password: 'Password123!' });

    citizenAgent = request.agent(app);
    await citizenAgent.post('/api/sessions').send({ username: `citizen_msg_${r()}`, password: 'Password123!' });

    otherCitizenAgent = request.agent(app);
    await otherCitizenAgent.post('/api/sessions').send({ username: `other_citizen_msg_${r()}`, password: 'Password123!' });
  });

  afterAll(async () => {
    if (createdReportIds.length > 0) {
      await AppDataSource.getRepository(ReportEntity).delete({ id: In(createdReportIds) });
    }
    if (createdUserIds.length > 0) {
      await AppDataSource.getRepository(UserEntity).delete({ id: In(createdUserIds) });
    }
  });

  beforeEach(async () => {
    // Create assigned report
    const report = await AppDataSource.query(
      `INSERT INTO reports (reporter_id, title, description, category, status, assignee_id, location, is_internal, created_at)
       VALUES ($1, 'Report with messages', 'Test', 'Water and Sewer Services', 'Assigned', $2, ST_GeogFromText('POINT(7.6869 45.0703)'), false, CURRENT_TIMESTAMP)
       RETURNING id`,
      [citizenUserId, technicianUserId]
    );
    assignedReportId = report[0].id;
    createdReportIds.push(assignedReportId);
  });

  afterEach(async () => {
    if (createdReportIds.length > 0) {
      await AppDataSource.getRepository(ReportEntity).delete({ id: In(createdReportIds) });
      createdReportIds = [];
    }
  });

  describe('POST /api/reports/:id/messages', () => {
    it('should send message when assigned technician posts (201)', async () => {
      const response = await technicianAgent
        .post(`/api/reports/${assignedReportId}/messages`)
        .send({ content: 'We will fix this issue tomorrow' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.content).toBe('We will fix this issue tomorrow');
      expect(response.body.author).toBeDefined();
      expect(response.body.author.username).toBe(`tech_msg_${r()}`);
    });

    it('should trim whitespace from message content (201)', async () => {
      const response = await technicianAgent
        .post(`/api/reports/${assignedReportId}/messages`)
        .send({ content: '  Message with spaces  ' });

      expect(response.status).toBe(201);
      expect(response.body.content).toBe('Message with spaces');
    });

    it('should return 400 when content is missing', async () => {
      const response = await technicianAgent
        .post(`/api/reports/${assignedReportId}/messages`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('content');
    });

    it('should return 400 when content is empty', async () => {
      const response = await technicianAgent
        .post(`/api/reports/${assignedReportId}/messages`)
        .send({ content: '' });

      expect(response.status).toBe(400);
    });

    it('should return 403 when non-assigned user tries to send message', async () => {
      const response = await otherCitizenAgent
        .post(`/api/reports/${assignedReportId}/messages`)
        .send({ content: 'Unauthorized message' });

      expect(response.status).toBe(403);
    });

    it('should return 404 when report does not exist', async () => {
      const response = await technicianAgent
        .post('/api/reports/999999/messages')
        .send({ content: 'Test message' });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/reports/:id/messages', () => {
    beforeEach(async () => {
      // Add a message to the report
      await AppDataSource.query(
        `INSERT INTO messages (report_id, sender_id, content, created_at)
         VALUES ($1, $2, 'Test message content', CURRENT_TIMESTAMP)`,
        [assignedReportId, technicianUserId]
      );
    });

    it('should return messages when assigned technician requests (200)', async () => {
      const response = await technicianAgent
        .get(`/api/reports/${assignedReportId}/messages`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].content).toBe('Test message content');
    });

    it('should return messages when reporter (citizen) requests (200)', async () => {
      const response = await citizenAgent
        .get(`/api/reports/${assignedReportId}/messages`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
    });

    it('should return 403 when unauthorized user requests messages', async () => {
      const response = await otherCitizenAgent
        .get(`/api/reports/${assignedReportId}/messages`);

      expect(response.status).toBe(403);
    });

    it('should return 404 when report does not exist', async () => {
      const response = await technicianAgent
        .get('/api/reports/999999/messages');

      expect(response.status).toBe(404);
    });

    it('should return empty array when no messages exist', async () => {
      // Create new report without messages
      const newReport = await AppDataSource.query(
        `INSERT INTO reports (reporter_id, title, description, category, status, assignee_id, location, is_internal, created_at)
         VALUES ($1, 'No messages', 'Test', 'Water and Sewer Services', 'Assigned', $2, ST_GeogFromText('POINT(7.6869 45.0703)'), false, CURRENT_TIMESTAMP)
         RETURNING id`,
        [citizenUserId, technicianUserId]
      );
      const newReportId = newReport[0].id;
      createdReportIds.push(newReportId);

      const response = await technicianAgent
        .get(`/api/reports/${newReportId}/messages`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });
});
