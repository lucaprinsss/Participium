import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import { AppDataSource } from '@database/connection';
import app from '../../../app';
import { UserEntity } from '@models/entity/userEntity';
import { ReportEntity } from '@models/entity/reportEntity';
import { userRepository } from '@repositories/userRepository';
import { departmentRoleRepository } from '@repositories/departmentRoleRepository';
import { reportRepository } from '@repositories/reportRepository';
import { In } from 'typeorm';
import { ReportCategory } from '@models/dto/ReportCategory';

const r = () => `_${Math.floor(Math.random() * 1000000)}`;

describe('ReportController - Internal Comments Integration Tests', () => {
  let agent: ReturnType<typeof request.agent>;
  let createdUserIds: number[] = [];
  let createdReportIds: number[] = [];

  let techStaffUser: UserEntity;
  let techStaffCredentials: any;
  let proUser: UserEntity;
  let proCredentials: any;
  let externalUser: UserEntity;
  let externalCredentials: any;
  let citizenUser: UserEntity;
  let citizenCredentials: any;
  let testReport: ReportEntity;

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
  });

  beforeEach(async () => {
    // Create technical staff user
    const techRole = await departmentRoleRepository.findByDepartmentAndRole('Water and Sewer Services Department', 'Water Network staff member');
    techStaffCredentials = {
      username: `tech${r()}`,
      password: 'Password123!',
      email: `tech${r()}@test.com`,
      firstName: 'Tech',
      lastName: 'Staff',
      departmentRoleId: techRole!.id
    };
    techStaffUser = await userRepository.createUserWithPassword({
      ...techStaffCredentials,
      isVerified: true
    });
    createdUserIds.push(techStaffUser.id);

    // Create PRO user
    const proRole = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Municipal Public Relations Officer');
    proCredentials = {
      username: `pro${r()}`,
      password: 'Password123!',
      email: `pro${r()}@test.com`,
      firstName: 'PRO',
      lastName: 'User',
      departmentRoleId: proRole!.id
    };
    proUser = await userRepository.createUserWithPassword({
      ...proCredentials,
      isVerified: true
    });
    createdUserIds.push(proUser.id);

    // Create external maintainer
    const externalRole = await departmentRoleRepository.findByDepartmentAndRole('External Service Providers', 'External Maintainer');
    externalCredentials = {
      username: `external${r()}`,
      password: 'Password123!',
      email: `external${r()}@test.com`,
      firstName: 'External',
      lastName: 'User',
      departmentRoleId: externalRole!.id
    };
    externalUser = await userRepository.createUserWithPassword({
      ...externalCredentials,
      isVerified: true
    });
    createdUserIds.push(externalUser.id);

    // Create citizen user
    const citizenRole = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Citizen');
    citizenCredentials = {
      username: `citizen${r()}`,
      password: 'Password123!',
      email: `citizen${r()}@test.com`,
      firstName: 'Citizen',
      lastName: 'User',
      departmentRoleId: citizenRole!.id
    };
    citizenUser = await userRepository.createUserWithPassword({
      ...citizenCredentials,
      isVerified: true
    });
    createdUserIds.push(citizenUser.id);

    // Create test report
    testReport = await reportRepository.createReport({
      reporterId: citizenUser.id,
      title: 'Test Report for Comments',
      description: 'Description for comment testing',
      category: ReportCategory.ROADS,
      location: 'POINT(7.6869 45.0703)',
      isAnonymous: false
    }, []);
    createdReportIds.push(testReport.id);
  });

  describe('GET /api/reports/:id/internal-comments', () => {
    it('should return comments for technical staff', async () => {
      agent = request.agent(app);
      await agent.post('/api/sessions').send({
        username: techStaffCredentials.username,
        password: techStaffCredentials.password
      });

      // Add a comment first
      await agent
        .post(`/api/reports/${testReport.id}/internal-comments`)
        .send({ content: 'Test comment' });

      const res = await agent
        .get(`/api/reports/${testReport.id}/internal-comments`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0]).toHaveProperty('content', 'Test comment');
      expect(res.body[0]).toHaveProperty('author');
    });

    it('should return comments for PRO', async () => {
      agent = request.agent(app);
      await agent.post('/api/sessions').send({
        username: proCredentials.username,
        password: proCredentials.password
      });

      const res = await agent
        .get(`/api/reports/${testReport.id}/internal-comments`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return comments for external maintainer', async () => {
      agent = request.agent(app);
      await agent.post('/api/sessions').send({
        username: externalCredentials.username,
        password: externalCredentials.password
      });

      const res = await agent
        .get(`/api/reports/${testReport.id}/internal-comments`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 403 for citizen', async () => {
      agent = request.agent(app);
      await agent.post('/api/sessions').send({
        username: citizenCredentials.username,
        password: citizenCredentials.password
      });

      await agent
        .get(`/api/reports/${testReport.id}/internal-comments`)
        .expect(403);
    });

    it('should return 401 if not authenticated', async () => {
      await request(app)
        .get(`/api/reports/${testReport.id}/internal-comments`)
        .expect(401);
    });

    it('should return 400 for invalid report ID', async () => {
      agent = request.agent(app);
      await agent.post('/api/sessions').send({
        username: techStaffCredentials.username,
        password: techStaffCredentials.password
      });

      await agent
        .get('/api/reports/invalid/internal-comments')
        .expect(400);
    });

    it('should return 404 for non-existent report', async () => {
      agent = request.agent(app);
      await agent.post('/api/sessions').send({
        username: techStaffCredentials.username,
        password: techStaffCredentials.password
      });

      await agent
        .get('/api/reports/999999/internal-comments')
        .expect(404);
    });
  });

  describe('POST /api/reports/:id/internal-comments', () => {
    it('should add comment as technical staff', async () => {
      agent = request.agent(app);
      await agent.post('/api/sessions').send({
        username: techStaffCredentials.username,
        password: techStaffCredentials.password
      });

      const res = await agent
        .post(`/api/reports/${testReport.id}/internal-comments`)
        .send({ content: 'New internal comment' })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('content', 'New internal comment');
      expect(res.body).toHaveProperty('author');
      expect(res.body.author.id).toBe(techStaffUser.id);
    });

    it('should add comment as PRO', async () => {
      agent = request.agent(app);
      await agent.post('/api/sessions').send({
        username: proCredentials.username,
        password: proCredentials.password
      });

      const res = await agent
        .post(`/api/reports/${testReport.id}/internal-comments`)
        .send({ content: 'PRO comment' })
        .expect(201);

      expect(res.body.author.id).toBe(proUser.id);
    });

    it('should add comment as external maintainer', async () => {
      agent = request.agent(app);
      await agent.post('/api/sessions').send({
        username: externalCredentials.username,
        password: externalCredentials.password
      });

      const res = await agent
        .post(`/api/reports/${testReport.id}/internal-comments`)
        .send({ content: 'External comment' })
        .expect(201);

      expect(res.body.author.id).toBe(externalUser.id);
    });

    it('should return 400 for missing content', async () => {
      agent = request.agent(app);
      await agent.post('/api/sessions').send({
        username: techStaffCredentials.username,
        password: techStaffCredentials.password
      });

      await agent
        .post(`/api/reports/${testReport.id}/internal-comments`)
        .send({})
        .expect(400);
    });

    it('should return 400 for empty content', async () => {
      agent = request.agent(app);
      await agent.post('/api/sessions').send({
        username: techStaffCredentials.username,
        password: techStaffCredentials.password
      });

      await agent
        .post(`/api/reports/${testReport.id}/internal-comments`)
        .send({ content: '   ' })
        .expect(400);
    });

    it('should return 400 for content too long', async () => {
      agent = request.agent(app);
      await agent.post('/api/sessions').send({
        username: techStaffCredentials.username,
        password: techStaffCredentials.password
      });

      const longContent = 'a'.repeat(2001);
      await agent
        .post(`/api/reports/${testReport.id}/internal-comments`)
        .send({ content: longContent })
        .expect(400);
    });

    it('should return 403 for citizen', async () => {
      agent = request.agent(app);
      await agent.post('/api/sessions').send({
        username: citizenCredentials.username,
        password: citizenCredentials.password
      });

      await agent
        .post(`/api/reports/${testReport.id}/internal-comments`)
        .send({ content: 'Should not work' })
        .expect(403);
    });

    it('should return 401 if not authenticated', async () => {
      await request(app)
        .post(`/api/reports/${testReport.id}/internal-comments`)
        .send({ content: 'Test' })
        .expect(401);
    });

    it('should return 404 for non-existent report', async () => {
      agent = request.agent(app);
      await agent.post('/api/sessions').send({
        username: techStaffCredentials.username,
        password: techStaffCredentials.password
      });

      await agent
        .post('/api/reports/999999/internal-comments')
        .send({ content: 'Test' })
        .expect(404);
    });
  });

  describe('DELETE /api/reports/:reportId/internal-comments/:commentId', () => {
    it('should delete own comment as technical staff', async () => {
      agent = request.agent(app);
      await agent.post('/api/sessions').send({
        username: techStaffCredentials.username,
        password: techStaffCredentials.password
      });

      // Create comment
      const createRes = await agent
        .post(`/api/reports/${testReport.id}/internal-comments`)
        .send({ content: 'Comment to delete' });

      const commentId = createRes.body.id;

      // Delete comment
      await agent
        .delete(`/api/reports/${testReport.id}/internal-comments/${commentId}`)
        .expect(204);

      // Verify deletion
      const getRes = await agent
        .get(`/api/reports/${testReport.id}/internal-comments`);
      expect(getRes.body.length).toBe(0);
    });

    it('should return 403 when trying to delete someone else\'s comment', async () => {
      // Tech staff creates comment
      const techAgent = request.agent(app);
      await techAgent.post('/api/sessions').send({
        username: techStaffCredentials.username,
        password: techStaffCredentials.password
      });

      const createRes = await techAgent
        .post(`/api/reports/${testReport.id}/internal-comments`)
        .send({ content: 'Tech staff comment' });

      const commentId = createRes.body.id;

      // PRO tries to delete
      const proAgent = request.agent(app);
      await proAgent.post('/api/sessions').send({
        username: proCredentials.username,
        password: proCredentials.password
      });

      await proAgent
        .delete(`/api/reports/${testReport.id}/internal-comments/${commentId}`)
        .expect(403);
    });

    it('should return 403 for citizen', async () => {
      agent = request.agent(app);
      await agent.post('/api/sessions').send({
        username: citizenCredentials.username,
        password: citizenCredentials.password
      });

      await agent
        .delete(`/api/reports/${testReport.id}/internal-comments/1`)
        .expect(403);
    });

    it('should return 401 if not authenticated', async () => {
      await request(app)
        .delete(`/api/reports/${testReport.id}/internal-comments/1`)
        .expect(401);
    });

    it('should return 400 for invalid report ID', async () => {
      agent = request.agent(app);
      await agent.post('/api/sessions').send({
        username: techStaffCredentials.username,
        password: techStaffCredentials.password
      });

      await agent
        .delete('/api/reports/invalid/internal-comments/1')
        .expect(400);
    });

    it('should return 400 for invalid comment ID', async () => {
      agent = request.agent(app);
      await agent.post('/api/sessions').send({
        username: techStaffCredentials.username,
        password: techStaffCredentials.password
      });

      await agent
        .delete(`/api/reports/${testReport.id}/internal-comments/invalid`)
        .expect(400);
    });

    it('should return 404 for non-existent report', async () => {
      agent = request.agent(app);
      await agent.post('/api/sessions').send({
        username: techStaffCredentials.username,
        password: techStaffCredentials.password
      });

      await agent
        .delete('/api/reports/999999/internal-comments/1')
        .expect(404);
    });

    it('should return 404 for non-existent comment', async () => {
      agent = request.agent(app);
      await agent.post('/api/sessions').send({
        username: techStaffCredentials.username,
        password: techStaffCredentials.password
      });

      await agent
        .delete(`/api/reports/${testReport.id}/internal-comments/999999`)
        .expect(404);
    });
  });
});
