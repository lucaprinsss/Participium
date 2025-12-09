import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { userRepository } from '@repositories/userRepository';
import { departmentRoleRepository } from '@repositories/departmentRoleRepository';
import { reportRepository } from '@repositories/reportRepository';
import { commentRepository } from '@repositories/commentRepository';
import { In } from 'typeorm';
import { AppDataSource } from '@database/connection';
import { ReportCategory } from '@models/dto/ReportCategory';
import { UserEntity } from '@models/entity/userEntity';
import { ReportEntity } from '@models/entity/reportEntity';
import { CommentEntity } from '@models/entity/commentEntity';
import { NotFoundError } from '@models/errors/NotFoundError';

const r = () => `_${Math.floor(Math.random() * 1000000)}`;

describe('CommentRepository Integration Tests', () => {
  let createdUserIds: number[] = [];
  let createdReportIds: number[] = [];
  let createdCommentIds: number[] = [];
  let testUser: UserEntity;
  let testReport: ReportEntity;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });

  afterAll(async () => {
    if (createdCommentIds.length > 0) {
      await (commentRepository as any)['repository'].delete({ id: In(createdCommentIds) });
    }
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
    if (createdCommentIds.length > 0) {
      await (commentRepository as any)['repository'].delete({ id: In(createdCommentIds) });
      createdCommentIds = [];
    }
    if (createdReportIds.length > 0) {
      await (reportRepository as any)['repository'].delete({ id: In(createdReportIds) });
      createdReportIds = [];
    }
    if (createdUserIds.length > 0) {
      await (userRepository as any)['repository'].delete({ id: In(createdUserIds) });
      createdUserIds = [];
    }
  });

  beforeEach(async () => {
    // Create test user
    const citizenRole = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Citizen');
    testUser = await userRepository.createUserWithPassword({
      username: `user${r()}`,
      password: 'Password123!',
      email: `user${r()}@test.com`,
      firstName: 'Test',
      lastName: 'User',
      departmentRoleId: citizenRole!.id,
      isVerified: true
    });
    createdUserIds.push(testUser.id);

    // Create test report
    const reportData = {
      reporterId: testUser.id,
      reporter: testUser,
      title: 'Test Report for Comments',
      description: 'Description for comment testing',
      category: ReportCategory.ROADS,
      location: 'POINT(7.6869 45.0703)',
      isAnonymous: false
    };
    testReport = await reportRepository.createReport(reportData, []);
    createdReportIds.push(testReport.id);
  });

  describe('createComment', () => {
    it('should create a comment with author relation loaded', async () => {
      const commentData = {
        reportId: testReport.id,
        authorId: testUser.id,
        content: 'This is a test comment'
      };

      const createdComment = await commentRepository.createComment(commentData.reportId, commentData.authorId, commentData.content);
      createdCommentIds.push(createdComment.id);

      expect(createdComment).toBeDefined();
      expect(createdComment.id).toBeDefined();
      expect(createdComment.content).toBe(commentData.content);
      expect(createdComment.reportId).toBe(testReport.id);
      expect(createdComment.author).toBeDefined();
      expect(createdComment.author.id).toBe(testUser.id);
      expect(createdComment.author.username).toBe(testUser.username);
      expect(createdComment.createdAt).toBeDefined();
    });

    it('should create multiple comments for same report', async () => {
      const comment1 = await commentRepository.createComment(
        testReport.id,
        testUser.id,
        'First comment'
      );
      createdCommentIds.push(comment1.id);

      const comment2 = await commentRepository.createComment(
        testReport.id,
        testUser.id,
        'Second comment'
      );
      createdCommentIds.push(comment2.id);

      expect(comment1.id).not.toBe(comment2.id);
      expect(comment1.reportId).toBe(comment2.reportId);
    });
  });

  describe('getCommentsByReportId', () => {
    it('should return all comments for a report ordered by creation time', async () => {
      // Create multiple comments
      const comment1 = await commentRepository.createComment(
        testReport.id,
        testUser.id,
        'First comment'
      );
      createdCommentIds.push(comment1.id);

      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const comment2 = await commentRepository.createComment(
        testReport.id,
        testUser.id,
        'Second comment'
      );
      createdCommentIds.push(comment2.id);

      const comments = await commentRepository.getCommentsByReportId(testReport.id);

      expect(comments).toHaveLength(2);
      expect(comments[0].id).toBe(comment1.id);
      expect(comments[1].id).toBe(comment2.id);
      expect(comments[0].author).toBeDefined();
      expect(comments[0].author.username).toBe(testUser.username);
    });

    it('should return empty array for report with no comments', async () => {
      const comments = await commentRepository.getCommentsByReportId(testReport.id);

      expect(comments).toHaveLength(0);
      expect(Array.isArray(comments)).toBe(true);
    });

    it('should return empty array for non-existent report', async () => {
      const comments = await commentRepository.getCommentsByReportId(999999);

      expect(comments).toHaveLength(0);
    });

    it('should load author with department role information', async () => {
      const comment = await commentRepository.createComment(
        testReport.id,
        testUser.id,
        'Test comment'
      );
      createdCommentIds.push(comment.id);

      const comments = await commentRepository.getCommentsByReportId(testReport.id);

      expect(comments[0].author.departmentRole).toBeDefined();
      expect(comments[0].author.departmentRole.role).toBeDefined();
      expect(comments[0].author.departmentRole.role.name).toBe('Citizen');
    });
  });

  describe('getCommentById', () => {
    it('should return comment by id with author relation', async () => {
      const createdComment = await commentRepository.createComment(
        testReport.id,
        testUser.id,
        'Test comment'
      );
      createdCommentIds.push(createdComment.id);

      const foundComment = await commentRepository.getCommentById(createdComment.id);

      expect(foundComment).toBeDefined();
      expect(foundComment!.id).toBe(createdComment.id);
      expect(foundComment!.content).toBe('Test comment');
      expect(foundComment!.author).toBeDefined();
      expect(foundComment!.author.id).toBe(testUser.id);
    });

    it('should return null for non-existent comment', async () => {
      const foundComment = await commentRepository.getCommentById(999999);

      expect(foundComment).toBeNull();
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment successfully', async () => {
      const comment = await commentRepository.createComment(
        testReport.id,
        testUser.id,
        'Comment to delete'
      );
      createdCommentIds.push(comment.id);

      await commentRepository.deleteComment(comment.id);

      const foundComment = await commentRepository.getCommentById(comment.id);
      expect(foundComment).toBeNull();

      // Remove from cleanup array since already deleted
      createdCommentIds = createdCommentIds.filter(id => id !== comment.id);
    });

    it('should throw NotFoundError when deleting non-existent comment', async () => {
      await expect(commentRepository.deleteComment(999999))
        .rejects
        .toThrow(NotFoundError);
    });

    it('should not affect other comments when deleting one', async () => {
      const comment1 = await commentRepository.createComment(
        testReport.id,
        testUser.id,
        'Comment 1'
      );
      createdCommentIds.push(comment1.id);

      const comment2 = await commentRepository.createComment(
        testReport.id,
        testUser.id,
        'Comment 2'
      );
      createdCommentIds.push(comment2.id);

      await commentRepository.deleteComment(comment1.id);

      const remainingComments = await commentRepository.getCommentsByReportId(testReport.id);
      expect(remainingComments).toHaveLength(1);
      expect(remainingComments[0].id).toBe(comment2.id);

      createdCommentIds = createdCommentIds.filter(id => id !== comment1.id);
    });
  });

  describe('CASCADE behavior', () => {
    it('should delete comments when report is deleted', async () => {
      const comment = await commentRepository.createComment(
        testReport.id,
        testUser.id,
        'Comment that will be cascaded'
      );
      createdCommentIds.push(comment.id);

      // Delete the report
      await (reportRepository as any)['repository'].delete({ id: testReport.id });
      createdReportIds = createdReportIds.filter(id => id !== testReport.id);

      // Comment should be automatically deleted
      const foundComment = await commentRepository.getCommentById(comment.id);
      expect(foundComment).toBeNull();

      createdCommentIds = createdCommentIds.filter(id => id !== comment.id);
    });
  });
});
