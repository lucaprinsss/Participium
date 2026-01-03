import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { In } from 'typeorm';
import { AppDataSource } from '@database/connection';
import { notificationService } from '@services/notificationService';
import { notificationRepository } from '@repositories/notificationRepository';
import { userRepository } from '@repositories/userRepository';
import { reportRepository } from '@repositories/reportRepository';
import { departmentRoleRepository } from '@repositories/departmentRoleRepository';
import { UserEntity } from '@models/entity/userEntity';
import { ReportEntity } from '@models/entity/reportEntity';
import { NotificationEntity } from '@models/entity/notificationEntity';
import { DepartmentEntity } from '@models/entity/departmentEntity';
import { RoleEntity } from '@models/entity/roleEntity';
import { DepartmentRoleEntity } from '@models/entity/departmentRoleEntity';
import { ReportCategory } from '@models/dto/ReportCategory';
import { NotFoundError } from '@models/errors/NotFoundError';
import { InsufficientRightsError } from '@models/errors/InsufficientRightsError';

const r = () => `_${Math.floor(Math.random() * 1000000)}`;

describe('NotificationService - Integration Tests', () => {
  let createdUserIds: number[] = [];
  let createdReportIds: number[] = [];
  let createdNotificationIds: number[] = [];

  let testUser1: UserEntity;
  let testUser2: UserEntity;
  let testReport: ReportEntity;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Seed Organization and Citizen role
    let orgDept = await AppDataSource.getRepository(DepartmentEntity).findOneBy({ name: 'Organization' });
    if (!orgDept) {
      orgDept = await AppDataSource.getRepository(DepartmentEntity).save({ name: 'Organization', description: 'Organization' });
    }

    const roleNames = ['Citizen'];
    for (const name of roleNames) {
      let role = await AppDataSource.getRepository(RoleEntity).findOneBy({ name });
      if (!role) {
        await AppDataSource.getRepository(RoleEntity).save({ name, description: name });
      }
    }

    const citizenRoleEntity = await AppDataSource.getRepository(RoleEntity).findOneBy({ name: 'Citizen' });
    let citizenDeptRole = await AppDataSource.getRepository(DepartmentRoleEntity).findOneBy({ departmentId: orgDept.id, roleId: citizenRoleEntity!.id });
    if (!citizenDeptRole) {
      await AppDataSource.getRepository(DepartmentRoleEntity).save({ departmentId: orgDept.id, roleId: citizenRoleEntity!.id });
    }
  });

  afterAll(async () => {
    if (createdNotificationIds.length > 0) {
      await AppDataSource.getRepository(NotificationEntity).delete({ id: In(createdNotificationIds) });
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
    if (createdNotificationIds.length > 0) {
      await AppDataSource.getRepository(NotificationEntity).delete({ id: In(createdNotificationIds) });
      createdNotificationIds = [];
    }
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
    // Create test users
    const citizenRole = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Citizen');
    
    testUser1 = await userRepository.createUserWithPassword({
      username: `user1${r()}`,
      password: 'Password123!',
      email: `user1${r()}@test.com`,
      firstName: 'Test',
      lastName: 'User1',
      isVerified: true,
      telegramLinkConfirmed: false,
    });
    await AppDataSource.query(
      `INSERT INTO user_roles (user_id, department_role_id) VALUES ($1, $2)`,
      [testUser1.id, citizenRole!.id]
    );
    createdUserIds.push(testUser1.id);

    testUser2 = await userRepository.createUserWithPassword({
      username: `user2${r()}`,
      password: 'Password123!',
      email: `user2${r()}@test.com`,
      firstName: 'Test',
      lastName: 'User2',
      isVerified: true,
      telegramLinkConfirmed: false,
    });
    await AppDataSource.query(
      `INSERT INTO user_roles (user_id, department_role_id) VALUES ($1, $2)`,
      [testUser2.id, citizenRole!.id]
    );
    createdUserIds.push(testUser2.id);

    // Create test report
    testReport = await reportRepository.createReport({
      reporterId: testUser1.id,
      title: `Test Report${r()}`,
      description: 'Test report for notification integration tests',
      category: ReportCategory.PUBLIC_LIGHTING,
      location: 'POINT(7.6869 45.0703)',
      address: 'Test Address',
      isAnonymous: false,
    }, []);
    createdReportIds.push(testReport.id);
  });

  describe('getUserNotifications', () => {
    it('should return all notifications for a user', async () => {
      // Create multiple notifications for testUser1
      const notification1 = await notificationService.createNotification(
        testUser1.id,
        'Test Notification 1',
        testReport.id
      );
      createdNotificationIds.push(notification1.id);

      const notification2 = await notificationService.createNotification(
        testUser1.id,
        'Test Notification 2',
        testReport.id
      );
      createdNotificationIds.push(notification2.id);

      // Get notifications
      const result = await notificationService.getUserNotifications(testUser1.id);

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('Test Notification 2'); // Most recent first
      expect(result[1].content).toBe('Test Notification 1');
      expect(result[0].isRead).toBe(false);
      expect(result[1].isRead).toBe(false);
    });

    it('should return empty array when user has no notifications', async () => {
      const result = await notificationService.getUserNotifications(testUser2.id);
      expect(result).toHaveLength(0);
    });

    it('should include report details in notifications', async () => {
      const notification = await notificationService.createNotification(
        testUser1.id,
        'Test Notification',
        testReport.id
      );
      createdNotificationIds.push(notification.id);

      const result = await notificationService.getUserNotifications(testUser1.id);

      expect(result).toHaveLength(1);
      expect(result[0].report).toBeDefined();
      expect(result[0].report?.id).toBe(testReport.id);
      expect(result[0].report?.title).toBe(testReport.title);
    });

    it('should order notifications by creation date descending', async () => {
      // Create notifications with slight delay
      const notification1 = await notificationService.createNotification(
        testUser1.id,
        'First notification',
        testReport.id
      );
      createdNotificationIds.push(notification1.id);

      await new Promise(resolve => setTimeout(resolve, 10));

      const notification2 = await notificationService.createNotification(
        testUser1.id,
        'Second notification',
        testReport.id
      );
      createdNotificationIds.push(notification2.id);

      const result = await notificationService.getUserNotifications(testUser1.id);

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('Second notification');
      expect(result[1].content).toBe('First notification');
    });

    it('should only return notifications for the specified user', async () => {
      // Create notifications for different users
      const notification1 = await notificationService.createNotification(
        testUser1.id,
        'User1 Notification',
        testReport.id
      );
      createdNotificationIds.push(notification1.id);

      const notification2 = await notificationService.createNotification(
        testUser2.id,
        'User2 Notification',
        testReport.id
      );
      createdNotificationIds.push(notification2.id);

      const user1Notifications = await notificationService.getUserNotifications(testUser1.id);
      const user2Notifications = await notificationService.getUserNotifications(testUser2.id);

      expect(user1Notifications).toHaveLength(1);
      expect(user1Notifications[0].content).toBe('User1 Notification');

      expect(user2Notifications).toHaveLength(1);
      expect(user2Notifications[0].content).toBe('User2 Notification');
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const notification = await notificationService.createNotification(
        testUser1.id,
        'Test Notification',
        testReport.id
      );
      createdNotificationIds.push(notification.id);

      // Mark as read
      await notificationService.markAsRead(notification.id, testUser1.id);

      // Verify it was marked as read
      const updated = await notificationRepository.findOne({ where: { id: notification.id } });
      expect(updated).toBeDefined();
      expect(updated!.isRead).toBe(true);
    });

    it('should throw NotFoundError when notification does not exist', async () => {
      await expect(
        notificationService.markAsRead(99999, testUser1.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw InsufficientRightsError when user does not own the notification', async () => {
      const notification = await notificationService.createNotification(
        testUser1.id,
        'Test Notification',
        testReport.id
      );
      createdNotificationIds.push(notification.id);

      await expect(
        notificationService.markAsRead(notification.id, testUser2.id)
      ).rejects.toThrow(InsufficientRightsError);
    });

    it('should not throw error when marking already read notification', async () => {
      const notification = await notificationService.createNotification(
        testUser1.id,
        'Test Notification',
        testReport.id
      );
      createdNotificationIds.push(notification.id);

      // Mark as read twice
      await notificationService.markAsRead(notification.id, testUser1.id);
      await notificationService.markAsRead(notification.id, testUser1.id);

      const updated = await notificationRepository.findOne({ where: { id: notification.id } });
      expect(updated!.isRead).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all user notifications as read', async () => {
      // Create multiple unread notifications
      const notification1 = await notificationService.createNotification(
        testUser1.id,
        'Notification 1',
        testReport.id
      );
      createdNotificationIds.push(notification1.id);

      const notification2 = await notificationService.createNotification(
        testUser1.id,
        'Notification 2',
        testReport.id
      );
      createdNotificationIds.push(notification2.id);

      const notification3 = await notificationService.createNotification(
        testUser1.id,
        'Notification 3',
        testReport.id
      );
      createdNotificationIds.push(notification3.id);

      // Mark all as read
      await notificationService.markAllAsRead(testUser1.id);

      // Verify all are marked as read
      const notifications = await notificationService.getUserNotifications(testUser1.id);
      expect(notifications).toHaveLength(3);
      notifications.forEach(n => {
        expect(n.isRead).toBe(true);
      });
    });

    it('should only mark notifications for the specified user', async () => {
      // Create notifications for both users
      const notification1 = await notificationService.createNotification(
        testUser1.id,
        'User1 Notification',
        testReport.id
      );
      createdNotificationIds.push(notification1.id);

      const notification2 = await notificationService.createNotification(
        testUser2.id,
        'User2 Notification',
        testReport.id
      );
      createdNotificationIds.push(notification2.id);

      // Mark all as read for user1 only
      await notificationService.markAllAsRead(testUser1.id);

      // Verify user1 notifications are read
      const user1Notifications = await notificationService.getUserNotifications(testUser1.id);
      expect(user1Notifications[0].isRead).toBe(true);

      // Verify user2 notifications are still unread
      const user2Notifications = await notificationService.getUserNotifications(testUser2.id);
      expect(user2Notifications[0].isRead).toBe(false);
    });

    it('should not throw error when user has no notifications', async () => {
      await expect(
        notificationService.markAllAsRead(testUser2.id)
      ).resolves.not.toThrow();
    });

    it('should not affect already read notifications', async () => {
      // Create one read and one unread notification
      const notification1 = await notificationService.createNotification(
        testUser1.id,
        'Notification 1',
        testReport.id
      );
      createdNotificationIds.push(notification1.id);
      await notificationService.markAsRead(notification1.id, testUser1.id);

      const notification2 = await notificationService.createNotification(
        testUser1.id,
        'Notification 2',
        testReport.id
      );
      createdNotificationIds.push(notification2.id);

      // Mark all as read
      await notificationService.markAllAsRead(testUser1.id);

      // Verify both are read
      const notifications = await notificationService.getUserNotifications(testUser1.id);
      expect(notifications).toHaveLength(2);
      notifications.forEach(n => {
        expect(n.isRead).toBe(true);
      });
    });
  });

  describe('createNotification', () => {
    it('should create a new notification', async () => {
      const result = await notificationService.createNotification(
        testUser1.id,
        'This is a new notification',
        testReport.id
      );
      createdNotificationIds.push(result.id);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.userId).toBe(testUser1.id);
      expect(result.reportId).toBe(testReport.id);
      expect(result.content).toBe('This is a new notification');
      expect(result.isRead).toBe(false);
      expect(result.createdAt).toBeDefined();
    });

    it('should create notification without reportId', async () => {
      const result = await notificationService.createNotification(
        testUser1.id,
        'This is a system notification'
      );
      createdNotificationIds.push(result.id);

      expect(result).toBeDefined();
      expect(result.reportId).toBeNull();
      expect(result.content).toBe('This is a system notification');
    });

    it('should persist notification to database', async () => {
      const created = await notificationService.createNotification(
        testUser1.id,
        'This should be in the database',
        testReport.id
      );
      createdNotificationIds.push(created.id);

      // Retrieve from database
      const retrieved = await notificationRepository.findOne({ where: { id: created.id } });

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(created.id);
      expect(retrieved!.content).toBe('This should be in the database');
    });

    it('should create multiple notifications for same user', async () => {
      const notification1 = await notificationService.createNotification(
        testUser1.id,
        'First notification',
        testReport.id
      );
      createdNotificationIds.push(notification1.id);

      const notification2 = await notificationService.createNotification(
        testUser1.id,
        'Second notification',
        testReport.id
      );
      createdNotificationIds.push(notification2.id);

      const notifications = await notificationService.getUserNotifications(testUser1.id);
      expect(notifications).toHaveLength(2);
    });
  });
});
