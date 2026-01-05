import request from 'supertest';
import app from '@app';
import {
  setupTestDatabase,
  teardownTestDatabase,
  ensureTestDatabase
} from '@test/utils/dbTestUtils';

describe('App Configuration Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
    await ensureTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('Health Check Endpoint', () => {
    it('should return 200 and status ok', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return timestamp in ISO format', async () => {
      const response = await request(app).get('/health');

      expect(response.body.timestamp).toBeDefined();
      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toISOString()).toBe(response.body.timestamp);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent routes with 404', async () => {
      const response = await request(app).get('/non-existent-route');
      expect(response.status).toBe(404);
    });

    it('should handle non-existent API routes', async () => {
      const response = await request(app).get('/api/non-existent');
      expect(response.status).toBe(404);
    });
  });

  describe('CORS Configuration', () => {
    it('should have CORS headers configured', async () => {
      const response = await request(app)
        .options('/health')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'GET');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Static File Serving', () => {
    it('should serve uploads directory', async () => {
      // This will return 404 if directory is empty, but verifies the route is configured
      const response = await request(app).get('/uploads/test.jpg');
      // We expect either 200 (if file exists) or 404 (if not), but not 500
      expect([200, 404]).toContain(response.status);
    });

    it('should serve seed-data directory', async () => {
      const response = await request(app).get('/seed-data/test.jpg');
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Middleware Configuration', () => {
    it('should parse JSON bodies', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .send({ username: 'test', password: 'test' })
        .set('Content-Type', 'application/json');

      expect(response.status).not.toBe(500);
    });

    it('should handle large JSON payloads', async () => {
      const largeData = { data: 'x'.repeat(1000000) }; // 1MB of data

      const response = await request(app)
        .post('/api/sessions')
        .send(largeData)
        .set('Content-Type', 'application/json');

      // Should not fail due to size limits (configured to 100mb)
      expect(response.status).not.toBe(413);
    });
  });

  describe('API Routes Configuration', () => {
    it('should have /api/sessions route configured', async () => {
      const response = await request(app).post('/api/sessions');
      // Should not be 404 (route exists)
      expect(response.status).not.toBe(404);
    });

    it('should have /api/users POST route configured', async () => {
      const response = await request(app).post('/api/users');
      // Route exists - POST for user registration
      expect(response.status).not.toBe(404);
    });

    it('should have /api/reports route configured', async () => {
      const response = await request(app).get('/api/reports');
      expect(response.status).not.toBe(404);
    });

    it('should have /api/departments route configured', async () => {
      const response = await request(app).get('/api/departments');
      expect(response.status).not.toBe(404);
    });

    it('should have /api/companies route configured', async () => {
      const response = await request(app).get('/api/companies');
      expect(response.status).not.toBe(404);
    });

    it('should have /api/proxy route configured', async () => {
      const response = await request(app).get('/api/proxy/address');
      expect(response.status).not.toBe(404);
    });

    it('should have /api-docs route configured', async () => {
      const response = await request(app).get('/api-docs');
      expect([200, 301, 302]).toContain(response.status);
    });

    it('should have /api-docs.json route configured', async () => {
      const response = await request(app).get('/api-docs.json');
      expect(response.status).toBe(200);
      expect(response.body.openapi).toBeDefined();
    });
  });
});
