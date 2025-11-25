import request from 'supertest';
import app from '../../app';
import {
  setupTestDatabase,
  teardownTestDatabase,
  cleanDatabase,
  ensureTestDatabase
} from '@test/utils/dbTestUtils';
import { AppDataSource } from '@database/connection';
import { ReportStatus } from '@models/dto/ReportStatus';
import { ReportCategory } from '@models/dto/ReportCategory';

describe('ReportController E2E Tests - Assigned Reports', () => {
  let technicianId: number;
  let technicianCookies: string[];
  let citizenId: number;

  // Usa utenti di test già presenti in test-data.sql
  const TECHNICIAN_USERNAME = 'teststaffmember';
  const TECHNICIAN_PASSWORD = 'StaffPass123!';
  const CITIZEN_USERNAME = 'testcitizen';
  const CITIZEN_PASSWORD = 'TestPass123!';

  // Helper function to login and get cookies
  const loginAs = async (username: string, password: string): Promise<string[]> => {
    const response = await request(app)
      .post('/api/sessions')
      .send({ username, password })
      .expect(200);
    const cookies = response.headers['set-cookie'];
    return Array.isArray(cookies) ? cookies : [cookies];
  };

  beforeAll(async () => {
    await setupTestDatabase();
    await ensureTestDatabase();

    // Recupera gli id degli utenti di test già presenti
    const techResult = await AppDataSource.query(
      `SELECT id FROM users WHERE username = $1`,
      [TECHNICIAN_USERNAME]
    );
    technicianId = techResult[0].id;

    const citizenResult = await AppDataSource.query(
      `SELECT id FROM users WHERE username = $1`,
      [CITIZEN_USERNAME]
    );
    citizenId = citizenResult[0].id;

    technicianCookies = await loginAs(TECHNICIAN_USERNAME, TECHNICIAN_PASSWORD);
  });

afterAll(async () => {
  await AppDataSource.query(
    `DELETE FROM reports WHERE assignee_id = $1`,
    [technicianId]
  );
  await teardownTestDatabase();
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});

  afterEach(async () => {
    await cleanDatabase();
    await AppDataSource.query(
      `DELETE FROM reports WHERE assignee_id = $1`,
      [technicianId]
    );
  });

  describe('GET /api/reports/assigned/me', () => {
    beforeEach(async () => {
      // Inserisci report assegnati al tecnico
      await AppDataSource.query(
        `INSERT INTO reports 
          (reporter_id, title, description, category, location, status, assignee_id, is_anonymous, created_at)
         VALUES
          ($1, $2, $3, $4, ST_GeogFromText($5), $6, $7, $8, $9),
          ($1, $10, $11, $4, ST_GeogFromText($12), $13, $7, $8, $14),
          ($1, $15, $16, $4, ST_GeogFromText($17), $18, $7, $8, $19)`,
        [
          citizenId,
          'Street light broken',
          'Lamp not working',
          ReportCategory.PUBLIC_LIGHTING,
          'POINT(7.6869005 45.0703393)',
          ReportStatus.ASSIGNED,
          technicianId,
          false,
          new Date('2024-01-01'),
          'Light maintenance needed',
          'Routine check',
          'POINT(7.6932941 45.0692403)',
          ReportStatus.IN_PROGRESS,
          new Date('2024-01-02'),
          'Resolved light issue',
          'Resolved successfully',
          'POINT(7.6782069 45.0625748)',
          ReportStatus.RESOLVED,
          new Date('2024-01-03')
        ]
      );
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/api/reports/assigned/me')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Not authenticated');
    });

    it('should return all assigned reports for authenticated technician', async () => {
      const response = await request(app)
        .get('/api/reports/assigned/me')
        .set('Cookie', technicianCookies)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);

      const titles = response.body.map((r: any) => r.title);
      expect(titles).toContain('Street light broken');
      expect(titles).toContain('Light maintenance needed');
      expect(titles).toContain('Resolved light issue');
      expect(response.body.every((r: any) => r.assigneeId === technicianId)).toBe(true);
    });

    it('should filter reports by status ASSIGNED', async () => {
      const response = await request(app)
        .get('/api/reports/assigned/me')
        .set('Cookie', technicianCookies)
        .query({ status: ReportStatus.ASSIGNED })
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].status).toBe(ReportStatus.ASSIGNED);
      expect(response.body[0].title).toBe('Street light broken');
    });

    it('should filter reports by status IN_PROGRESS', async () => {
      const response = await request(app)
        .get('/api/reports/assigned/me')
        .set('Cookie', technicianCookies)
        .query({ status: ReportStatus.IN_PROGRESS })
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].status).toBe(ReportStatus.IN_PROGRESS);
      expect(response.body[0].title).toBe('Light maintenance needed');
    });

    it('should filter reports by status RESOLVED', async () => {
      const response = await request(app)
        .get('/api/reports/assigned/me')
        .set('Cookie', technicianCookies)
        .query({ status: ReportStatus.RESOLVED })
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].status).toBe(ReportStatus.RESOLVED);
      expect(response.body[0].title).toBe('Resolved light issue');
    });

    it('should return empty array if technician has no assigned reports', async () => {
      await AppDataSource.query(
        `DELETE FROM reports WHERE assignee_id = $1`,
        [technicianId]
      );

      const response = await request(app)
        .get('/api/reports/assigned/me')
        .set('Cookie', technicianCookies)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });
  });
});