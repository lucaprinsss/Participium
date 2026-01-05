import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import { AppDataSource } from '@database/connection';
import app from '../../../app';
import { UserEntity } from '@entity/userEntity';
import { ReportEntity } from '@entity/reportEntity';
import { NotificationEntity } from '@entity/notificationEntity';
import { userRepository } from '@repositories/userRepository';
import { departmentRoleRepository } from '@repositories/departmentRoleRepository';
import { reportRepository } from '@repositories/reportRepository';
import { notificationRepository } from '@repositories/notificationRepository';
import { notificationService } from '@services/notificationService';
import { In } from 'typeorm';
import { DepartmentEntity } from '@models/entity/departmentEntity';
import { DepartmentRoleEntity } from '@models/entity/departmentRoleEntity';
import { RoleEntity } from '@models/entity/roleEntity';
import { ReportCategory } from '@dto/ReportCategory';

const r = () => `_${Math.floor(Math.random() * 1000000)}`;

describe('NotificationController Integration Tests', () => {
  let agent: ReturnType<typeof request.agent>;
  let createdUserIds: number[] = [];
  let createdReportIds: number[] = [];
  let createdNotificationIds: number[] = [];

  let testUser: UserEntity;
  let otherUser: UserEntity;
  let testReport: ReportEntity;

  // Setup database connection
  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Ensure Organization and Citizen role exist
    let orgDept = await AppDataSource.getRepository(DepartmentEntity).findOneBy({ name: 'Organization' });
    if (!orgDept) {
      orgDept = await AppDataSource.getRepository(DepartmentEntity).save({
        name: 'Organization',
        description: 'Organization',
      });
    }

    let citizenRole = await AppDataSource.getRepository(RoleEntity).findOneBy({ name: 'Citizen' });
    if (!citizenRole) {
      citizenRole = await AppDataSource.getRepository(RoleEntity).save({
        name: 'Citizen',
        description: 'Citizen',
      });
    }

    let citizenDeptRole = await AppDataSource.getRepository(DepartmentRoleEntity).findOneBy({
      departmentId: orgDept.id,
      roleId: citizenRole.id,
    });

    if (!citizenDeptRole) {
      await AppDataSource.getRepository(DepartmentRoleEntity).save({
        departmentId: orgDept.id,
        roleId: citizenRole.id,
        department: orgDept,
        role: citizenRole,
      });
    }
  });

  // Final cleanup
  afterAll(async () => {
    if (createdNotificationIds.length > 0) {
      await AppDataSource.getRepository(NotificationEntity).delete({ id: In(createdNotificationIds) });
      createdNotificationIds = [];
    }
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
    if (createdNotificationIds.length > 0) {
      await AppDataSource.getRepository(NotificationEntity).delete({ id: In(createdNotificationIds) });
      createdNotificationIds = [];
    }
    if (createdReportIds.length > 0) {
      await AppDataSource.getRepository(ReportEntity).delete({ id: In(createdReportIds) });
      createdReportIds = [];
    }
    if (createdUserIds.length > 0) {
      await AppDataSource.getRepository(UserEntity).delete({ id: In(createdUserIds) });
      createdUserIds = [];
    }
  });

  // Setup before each test
  beforeEach(async () => {
    agent = request.agent(app);

    const citizenRole = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Citizen');

    // Create test user
    testUser = await userRepository.createUserWithPassword({
      username: `testuser${r()}`,
      password: 'Password123!',
      email: `testuser${r()}@test.com`,
      firstName: 'Test',
      lastName: 'User',
      isVerified: true,
      telegramLinkConfirmed: false,
    });
    await AppDataSource.query(`INSERT INTO user_roles (user_id, department_role_id) VALUES ($1, $2)`, [
      testUser.id,
      citizenRole!.id,
    ]);
    createdUserIds.push(testUser.id);

    // Create other user
    otherUser = await userRepository.createUserWithPassword({
      username: `otheruser${r()}`,
      password: 'Password123!',
      email: `otheruser${r()}@test.com`,
      firstName: 'Other',
      lastName: 'User',
      isVerified: true,
      telegramLinkConfirmed: false,
    });
    await AppDataSource.query(`INSERT INTO user_roles (user_id, department_role_id) VALUES ($1, $2)`, [
      otherUser.id,
      citizenRole!.id,
    ]);
    createdUserIds.push(otherUser.id);

    // Create test report
    testReport = await reportRepository.createReport({
      reporterId: testUser.id,
      title: `Test Report${r()}`,
      description: 'Test report for notification integration tests',
      category: ReportCategory.PUBLIC_LIGHTING,
      location: 'POINT(7.6869 45.0703)',
      address: 'Test Address',
      isAnonymous: false,
    }, []);
    createdReportIds.push(testReport.id);

    // Login the test user
    const loginResponse = await agent.post('/api/sessions').send({
      username: testUser.username,
      password: 'Password123!',
    });
    
    if (loginResponse.status !== 200) {
      throw new Error(`Login failed with status ${loginResponse.status}`);
    }
  });

  describe('GET /api/users/notifications', () => {
    it('should return all notifications for authenticated user', async () => {
      // Create notifications for testUser
      const notification1 = await notificationService.createNotification(
        testUser.id,
        'Test Notification 1',
        testReport.id
      );
      createdNotificationIds.push(notification1.id);

      const notification2 = await notificationService.createNotification(
        testUser.id,
        'Test Notification 2',
        testReport.id
      );
      createdNotificationIds.push(notification2.id);

      const response = await agent.get('/api/users/notifications').expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].content).toBe('Test Notification 2'); // Most recent first
      expect(response.body[1].content).toBe('Test Notification 1');
    });

    it('should return empty array when user has no notifications', async () => {
      const response = await agent.get('/api/users/notifications').expect(200);
      expect(response.body).toHaveLength(0);
    });

    it('should not return notifications from other users', async () => {
      // Create notification for testUser
      const notification1 = await notificationService.createNotification(
        testUser.id,
        'Test User Notification',
        testReport.id
      );
      createdNotificationIds.push(notification1.id);

      // Create notification for otherUser
      const notification2 = await notificationService.createNotification(
        otherUser.id,
        'Other User Notification',
        testReport.id
      );
      createdNotificationIds.push(notification2.id);

      const response = await agent.get('/api/users/notifications').expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].content).toBe('Test User Notification');
    });

    it('should return 401 when user is not authenticated', async () => {
      const unauthenticatedAgent = request.agent(app);
      const response = await unauthenticatedAgent.get('/api/users/notifications').expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should include report details in notifications', async () => {
      const notification = await notificationService.createNotification(
        testUser.id,
        'Test Notification',
        testReport.id
      );
      createdNotificationIds.push(notification.id);

      const response = await agent.get('/api/users/notifications').expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].reportId).toBeDefined();
      expect(response.body[0].reportId).toBe(testReport.id);
    });

    it('should include isRead status in notifications', async () => {
      const notification = await notificationService.createNotification(
        testUser.id,
        'Test Notification',
        testReport.id
      );
      createdNotificationIds.push(notification.id);

      const response = await agent.get('/api/users/notifications').expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].isRead).toBe(false);
    });
  });

  describe('PATCH /api/users/notifications/:id', () => {
    it('should mark notification as read', async () => {
      const notification = await notificationService.createNotification(
        testUser.id,
        'Test Notification',
        testReport.id
      );
      createdNotificationIds.push(notification.id);

      const response = await agent.patch(`/api/users/notifications/${notification.id}`).send({ is_read: true }).expect(200);

      expect(response.body.isRead).toBe(true);
      expect(response.body.id).toBe(notification.id);

      // Verify it was marked as read
      const updated = await notificationRepository.findOne({ where: { id: notification.id } });
      expect(updated!.isRead).toBe(true);
    });

    it('should return 404 when notification does not exist', async () => {
      const response = await agent.patch('/api/users/notifications/99999').send({ is_read: true }).expect(404);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 403 when user does not own the notification', async () => {
      // Create notification for otherUser
      const notification = await notificationService.createNotification(
        otherUser.id,
        'Other User Notification',
        testReport.id
      );
      createdNotificationIds.push(notification.id);

      // testUser tries to mark it as read
      const response = await agent.patch(`/api/users/notifications/${notification.id}`).send({ is_read: true }).expect(403);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 when user is not authenticated', async () => {
      const notification = await notificationService.createNotification(
        testUser.id,
        'Test Notification',
        testReport.id
      );
      createdNotificationIds.push(notification.id);

      const unauthenticatedAgent = request.agent(app);
      const response = await unauthenticatedAgent.patch(`/api/users/notifications/${notification.id}`).expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should not throw error when marking already read notification', async () => {
      const notification = await notificationService.createNotification(
        testUser.id,
        'Test Notification',
        testReport.id
      );
      createdNotificationIds.push(notification.id);

      // Mark as read twice
      await agent.patch(`/api/users/notifications/${notification.id}`).send({ is_read: true }).expect(200);
      await agent.patch(`/api/users/notifications/${notification.id}`).send({ is_read: true }).expect(200);

      const updated = await notificationRepository.findOne({ where: { id: notification.id } });
      expect(updated!.isRead).toBe(true);
    });

    it('should return 400 for invalid notification ID format', async () => {
      const response = await agent.patch('/api/users/notifications/invalid').expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });
});
