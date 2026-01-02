import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { departmentRoleRepository } from '@repositories/departmentRoleRepository';
import { BadRequestError } from '@models/errors/BadRequestError';
import { NotFoundError } from '@models/errors/NotFoundError';
import { InsufficientRightsError } from '@models/errors/InsufficientRightsError';
import { In } from 'typeorm';
import { AppDataSource } from '@database/connection';
import { reportService } from '@services/reportService';
import { reportRepository } from '@repositories/reportRepository';
import { userRepository } from '@repositories/userRepository';
import { commentRepository } from '@repositories/commentRepository';
import { ReportCategory } from '@models/dto/ReportCategory';
import { UserEntity } from '@models/entity/userEntity';
import { ReportEntity } from '@models/entity/reportEntity';
import { DepartmentEntity } from '@models/entity/departmentEntity';
import { DepartmentRoleEntity } from '@models/entity/departmentRoleEntity';
import { RoleEntity } from '@models/entity/roleEntity';

const r = () => `_${Math.floor(Math.random() * 1000000)}`;

describe('ReportService - Internal Comments Integration Tests', () => {
  let createdUserIds: number[] = [];
  let createdReportIds: number[] = [];
  let createdCommentIds: number[] = [];

  let techStaffUser: UserEntity;
  let proUser: UserEntity;
  let externalUser: UserEntity;
  let citizenUser: UserEntity;
  let testReport: ReportEntity;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Seed Organization and PRO/Citizen roles
    let orgDept = await AppDataSource.getRepository(DepartmentEntity).findOneBy({ name: 'Organization' });
    if (!orgDept) {
      orgDept = await AppDataSource.getRepository(DepartmentEntity).save({ name: 'Organization', description: 'Organization' });
    }

    const roleNames = ['Municipal Public Relations Officer', 'Citizen', 'Water Network staff member', 'External Maintainer'];
    for (const name of roleNames) {
      let role = await AppDataSource.getRepository(RoleEntity).findOneBy({ name });
      if (!role) {
        await AppDataSource.getRepository(RoleEntity).save({ name, description: name });
      }
    }

    const proRoleEntity = await AppDataSource.getRepository(RoleEntity).findOneBy({ name: 'Municipal Public Relations Officer' });
    let proDeptRole = await AppDataSource.getRepository(DepartmentRoleEntity).findOneBy({ departmentId: orgDept.id, roleId: proRoleEntity!.id });
    if (!proDeptRole) {
      await AppDataSource.getRepository(DepartmentRoleEntity).save({ departmentId: orgDept.id, roleId: proRoleEntity!.id });
    }

    const citizenRoleEntity = await AppDataSource.getRepository(RoleEntity).findOneBy({ name: 'Citizen' });
    let citizenDeptRole = await AppDataSource.getRepository(DepartmentRoleEntity).findOneBy({ departmentId: orgDept.id, roleId: citizenRoleEntity!.id });
    if (!citizenDeptRole) {
      await AppDataSource.getRepository(DepartmentRoleEntity).save({ departmentId: orgDept.id, roleId: citizenRoleEntity!.id });
    }

    // Seed Water Dept
    let waterDept = await AppDataSource.getRepository(DepartmentEntity).findOneBy({ name: 'Water and Sewer Services Department' });
    if (!waterDept) {
      waterDept = await AppDataSource.getRepository(DepartmentEntity).save({ name: 'Water and Sewer Services Department', description: 'Water Dept' });
    }
    const waterStaffRole = await AppDataSource.getRepository(RoleEntity).findOneBy({ name: 'Water Network staff member' });
    let waterDeptRole = await AppDataSource.getRepository(DepartmentRoleEntity).findOneBy({ departmentId: waterDept.id, roleId: waterStaffRole!.id });
    if (!waterDeptRole) {
      await AppDataSource.getRepository(DepartmentRoleEntity).save({ departmentId: waterDept.id, roleId: waterStaffRole!.id });
    }

    // Seed External Dept
    let extDept = await AppDataSource.getRepository(DepartmentEntity).findOneBy({ name: 'External Service Providers' });
    if (!extDept) {
      extDept = await AppDataSource.getRepository(DepartmentEntity).save({ name: 'External Service Providers', description: 'External' });
    }
    const extRole = await AppDataSource.getRepository(RoleEntity).findOneBy({ name: 'External Maintainer' });
    let extDeptRole = await AppDataSource.getRepository(DepartmentRoleEntity).findOneBy({ departmentId: extDept.id, roleId: extRole!.id });
    if (!extDeptRole) {
      await AppDataSource.getRepository(DepartmentRoleEntity).save({ departmentId: extDept.id, roleId: extRole!.id });
    }
  });

  afterAll(async () => {
    // Comments will be deleted by CASCADE when reports are deleted
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
    // Comments deleted automatically via CASCADE
    if (createdReportIds.length > 0) {
      await (reportRepository as any)['repository'].delete({ id: In(createdReportIds) });
      createdReportIds = [];
    }
    if (createdUserIds.length > 0) {
      await (userRepository as any)['repository'].delete({ id: In(createdUserIds) });
      createdUserIds = [];
    }
    createdCommentIds = [];
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    // Create technical staff user
    const techRole = await departmentRoleRepository.findByDepartmentAndRole('Water and Sewer Services Department', 'Water Network staff member');
    techStaffUser = await userRepository.createUserWithPassword({
      username: `tech${r()}`,
      password: 'Password123!',
      email: `tech${r()}@test.com`,
      firstName: 'Tech',
      lastName: 'Staff',
      isVerified: true,
      telegramLinkConfirmed: false,
    });
    await AppDataSource.query(
      `INSERT INTO user_roles (user_id, department_role_id) VALUES ($1, $2)`,
      [techStaffUser.id, techRole!.id]
    );
    createdUserIds.push(techStaffUser.id);

    // Create PRO user
    const proRole = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Municipal Public Relations Officer');
    proUser = await userRepository.createUserWithPassword({
      username: `pro${r()}`,
      password: 'Password123!',
      email: `pro${r()}@test.com`,
      firstName: 'PRO',
      lastName: 'User',
      isVerified: true,
      telegramLinkConfirmed: false,
    });
    await AppDataSource.query(
      `INSERT INTO user_roles (user_id, department_role_id) VALUES ($1, $2)`,
      [proUser.id, proRole!.id]
    );
    createdUserIds.push(proUser.id);

    // Create external maintainer
    const externalRole = await departmentRoleRepository.findByDepartmentAndRole('External Service Providers', 'External Maintainer');
    externalUser = await userRepository.createUserWithPassword({
      username: `external${r()}`,
      password: 'Password123!',
      email: `external${r()}@test.com`,
      firstName: 'External',
      lastName: 'User',
      isVerified: true,
      telegramLinkConfirmed: false,
    });
    await AppDataSource.query(
      `INSERT INTO user_roles (user_id, department_role_id) VALUES ($1, $2)`,
      [externalUser.id, externalRole!.id]
    );
    createdUserIds.push(externalUser.id);

    // Create citizen user
    const citizenRole = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Citizen');
    citizenUser = await userRepository.createUserWithPassword({
      username: `citizen${r()}`,
      password: 'Password123!',
      email: `citizen${r()}@test.com`,
      firstName: 'Citizen',
      lastName: 'User',
      isVerified: true,
      telegramLinkConfirmed: false,
    });
    await AppDataSource.query(
      `INSERT INTO user_roles (user_id, department_role_id) VALUES ($1, $2)`,
      [citizenUser.id, citizenRole!.id]
    );
    createdUserIds.push(citizenUser.id);

    // Create test report
    const reportData = {
      reporterId: citizenUser.id,
      title: 'Test Report for Comments',
      description: 'Description for comment testing',
      category: ReportCategory.ROADS,
      location: 'POINT(7.6869 45.0703)',
      isAnonymous: false
    };
    testReport = await reportRepository.createReport(reportData, []);
    createdReportIds.push(testReport.id);
  });

  describe('getInternalComments', () => {
    it('should return all comments for a report', async () => {
      // Add comments
      await reportService.addInternalComment(testReport.id, techStaffUser.id, 'First comment');
      await reportService.addInternalComment(testReport.id, proUser.id, 'Second comment');

      const comments = await reportService.getInternalComments(testReport.id);

      expect(comments).toHaveLength(2);
      expect(comments[0].content).toBe('First comment');
      expect(comments[1].content).toBe('Second comment');
      expect(comments[0].author).toBeDefined();
      expect(comments[0].author.username).toBe(techStaffUser.username);
    });

    it('should return empty array for report with no comments', async () => {
      const comments = await reportService.getInternalComments(testReport.id);

      expect(comments).toHaveLength(0);
      expect(Array.isArray(comments)).toBe(true);
    });

    it('should throw NotFoundError for non-existent report', async () => {
      await expect(reportService.getInternalComments(999999))
        .rejects
        .toThrow(NotFoundError);
    });

    it('should include author details in response', async () => {
      await reportService.addInternalComment(testReport.id, techStaffUser.id, 'Test comment');

      const comments = await reportService.getInternalComments(testReport.id);

      expect(comments[0].author.id).toBe(techStaffUser.id);
      expect(comments[0].author.username).toBe(techStaffUser.username);
      expect(comments[0].author.firstName).toBe(techStaffUser.firstName);
      expect(comments[0].author.lastName).toBe(techStaffUser.lastName);
      expect(comments[0].author.role).toBeDefined();
    });

    it('should order comments by creation time (oldest first)', async () => {
      await reportService.addInternalComment(testReport.id, techStaffUser.id, 'First');
      await new Promise(resolve => setTimeout(resolve, 10));
      await reportService.addInternalComment(testReport.id, proUser.id, 'Second');
      await new Promise(resolve => setTimeout(resolve, 10));
      await reportService.addInternalComment(testReport.id, externalUser.id, 'Third');

      const comments = await reportService.getInternalComments(testReport.id);

      expect(comments).toHaveLength(3);
      expect(comments[0].content).toBe('First');
      expect(comments[1].content).toBe('Second');
      expect(comments[2].content).toBe('Third');
    });
  });

  describe('addInternalComment', () => {
    it('should add comment as technical staff', async () => {
      const comment = await reportService.addInternalComment(
        testReport.id,
        techStaffUser.id,
        'Technical staff comment'
      );

      expect(comment).toBeDefined();
      expect(comment.id).toBeDefined();
      expect(comment.content).toBe('Technical staff comment');
      expect(comment.reportId).toBe(testReport.id);
      expect(comment.author.id).toBe(techStaffUser.id);
      expect(comment.createdAt).toBeDefined();
    });

    it('should add comment as PRO', async () => {
      const comment = await reportService.addInternalComment(
        testReport.id,
        proUser.id,
        'PRO comment'
      );

      expect(comment.author.id).toBe(proUser.id);
    });

    it('should add comment as external maintainer', async () => {
      const comment = await reportService.addInternalComment(
        testReport.id,
        externalUser.id,
        'External maintainer comment'
      );

      expect(comment.author.id).toBe(externalUser.id);
    });

    it('should throw NotFoundError for non-existent report', async () => {
      await expect(
        reportService.addInternalComment(999999, techStaffUser.id, 'Test')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw BadRequestError for empty content', async () => {
      await expect(
        reportService.addInternalComment(testReport.id, techStaffUser.id, '')
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError for whitespace-only content', async () => {
      await expect(
        reportService.addInternalComment(testReport.id, techStaffUser.id, '   ')
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError for content exceeding max length', async () => {
      const longContent = 'a'.repeat(2001);

      await expect(
        reportService.addInternalComment(testReport.id, techStaffUser.id, longContent)
      ).rejects.toThrow(BadRequestError);
    });

    it('should accept content at max length (2000 chars)', async () => {
      const maxContent = 'a'.repeat(2000);

      const comment = await reportService.addInternalComment(
        testReport.id,
        techStaffUser.id,
        maxContent
      );

      expect(comment.content).toBe(maxContent);
    });

    it('should trim whitespace from content', async () => {
      const comment = await reportService.addInternalComment(
        testReport.id,
        techStaffUser.id,
        '  Test comment  '
      );

      expect(comment.content).toBe('Test comment');
    });
  });

  describe('deleteInternalComment', () => {
    it('should delete own comment successfully', async () => {
      const comment = await reportService.addInternalComment(
        testReport.id,
        techStaffUser.id,
        'Comment to delete'
      );

      await reportService.deleteInternalComment(
        testReport.id,
        comment.id,
        techStaffUser.id
      );

      const comments = await reportService.getInternalComments(testReport.id);
      expect(comments).toHaveLength(0);
    });

    it('should throw InsufficientRightsError when trying to delete someone else\'s comment', async () => {
      const comment = await reportService.addInternalComment(
        testReport.id,
        techStaffUser.id,
        'Tech staff comment'
      );

      await expect(
        reportService.deleteInternalComment(testReport.id, comment.id, proUser.id)
      ).rejects.toThrow(InsufficientRightsError);
    });

    it('should throw NotFoundError for non-existent report', async () => {
      await expect(
        reportService.deleteInternalComment(999999, 1, techStaffUser.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError for non-existent comment', async () => {
      await expect(
        reportService.deleteInternalComment(testReport.id, 999999, techStaffUser.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw BadRequestError if comment does not belong to report', async () => {
      // Create another report
      const anotherReport = await reportRepository.createReport({
        reporterId: citizenUser.id,
        title: 'Another Report',
        description: 'Another description',
        category: ReportCategory.PUBLIC_LIGHTING,
        location: 'POINT(7.6869 45.0703)',
        isAnonymous: false
      }, []);
      createdReportIds.push(anotherReport.id);

      // Add comment to another report
      const comment = await reportService.addInternalComment(
        anotherReport.id,
        techStaffUser.id,
        'Comment on another report'
      );

      // Try to delete using wrong report ID
      await expect(
        reportService.deleteInternalComment(testReport.id, comment.id, techStaffUser.id)
      ).rejects.toThrow(BadRequestError);
    });

    it('should not affect other comments when deleting one', async () => {
      const comment1 = await reportService.addInternalComment(
        testReport.id,
        techStaffUser.id,
        'First comment'
      );
      const comment2 = await reportService.addInternalComment(
        testReport.id,
        proUser.id,
        'Second comment'
      );

      await reportService.deleteInternalComment(
        testReport.id,
        comment1.id,
        techStaffUser.id
      );

      const comments = await reportService.getInternalComments(testReport.id);
      expect(comments).toHaveLength(1);
      expect(comments[0].id).toBe(comment2.id);
    });
  });

  describe('mapCommentToResponse', () => {
    it('should correctly map comment entity to response DTO', async () => {
      const comment = await reportService.addInternalComment(
        testReport.id,
        techStaffUser.id,
        'Test comment'
      );

      expect(comment).toHaveProperty('id');
      expect(comment).toHaveProperty('reportId', testReport.id);
      expect(comment).toHaveProperty('content', 'Test comment');
      expect(comment).toHaveProperty('author');
      expect(comment.author).toHaveProperty('id');
      expect(comment.author).toHaveProperty('username');
      expect(comment.author).toHaveProperty('firstName');
      expect(comment.author).toHaveProperty('lastName');
      expect(comment.author).toHaveProperty('role');
      expect(comment).toHaveProperty('createdAt');
    });
  });
});
