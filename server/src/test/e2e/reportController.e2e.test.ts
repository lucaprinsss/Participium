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
  let citizenCookies: string[];

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
    citizenCookies = await loginAs(CITIZEN_USERNAME, CITIZEN_PASSWORD);
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

  describe('POST /api/reports', () => {
    it('should create a new report successfully', async () => {
      const newReport = {
        title: 'Valid test report title',
        description: 'This is a valid test description with sufficient length',
        category: ReportCategory.ROADS,
        location: {
            latitude: 45.0703393,
            longitude: 7.6869005,
            address: 'Via Roma 1, Torino'
          },
          isAnonymous: false,
          photos: ['data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD86P8Ag5t/4Lpftzf8E4v+CwnxO+DPwH+P3/Cvfht4e8N/D2+0vQf+FZeBNc+zz6j4C0PUL2T7XrPhu+vJvMvLu4l2vcuqbyqKqKqqP6PP+CL3/BVD4+f8FMP2DPDnxp+P3wz+Gfwy8U69r2uaReeG/h1qniG/0q1i026WCKZJvEum6ddmR1BLAwBQRwSea/zsP+D3X/lM98Z/+xJ+F/8A6qfRK/0Gf+Dbf/lBF+zJ/wBhzx1/6l7ygD/9k=']
      };

      const response = await request(app)
        .post('/api/reports')
        .set('Cookie', citizenCookies)
        .send(newReport)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(newReport.title);
      expect(response.body.reporterId).toBe(citizenId);
      expect(response.body.status).toBe(ReportStatus.PENDING_APPROVAL);
    });

    it('should return 401 if user is not authenticated', async () => {
      const newReport = {
        title: 'Valid unauthorized report',
        description: 'This is a valid description for an unauthorized report',
        category: ReportCategory.ROADS,
        location: {
          latitude: 45.0703393,
          longitude: 7.6869005,
          address: 'Via Roma 1, Torino'
        },
        isAnonymous: false
      };

      await request(app)
        .post('/api/reports')
        .send(newReport)
        .expect(401);
    });

    it('should return 400 for invalid report data', async () => {
      const invalidReport = {
        // title is missing
        description: 'This is a test description',
        category: ReportCategory.ROADS,
        location: {
          latitude: 45.0703393,
          longitude: 7.6869005,
          address: 'Via Roma 1, Torino'
        },
        isAnonymous: false
      };

      await request(app)
        .post('/api/reports')
        .set('Cookie', citizenCookies)
        .send(invalidReport)
        .expect(400);
    });
  });

  describe('GET /api/reports', () => {
    beforeEach(async () => {
      await cleanDatabase();
      // Insert some reports for testing
      await AppDataSource.query(
        `INSERT INTO reports 
          (reporter_id, title, description, category, location, status, is_anonymous, created_at)
         VALUES
          ($1, $2, $3, $4, ST_GeogFromText($5), $6, $7, $8),
          ($1, $9, $10, $11, ST_GeogFromText($12), $13, $7, $14)`,
        [
          citizenId,
          'Report 1 Title',
          'Valid description for report 1',
          ReportCategory.PUBLIC_LIGHTING,
          'POINT(7.68 45.07)',
          ReportStatus.PENDING_APPROVAL,
          false,
          new Date(),
          'Report 2 Title',
          'Valid description for report 2',
          ReportCategory.ROADS,
          'POINT(7.69 45.06)',
          ReportStatus.ASSIGNED,
          new Date(),
        ]
      );
    });

    it('should return all reports for authenticated user', async () => {
      const response = await request(app)
        .get('/api/reports')
        .set('Cookie', citizenCookies)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].status).toBe(ReportStatus.ASSIGNED);
    });

    it('should filter reports by status', async () => {
      const response = await request(app)
        .get('/api/reports')
        .set('Cookie', citizenCookies)
        .query({ status: ReportStatus.ASSIGNED })
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].status).toBe(ReportStatus.ASSIGNED);
    });

    it('should filter reports by category', async () => {
      const response = await request(app)
        .get('/api/reports')
        .set('Cookie', citizenCookies)
        .query({ category: ReportCategory.ROADS })
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].category).toBe(ReportCategory.ROADS);
    });

    it('should filter reports by status and category', async () => {
      const response = await request(app)
        .get('/api/reports')
        .set('Cookie', citizenCookies)
        .query({ status: ReportStatus.ASSIGNED, category: ReportCategory.ROADS })
        .expect(200);

      expect(response.body.length).toBe(1);
    });

    it('should return 401 if user is not authenticated', async () => {
      await request(app)
        .get('/api/reports')
        .expect(401);
    });
  });

  describe('GET /api/reports/map', () => {
    beforeEach(async () => {
      // Inserisci report con diverse categorie e stati per la mappa
      await AppDataSource.query(
        `INSERT INTO reports 
          (reporter_id, title, description, category, location, status, assignee_id, is_anonymous, created_at)
         VALUES
          ($1, $2, $3, $4, ST_GeogFromText($5), $6, NULL, $7, $8),
          ($1, $9, $10, $11, ST_GeogFromText($12), $13, $14, $7, $15),
          ($1, $16, $17, $18, ST_GeogFromText($19), $20, $14, $7, $21),
          ($1, $22, $23, $24, ST_GeogFromText($25), $26, $14, $7, $27)`,
        [
          citizenId,
          // Report 1 - PENDING_APPROVAL
          'Broken sidewalk',
          'Sidewalk needs repair',
          ReportCategory.ROADS,
          'POINT(7.6869005 45.0703393)',
          ReportStatus.PENDING_APPROVAL,
          false,
          new Date('2024-01-01'),
          // Report 2 - ASSIGNED
          'Street light broken map',
          'Lamp not working',
          ReportCategory.PUBLIC_LIGHTING,
          'POINT(7.6932941 45.0692403)',
          ReportStatus.ASSIGNED,
          technicianId,
          new Date('2024-01-02'),
          // Report 3 - IN_PROGRESS
          'Graffiti on wall',
          'Graffiti removal needed',
          ReportCategory.OTHER,
          'POINT(7.6782069 45.0625748)',
          ReportStatus.IN_PROGRESS,
          new Date('2024-01-03'),
          // Report 4 - RESOLVED
          'Trash overflow',
          'Trash bin is full',
          ReportCategory.WASTE,
          'POINT(7.6950000 45.0700000)',
          ReportStatus.RESOLVED,
          new Date('2024-01-04')
        ]
      );
    });

    // it('should return all reports for the map', async () => {
    //   const response = await request(app)
    //     .get('/api/reports/map')
    //     .set('Cookie', citizenCookies)
    //     .expect('Content-Type', /json/)
    //     .expect(200);

    //   expect(Array.isArray(response.body)).toBe(true);
    //   expect(response.body.length).toBe(4);

    //   // Verifica che ogni report abbia i campi necessari per la mappa
    //   response.body.forEach((report: any) => {
    //     expect(report).toHaveProperty('id');
    //     expect(report).toHaveProperty('title');
    //     expect(report).toHaveProperty('category');
    //     expect(report).toHaveProperty('status');
    //     expect(report).toHaveProperty('location');
    //     expect(report.location).toHaveProperty('latitude');
    //     expect(report.location).toHaveProperty('longitude');
    //   });
    // });

    it('should filter reports by category', async () => {
      const response = await request(app)
        .get('/api/reports/map')
        .set('Cookie', citizenCookies)
        .query({ category: ReportCategory.PUBLIC_LIGHTING })
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].category).toBe(ReportCategory.PUBLIC_LIGHTING);
      expect(response.body[0].title).toBe('Street light broken map');
    });

    // it('should filter reports by status', async () => {
    //   const response = await request(app)
    //     .get('/api/reports/map')
    //     .set('Cookie', citizenCookies)
    //     .query({ status: ReportStatus.ASSIGNED })
    //     .expect(200);

    //   expect(response.body.length).toBe(1);
    //   expect(response.body[0].status).toBe(ReportStatus.ASSIGNED);
    //   expect(response.body[0].title).toBe('Street light broken map');
    // });

    // it('should filter reports by multiple statuses', async () => {
    //   const response = await request(app)
    //     .get('/api/reports/map')
    //     .set('Cookie', citizenCookies)
    //     .query({ status: `${ReportStatus.ASSIGNED},${ReportStatus.IN_PROGRESS}` })
    //     .expect(200);

    //   expect(response.body.length).toBe(2);
    //   const statuses = response.body.map((r: any) => r.status);
    //   expect(statuses).toContain(ReportStatus.ASSIGNED);
    //   expect(statuses).toContain(ReportStatus.IN_PROGRESS);
    // });

    it('should filter reports by category and status', async () => {
      const response = await request(app)
        .get('/api/reports/map')
        .set('Cookie', citizenCookies)
        .query({ 
          category: ReportCategory.PUBLIC_LIGHTING,
          status: ReportStatus.ASSIGNED
        })
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].category).toBe(ReportCategory.PUBLIC_LIGHTING);
      expect(response.body[0].status).toBe(ReportStatus.ASSIGNED);
    });

    it('should return empty array when no reports match filters', async () => {
      const response = await request(app)
        .get('/api/reports/map')
        .set('Cookie', citizenCookies)
        .query({ 
          category: ReportCategory.ROADS,
          status: ReportStatus.RESOLVED
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    // it('should exclude rejected reports from map', async () => {
    //   // Aggiungi un report rifiutato
    //   await AppDataSource.query(
    //     `INSERT INTO reports 
    //       (reporter_id, title, description, category, location, status, is_anonymous, rejection_reason, created_at)
    //      VALUES ($1, $2, $3, $4, ST_GeogFromText($5), $6, $7, $8, $9)`,
    //     [
    //       citizenId,
    //       'Rejected report',
    //       'This was rejected',
    //       ReportCategory.OTHER,
    //       'POINT(7.6800000 45.0650000)',
    //       ReportStatus.REJECTED,
    //       false,
    //       'Invalid report',
    //       new Date('2024-01-05')
    //     ]
    //   );

    //   const response = await request(app)
    //     .get('/api/reports/map')
    //     .set('Cookie', citizenCookies)
    //     .expect(200);

    //   // Non dovrebbe includere il report rifiutato
    //   expect(response.body.length).toBe(4);
    //   expect(response.body.every((r: any) => r.status !== ReportStatus.REJECTED)).toBe(true);
    // });

    it('should return reports with valid geographic coordinates', async () => {
      const response = await request(app)
        .get('/api/reports/map')
        .set('Cookie', citizenCookies)
        .expect(200);

      response.body.forEach((report: any) => {
        expect(report.location.latitude).toBeGreaterThanOrEqual(-90);
        expect(report.location.latitude).toBeLessThanOrEqual(90);
        expect(report.location.longitude).toBeGreaterThanOrEqual(-180);
        expect(report.location.longitude).toBeLessThanOrEqual(180);
      });
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/reports/map')
        .expect(401);

      expect(response.body).toHaveProperty('name');
      expect(response.body.name).toBe('UnauthorizedError');
    });
  });
});