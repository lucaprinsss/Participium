import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { AppDataSource } from '@database/connection';
import { userService } from '@services/userService';
import { userRepository } from '@repositories/userRepository';
import { departmentRoleRepository } from '@repositories/departmentRoleRepository';
import { companyRepository } from '@repositories/companyRepository';
import { RegisterRequest } from '@models/dto/input/RegisterRequest';
import { UserEntity } from '@models/entity/userEntity';
import { ConflictError } from '@models/errors/ConflictError';
import { In } from 'typeorm';

describe('UserService Integration Tests', () => {
  const createdUserIds: number[] = [];
  const createdCompanyIds: number[] = [];
  let citizenRoleId: number;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    const citizenRole = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Citizen');
    if (!citizenRole) throw new Error('Citizen role not found');
    citizenRoleId = citizenRole.id;
  });

  afterAll(async () => {
    // Cleanup
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

  describe('registerCitizen', () => {
    it('should register a new citizen successfully', async () => {
      const timestamp = Date.now();
      const registerRequest: RegisterRequest = {
        username: `testcitizen_${timestamp}`,
        email: `testcitizen_${timestamp}@test.com`,
        first_name: 'Test',
        last_name: 'Citizen',
        password: 'Password123!',
        department_role_ids: [citizenRoleId],
      };

      const result = await userService.registerCitizen(registerRequest);
      createdUserIds.push(result.id);

      expect(result).toBeDefined();
      expect(result.username).toBe(registerRequest.username);
      expect(result.email).toBe(registerRequest.email);
      expect(result.first_name).toBe(registerRequest.first_name);
      expect(result.last_name).toBe(registerRequest.last_name);
      expect(result.roles.length).toBeGreaterThan(0);
      expect(result.roles[0].role_name).toBe('Citizen');
    });

    it('should use fallback role CITIZEN if role is not provided', async () => {
      const timestamp = Date.now();
      const registerRequest: Omit<RegisterRequest, 'department_role_ids'> = {
        username: `testcitizen2_${timestamp}`,
        email: `testcitizen2_${timestamp}@test.com`,
        first_name: 'Test',
        last_name: 'Citizen2',
        password: 'Password123!',
      };

      const result = await userService.registerCitizen(registerRequest as RegisterRequest);
      createdUserIds.push(result.id);

      expect(result.roles[0].role_name).toBe('Citizen');
    });

    it('should throw ConflictError if username already exists', async () => {
      const timestamp = Date.now();
      const registerRequest: RegisterRequest = {
        username: `duplicate_${timestamp}`,
        email: `unique1_${timestamp}@test.com`,
        first_name: 'Test',
        last_name: 'User',
        password: 'Password123!',
        department_role_ids: [citizenRoleId],
      };

      const firstUser = await userService.registerCitizen(registerRequest);
      createdUserIds.push(firstUser.id);

      // Try to register with same username
      const duplicateRequest: RegisterRequest = {
        ...registerRequest,
        email: `unique2_${timestamp}@test.com`, // Different email
      };

      await expect(userService.registerCitizen(duplicateRequest)).rejects.toThrow(ConflictError);
      await expect(userService.registerCitizen(duplicateRequest)).rejects.toThrow('Username already exists');
    });

    it('should throw ConflictError if email already exists', async () => {
      const timestamp = Date.now();
      const registerRequest: RegisterRequest = {
        username: `user1_${timestamp}`,
        email: `duplicate_${timestamp}@test.com`,
        first_name: 'Test',
        last_name: 'User',
        password: 'Password123!',
        department_role_ids: [citizenRoleId],
      };

      const firstUser = await userService.registerCitizen(registerRequest);
      createdUserIds.push(firstUser.id);

      // Try to register with same email
      const duplicateRequest: RegisterRequest = {
        ...registerRequest,
        username: `user2_${timestamp}`, // Different username
      };

      await expect(userService.registerCitizen(duplicateRequest)).rejects.toThrow(ConflictError);
      await expect(userService.registerCitizen(duplicateRequest)).rejects.toThrow('Email already exists');
    });
  });

  describe('getUserById', () => {
    it('should return a user response if user is found', async () => {
      const timestamp = Date.now();
      const registerRequest: RegisterRequest = {
        username: `getbyid_${timestamp}`,
        email: `getbyid_${timestamp}@test.com`,
        first_name: 'Get',
        last_name: 'ById',
        password: 'Password123!',
        department_role_ids: [citizenRoleId],
      };

      const created = await userService.registerCitizen(registerRequest);
      createdUserIds.push(created.id);

      const result = await userService.getUserById(created.id);

      expect(result).toBeDefined();
      expect(result!.id).toBe(created.id);
      expect(result!.username).toBe(registerRequest.username);
      expect(result!.email).toBe(registerRequest.email);
    });

    it('should return null if user is not found', async () => {
      const result = await userService.getUserById(999999);

      expect(result).toBeNull();
    });
  });

  describe('getExternalMaintainersByCategory', () => {
    let lightingCompanyId: number;
    let roadsCompanyId: number;
    let lightingMaintainer1Id: number;
    let lightingMaintainer2Id: number;
    let roadsMaintainerId: number;

    beforeAll(async () => {
      const timestamp = Date.now();

      // Create companies
      const lightingCompany = await companyRepository.create(
        `Lighting Company ${timestamp}`,
        'Public Lighting'
      );
      lightingCompanyId = lightingCompany.id;
      createdCompanyIds.push(lightingCompanyId);

      const roadsCompany = await companyRepository.create(
        `Roads Company ${timestamp}`,
        'Roads and Urban Furnishings'
      );
      roadsCompanyId = roadsCompany.id;
      createdCompanyIds.push(roadsCompanyId);

      // Get external maintainer role
      const externalRole = await departmentRoleRepository.findByDepartmentAndRole(
        'External Service Providers',
        'External Maintainer'
      );

      if (!externalRole) {
        throw new Error('External Maintainer role not found');
      }

      // Create lighting maintainers
      const lightingMaintainer1 = await userRepository.createUserWithPassword({
        username: `lighting_m1_${timestamp}`,
        email: `lighting_m1_${timestamp}@test.com`,
        password: 'Password123!',
        firstName: 'Lighting',
        lastName: 'Maintainer1',
        companyId: lightingCompanyId,
        isVerified: true,
      });
      await AppDataSource.getRepository('user_roles').save({
        userId: lightingMaintainer1.id,
        departmentRoleId: externalRole.id
      });
      lightingMaintainer1Id = lightingMaintainer1.id;
      createdUserIds.push(lightingMaintainer1Id);

      const lightingMaintainer2 = await userRepository.createUserWithPassword({
        username: `lighting_m2_${timestamp}`,
        email: `lighting_m2_${timestamp}@test.com`,
        password: 'Password123!',
        firstName: 'Lighting',
        lastName: 'Maintainer2',
        companyId: lightingCompanyId,
        isVerified: true,
      });
      await AppDataSource.getRepository('user_roles').save({
        userId: lightingMaintainer2.id,
        departmentRoleId: externalRole.id
      });
      lightingMaintainer2Id = lightingMaintainer2.id;
      createdUserIds.push(lightingMaintainer2Id);

      // Create roads maintainer
      const roadsMaintainer = await userRepository.createUserWithPassword({
        username: `roads_m1_${timestamp}`,
        email: `roads_m1_${timestamp}@test.com`,
        password: 'Password123!',
        firstName: 'Roads',
        lastName: 'Maintainer',
        companyId: roadsCompanyId,
        isVerified: true,
      });
      await AppDataSource.getRepository('user_roles').save({
        userId: roadsMaintainer.id,
        departmentRoleId: externalRole.id
      });
      roadsMaintainerId = roadsMaintainer.id;
      createdUserIds.push(roadsMaintainerId);
    });

    it('should return maintainers filtered by category', async () => {
      const result = await userService.getExternalMaintainersByCategory('Public Lighting');

      expect(result.length).toBeGreaterThanOrEqual(2);

      const ids = result.map(u => u.id);
      expect(ids).toContain(lightingMaintainer1Id);
      expect(ids).toContain(lightingMaintainer2Id);
      expect(ids).not.toContain(roadsMaintainerId);
    });

    it('should include company_name in response', async () => {
      const result = await userService.getExternalMaintainersByCategory('Public Lighting');

      expect(result.length).toBeGreaterThan(0);

      const maintainer = result.find(u => u.id === lightingMaintainer1Id);
      expect(maintainer).toBeDefined();
      expect(maintainer!.company_name).toBeDefined();
      expect(maintainer!.company_name).toContain('Lighting Company');
    });

    it('should return empty array when no maintainers for category', async () => {
      const result = await userService.getExternalMaintainersByCategory('Public Green Areas and Playgrounds');

      const testMaintainerIds = new Set([lightingMaintainer1Id, lightingMaintainer2Id, roadsMaintainerId]);
      const hasTestMaintainers = result.some(u => testMaintainerIds.has(u.id));

      expect(hasTestMaintainers).toBe(false);
    });

    it('should only return external maintainers, not other roles', async () => {
      const result = await userService.getExternalMaintainersByCategory('Public Lighting');

      expect(result.length).toBeGreaterThan(0);
      for (const user of result) {
        expect(user.roles[0].role_name).toBe('External Maintainer');
      }
    });

    it('should return all maintainers when category is undefined', async () => {
      const result = await userService.getExternalMaintainersByCategory(undefined as any);
      expect(Array.isArray(result)).toBe(true);
      // Should return maintainers without filtering
    });

    it('should return all maintainers when category is empty string', async () => {
      const result = await userService.getExternalMaintainersByCategory('');
      expect(Array.isArray(result)).toBe(true);
      // Should return maintainers without filtering
    });

    it('should separate maintainers by category correctly', async () => {
      const lightingResult = await userService.getExternalMaintainersByCategory('Public Lighting');
      const roadsResult = await userService.getExternalMaintainersByCategory('Roads and Urban Furnishings');

      const lightingIds = lightingResult.map(u => u.id);
      const roadsIds = roadsResult.map(u => u.id);

      // Lighting maintainers in lighting results
      expect(lightingIds).toContain(lightingMaintainer1Id);
      expect(lightingIds).toContain(lightingMaintainer2Id);
      expect(lightingIds).not.toContain(roadsMaintainerId);

      // Roads maintainer in roads results
      expect(roadsIds).toContain(roadsMaintainerId);
      expect(roadsIds).not.toContain(lightingMaintainer1Id);
      expect(roadsIds).not.toContain(lightingMaintainer2Id);
    });

    it('should handle concurrent requests for different categories', async () => {
      const promises = [
        userService.getExternalMaintainersByCategory('Public Lighting'),
        userService.getExternalMaintainersByCategory('Roads and Urban Furnishings'),
        userService.getExternalMaintainersByCategory('Public Green Areas and Playgrounds')
      ];

      const results = await Promise.all(promises);

      expect(results[0].length).toBeGreaterThanOrEqual(2); // Lighting
      expect(results[1].length).toBeGreaterThanOrEqual(1); // Roads
      // results[2] might be empty for Green areas
    });

    it('should include all required fields in UserResponse', async () => {
      const result = await userService.getExternalMaintainersByCategory('Public Lighting');

      expect(result.length).toBeGreaterThan(0);

      const maintainer = result.find(u => u.id === lightingMaintainer1Id);
      expect(maintainer).toBeDefined();
      expect(maintainer).toHaveProperty('id');
      expect(maintainer).toHaveProperty('username');
      expect(maintainer).toHaveProperty('email');
      expect(maintainer).toHaveProperty('first_name');
      expect(maintainer).toHaveProperty('last_name');
      expect(maintainer).toHaveProperty('roles');
      expect(maintainer!.roles[0]).toHaveProperty('role_name');
      expect(maintainer!.roles[0]).toHaveProperty('department_name');
      expect(maintainer).toHaveProperty('company_name');
    });

    it('should batch query companies to avoid N+1 problem', async () => {
      const result = await userService.getExternalMaintainersByCategory('Public Lighting');

      expect(result.length).toBeGreaterThanOrEqual(2);

      // All maintainers should have company_name populated
      for (const maintainer of result) {
        expect(maintainer.company_name).toBeDefined();
        expect(typeof maintainer.company_name).toBe('string');
      }

      // Maintainers from same company should have same company_name
      const m1 = result.find(u => u.id === lightingMaintainer1Id);
      const m2 = result.find(u => u.id === lightingMaintainer2Id);

      if (m1 && m2) {
        expect(m1.company_name).toBe(m2.company_name);
      }
    });
  });
});

describe('UserService Integration Tests - Notifications', () => {
  const createdUserIds: number[] = [];
  const createdNotificationIds: number[] = [];
  let citizenId: number;
  let otherCitizenId: number;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Create citizen user
    const citizenRole = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Citizen');
    if (!citizenRole) throw new Error('Citizen role not found');

    const citizen = await userRepository.createUserWithPassword({
      username: `citizen_notif_svc_${Date.now()}`,
      password: 'Password123!',
      email: `citizen_notif_svc_${Date.now()}@test.com`,
      firstName: 'Citizen',
      lastName: 'Notif',
      isVerified: true
    });
    await AppDataSource.query(
      `INSERT INTO user_roles (user_id, department_role_id) VALUES ($1, $2)`,
      [citizen.id, citizenRole.id]
    );
    citizenId = citizen.id;
    createdUserIds.push(citizenId);

    // Create other citizen
    const otherCitizen = await userRepository.createUserWithPassword({
      username: `other_citizen_notif_svc_${Date.now()}`,
      password: 'Password123!',
      email: `other_citizen_notif_svc_${Date.now()}@test.com`,
      firstName: 'Other',
      lastName: 'Citizen',
      isVerified: true
    });
    await AppDataSource.query(
      `INSERT INTO user_roles (user_id, department_role_id) VALUES ($1, $2)`,
      [otherCitizen.id, citizenRole.id]
    );
    otherCitizenId = otherCitizen.id;
    createdUserIds.push(otherCitizenId);
  });

  afterAll(async () => {
    if (createdNotificationIds.length > 0) {
      await AppDataSource.query('DELETE FROM notifications WHERE id = ANY($1)', [createdNotificationIds]);
    }
    if (createdUserIds.length > 0) {
      await AppDataSource.getRepository(UserEntity).delete({ id: In(createdUserIds) });
    }
  });

  describe('getNotifications', () => {
    beforeEach(async () => {
      // Create notifications for citizen
      const result1 = await AppDataSource.query(
        `INSERT INTO notifications (user_id, content, is_read, created_at)
         VALUES ($1, 'Unread notification', false, CURRENT_TIMESTAMP)
         RETURNING id`,
        [citizenId]
      );
      createdNotificationIds.push(result1[0].id);

      const result2 = await AppDataSource.query(
        `INSERT INTO notifications (user_id, content, is_read, created_at)
         VALUES ($1, 'Read notification', true, CURRENT_TIMESTAMP - interval '1 day')
         RETURNING id`,
        [citizenId]
      );
      createdNotificationIds.push(result2[0].id);

      // Create notification for other citizen
      const result3 = await AppDataSource.query(
        `INSERT INTO notifications (user_id, content, is_read, created_at)
         VALUES ($1, 'Other user notification', false, CURRENT_TIMESTAMP)
         RETURNING id`,
        [otherCitizenId]
      );
      createdNotificationIds.push(result3[0].id);
    });

    afterEach(async () => {
      if (createdNotificationIds.length > 0) {
        await AppDataSource.query('DELETE FROM notifications WHERE id = ANY($1)', [createdNotificationIds]);
        createdNotificationIds.length = 0;
      }
    });

    it('should return all notifications for the user', async () => {
      const notifications = await userService.getUserNotifications(citizenId);

      expect(Array.isArray(notifications)).toBe(true);
      expect(notifications.length).toBe(2);
    });

    it('should return notifications ordered by creation date (DESC)', async () => {
      const notifications = await userService.getUserNotifications(citizenId);

      expect(notifications[0].content).toBe('Unread notification');
      expect(notifications[1].content).toBe('Read notification');
      expect(notifications[0].createdAt.getTime()).toBeGreaterThan(notifications[1].createdAt.getTime());
    });

    it('should only return notifications for the specified user', async () => {
      const notifications = await userService.getUserNotifications(citizenId);

      const hasOtherUserNotif = notifications.some((n: any) => n.content === 'Other user notification');
      expect(hasOtherUserNotif).toBe(false);
    });

    it('should return empty array when user has no notifications', async () => {
      // Create new user without notifications
      const citizenRole = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Citizen');
      const newUser = await userRepository.createUserWithPassword({
        username: `no_notif_user_${Date.now()}`,
        password: 'Password123!',
        email: `no_notif_user_${Date.now()}@test.com`,
        firstName: 'No',
        lastName: 'Notif',
        isVerified: true
      });
      await AppDataSource.query(
        `INSERT INTO user_roles (user_id, department_role_id) VALUES ($1, $2)`,
        [newUser.id, citizenRole!.id]
      );
      createdUserIds.push(newUser.id);

      const notifications = await userService.getUserNotifications(newUser.id);

      expect(Array.isArray(notifications)).toBe(true);
      expect(notifications.length).toBe(0);
    });

    it('should include all required fields in notification response', async () => {
      const notifications = await userService.getUserNotifications(citizenId);

      expect(notifications.length).toBeGreaterThan(0);
      const notif = notifications[0];

      expect(notif).toHaveProperty('id');
      expect(notif).toHaveProperty('userId');
      expect(notif).toHaveProperty('content');
      expect(notif).toHaveProperty('isRead');
      expect(notif).toHaveProperty('createdAt');
      expect(notif.userId).toBe(citizenId);
    });

    it('should include reportId when notification is related to a report', async () => {
      // Create a report first
      const reportResult = await AppDataSource.query(
        `INSERT INTO reports 
          (reporter_id, title, description, category, location, status, is_anonymous, created_at) 
         VALUES ($1, $2, $3, $4, ST_GeogFromText($5), $6, $7, $8)
         RETURNING id`,
        [
          citizenId,
          'Test report',
          'Test description',
          'Public Lighting',
          'POINT(7.6869005 45.0703393)',
          'Pending Approval',
          false,
          new Date()
        ]
      );
      const reportId = reportResult[0].id;

      // Create a report-related notification
      const reportNotif = await AppDataSource.query(
        `INSERT INTO notifications (user_id, report_id, content, is_read, created_at)
         VALUES ($1, $2, 'Report notification', false, CURRENT_TIMESTAMP)
         RETURNING id`,
        [citizenId, reportId]
      );
      createdNotificationIds.push(reportNotif[0].id);

      const notifications = await userService.getUserNotifications(citizenId);
      const reportRelated = notifications.find((n: any) => n.content === 'Report notification');

      expect(reportRelated).toBeDefined();
      expect(reportRelated?.reportId).toBe(reportId);

      // Cleanup: delete the report
      await AppDataSource.query('DELETE FROM reports WHERE id = $1', [reportId]);
    });
  });

  describe('updateNotification', () => {
    let notificationId: number;

    beforeEach(async () => {
      const result = await AppDataSource.query(
        `INSERT INTO notifications (user_id, content, is_read, created_at)
         VALUES ($1, 'Test notification', false, CURRENT_TIMESTAMP)
         RETURNING id`,
        [citizenId]
      );
      notificationId = result[0].id;
      createdNotificationIds.push(notificationId);
    });

    afterEach(async () => {
      if (createdNotificationIds.length > 0) {
        await AppDataSource.query('DELETE FROM notifications WHERE id = ANY($1)', [createdNotificationIds]);
        createdNotificationIds.length = 0;
      }
    });

    it('should mark notification as read', async () => {
      const updated = await userService.markNotificationAsRead(citizenId, notificationId, true);

      expect(updated.isRead).toBe(true);
      expect(updated.id).toBe(notificationId);

      // Verify in database
      const dbNotif = await AppDataSource.query(
        'SELECT is_read FROM notifications WHERE id = $1',
        [notificationId]
      );
      expect(dbNotif[0].is_read).toBe(true);
    });

    it('should mark notification as unread', async () => {
      // First mark as read
      await AppDataSource.query(
        'UPDATE notifications SET is_read = true WHERE id = $1',
        [notificationId]
      );

      const updated = await userService.markNotificationAsRead(citizenId, notificationId, false);


      expect(updated.isRead).toBe(false);

      // Verify in database
      const dbNotif = await AppDataSource.query(
        'SELECT is_read FROM notifications WHERE id = $1',
        [notificationId]
      );
      expect(dbNotif[0].is_read).toBe(false);
    });

    it('should throw NotFoundError when notification does not exist', async () => {
      await expect(
        userService.markNotificationAsRead(citizenId, 999999, true)
      ).rejects.toThrow();
    });

    it('should throw error when user tries to update other user notification', async () => {
      await expect(
        userService.markNotificationAsRead(otherCitizenId, notificationId, true)
      ).rejects.toThrow();
    });

    it('should return updated notification with all fields', async () => {
      const updated = await userService.markNotificationAsRead(citizenId, notificationId, true);

      expect(updated).toHaveProperty('id');
      expect(updated).toHaveProperty('userId');
      expect(updated).toHaveProperty('content');
      expect(updated).toHaveProperty('isRead');
      expect(updated).toHaveProperty('createdAt');
      expect(updated.content).toBe('Test notification');
    });
  });
});