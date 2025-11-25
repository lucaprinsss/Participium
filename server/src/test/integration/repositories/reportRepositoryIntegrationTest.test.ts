import { AppDataSource } from '@database/connection';
import { reportRepository } from '@repositories/reportRepository';
import { departmentRepository } from '@repositories/departmentRepository';
import { ReportStatus } from '@models/dto/ReportStatus';
import { ReportCategory } from '@models/dto/ReportCategory';
import { reportEntity } from '@models/entity/reportEntity';
import { userEntity } from '@models/entity/userEntity';
import { DepartmentEntity } from '@models/entity/departmentEntity';

describe('ReportRepository Integration Tests - getMyAssignedReports', () => {
  let testTechnician1: userEntity;
  let testTechnician2: userEntity;
  let testCitizen: userEntity;
  let publicLightingDepartment: DepartmentEntity;
  let electricalStaffDeptRoleId: number;
  let citizenDeptRoleId: number;

  beforeAll(async () => {
    await AppDataSource.initialize();

    // Find Public Lighting Department
    publicLightingDepartment = await departmentRepository.findByName('Public Lighting Department') as DepartmentEntity;
    if (!publicLightingDepartment) throw new Error('Public Lighting Department not found');

    // Find Electrical staff member department_role_id
    const electricalDeptRoleArr = await AppDataSource.query(
      `SELECT dr.id
       FROM department_roles dr
       INNER JOIN roles r ON dr.role_id = r.id
       WHERE r.name = $1 AND dr.department_id = $2`,
      ['Electrical staff member', publicLightingDepartment.id]
    );
    if (!electricalDeptRoleArr || electricalDeptRoleArr.length === 0) throw new Error('Electrical staff member role not found');
    electricalStaffDeptRoleId = electricalDeptRoleArr[0].id;

    // Find Citizen department_role_id
    const citizenDeptRoleArr = await AppDataSource.query(
      `SELECT dr.id
       FROM department_roles dr
       INNER JOIN departments d ON dr.department_id = d.id
       INNER JOIN roles r ON dr.role_id = r.id
       WHERE d.name = $1 AND r.name = $2`,
      ['Organization', 'Citizen']
    );
    if (!citizenDeptRoleArr || citizenDeptRoleArr.length === 0) throw new Error('Citizen department_role not found');
    citizenDeptRoleId = citizenDeptRoleArr[0].id;

    // Create test citizen
    const citizenResult = await AppDataSource.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, department_role_id, email_notifications_enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        'citizen.test.repo',
        'citizen.test.repo@example.com',
        '$2b$10$dummyHashForTesting',
        'Citizen',
        'Test',
        citizenDeptRoleId,
        true
      ]
    );
    testCitizen = citizenResult[0];

    // Create test technicians
    const tech1Result = await AppDataSource.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, department_role_id, email_notifications_enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        'tech.test1.repo',
        'tech.test1.repo@comune.it',
        '$2b$10$dummyHashForTesting',
        'Technician',
        'One',
        electricalStaffDeptRoleId,
        true
      ]
    );
    testTechnician1 = tech1Result[0];

    const tech2Result = await AppDataSource.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, department_role_id, email_notifications_enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        'tech.test2.repo',
        'tech.test2.repo@comune.it',
        '$2b$10$dummyHashForTesting',
        'Technician',
        'Two',
        electricalStaffDeptRoleId,
        true
      ]
    );
    testTechnician2 = tech2Result[0];
  });

  afterAll(async () => {
    await AppDataSource.query(
      `DELETE FROM reports WHERE reporter_id IN ($1, $2, $3)`,
      [testCitizen.id, testTechnician1.id, testTechnician2.id]
    );
    await AppDataSource.query(
      `DELETE FROM users WHERE id IN ($1, $2, $3)`,
      [testCitizen.id, testTechnician1.id, testTechnician2.id]
    );
    await AppDataSource.destroy();
  });

  afterEach(async () => {
    await AppDataSource.query(
      `DELETE FROM reports WHERE reporter_id IN ($1, $2, $3)`,
      [testCitizen.id, testTechnician1.id, testTechnician2.id]
    );
  });

  describe('findByAssigneeId - without status filter', () => {
    it('should return all reports assigned to a specific user', async () => {
      await AppDataSource.query(
        `INSERT INTO reports 
          (reporter_id, title, description, category, location, status, assignee_id, is_anonymous, created_at) 
         VALUES ($1, $2, $3, $4, ST_GeogFromText($5), $6, $7, $8, $9)`,
        [
          testCitizen.id,
          'Street light broken on Via Roma',
          'The light is not working',
          ReportCategory.PUBLIC_LIGHTING,
          'POINT(7.6869005 45.0703393)',
          ReportStatus.ASSIGNED,
          testTechnician1.id,
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
          'Regular maintenance required',
          ReportCategory.PUBLIC_LIGHTING,
          'POINT(7.6932941 45.0692403)',
          ReportStatus.IN_PROGRESS,
          testTechnician1.id,
          false,
          new Date('2024-01-02')
        ]
      );
      await AppDataSource.query(
        `INSERT INTO reports 
          (reporter_id, title, description, category, location, status, assignee_id, is_anonymous, created_at) 
         VALUES ($1, $2, $3, $4, ST_GeogFromText($5), $6, $7, $8, $9)`,
        [
          testCitizen.id,
          'Different technician report',
          'Assigned to technician 2',
          ReportCategory.PUBLIC_LIGHTING,
          'POINT(7.6782069 45.0625748)',
          ReportStatus.ASSIGNED,
          testTechnician2.id,
          false,
          new Date('2024-01-03')
        ]
      );

      const result = await reportRepository.findByAssigneeId(testTechnician1.id);

      expect(result).toHaveLength(2);
      expect(result.map(r => r.title)).toContain('Street light broken on Via Roma');
      expect(result.map(r => r.title)).toContain('Light maintenance needed');
      expect(result.map(r => r.title)).not.toContain('Different technician report');
      expect(result.every(r => r.assigneeId === testTechnician1.id)).toBe(true);
    });

    it('should return empty array when user has no assigned reports', async () => {
      await AppDataSource.query(
        `INSERT INTO reports 
          (reporter_id, title, description, category, location, status, assignee_id, is_anonymous, created_at) 
         VALUES ($1, $2, $3, $4, ST_GeogFromText($5), $6, $7, $8, $9)`,
        [
          testCitizen.id,
          'Report for other technician',
          'Not for technician 1',
          ReportCategory.PUBLIC_LIGHTING,
          'POINT(7.6869005 45.0703393)',
          ReportStatus.ASSIGNED,
          testTechnician2.id,
          false,
          new Date()
        ]
      );

      const result = await reportRepository.findByAssigneeId(testTechnician1.id);

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it('should return reports in chronological order (newest first)', async () => {
      await AppDataSource.query(
        `INSERT INTO reports 
          (reporter_id, title, description, category, location, status, assignee_id, is_anonymous, created_at) 
         VALUES ($1, $2, $3, $4, ST_GeogFromText($5), $6, $7, $8, $9)`,
        [
          testCitizen.id,
          'Oldest report',
          'Created first',
          ReportCategory.PUBLIC_LIGHTING,
          'POINT(7.6869005 45.0703393)',
          ReportStatus.ASSIGNED,
          testTechnician1.id,
          false,
          new Date('2024-01-01T10:00:00')
        ]
      );
      await AppDataSource.query(
        `INSERT INTO reports 
          (reporter_id, title, description, category, location, status, assignee_id, is_anonymous, created_at) 
         VALUES ($1, $2, $3, $4, ST_GeogFromText($5), $6, $7, $8, $9)`,
        [
          testCitizen.id,
          'Middle report',
          'Created second',
          ReportCategory.PUBLIC_LIGHTING,
          'POINT(7.6932941 45.0692403)',
          ReportStatus.ASSIGNED,
          testTechnician1.id,
          false,
          new Date('2024-01-02T10:00:00')
        ]
      );
      await AppDataSource.query(
        `INSERT INTO reports 
          (reporter_id, title, description, category, location, status, assignee_id, is_anonymous, created_at) 
         VALUES ($1, $2, $3, $4, ST_GeogFromText($5), $6, $7, $8, $9)`,
        [
          testCitizen.id,
          'Newest report',
          'Created third',
          ReportCategory.PUBLIC_LIGHTING,
          'POINT(7.6782069 45.0625748)',
          ReportStatus.ASSIGNED,
          testTechnician1.id,
          false,
          new Date('2024-01-03T10:00:00')
        ]
      );

      const result = await reportRepository.findByAssigneeId(testTechnician1.id);

      expect(result).toHaveLength(3);
      expect(result[0].title).toBe('Newest report');
      expect(result[1].title).toBe('Middle report');
      expect(result[2].title).toBe('Oldest report');
      expect(result[0].createdAt.getTime()).toBeGreaterThan(result[1].createdAt.getTime());
      expect(result[1].createdAt.getTime()).toBeGreaterThan(result[2].createdAt.getTime());
    });
  });

  describe('findByAssigneeId - with status filter', () => {
    it('should return only ASSIGNED reports for a user', async () => {
      await AppDataSource.query(
        `INSERT INTO reports 
          (reporter_id, title, description, category, location, status, assignee_id, is_anonymous, created_at) 
         VALUES 
          ($1, $2, $3, $4, ST_GeogFromText($5), $6, $7, $8, $9),
          ($1, $10, $11, $4, ST_GeogFromText($12), $13, $7, $8, $14),
          ($1, $15, $16, $4, ST_GeogFromText($17), $18, $7, $8, $19)`,
        [
          testCitizen.id,
          'Assigned report',
          'Status is ASSIGNED',
          ReportCategory.PUBLIC_LIGHTING,
          'POINT(7.6869005 45.0703393)',
          ReportStatus.ASSIGNED,
          testTechnician1.id,
          false,
          new Date('2024-01-01'),
          'In progress report',
          'Status is IN_PROGRESS',
          'POINT(7.6932941 45.0692403)',
          ReportStatus.IN_PROGRESS,
          new Date('2024-01-02'),
          'Resolved report',
          'Status is RESOLVED',
          'POINT(7.6782069 45.0625748)',
          ReportStatus.RESOLVED,
          new Date('2024-01-03')
        ]
      );

      const result = await reportRepository.findByAssigneeId(
        testTechnician1.id,
        ReportStatus.ASSIGNED
      );

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Assigned report');
      expect(result[0].status).toBe(ReportStatus.ASSIGNED);
    });

    it('should return only IN_PROGRESS reports for a user', async () => {
      await AppDataSource.query(
        `INSERT INTO reports 
          (reporter_id, title, description, category, location, status, assignee_id, is_anonymous, created_at) 
         VALUES 
          ($1, $2, $3, $4, ST_GeogFromText($5), $6, $7, $8, $9),
          ($1, $10, $11, $4, ST_GeogFromText($12), $6, $7, $8, $13)`,
        [
          testCitizen.id,
          'In progress 1',
          'Working on it',
          ReportCategory.PUBLIC_LIGHTING,
          'POINT(7.6869005 45.0703393)',
          ReportStatus.IN_PROGRESS,
          testTechnician1.id,
          false,
          new Date('2024-01-01'),
          'In progress 2',
          'Still working',
          'POINT(7.6932941 45.0692403)',
          new Date('2024-01-02')
        ]
      );

      const result = await reportRepository.findByAssigneeId(
        testTechnician1.id,
        ReportStatus.IN_PROGRESS
      );

      expect(result).toHaveLength(2);
      expect(result.every(r => r.status === ReportStatus.IN_PROGRESS)).toBe(true);
    });

    it('should return only RESOLVED reports for a user', async () => {
      await AppDataSource.query(
        `INSERT INTO reports 
          (reporter_id, title, description, category, location, status, assignee_id, is_anonymous, created_at) 
         VALUES ($1, $2, $3, $4, ST_GeogFromText($5), $6, $7, $8, $9)`,
        [
          testCitizen.id,
          'Completed work',
          'Task completed',
          ReportCategory.PUBLIC_LIGHTING,
          'POINT(7.6869005 45.0703393)',
          ReportStatus.RESOLVED,
          testTechnician1.id,
          false,
          new Date()
        ]
      );

      const result = await reportRepository.findByAssigneeId(
        testTechnician1.id,
        ReportStatus.RESOLVED
      );

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(ReportStatus.RESOLVED);
    });

    it('should return empty array when no reports match status filter', async () => {
      await AppDataSource.query(
        `INSERT INTO reports 
          (reporter_id, title, description, category, location, status, assignee_id, is_anonymous, created_at) 
         VALUES ($1, $2, $3, $4, ST_GeogFromText($5), $6, $7, $8, $9)`,
        [
          testCitizen.id,
          'Only assigned',
          'No resolved reports',
          ReportCategory.PUBLIC_LIGHTING,
          'POINT(7.6869005 45.0703393)',
          ReportStatus.ASSIGNED,
          testTechnician1.id,
          false,
          new Date()
        ]
      );

      const result = await reportRepository.findByAssigneeId(
        testTechnician1.id,
        ReportStatus.RESOLVED
      );

      expect(result).toHaveLength(0);
    });

    it('should not return reports assigned to different users', async () => {
      await AppDataSource.query(
        `INSERT INTO reports 
          (reporter_id, title, description, category, location, status, assignee_id, is_anonymous, created_at) 
         VALUES 
          ($1, $2, $3, $4, ST_GeogFromText($5), $6, $7, $8, $9),
          ($1, $10, $11, $4, ST_GeogFromText($12), $6, $13, $8, $14)`,
        [
          testCitizen.id,
          'Tech 1 report',
          'For technician 1',
          ReportCategory.PUBLIC_LIGHTING,
          'POINT(7.6869005 45.0703393)',
          ReportStatus.ASSIGNED,
          testTechnician1.id,
          false,
          new Date('2024-01-01'),
          'Tech 2 report',
          'For technician 2',
          'POINT(7.6932941 45.0692403)',
          testTechnician2.id,
          new Date('2024-01-02')
        ]
      );

      const result = await reportRepository.findByAssigneeId(
        testTechnician1.id,
        ReportStatus.ASSIGNED
      );

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Tech 1 report');
      expect(result[0].assigneeId).toBe(testTechnician1.id);
    });

    it('should maintain chronological order with status filter', async () => {
      await AppDataSource.query(
       `INSERT INTO reports 
    (reporter_id, title, description, category, location, status, assignee_id, is_anonymous, created_at) 
   VALUES 
    ($1, $2, $3, $4, ST_GeogFromText($5), $6, $7, $8, $9),
    ($1, $10, $11, $4, ST_GeogFromText($12), $13, $7, $8, $14),
    ($1, $15, $16, $4, ST_GeogFromText($17), $18, $7, $8, $19)`,
   [
    testCitizen.id,
    'Oldest assigned',
    'First',
    ReportCategory.PUBLIC_LIGHTING,
    'POINT(7.6869005 45.0703393)',
    ReportStatus.ASSIGNED,
    testTechnician1.id,
    false,
    new Date('2024-01-01T10:00:00'),
    'Middle in progress',
    'Second',
    'POINT(7.6932941 45.0692403)',
    ReportStatus.IN_PROGRESS,
    new Date('2024-01-02T10:00:00'),
    'Newest assigned',
    'Third',
    'POINT(7.6782069 45.0625748)',
    ReportStatus.ASSIGNED,
    new Date('2024-01-03T10:00:00')
  ]
      );

      const result = await reportRepository.findByAssigneeId(
        testTechnician1.id,
        ReportStatus.ASSIGNED
      );

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Newest assigned');
      expect(result[1].title).toBe('Oldest assigned');
      expect(result[0].createdAt.getTime()).toBeGreaterThan(result[1].createdAt.getTime());
    });
  });
});