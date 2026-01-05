import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import { AppDataSource } from "@database/connection";
import app from "../../../app";
import { UserEntity } from "@models/entity/userEntity";
import { RegisterRequest } from '@models/dto/input/RegisterRequest';
import { userRepository } from '@repositories/userRepository';
import { departmentRoleRepository } from '@repositories/departmentRoleRepository';
import { companyRepository } from '@repositories/companyRepository';
import { In } from 'typeorm';

const random = () => Math.floor(Math.random() * 1000000);
const buildRegisterPayload = (overrides: Partial<Omit<RegisterRequest, 'role'>> = {}) => ({
  username: `citizen_${random()}`,
  first_name: "Test",
  last_name: "Citizen",
  email: `citizen.${random()}@example.com`,
  password: "securePassword123!",
  ...overrides,
});

describe('UserController Integration Tests', () => {
  // Arrat to track created users for cleanup
  let createdUserIds: number[] = [];

  // Setup before all tests
  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });

  // Cleanup after all tests
  afterAll(async () => {
    if (createdUserIds.length > 0) {
      const repository = AppDataSource.getRepository(UserEntity);
      await repository.delete({ id: In(createdUserIds) });
      createdUserIds = [];
    }
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  // Cleanup after each test
  afterEach(async () => {
    if (createdUserIds.length > 0) {
      const repository = AppDataSource.getRepository(UserEntity);
      await repository.delete({ id: In(createdUserIds) });
      createdUserIds = [];
    }
  });

  // ---- POST /api/users (Registrazione) -----
  describe('POST /api/users', () => {

    it('should register a new citizen successfully (201)', async () => {
      const newCitizenData = buildRegisterPayload();

      const response = await request(app)
        .post('/api/users')
        .send(newCitizenData);

      expect(response.status).toBe(201);
      expect(response.body).toBeDefined();
      expect(response.body.id).toBeGreaterThan(0);

      createdUserIds.push(response.body.id);

      expect(response.body.username).toBe(newCitizenData.username);
      expect(response.body.email).toBe(newCitizenData.email);

      expect(response.body.first_name).toBe(newCitizenData.first_name);
      expect(response.body.last_name).toBe(newCitizenData.last_name);

      expect(response.body.roles).toBeDefined();
      expect(Array.isArray(response.body.roles)).toBe(true);
      expect(response.body.roles.some((r: any) => r.role_name === 'Citizen')).toBe(true);

      expect(response.body.password).toBeUndefined();
      expect(response.body.passwordHash).toBeUndefined();

      const dbUser = await AppDataSource.getRepository(UserEntity).findOneBy({ id: response.body.id });
      expect(dbUser).not.toBeNull();
      expect(dbUser?.username).toBe(newCitizenData.username);
    });

    it('should return 400 if required fields are missing', async () => {
      const baseData = buildRegisterPayload();
      const requiredFields: Array<keyof typeof baseData> = ['username', 'email', 'password', 'first_name', 'last_name'];

      for (const field of requiredFields) {
        const invalidData = { ...baseData };
        delete invalidData[field];

        const response = await request(app)
          .post('/api/users')
          .send(invalidData);

        expect(response.status).toBe(400);
        expect(response.body.message).toBeDefined();
      }
    });

    it('should return 400 for an empty body', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    }); it('should return 409 if username already exists', async () => {
      const dynamicUsername = `duplicateUser_${random()}`;
      const existingUserData = buildRegisterPayload({ username: dynamicUsername });

      const res1 = await request(app)
        .post('/api/users')
        .send(existingUserData);
      expect(res1.status).toBe(201);
      createdUserIds.push(res1.body.id);

      const newUserData = buildRegisterPayload({ username: dynamicUsername });
      const response = await request(app)
        .post('/api/users')
        .send(newUserData);

      expect(response.status).toBe(409);

      expect(response.body.message || response.body.error).toBe('Username already exists');
    });

    it('should return 409 if email already exists', async () => {
      const dynamicEmail = `duplicate_${random()}@example.com`;
      const existingUserData = buildRegisterPayload({ email: dynamicEmail });

      const res1 = await request(app)
        .post('/api/users')
        .send(existingUserData);
      expect(res1.status).toBe(201);
      createdUserIds.push(res1.body.id);

      const newUserData = buildRegisterPayload({ email: dynamicEmail });
      const response = await request(app)
        .post('/api/users')
        .send(newUserData);

      expect(response.status).toBe(409);

      expect(response.body.message || response.body.error).toBe('Email already exists');
    });

  });
});

describe('UserController Integration Tests - Get External Maintainers', () => {
  let techStaffAgent: ReturnType<typeof request.agent>;
  let citizenAgent: ReturnType<typeof request.agent>;
  let createdUserIds: number[] = [];
  let createdCompanyIds: number[] = [];

  const r = () => `_${Math.floor(Math.random() * 1000000)}`;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });

  afterAll(async () => {
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
      isVerified: true,
      telegramLinkConfirmed: false,
    });
    createdUserIds.push(techStaffUser.id);

    // Assign tech staff role using user_roles table (V5.0 multi-role support)
    await AppDataSource.getRepository('user_roles').save({
      userId: techStaffUser.id,
      departmentRoleId: techStaffRole.id
    });

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
      isVerified: true,
      telegramLinkConfirmed: false,
    });
    createdUserIds.push(citizenUser.id);

    // Assign citizen role using user_roles table (V5.0 multi-role support)
    await AppDataSource.getRepository('user_roles').save({
      userId: citizenUser.id,
      departmentRoleId: citizenRole.id
    });

    citizenAgent = request.agent(app);
    await citizenAgent.post('/api/sessions').send({
      username: citizenUser.username,
      password: 'Password123!'
    });
  });

  describe('GET /api/users/external-maintainers', () => {
    let companyId: number;
    let externalMaintainerId: number;

    beforeEach(async () => {
      // Create a company
      const company = await companyRepository.create(`Maintenance Co ${r()}`, 'Public Lighting');
      companyId = company.id;
      createdCompanyIds.push(companyId);

      // Create an external maintainer user
      const externalMaintainerRole = await departmentRoleRepository.findByDepartmentAndRole('External Service Providers', 'External Maintainer');
      if (!externalMaintainerRole) throw new Error('External Maintainer role not found');

      const externalMaintainer = await userRepository.createUserWithPassword({
        username: `maintainer${r()}`,
        password: 'Password123!',
        email: `maintainer${r()}@test.com`,
        firstName: 'External',
        lastName: 'Maintainer',
        emailNotificationsEnabled: true,
        companyId: companyId,
        isVerified: true,
      telegramLinkConfirmed: false,
      });
      createdUserIds.push(externalMaintainer.id);
      externalMaintainerId = externalMaintainer.id;

      // Assign external maintainer role using user_roles table (V5.0 multi-role support)
      await AppDataSource.getRepository('user_roles').save({
        userId: externalMaintainer.id,
        departmentRoleId: externalMaintainerRole.id
      });
    });

    it('should get external maintainers by category as technical staff (200)', async () => {
      const response = await techStaffAgent
        .get('/api/users/external-maintainers')
        .query({ category: 'Public Lighting' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      const maintainer = response.body.find((m: any) => m.id === externalMaintainerId);
      expect(maintainer).toBeDefined();
      expect(maintainer.company_name).toBeTruthy();
    });

    it('should return all maintainers without category parameter (200)', async () => {
      const response = await techStaffAgent.get('/api/users/external-maintainers');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should fail for citizen users (403)', async () => {
      const response = await citizenAgent
        .get('/api/users/external-maintainers')
        .query({ category: 'Public Lighting' });

      expect(response.status).toBe(403);
    });

    it('should fail if not authenticated (401)', async () => {
      const unauthAgent = request.agent(app);
      const response = await unauthAgent
        .get('/api/users/external-maintainers')
        .query({ category: 'Public Lighting' });

      expect(response.status).toBe(401);
    });
  });
});

describe('UserController Integration Tests - Notifications', () => {
  let citizenAgent: ReturnType<typeof request.agent>;
  let otherCitizenAgent: ReturnType<typeof request.agent>;
  let citizenUserId: number;
  let otherCitizenUserId: number;
  let notificationId: number;
  let createdUserIds: number[] = [];
  let createdNotificationIds: number[] = [];
  let citizenUsername: string;
  let otherCitizenUsername: string;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Create citizen user
    const citizenDeptRole = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Citizen');
    if (!citizenDeptRole) throw new Error('Citizen role not found');

    citizenUsername = `citizen_notif_${random()}`;
    const citizenUser = await userRepository.createUserWithPassword({
      username: citizenUsername,
      password: 'Password123!',
      email: `${citizenUsername}@test.com`,
      firstName: 'Citizen',
      lastName: 'Notif',
      emailNotificationsEnabled: true,
      isVerified: true,
      telegramLinkConfirmed: false,
    });
    await AppDataSource.getRepository('user_roles').save({
      userId: citizenUser.id,
      departmentRoleId: citizenDeptRole.id
    });
    citizenUserId = citizenUser.id;
    createdUserIds.push(citizenUserId);

    // Create other citizen user
    otherCitizenUsername = `other_citizen_notif_${random()}`;
    const otherCitizenUser = await userRepository.createUserWithPassword({
      username: otherCitizenUsername,
      password: 'Password123!',
      email: `${otherCitizenUsername}@test.com`,
      firstName: 'Other',
      lastName: 'Citizen',
      emailNotificationsEnabled: true,
      isVerified: true,
      telegramLinkConfirmed: false,
    });
    await AppDataSource.getRepository('user_roles').save({
      userId: otherCitizenUser.id,
      departmentRoleId: citizenDeptRole.id
    });
    otherCitizenUserId = otherCitizenUser.id;
    createdUserIds.push(otherCitizenUserId);

    // Login agents
    citizenAgent = request.agent(app);
    await citizenAgent.post('/api/sessions').send({ 
      username: citizenUsername, 
      password: 'Password123!' 
    });

    otherCitizenAgent = request.agent(app);
    await otherCitizenAgent.post('/api/sessions').send({ 
      username: otherCitizenUsername, 
      password: 'Password123!' 
    });
  });

  afterAll(async () => {
    if (createdNotificationIds.length > 0) {
      await AppDataSource.query('DELETE FROM notifications WHERE id = ANY($1)', [createdNotificationIds]);
    }
    if (createdUserIds.length > 0) {
      await AppDataSource.getRepository(UserEntity).delete({ id: In(createdUserIds) });
    }
  });

  beforeEach(async () => {
    // Create a notification for the citizen
    const result = await AppDataSource.query(
      `INSERT INTO notifications (user_id, content, is_read, created_at)
       VALUES ($1, 'Test notification', false, CURRENT_TIMESTAMP)
       RETURNING id`,
      [citizenUserId]
    );
    notificationId = result[0].id;
    createdNotificationIds.push(notificationId);
  });

  afterEach(async () => {
    if (createdNotificationIds.length > 0) {
      await AppDataSource.query('DELETE FROM notifications WHERE id = ANY($1)', [createdNotificationIds]);
      createdNotificationIds = [];
    }
  });

  describe('GET /api/users/notifications', () => {
    it('should return user notifications (200)', async () => {
      const response = await citizenAgent.get('/api/users/notifications');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      const notification = response.body.find((n: any) => n.id === notificationId);
      expect(notification).toBeDefined();
      expect(notification.content).toBe('Test notification');
      expect(notification.isRead).toBe(false);
    });

    it('should return empty array when user has no notifications (200)', async () => {
      const response = await otherCitizenAgent.get('/api/users/notifications');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should return 401 when not authenticated', async () => {
      const unauthAgent = request.agent(app);
      const response = await unauthAgent.get('/api/users/notifications');

      expect(response.status).toBe(401);
    });

    it('should only return current user notifications', async () => {
      // Create notification for other user
      const otherNotif = await AppDataSource.query(
        `INSERT INTO notifications (user_id, content, is_read, created_at)
         VALUES ($1, 'Other user notification', false, CURRENT_TIMESTAMP)
         RETURNING id`,
        [otherCitizenUserId]
      );
      createdNotificationIds.push(otherNotif[0].id);

      const response = await citizenAgent.get('/api/users/notifications');

      expect(response.status).toBe(200);
      const hasOtherNotif = response.body.some((n: any) => n.id === otherNotif[0].id);
      expect(hasOtherNotif).toBe(false);
    });
  });

  describe('PATCH /api/users/notifications/:id', () => {
    it('should mark notification as read (200)', async () => {
      const response = await citizenAgent
        .patch(`/api/users/notifications/${notificationId}`)
        .send({ is_read: true });

      expect(response.status).toBe(200);
      expect(response.body.isRead).toBe(true);

      // Verify in database
      const dbNotif = await AppDataSource.query(
        'SELECT is_read FROM notifications WHERE id = $1',
        [notificationId]
      );
      expect(dbNotif[0].is_read).toBe(true);
    });

    it('should mark notification as unread (200)', async () => {
      // First mark as read
      await AppDataSource.query(
        'UPDATE notifications SET is_read = true WHERE id = $1',
        [notificationId]
      );

      const response = await citizenAgent
        .patch(`/api/users/notifications/${notificationId}`)
        .send({ is_read: false });

      expect(response.status).toBe(200);
      expect(response.body.isRead).toBe(false);
    });

    it('should return 403 when user tries to update other user notification', async () => {
      const response = await otherCitizenAgent
        .patch(`/api/users/notifications/${notificationId}`)
        .send({ is_read: true });

      expect(response.status).toBe(403);
    });

    it('should return 404 when notification does not exist', async () => {
      const response = await citizenAgent
        .patch('/api/users/notifications/999999')
        .send({ is_read: true });

      expect(response.status).toBe(404);
    });

    it('should return 400 with invalid notification ID format', async () => {
      const response = await citizenAgent
        .patch('/api/users/notifications/invalid')
        .send({ is_read: true });

      expect(response.status).toBe(400);
    });

    it('should default to false when is_read is missing', async () => {
      const response = await citizenAgent
        .patch(`/api/users/notifications/${notificationId}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.isRead).toBe(false);
    });

    it('should return 401 when not authenticated', async () => {
      const unauthAgent = request.agent(app);
      const response = await unauthAgent
        .patch(`/api/users/notifications/${notificationId}`)
        .send({ is_read: true });

      expect(response.status).toBe(401);
    });
  });
});