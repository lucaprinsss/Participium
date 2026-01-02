import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { departmentRoleRepository } from '../../../repositories/departmentRoleRepository';
import { BadRequestError } from '../../../models/errors/BadRequestError';
import { NotFoundError } from '../../../models/errors/NotFoundError';
import { In } from 'typeorm';
import { AppDataSource } from '@database/connection';
import { reportService } from '@services/reportService';
import { reportRepository } from '@repositories/reportRepository';
import { userRepository } from '@repositories/userRepository';
import { departmentRepository } from '@repositories/departmentRepository';
import { companyRepository } from '@repositories/companyRepository';
import { ReportStatus } from '@models/dto/ReportStatus';
import { ReportCategory } from '@models/dto/ReportCategory';
import { UserEntity } from '@models/entity/userEntity';
import { ReportEntity } from '@models/entity/reportEntity';
import { DepartmentEntity } from '@models/entity/departmentEntity';
import { RoleEntity } from '@models/entity/roleEntity';
import { DepartmentRoleEntity } from '@models/entity/departmentRoleEntity';

// Mock storage service to avoid actual file I/O
jest.mock('../../../services/storageService', () => ({
  storageService: {
    uploadPhoto: jest.fn<() => Promise<string>>().mockResolvedValue('uploads/reports/1/mock_photo.jpg'),
    deleteReportPhotos: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  }
}));

const r = () => `_${Math.floor(Math.random() * 1000000)}`;

describe('ReportService Integration Tests', () => {
  let createdUserIds: number[] = [];
  let createdReportIds: number[] = [];

  let citizenUser: UserEntity;
  let officerUser: UserEntity;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });

  afterAll(async () => {
    if (createdReportIds.length > 0) {
      await (reportRepository as any)['repository'].delete({ id: In(createdReportIds) });
    }
    if (createdUserIds.length > 0) {
      await (userRepository as any)['repository'].delete({ id: In(createdUserIds) });
    }
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  afterEach(async () => {
    if (createdReportIds.length > 0) {
      await (reportRepository as any)['repository'].delete({ id: In(createdReportIds) });
      createdReportIds = [];
    }
    if (createdUserIds.length > 0) {
      await (userRepository as any)['repository'].delete({ id: In(createdUserIds) });
      createdUserIds = [];
    }
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    // Create Citizen
    const citizenRole = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Citizen');
    citizenUser = await userRepository.createUserWithPassword({
      username: `citizen${r()}`,
      password: 'Password123!',
      email: `citizen${r()}@test.com`,
      firstName: 'Citizen',
      lastName: 'Test',
      isVerified: true,
      telegramLinkConfirmed: false,
    });
    await AppDataSource.query(
      `INSERT INTO user_roles (user_id, department_role_id) VALUES ($1, $2)`,
      [citizenUser.id, citizenRole!.id]
    );
    createdUserIds.push(citizenUser.id);

    // Create Officer
    const officerRole = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Municipal Public Relations Officer');
    officerUser = await userRepository.createUserWithPassword({
      username: `officer${r()}`,
      password: 'Password123!',
      email: `officer${r()}@test.com`,
      firstName: 'Officer',
      lastName: 'Test',
      isVerified: true,
      telegramLinkConfirmed: false,
    });
    await AppDataSource.query(
      `INSERT INTO user_roles (user_id, department_role_id) VALUES ($1, $2)`,
      [officerUser.id, officerRole!.id]
    );
    createdUserIds.push(officerUser.id);
  });

  const VALID_PHOTO = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

  describe('createReport', () => {
    it('should create a valid report', async () => {
      const reportData = {
        title: 'Test Report',
        description: 'Description',
        category: ReportCategory.ROADS,
        location: { latitude: 45.0703, longitude: 7.6869 }, // Turin
        photos: [VALID_PHOTO],
        isAnonymous: false
      };

      const result = await reportService.createReport(reportData, citizenUser.id);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.title).toBe(reportData.title);
      expect(result.status).toBe(ReportStatus.PENDING_APPROVAL);

      createdReportIds.push(result.id);

      // Verify DB
      const saved = await reportRepository.findReportById(result.id);
      expect(saved).toBeDefined();
      expect(saved?.title).toBe(reportData.title);
    });

    it('should throw BadRequestError if location is outside Turin', async () => {
      const reportData = {
        title: 'Outside Turin',
        description: 'Description',
        category: ReportCategory.ROADS,
        location: { latitude: 41.9028, longitude: 12.4964 }, // Rome
        photos: [VALID_PHOTO],
        isAnonymous: false
      };

      await expect(reportService.createReport(reportData, citizenUser.id))
        .rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError if photos are invalid (empty)', async () => {
      const reportData = {
        title: 'No Photos',
        description: 'Description',
        category: ReportCategory.ROADS,
        location: { latitude: 45.0703, longitude: 7.6869 },
        photos: [], // Empty
        isAnonymous: false
      };

      await expect(reportService.createReport(reportData, citizenUser.id))
        .rejects.toThrow(BadRequestError);
    });
  });

  describe('getAllReports', () => {
    it('should return reports visible to Citizen (excluding Pending)', async () => {
      // Create a pending report (by Citizen)
      const r1 = await reportService.createReport({
        title: 'Pending Report',
        description: 'Desc',
        category: ReportCategory.ROADS,
        location: { latitude: 45.0703, longitude: 7.6869 },
        photos: [VALID_PHOTO],
        isAnonymous: false
      }, citizenUser.id);
      createdReportIds.push(r1.id);

      // Create an assigned report (manually update status)
      const r2 = await reportService.createReport({
        title: 'Assigned Report',
        description: 'Desc',
        category: ReportCategory.WASTE,
        location: { latitude: 45.0703, longitude: 7.6869 },
        photos: [VALID_PHOTO],
        isAnonymous: false
      }, citizenUser.id);
      createdReportIds.push(r2.id);

      await reportRepository['repository'].update(r2.id, { status: ReportStatus.ASSIGNED });

      // Act
      const results = await reportService.getAllReports(citizenUser.id);

      // Assert
      expect(results.some(r => r.id === r2.id)).toBe(true);
      expect(results.some(r => r.id === r1.id)).toBe(false); // Citizen can't see Pending
    });

    it('should return all reports to Officer (including Pending)', async () => {
      // Create a pending report
      const r1 = await reportService.createReport({
        title: 'Pending Report',
        description: 'Desc',
        category: ReportCategory.ROADS,
        location: { latitude: 45.0703, longitude: 7.6869 },
        photos: [VALID_PHOTO],
        isAnonymous: false
      }, citizenUser.id);
      createdReportIds.push(r1.id);

      // Act
      const results = await reportService.getAllReports(officerUser.id);

      // Assert
      expect(results.some(r => r.id === r1.id)).toBe(true);
    });

    it('should filter by category', async () => {
      const r1 = await reportService.createReport({
        title: 'Roads',
        description: 'Desc',
        category: ReportCategory.ROADS,
        location: { latitude: 45.0703, longitude: 7.6869 },
        photos: [VALID_PHOTO],
        isAnonymous: false
      }, citizenUser.id);
      createdReportIds.push(r1.id);
      await reportRepository['repository'].update(r1.id, { status: ReportStatus.ASSIGNED });

      const r2 = await reportService.createReport({
        title: 'Waste',
        description: 'Desc',
        category: ReportCategory.WASTE,
        location: { latitude: 45.0703, longitude: 7.6869 },
        photos: [VALID_PHOTO],
        isAnonymous: false
      }, citizenUser.id);
      createdReportIds.push(r2.id);
      await reportRepository['repository'].update(r2.id, { status: ReportStatus.ASSIGNED });

      const results = await reportService.getAllReports(citizenUser.id, undefined, ReportCategory.ROADS);

      expect(results.some(r => r.id === r1.id)).toBe(true);
      expect(results.some(r => r.id === r2.id)).toBe(false);
    });
  });
});

describe('ReportService Integration Tests - getMyAssignedReports', () => {
  let testTechnician: UserEntity;
  let testCitizen: UserEntity;
  let testRoadStaff: UserEntity;
  let publicLightingDepartment: DepartmentEntity;
  let electricalStaffDeptRoleId: number;
  let citizenDeptRoleId: number;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Find Public Lighting Department
    publicLightingDepartment = await departmentRepository.findByName('Public Lighting Department') as DepartmentEntity;
    if (!publicLightingDepartment) {
      publicLightingDepartment = await AppDataSource.getRepository(DepartmentEntity).save({
        name: 'Public Lighting Department',
        description: 'Public Lighting'
      });
    }

    // Ensure Electrical staff member role exists
    let electRole = await AppDataSource.getRepository(RoleEntity).findOneBy({ name: 'Electrical staff member' });
    if (!electRole) {
      electRole = await AppDataSource.getRepository(RoleEntity).save({ name: 'Electrical staff member', description: 'Elec Staff' });
    }

    // Ensure link
    let electricalDeptRole = await AppDataSource.getRepository(DepartmentRoleEntity).findOneBy({
      departmentId: publicLightingDepartment.id,
      roleId: electRole.id
    });
    if (!electricalDeptRole) {
      electricalDeptRole = await AppDataSource.getRepository(DepartmentRoleEntity).save({
        departmentId: publicLightingDepartment.id,
        roleId: electRole.id
      });
    }
    electricalStaffDeptRoleId = electricalDeptRole.id;

    // Ensure Citizen role exists
    let citizenRole = await AppDataSource.getRepository(RoleEntity).findOneBy({ name: 'Citizen' });
    if (!citizenRole) {
      citizenRole = await AppDataSource.getRepository(RoleEntity).save({ name: 'Citizen', description: 'Citizen' });
    }
    // Ensure Org dept (might be created in first block or not)
    let orgDept = await AppDataSource.getRepository(DepartmentEntity).findOneBy({ name: 'Organization' });
    if (!orgDept) {
      orgDept = await AppDataSource.getRepository(DepartmentEntity).save({ name: 'Organization', description: 'Org' });
    }
    // Ensure link
    let citizenDeptRole = await AppDataSource.getRepository(DepartmentRoleEntity).findOneBy({
      departmentId: orgDept.id,
      roleId: citizenRole.id
    });
    if (!citizenDeptRole) {
      citizenDeptRole = await AppDataSource.getRepository(DepartmentRoleEntity).save({
        departmentId: orgDept.id,
        roleId: citizenRole.id
      });
    }
    citizenDeptRoleId = citizenDeptRole.id;

    // Create test citizen
    const citizenResult = await AppDataSource.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, email_notifications_enabled)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        `citizen.test.service_${Date.now()}`,
        `citizen.test.service_${Date.now()}@example.com`,
        '$2b$10$dummyHashForTesting',
        'Citizen',
        'Test',
        true
      ]
    );
    testCitizen = citizenResult[0];
    await AppDataSource.query(
      `INSERT INTO user_roles (user_id, department_role_id) VALUES ($1, $2)`,
      [testCitizen.id, citizenDeptRoleId]
    );

    // Create test technician
    const techResult = await AppDataSource.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, email_notifications_enabled)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        `tech.test.service_${Date.now()}`,
        `tech.test.service_${Date.now()}@comune.it`,
        '$2b$10$dummyHashForTesting',
        'Technician',
        'Service',
        true
      ]
    );
    testTechnician = techResult[0];
    await AppDataSource.query(
      `INSERT INTO user_roles (user_id, department_role_id) VALUES ($1, $2)`,
      [testTechnician.id, electricalStaffDeptRoleId]
    );

    // Find Public Infrastructure Department
    let publicInfrastructureDepartment = await departmentRepository.findByName('Public Infrastructure and Accessibility Department') as DepartmentEntity;
    if (!publicInfrastructureDepartment) {
      publicInfrastructureDepartment = await AppDataSource.getRepository(DepartmentEntity).save({
        name: 'Public Infrastructure and Accessibility Department',
        description: 'Infra Dept'
      });
    }

    // Ensure Road Maintenance staff member role exists
    let roadRole = await AppDataSource.getRepository(RoleEntity).findOneBy({ name: 'Road Maintenance staff member' });
    if (!roadRole) {
      roadRole = await AppDataSource.getRepository(RoleEntity).save({ name: 'Road Maintenance staff member', description: 'Road Staff' });
    }

    // Ensure link
    let roadDeptRole = await AppDataSource.getRepository(DepartmentRoleEntity).findOneBy({
      departmentId: publicInfrastructureDepartment.id,
      roleId: roadRole.id
    });
    if (!roadDeptRole) {
      roadDeptRole = await AppDataSource.getRepository(DepartmentRoleEntity).save({
        departmentId: publicInfrastructureDepartment.id,
        roleId: roadRole.id
      });
    }
    const roadStaffDeptRoleId = roadDeptRole.id;

    // Create test road staff
    const roadStaffResult = await AppDataSource.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, email_notifications_enabled)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        `road.test.service_${Date.now()}`,
        `road.test.service_${Date.now()}@comune.it`,
        '$2b$10$dummyHashForTesting',
        'Road',
        'Staff',
        true
      ]
    );
    testRoadStaff = roadStaffResult[0];
    await AppDataSource.query(
      `INSERT INTO user_roles (user_id, department_role_id) VALUES ($1, $2)`,
      [testRoadStaff.id, roadStaffDeptRoleId]
    );
  });

  afterAll(async () => {
    await AppDataSource.query(
      `DELETE FROM reports WHERE reporter_id IN ($1, $2, $3)`,
      [testCitizen.id, testTechnician.id, testRoadStaff.id]
    );
    await AppDataSource.query(
      `DELETE FROM users WHERE id IN ($1, $2, $3)`,
      [testCitizen.id, testTechnician.id, testRoadStaff.id]
    );
    await AppDataSource.destroy();
  });

  afterEach(async () => {
    await AppDataSource.query(
      `DELETE FROM reports WHERE reporter_id IN ($1, $2, $3)`,
      [testCitizen.id, testTechnician.id, testRoadStaff.id]
    );
  });

  describe('getMyAssignedReports', () => {
    it('should return all reports assigned to the technician', async () => {
      // Arrange
      await AppDataSource.query(
        `INSERT INTO reports 
          (reporter_id, title, description, category, location, status, assignee_id, is_anonymous, created_at) 
         VALUES ($1, $2, $3, $4, ST_GeogFromText($5), $6, $7, $8, $9)`,
        [
          testCitizen.id,
          'Street light broken',
          'Lamp not working',
          ReportCategory.PUBLIC_LIGHTING,
          'POINT(7.6869005 45.0703393)',
          ReportStatus.ASSIGNED,
          testTechnician.id,
          false,
          new Date('2024-01-01')
        ]
      );
      await AppDataSource.query(
        `INSERT INTO reports 
          (reporter_id, title, description, category, location, status, assignee_id, is_anonymous, created_at) 
         VALUES ($1, $2, $3, $4, ST_GeogFromText($5), $6, $7, $8, $9)`,
        [
          testCitizen.id,
          'Light maintenance needed',
          'Routine check',
          ReportCategory.PUBLIC_LIGHTING,
          'POINT(7.6932941 45.0692403)',
          ReportStatus.IN_PROGRESS,
          testTechnician.id,
          false,
          new Date('2024-01-02')
        ]
      );

      // Act
      const reports = await reportService.getMyAssignedReports(testTechnician.id);

      // Assert
      expect(reports).toHaveLength(2);
      expect(reports.map(r => r.title)).toContain('Street light broken');
      expect(reports.map(r => r.title)).toContain('Light maintenance needed');
      expect(reports.every(r => r.assigneeId === testTechnician.id)).toBe(true);
    });

    it('should return only ASSIGNED reports when status filter is ASSIGNED', async () => {
      // Arrange
      await AppDataSource.query(
        `INSERT INTO reports 
          (reporter_id, title, description, category, location, status, assignee_id, is_anonymous, created_at) 
         VALUES ($1, $2, $3, $4, ST_GeogFromText($5), $6, $7, $8, $9),
                ($1, $10, $11, $4, ST_GeogFromText($12), $13, $7, $8, $14)`,
        [
          testCitizen.id,
          'Assigned report',
          'Status is ASSIGNED',
          ReportCategory.PUBLIC_LIGHTING,
          'POINT(7.6869005 45.0703393)',
          ReportStatus.ASSIGNED,
          testTechnician.id,
          false,
          new Date('2024-01-01'),
          'In progress report',
          'Status is IN_PROGRESS',
          'POINT(7.6932941 45.0692403)',
          ReportStatus.IN_PROGRESS,
          new Date('2024-01-02')
        ]
      );

      // Act
      const reports = await reportService.getMyAssignedReports(testTechnician.id, ReportStatus.ASSIGNED);

      // Assert
      expect(reports).toHaveLength(1);
      expect(reports[0].title).toBe('Assigned report');
      expect(reports[0].status).toBe(ReportStatus.ASSIGNED);
    });

    it('should return only IN_PROGRESS reports when status filter is IN_PROGRESS', async () => {
      // Arrange
      await AppDataSource.query(
        `INSERT INTO reports 
          (reporter_id, title, description, category, location, status, assignee_id, is_anonymous, created_at) 
         VALUES ($1, $2, $3, $4, ST_GeogFromText($5), $6, $7, $8, $9),
                ($1, $10, $11, $4, ST_GeogFromText($12), $6, $7, $8, $13)`,
        [
          testCitizen.id,
          'In progress 1',
          'Working on it',
          ReportCategory.PUBLIC_LIGHTING,
          'POINT(7.6869005 45.0703393)',
          ReportStatus.IN_PROGRESS,
          testTechnician.id,
          false,
          new Date('2024-01-01'),
          'In progress 2',
          'Still working',
          'POINT(7.6932941 45.0692403)',
          new Date('2024-01-02')
        ]
      );

      // Act
      const reports = await reportService.getMyAssignedReports(testTechnician.id, ReportStatus.IN_PROGRESS);

      // Assert
      expect(reports).toHaveLength(2);
      expect(reports.every(r => r.status === ReportStatus.IN_PROGRESS)).toBe(true);
    });

    it('should return empty array when technician has no assigned reports', async () => {
      // No insert

      // Act
      const reports = await reportService.getMyAssignedReports(testTechnician.id);

      // Assert
      expect(reports).toHaveLength(0);
    });

    it('should return reports in chronological order (newest first)', async () => {
      // Arrange
      await AppDataSource.query(
        `INSERT INTO reports 
          (reporter_id, title, description, category, location, status, assignee_id, is_anonymous, created_at) 
         VALUES ($1, $2, $3, $4, ST_GeogFromText($5), $6, $7, $8, $9),
                ($1, $10, $11, $4, ST_GeogFromText($12), $6, $7, $8, $13),
                ($1, $14, $15, $4, ST_GeogFromText($16), $6, $7, $8, $17)`,
        [
          testCitizen.id,
          'Oldest report',
          'Created first',
          ReportCategory.PUBLIC_LIGHTING,
          'POINT(7.6869005 45.0703393)',
          ReportStatus.ASSIGNED,
          testTechnician.id,
          false,
          new Date('2024-01-01T10:00:00'),
          'Middle report',
          'Created second',
          'POINT(7.6932941 45.0692403)',
          new Date('2024-01-02T10:00:00'),
          'Newest report',
          'Created third',
          'POINT(7.6782069 45.0625748)',
          new Date('2024-01-03T10:00:00')
        ]
      );

      // Act
      const reports = await reportService.getMyAssignedReports(testTechnician.id);

      // Assert
      expect(reports).toHaveLength(3);
      expect(reports[0].title).toBe('Newest report');
      expect(reports[1].title).toBe('Middle report');
      expect(reports[2].title).toBe('Oldest report');
      expect(reports[0].createdAt.getTime()).toBeGreaterThan(reports[1].createdAt.getTime());
      expect(reports[1].createdAt.getTime()).toBeGreaterThan(reports[2].createdAt.getTime());
    });
  });

  // --- getAllReports ---
  describe('getAllReports', () => {
    let proUser: UserEntity;
    let citizenUser: UserEntity;
    let proUserDeptRoleId: number;

    beforeAll(async () => {
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
      }
      // Find PRO department_role_id
      const proDeptRoleArr = await AppDataSource.query(
        `SELECT dr.id
       FROM department_roles dr
       INNER JOIN departments d ON dr.department_id = d.id
       INNER JOIN roles r ON dr.role_id = r.id
       WHERE d.name = $1 AND r.name = $2`,
        ['Organization', 'Municipal Public Relations Officer']
      );
      if (!proDeptRoleArr || proDeptRoleArr.length === 0) {
        // Seed if missing
        // ... assuming seeded for now or add seeding
      }
      // ensure ID if found
      proUserDeptRoleId = proDeptRoleArr?.[0]?.id || 1; // Fallback or throw

      const proResult = await AppDataSource.query(
        `INSERT INTO users (username, email, password_hash, first_name, last_name, email_notifications_enabled)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
        [
          `pro.integration.test_${Date.now()}`,
          `pro.integration_${Date.now()}@comune.it`,
          '$2b$10$dummyHashForTesting',
          'PRO',
          'IntegrationTest',
          true
        ]
      );
      proUser = proResult[0];
      await AppDataSource.query(
        `INSERT INTO user_roles (user_id, department_role_id) VALUES ($1, $2)`,
        [proUser.id, proUserDeptRoleId]
      );
    });

    afterAll(async () => {
      await AppDataSource.query(
        `DELETE FROM reports WHERE reporter_id IN ($1, $2)`,
        [testCitizen.id, proUser.id]
      );
      await AppDataSource.query(
        `DELETE FROM users WHERE id = $1`,
        [proUser.id]
      );
    });

    beforeEach(async () => {
      // Clean ALL reports before each test to avoid interference from other test suites
      await AppDataSource.query(`DELETE FROM reports`);
    });

    afterEach(async () => {
      await AppDataSource.query(
        `DELETE FROM reports WHERE reporter_id IN ($1, $2)`,
        [testCitizen.id, proUser.id]
      );
    });

    it('should return all reports for non-PRO user excluding PENDING_APPROVAL', async () => {
      // Arrange
      await AppDataSource.query(
        `INSERT INTO reports 
          (reporter_id, title, description, category, location, status, is_anonymous, created_at) 
         VALUES ($1, $2, $3, $4, ST_GeogFromText($5), $6, $7, $8),
                ($1, $9, $10, $4, ST_GeogFromText($11), $12, $7, $13)`,
        [
          testCitizen.id,
          'Assigned Report',
          'This is assigned',
          ReportCategory.ROADS,
          'POINT(7.6869005 45.0703393)',
          ReportStatus.ASSIGNED,
          false,
          new Date('2024-01-01'),
          'Pending Report',
          'This is pending',
          'POINT(7.6932941 45.0692403)',
          ReportStatus.PENDING_APPROVAL,
          new Date('2024-01-02')
        ]
      );

      // Act
      const reports = await reportService.getAllReports(testTechnician.id);

      // Assert
      expect(reports.length).toBe(1);
      expect(reports[0].title).toBe('Assigned Report');
      expect(reports.every(r => r.status !== ReportStatus.PENDING_APPROVAL)).toBe(true);
    });

    it('should return all reports including PENDING_APPROVAL for PRO user', async () => {
      // Arrange
      await AppDataSource.query(
        `INSERT INTO reports 
          (reporter_id, title, description, category, location, status, is_anonymous, created_at) 
         VALUES ($1, $2, $3, $4, ST_GeogFromText($5), $6, $7, $8),
                ($1, $9, $10, $4, ST_GeogFromText($11), $12, $7, $13)`,
        [
          testCitizen.id,
          'Assigned Report',
          'This is assigned',
          ReportCategory.ROADS,
          'POINT(7.6869005 45.0703393)',
          ReportStatus.ASSIGNED,
          false,
          new Date('2024-01-01'),
          'Pending Report',
          'This is pending',
          'POINT(7.6932941 45.0692403)',
          ReportStatus.PENDING_APPROVAL,
          new Date('2024-01-02')
        ]
      );

      // Act
      const reports = await reportService.getAllReports(proUser.id);

      // Assert
      expect(reports.length).toBe(2);
      expect(reports.map(r => r.title)).toContain('Assigned Report');
      expect(reports.map(r => r.title)).toContain('Pending Report');
    });

    it('should filter by status PENDING_APPROVAL for PRO user', async () => {
      // Arrange
      await AppDataSource.query(
        `INSERT INTO reports 
          (reporter_id, title, description, category, location, status, is_anonymous, created_at) 
         VALUES ($1, $2, $3, $4, ST_GeogFromText($5), $6, $7, $8),
                ($1, $9, $10, $4, ST_GeogFromText($11), $12, $7, $13)`,
        [
          testCitizen.id,
          'Assigned Report',
          'This is assigned',
          ReportCategory.ROADS,
          'POINT(7.6869005 45.0703393)',
          ReportStatus.ASSIGNED,
          false,
          new Date('2024-01-01'),
          'Pending Report',
          'This is pending',
          'POINT(7.6932941 45.0692403)',
          ReportStatus.PENDING_APPROVAL,
          new Date('2024-01-02')
        ]
      );

      // Act
      const reports = await reportService.getAllReports(proUser.id, ReportStatus.PENDING_APPROVAL);

      // Assert
      expect(reports.length).toBe(1);
      expect(reports[0].title).toBe('Pending Report');
      expect(reports[0].status).toBe(ReportStatus.PENDING_APPROVAL);
    });

    it('should throw InsufficientRightsError if non-PRO user requests PENDING_APPROVAL', async () => {
      // Act & Assert
      await expect(
        reportService.getAllReports(testTechnician.id, ReportStatus.PENDING_APPROVAL)
      ).rejects.toThrow('Only Municipal Public Relations Officers can view pending reports');
    });

    it('should filter by category', async () => {
      // Arrange
      await AppDataSource.query(
        `INSERT INTO reports 
          (reporter_id, title, description, category, location, status, is_anonymous, created_at) 
         VALUES ($1, $2, $3, $4, ST_GeogFromText($5), $6, $7, $8),
                ($1, $9, $10, $11, ST_GeogFromText($12), $6, $7, $13)`,
        [
          testCitizen.id,
          'Roads Report',
          'Road issue',
          ReportCategory.ROADS,
          'POINT(7.6869005 45.0703393)',
          ReportStatus.ASSIGNED,
          false,
          new Date('2024-01-01'),
          'Lighting Report',
          'Light issue',
          ReportCategory.PUBLIC_LIGHTING,
          'POINT(7.6932941 45.0692403)',
          new Date('2024-01-02')
        ]
      );

      // Act
      const reports = await reportService.getAllReports(proUser.id, undefined, ReportCategory.ROADS);

      // Assert
      expect(reports.length).toBe(1);
      expect(reports[0].title).toBe('Roads Report');
      expect(reports[0].category).toBe(ReportCategory.ROADS);
    });
  });

  // --- updateReportStatus ---
  describe('updateReportStatus', () => {
    let proUser: UserEntity;
    let proUserDeptRoleId: number;
    let pendingReportId: number;

    beforeAll(async () => {
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
      }
      // Find PRO department_role_id
      const proDeptRoleArr = await AppDataSource.query(
        `SELECT dr.id
         FROM department_roles dr
         INNER JOIN departments d ON dr.department_id = d.id
         INNER JOIN roles r ON dr.role_id = r.id
         WHERE d.name = $1 AND r.name = $2`,
        ['Organization', 'Municipal Public Relations Officer']
      );
      if (!proDeptRoleArr || proDeptRoleArr.length === 0) {
        throw new Error('Municipal Public Relations Officer department_role not found');
      }
      proUserDeptRoleId = proDeptRoleArr[0].id;

      // Create PRO user
      const proResult = await AppDataSource.query(
        `INSERT INTO users (username, email, password_hash, first_name, last_name, email_notifications_enabled)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          `pro.approve.test_${Date.now()}`,
          `pro.approve_${Date.now()}@comune.it`,
          '$2b$10$dummyHashForTesting',
          'PRO',
          'ApproveTest',
          true
        ]
      );
      proUser = proResult[0];
      await AppDataSource.query(
        `INSERT INTO user_roles (user_id, department_role_id) VALUES ($1, $2)`,
        [proUser.id, proUserDeptRoleId]
      );

      // Ensure Road Infrastructure Dept
      let infraDept = await AppDataSource.getRepository(DepartmentEntity).findOneBy({ name: 'Public Infrastructure and Accessibility Department' });
      if (!infraDept) {
        infraDept = await AppDataSource.getRepository(DepartmentEntity).save({
          name: 'Public Infrastructure and Accessibility Department',
          description: 'Infra'
        });
      }
      // Ensure Road Staff Role
      let roadRole = await AppDataSource.getRepository(RoleEntity).findOneBy({ name: 'Road Maintenance staff member' });
      if (!roadRole) {
        roadRole = await AppDataSource.getRepository(RoleEntity).save({ name: 'Road Maintenance staff member', description: 'Road Staff' });
      }
      // Link
      let roadDeptRole = await AppDataSource.getRepository(DepartmentRoleEntity).findOneBy({
        departmentId: infraDept.id,
        roleId: roadRole.id
      });
      if (!roadDeptRole) {
        roadDeptRole = await AppDataSource.getRepository(DepartmentRoleEntity).save({
          departmentId: infraDept.id,
          roleId: roadRole.id
        });
      }

      // Seed category_roles for ROADS
      const catRole = await AppDataSource.query(
        `SELECT * FROM category_role_mapping WHERE category = $1`,
        [ReportCategory.ROADS]
      );
      if (!catRole || catRole.length === 0) {
        await AppDataSource.query(
          `INSERT INTO category_role_mapping (category, role_id) VALUES ($1, $2)`,
          [ReportCategory.ROADS, roadRole.id]
        );
      } else {
        await AppDataSource.query(
          `UPDATE category_role_mapping SET role_id = $2 WHERE category = $1`,
          [ReportCategory.ROADS, roadRole.id]
        );
      }

      // Create a USER with this role so automatic assignment works
      const roadResult = await AppDataSource.query(
        `INSERT INTO users (username, email, password_hash, first_name, last_name, email_notifications_enabled)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          `roadz.staff_${Date.now()}`,
          `roadz.staff_${Date.now()}@comune.it`,
          '$2b$10$dummyHashForTesting',
          'Roads',
          'Staff',
          true
        ]
      );
      const roadUser = roadResult[0];
      await AppDataSource.query(
        `INSERT INTO user_roles (user_id, department_role_id) VALUES ($1, $2)`,
        [roadUser.id, roadDeptRole.id]
      );
    });

    beforeEach(async () => {
      // Create a pending report before each test
      const reportResult = await AppDataSource.query(
        `INSERT INTO reports 
          (reporter_id, title, description, category, location, status, is_anonymous, created_at) 
         VALUES ($1, $2, $3, $4, ST_GeogFromText($5), $6, $7, $8)
         RETURNING id`,
        [
          testCitizen.id,
          'Pending Report for Approval',
          'This report needs approval',
          ReportCategory.ROADS,
          'POINT(7.6869005 45.0703393)',
          ReportStatus.PENDING_APPROVAL,
          false,
          new Date()
        ]
      );
      pendingReportId = reportResult[0].id;
    });

    afterAll(async () => {
      await AppDataSource.query(
        `DELETE FROM reports WHERE reporter_id = $1`,
        [testCitizen.id]
      );
      await AppDataSource.query(
        `DELETE FROM users WHERE id = $1`,
        [proUser.id]
      );
    });

    afterEach(async () => {
      await AppDataSource.query(
        `DELETE FROM reports WHERE reporter_id = $1`,
        [testCitizen.id]
      );
    });

    it('should approve report and assign to technical staff', async () => {
      // Act
      const approvedReport = await reportService.updateReportStatus(pendingReportId, ReportStatus.ASSIGNED, {}, proUser.id);

      // Assert
      expect(approvedReport).toBeDefined();
      expect(approvedReport.status).toBe(ReportStatus.ASSIGNED);
      expect(approvedReport.assignee_id).toBeDefined();
      expect(approvedReport.assignee_id).not.toBeNull();
      expect(approvedReport.rejection_reason).toBeUndefined();
    });

    it('should throw NotFoundError if report does not exist', async () => {
      // Act & Assert
      await expect(
        reportService.updateReportStatus(999999, ReportStatus.ASSIGNED, {}, proUser.id)
      ).rejects.toThrow('Report not found');
    });

    it('should throw BadRequestError if report is not in PENDING_APPROVAL status', async () => {
      // Arrange - Create an already assigned report
      const assignedReportResult = await AppDataSource.query(
        `INSERT INTO reports 
          (reporter_id, title, description, category, location, status, assignee_id, is_anonymous, created_at) 
         VALUES ($1, $2, $3, $4, ST_GeogFromText($5), $6, $7, $8, $9)
         RETURNING id`,
        [
          testCitizen.id,
          'Already Assigned Report',
          'This is already assigned',
          ReportCategory.ROADS,
          'POINT(7.6869005 45.0703393)',
          ReportStatus.ASSIGNED,
          testTechnician.id,
          false,
          new Date()
        ]
      );
      const assignedReportId = assignedReportResult[0].id;

      // Act & Assert
      await expect(
        reportService.updateReportStatus(assignedReportId, ReportStatus.ASSIGNED, {}, proUser.id)
      ).rejects.toThrow('Cannot approve report with status');
    });

    it('should throw BadRequestError if reportId is not a number', async () => {
      // Act & Assert
      await expect(
        reportService.updateReportStatus(Number.NaN, ReportStatus.ASSIGNED, {}, proUser.id)
      ).rejects.toThrow('Invalid report ID');
    });
  });

  // --- updateReportStatus ---
  describe('updateReportStatus', () => {
    let proUser: UserEntity;
    let proUserDeptRoleId: number;
    let pendingReportId: number;

    beforeAll(async () => {
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
      }
      // Find PRO department_role_id
      const proDeptRoleArr = await AppDataSource.query(
        `SELECT dr.id
         FROM department_roles dr
         INNER JOIN departments d ON dr.department_id = d.id
         INNER JOIN roles r ON dr.role_id = r.id
         WHERE d.name = $1 AND r.name = $2`,
        ['Organization', 'Municipal Public Relations Officer']
      );
      if (!proDeptRoleArr || proDeptRoleArr.length === 0) {
        throw new Error('Municipal Public Relations Officer department_role not found');
      }
      proUserDeptRoleId = proDeptRoleArr[0].id;

      // Create PRO user
      const proResult = await AppDataSource.query(
        `INSERT INTO users (username, email, password_hash, first_name, last_name, email_notifications_enabled)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          `pro.reject.test_${Date.now()}`,
          `pro.reject_${Date.now()}@comune.it`,
          '$2b$10$dummyHashForTesting',
          'PRO',
          'RejectTest',
          true
        ]
      );
      proUser = proResult[0];
      await AppDataSource.query(
        `INSERT INTO user_roles (user_id, department_role_id) VALUES ($1, $2)`,
        [proUser.id, proUserDeptRoleId]
      );
    });

    beforeEach(async () => {
      // Create a pending report before each test
      const reportResult = await AppDataSource.query(
        `INSERT INTO reports 
          (reporter_id, title, description, category, location, status, is_anonymous, created_at) 
         VALUES ($1, $2, $3, $4, ST_GeogFromText($5), $6, $7, $8)
         RETURNING id`,
        [
          testCitizen.id,
          'Pending Report for Rejection',
          'This report will be rejected',
          ReportCategory.ROADS,
          'POINT(7.6869005 45.0703393)',
          ReportStatus.PENDING_APPROVAL,
          false,
          new Date()
        ]
      );
      pendingReportId = reportResult[0].id;
    });

    afterAll(async () => {
      await AppDataSource.query(
        `DELETE FROM reports WHERE reporter_id = $1`,
        [testCitizen.id]
      );
      await AppDataSource.query(
        `DELETE FROM users WHERE id = $1`,
        [proUser.id]
      );
    });

    afterEach(async () => {
      await AppDataSource.query(
        `DELETE FROM reports WHERE reporter_id = $1`,
        [testCitizen.id]
      );
    });

    it('should reject report with valid rejection reason', async () => {
      // Act
      const rejectedReport = await reportService.updateReportStatus(
        pendingReportId,
        ReportStatus.REJECTED,
        { rejectionReason: 'Report does not meet our criteria' },
        proUser.id
      );

      // Assert
      expect(rejectedReport).toBeDefined();
      expect(rejectedReport.status).toBe(ReportStatus.REJECTED);
      expect(rejectedReport.rejection_reason).toBe('Report does not meet our criteria');
      expect(rejectedReport.assignee_id).toBeUndefined();
    });

    it('should throw NotFoundError if report does not exist', async () => {
      // Act & Assert
      await expect(
        reportService.updateReportStatus(999999, ReportStatus.REJECTED, { rejectionReason: 'Invalid report' }, proUser.id)
      ).rejects.toThrow('Report not found');
    });

    it('should throw BadRequestError if report is not in PENDING_APPROVAL status', async () => {
      // Arrange - Create an already assigned report
      const assignedReportResult = await AppDataSource.query(
        `INSERT INTO reports 
          (reporter_id, title, description, category, location, status, assignee_id, is_anonymous, created_at) 
         VALUES ($1, $2, $3, $4, ST_GeogFromText($5), $6, $7, $8, $9)
         RETURNING id`,
        [
          testCitizen.id,
          'Already Assigned Report',
          'This is already assigned',
          ReportCategory.ROADS,
          'POINT(7.6869005 45.0703393)',
          ReportStatus.ASSIGNED,
          testTechnician.id,
          false,
          new Date()
        ]
      );
      const assignedReportId = assignedReportResult[0].id;

      // Act & Assert
      await expect(
        reportService.updateReportStatus(assignedReportId, ReportStatus.REJECTED, { rejectionReason: 'Cannot reject assigned report' }, proUser.id)
      ).rejects.toThrow('Cannot reject report with status');
    });

    it('should throw BadRequestError if rejection reason is empty', async () => {
      // Act & Assert
      await expect(
        reportService.updateReportStatus(pendingReportId, ReportStatus.REJECTED, { rejectionReason: '' }, proUser.id)
      ).rejects.toThrow('Rejection reason is required');
    });

    it('should throw BadRequestError if rejection reason is only whitespace', async () => {
      // Act & Assert
      await expect(
        reportService.updateReportStatus(pendingReportId, ReportStatus.REJECTED, { rejectionReason: '   ' }, proUser.id)
      ).rejects.toThrow('Rejection reason is required');
    });

    it('should throw BadRequestError if reportId is not a number', async () => {
      // Act & Assert
      await expect(
        reportService.updateReportStatus(Number.NaN, ReportStatus.REJECTED, { rejectionReason: 'Invalid ID' }, proUser.id)
      ).rejects.toThrow('Invalid report ID');
    });
  });
});

describe('ReportService Integration Tests - Assign to External Maintainer', () => {
  let techStaffUserId: number;
  let externalMaintainerId: number;
  let companyId: number;
  let citizenId: number;
  const createdUserIds: number[] = [];
  const createdReportIds: number[] = [];
  const createdCompanyIds: number[] = [];

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const timestamp = Date.now();

    // Create company
    const company = await companyRepository.create(
      `Test Company Report Service ${timestamp}`,
      'Public Lighting'
    );
    companyId = company.id;
    createdCompanyIds.push(companyId);

    // Ensure Public Lighting Dept
    let lightingDept = await AppDataSource.getRepository(DepartmentEntity).findOneBy({ name: 'Public Lighting Department' });
    if (!lightingDept) {
      lightingDept = await AppDataSource.getRepository(DepartmentEntity).save({
        name: 'Public Lighting Department',
        description: 'Public Lighting'
      });
    }

    // Ensure Dept Director role
    let directorRole = await AppDataSource.getRepository(RoleEntity).findOneBy({ name: 'Department Director' });
    if (!directorRole) {
      directorRole = await AppDataSource.getRepository(RoleEntity).save({ name: 'Department Director', description: 'Director' });
    }

    // Link
    let directorDeptRole = await AppDataSource.getRepository(DepartmentRoleEntity).findOneBy({
      departmentId: lightingDept.id,
      roleId: directorRole.id
    });
    if (!directorDeptRole) {
      directorDeptRole = await AppDataSource.getRepository(DepartmentRoleEntity).save({
        departmentId: lightingDept.id,
        roleId: directorRole.id
      });
    }

    // Create tech staff user
    const techStaffRole = await departmentRoleRepository.findByDepartmentAndRole(
      'Public Lighting Department',
      'Department Director'
    );

    if (!techStaffRole) {
      throw new Error('Tech staff role not found');
    }

    const techStaff = await userRepository.createUserWithPassword({
      username: `techstaff_report_service_${timestamp}`,
      email: `techstaff_report_service_${timestamp}@test.com`,
      password: 'Password123!',
      firstName: 'Tech',
      lastName: 'Staff',
      isVerified: true,
      telegramLinkConfirmed: false,
    });
    await AppDataSource.query(
      `INSERT INTO user_roles (user_id, department_role_id) VALUES ($1, $2)`,
      [techStaff.id, techStaffRole.id]
    );

    techStaffUserId = techStaff.id;
    createdUserIds.push(techStaffUserId);

    // Ensure External Dept
    let extDept = await AppDataSource.getRepository(DepartmentEntity).findOneBy({ name: 'External Service Providers' });
    if (!extDept) {
      extDept = await AppDataSource.getRepository(DepartmentEntity).save({
        name: 'External Service Providers',
        description: 'External'
      });
    }
    // Ensure External Maintainer role
    let extRole = await AppDataSource.getRepository(RoleEntity).findOneBy({ name: 'External Maintainer' });
    if (!extRole) {
      extRole = await AppDataSource.getRepository(RoleEntity).save({ name: 'External Maintainer', description: 'External' });
    }
    // Link
    let extDeptRole = await AppDataSource.getRepository(DepartmentRoleEntity).findOneBy({
      departmentId: extDept.id,
      roleId: extRole.id
    });
    if (!extDeptRole) {
      extDeptRole = await AppDataSource.getRepository(DepartmentRoleEntity).save({
        departmentId: extDept.id,
        roleId: extRole.id
      });
    }

    // Create external maintainer
    const externalRole = await departmentRoleRepository.findByDepartmentAndRole(
      'External Service Providers',
      'External Maintainer'
    );

    if (!externalRole) {
      throw new Error('External Maintainer role not found');
    }

    const externalMaintainer = await userRepository.createUserWithPassword({
      username: `external_maintainer_${timestamp}`,
      email: `external_maintainer_${timestamp}@test.com`,
      password: 'Password123!',
      firstName: 'External',
      lastName: 'Maintainer',
      companyId: companyId,
      isVerified: true,
      telegramLinkConfirmed: false,
    });
    await AppDataSource.query(
      `INSERT INTO user_roles (user_id, department_role_id) VALUES ($1, $2)`,
      [externalMaintainer.id, externalRole.id]
    );

    externalMaintainerId = externalMaintainer.id;
    createdUserIds.push(externalMaintainerId);

    // Ensure Organization Dept
    let orgDept = await AppDataSource.getRepository(DepartmentEntity).findOneBy({ name: 'Organization' });
    if (!orgDept) {
      orgDept = await AppDataSource.getRepository(DepartmentEntity).save({
        name: 'Organization',
        description: 'Org'
      });
    }
    // Ensure Citizen role
    let citizenRoleEntity = await AppDataSource.getRepository(RoleEntity).findOneBy({ name: 'Citizen' });
    if (!citizenRoleEntity) {
      citizenRoleEntity = await AppDataSource.getRepository(RoleEntity).save({ name: 'Citizen', description: 'Citizen' });
    }
    // Link
    let citizenDeptRole = await AppDataSource.getRepository(DepartmentRoleEntity).findOneBy({
      departmentId: orgDept.id,
      roleId: citizenRoleEntity.id
    });
    if (!citizenDeptRole) {
      citizenDeptRole = await AppDataSource.getRepository(DepartmentRoleEntity).save({
        departmentId: orgDept.id,
        roleId: citizenRoleEntity.id
      });
    }

    // Create citizen user
    const citizenRole = await departmentRoleRepository.findByDepartmentAndRole(
      'Organization',
      'Citizen'
    );

    if (!citizenRole) {
      throw new Error('Citizen role not found');
    }

    const citizen = await userRepository.createUserWithPassword({
      username: `citizen_report_service_${timestamp}`,
      email: `citizen_report_service_${timestamp}@test.com`,
      password: 'Password123!',
      firstName: 'Citizen',
      lastName: 'Test',
      isVerified: true,
      telegramLinkConfirmed: false,
    });
    await AppDataSource.query(
      `INSERT INTO user_roles (user_id, department_role_id) VALUES ($1, $2)`,
      [citizen.id, citizenRole.id]
    );

    citizenId = citizen.id;
    createdUserIds.push(citizenId);
  });

  afterAll(async () => {
    // Cleanup in correct order (FK constraints)
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

  describe('assignToExternalMaintainer', () => {
    it('should successfully assign report to external maintainer', async () => {
      const report = await reportRepository.createReport(
        {
          title: 'Light broken',
          description: 'Needs fixing',
          category: ReportCategory.PUBLIC_LIGHTING,
          reporterId: citizenId,
          location: 'POINT(7.6869 45.0703)',
          isAnonymous: false
        },
        []
      );
      createdReportIds.push(report.id);

      // Update status to ASSIGNED (requirement for assignToExternalMaintainer)
      await AppDataSource.query(
        'UPDATE reports SET status = $1 WHERE id = $2',
        [ReportStatus.ASSIGNED, report.id]
      );

      await reportService.assignToExternalMaintainer(
        report.id,
        externalMaintainerId,
        techStaffUserId
      );

      const updated = await reportRepository.findReportById(report.id);
      expect(updated?.externalAssigneeId).toBe(externalMaintainerId);
      expect(updated?.status).toBe(ReportStatus.ASSIGNED);
    });

    it('should maintain ASSIGNED status after assignment', async () => {
      const report = await reportRepository.createReport(
        {
          title: 'Test report',
          description: 'Status test',
          category: ReportCategory.PUBLIC_LIGHTING,
          reporterId: citizenId,
          location: 'POINT(7.6869 45.0703)',
          isAnonymous: false
        },
        []
      );
      createdReportIds.push(report.id);

      // Update to ASSIGNED
      await AppDataSource.query(
        'UPDATE reports SET status = $1 WHERE id = $2',
        [ReportStatus.ASSIGNED, report.id]
      );

      expect((await reportRepository.findReportById(report.id))?.status).toBe(ReportStatus.ASSIGNED);

      await reportService.assignToExternalMaintainer(
        report.id,
        externalMaintainerId,
        techStaffUserId
      );

      const updated = await reportRepository.findReportById(report.id);
      expect(updated?.status).toBe(ReportStatus.ASSIGNED);
    });

    it('should throw NotFoundError when report does not exist', async () => {
      const nonExistentId = 999999;

      await expect(
        reportService.assignToExternalMaintainer(
          nonExistentId,
          externalMaintainerId,
          techStaffUserId
        )
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when maintainer does not exist', async () => {
      const report = await reportRepository.createReport(
        {
          title: 'Test report',
          description: 'Test',
          category: ReportCategory.PUBLIC_LIGHTING,
          reporterId: citizenId,
          location: 'POINT(7.6869 45.0703)',
          isAnonymous: false
        },
        []
      );
      createdReportIds.push(report.id);

      await AppDataSource.query(
        'UPDATE reports SET status = $1 WHERE id = $2',
        [ReportStatus.ASSIGNED, report.id]
      );

      const nonExistentUserId = 999999;

      await expect(
        reportService.assignToExternalMaintainer(
          report.id,
          nonExistentUserId,
          techStaffUserId
        )
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw BadRequestError when maintainer has wrong role', async () => {
      const report = await reportRepository.createReport(
        {
          title: 'Test report',
          description: 'Test',
          category: ReportCategory.PUBLIC_LIGHTING,
          reporterId: citizenId,
          location: 'POINT(7.6869 45.0703)',
          isAnonymous: false
        },
        []
      );
      createdReportIds.push(report.id);

      await AppDataSource.query(
        'UPDATE reports SET status = $1 WHERE id = $2',
        [ReportStatus.ASSIGNED, report.id]
      );

      // Try to assign to citizen (wrong role)
      await expect(
        reportService.assignToExternalMaintainer(
          report.id,
          citizenId,
          techStaffUserId
        )
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError when category does not match', async () => {
      const timestamp = Date.now();

      // Create a Roads company and maintainer
      const roadsCompany = await companyRepository.create(
        `Roads Company ${timestamp}`,
        'Roads and Urban Furnishings'
      );
      createdCompanyIds.push(roadsCompany.id);

      const externalRole = await departmentRoleRepository.findByDepartmentAndRole(
        'External Service Providers',
        'External Maintainer'
      );

      const roadsMaintainer = await userRepository.createUserWithPassword({
        username: `roads_maintainer_${timestamp}`,
        email: `roads_maintainer_${timestamp}@test.com`,
        password: 'Password123!',
        firstName: 'Roads',
        lastName: 'Maintainer',
        companyId: roadsCompany.id,
        isVerified: true,
      telegramLinkConfirmed: false,
      });
      await AppDataSource.query(
        `INSERT INTO user_roles (user_id, department_role_id) VALUES ($1, $2)`,
        [roadsMaintainer.id, externalRole!.id]
      );
      createdUserIds.push(roadsMaintainer.id);

      // Create public lighting report
      const report = await reportRepository.createReport(
        {
          title: 'Light issue',
          description: 'Test',
          category: ReportCategory.PUBLIC_LIGHTING,
          reporterId: citizenId,
          location: 'POINT(7.6869 45.0703)',
          isAnonymous: false
        },
        []
      );
      createdReportIds.push(report.id);

      await AppDataSource.query(
        'UPDATE reports SET status = $1 WHERE id = $2',
        [ReportStatus.ASSIGNED, report.id]
      );

      // Try to assign roads maintainer to lighting report
      await expect(
        reportService.assignToExternalMaintainer(
          report.id,
          roadsMaintainer.id,
          techStaffUserId
        )
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError when report is not in ASSIGNED status', async () => {
      const report = await reportRepository.createReport(
        {
          title: 'Test report',
          description: 'Test',
          category: ReportCategory.PUBLIC_LIGHTING,
          reporterId: citizenId,
          location: 'POINT(7.6869 45.0703)',
          isAnonymous: false
        },
        []
      );
      createdReportIds.push(report.id);

      // Leave status as PENDING_APPROVAL
      await expect(
        reportService.assignToExternalMaintainer(
          report.id,
          externalMaintainerId,
          techStaffUserId
        )
      ).rejects.toThrow(BadRequestError);
    });

    it('should allow reassignment to another maintainer', async () => {
      const timestamp = Date.now();

      // Create second maintainer
      const externalRole = await departmentRoleRepository.findByDepartmentAndRole(
        'External Service Providers',
        'External Maintainer'
      );

      const secondMaintainer = await userRepository.createUserWithPassword({
        username: `second_maintainer_${timestamp}`,
        email: `second_maintainer_${timestamp}@test.com`,
        password: 'Password123!',
        firstName: 'Second',
        lastName: 'Maintainer',
        companyId: companyId,
        isVerified: true,
      telegramLinkConfirmed: false,
      });
      await AppDataSource.query(
        `INSERT INTO user_roles (user_id, department_role_id) VALUES ($1, $2)`,
        [secondMaintainer.id, externalRole!.id]
      );
      createdUserIds.push(secondMaintainer.id);

      const report = await reportRepository.createReport(
        {
          title: 'Reassignment test',
          description: 'Test',
          category: ReportCategory.PUBLIC_LIGHTING,
          reporterId: citizenId,
          location: 'POINT(7.6869 45.0703)',
          isAnonymous: false
        },
        []
      );
      createdReportIds.push(report.id);

      // Set to ASSIGNED with first maintainer
      await AppDataSource.query(
        'UPDATE reports SET status = $1, assignee_id = $2 WHERE id = $3',
        [ReportStatus.ASSIGNED, externalMaintainerId, report.id]
      );

      // Reassign to second maintainer
      await reportService.assignToExternalMaintainer(
        report.id,
        secondMaintainer.id,
        techStaffUserId
      );

      const updated = await reportRepository.findReportById(report.id);
      expect(updated?.externalAssigneeId).toBe(secondMaintainer.id);
      expect(updated?.status).toBe(ReportStatus.ASSIGNED);
    });

    it('should update updatedAt timestamp', async () => {
      const report = await reportRepository.createReport(
        {
          title: 'Timestamp test',
          description: 'Test',
          category: ReportCategory.PUBLIC_LIGHTING,
          reporterId: citizenId,
          location: 'POINT(7.6869 45.0703)',
          isAnonymous: false
        },
        []
      );
      createdReportIds.push(report.id);

      await AppDataSource.query(
        'UPDATE reports SET status = $1 WHERE id = $2',
        [ReportStatus.ASSIGNED, report.id]
      );

      const originalUpdatedAt = (await reportRepository.findReportById(report.id))!.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      await reportService.assignToExternalMaintainer(
        report.id,
        externalMaintainerId,
        techStaffUserId
      );

      const updated = await reportRepository.findReportById(report.id);
      expect(updated!.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});

describe('ReportService Integration Tests - Messages', () => {
  let createdUserIds: number[] = [];
  let createdReportIds: number[] = [];
  let citizenId: number;
  let technicianId: number;
  let otherTechnicianId: number;
  let assignedReportId: number;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Create citizen
    const citizenRole = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Citizen');
    const citizen = await userRepository.createUserWithPassword({
      username: `citizen_msg_svc${r()}`,
      password: 'Password123!',
      email: `citizen_msg_svc${r()}@test.com`,
      firstName: 'Citizen',
      lastName: 'Messages',
      isVerified: true,
      telegramLinkConfirmed: false,
    });
    await AppDataSource.query(
      `INSERT INTO user_roles (user_id, department_role_id) VALUES ($1, $2)`,
      [citizen.id, citizenRole!.id]
    );
    citizenId = citizen.id;
    createdUserIds.push(citizenId);

    // Create technician
    const techRole = await departmentRoleRepository.findByDepartmentAndRole('Water and Sewer Services Department', 'Water Network staff member');
    if (!techRole) throw new Error('Technician role not found');
    const technician = await userRepository.createUserWithPassword({
      username: `tech_msg_svc${r()}`,
      password: 'Password123!',
      email: `tech_msg_svc${r()}@test.com`,
      firstName: 'Tech',
      lastName: 'Messages',
      isVerified: true,
      telegramLinkConfirmed: false,
    });
    await AppDataSource.query(
      `INSERT INTO user_roles (user_id, department_role_id) VALUES ($1, $2)`,
      [technician.id, techRole!.id]
    );
    technicianId = technician.id;
    createdUserIds.push(technicianId);

    // Create other technician
    const otherTechnician = await userRepository.createUserWithPassword({
      username: `other_tech_msg_svc${r()}`,
      password: 'Password123!',
      email: `other_tech_msg_svc${r()}@test.com`,
      firstName: 'Other',
      lastName: 'Tech',
      isVerified: true,
      telegramLinkConfirmed: false,
    });
    await AppDataSource.query(
      `INSERT INTO user_roles (user_id, department_role_id) VALUES ($1, $2)`,
      [otherTechnician.id, techRole!.id]
    );
    otherTechnicianId = otherTechnician.id;
    createdUserIds.push(otherTechnicianId);
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
    const report = await reportRepository.createReport({
      title: 'Report for messages',
      description: 'Test messages',
      category: ReportCategory.WATER_SUPPLY,
      reporterId: citizenId,
      location: 'POINT(7.6869 45.0703)',
      isAnonymous: false
    }, []);
    await AppDataSource.query(
      'UPDATE reports SET status = $1, assignee_id = $2 WHERE id = $3',
      [ReportStatus.ASSIGNED, technicianId, report.id]
    );
    assignedReportId = report.id;
    createdReportIds.push(assignedReportId);
  });

  afterEach(async () => {
    if (createdReportIds.length > 0) {
      await AppDataSource.getRepository(ReportEntity).delete({ id: In(createdReportIds) });
      createdReportIds = [];
    }
  });

  describe('sendMessage', () => {
    it('should send message successfully when assigned technician posts', async () => {
      const message = await reportService.sendMessage(
        assignedReportId,
        technicianId,
        'We will fix this tomorrow'
      );

      expect(message).toBeDefined();
      expect(message.id).toBeGreaterThan(0);
      expect(message.content).toBe('We will fix this tomorrow');
      expect(message.author).toBeDefined();
      expect(message.author.id).toBe(technicianId);
      expect(message.reportId).toBe(assignedReportId);
      expect(message.createdAt).toBeDefined();
    });

    it('should trim whitespace from message content', async () => {
      const message = await reportService.sendMessage(
        assignedReportId,
        technicianId,
        '  Message with spaces  '
      );

      expect(message.content).toBe('Message with spaces');
    });

    it('should throw BadRequestError when content is empty', async () => {
      await expect(
        reportService.sendMessage(assignedReportId, technicianId, '')
      ).rejects.toThrow(BadRequestError);

      await expect(
        reportService.sendMessage(assignedReportId, technicianId, '   ')
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError when content exceeds 2000 characters', async () => {
      const longContent = 'x'.repeat(2001);

      await expect(
        reportService.sendMessage(assignedReportId, technicianId, longContent)
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw NotFoundError when report does not exist', async () => {
      await expect(
        reportService.sendMessage(999999, technicianId, 'Test message')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw InsufficientRightsError when non-assigned user tries to send', async () => {
      await expect(
        reportService.sendMessage(assignedReportId, otherTechnicianId, 'Unauthorized')
      ).rejects.toThrow();
    });

    it('should create notification for the report owner', async () => {
      await reportService.sendMessage(assignedReportId, technicianId, 'Test notification');

      // Check notification was created
      const notifications = await AppDataSource.query(
        'SELECT * FROM notifications WHERE user_id = $1 AND report_id = $2',
        [citizenId, assignedReportId]
      );

      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications[0].content).toContain('new message');
    });
  });

  describe('getMessages', () => {
    beforeEach(async () => {
      // Add a test message
      await AppDataSource.query(
        `INSERT INTO messages (report_id, sender_id, content, created_at)
         VALUES ($1, $2, 'Test message', CURRENT_TIMESTAMP)`,
        [assignedReportId, technicianId]
      );
    });

    it('should return messages when assigned technician requests', async () => {
      const messages = await reportService.getMessages(assignedReportId, technicianId);

      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBe(1);
      expect(messages[0].content).toBe('Test message');
      expect(messages[0].author).toBeDefined();
    });

    it('should return messages when reporter (citizen) requests', async () => {
      const messages = await reportService.getMessages(assignedReportId, citizenId);

      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBe(1);
      expect(messages[0].content).toBe('Test message');
    });

    it('should throw NotFoundError when report does not exist', async () => {
      await expect(
        reportService.getMessages(999999, technicianId)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw InsufficientRightsError for unauthorized user', async () => {
      await expect(
        reportService.getMessages(assignedReportId, otherTechnicianId)
      ).rejects.toThrow();
    });

    it('should return empty array when no messages exist', async () => {
      // Create new report without messages
      const newReport = await reportRepository.createReport({
        title: 'No messages',
        description: 'Test',
        category: ReportCategory.WATER_SUPPLY,
        reporterId: citizenId,
        location: 'POINT(7.6869 45.0703)',
        isAnonymous: false
      }, []);
      await AppDataSource.query(
        'UPDATE reports SET status = $1, assignee_id = $2 WHERE id = $3',
        [ReportStatus.ASSIGNED, technicianId, newReport.id]
      );
      createdReportIds.push(newReport.id);

      const messages = await reportService.getMessages(newReport.id, technicianId);

      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBe(0);
    });

    it('should return messages ordered by creation date (ASC)', async () => {
      // Add more messages
      await AppDataSource.query(
        `INSERT INTO messages (report_id, sender_id, content, created_at)
         VALUES ($1, $2, 'Second message', CURRENT_TIMESTAMP + interval '1 second')`,
        [assignedReportId, technicianId]
      );
      await AppDataSource.query(
        `INSERT INTO messages (report_id, sender_id, content, created_at)
         VALUES ($1, $2, 'Third message', CURRENT_TIMESTAMP + interval '2 seconds')`,
        [assignedReportId, technicianId]
      );

      const messages = await reportService.getMessages(assignedReportId, technicianId);

      expect(messages.length).toBe(3);
      expect(messages[0].content).toBe('Test message');
      expect(messages[1].content).toBe('Second message');
      expect(messages[2].content).toBe('Third message');
    });
  });
});