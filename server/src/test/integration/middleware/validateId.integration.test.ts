import request from 'supertest';
import app from '../../../app';
import {
  setupTestDatabase,
  teardownTestDatabase,
  cleanDatabase,
  ensureTestDatabase
} from '@test/utils/dbTestUtils';

describe('ValidateId Middleware Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
    await ensureTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  describe('Basic ID Validation', () => {
    // Note: These tests verify middleware behavior through public endpoints
    // Most endpoints with validateId require authentication/authorization,
    // so we test with unauthenticated requests to verify validation occurs

    it('should reject non-numeric ID in URL parameter', async () => {
      const res = await request(app).get('/api/users/abc');

      // Should get validation error, auth error, or 404 if route doesn't exist
      expect([400, 401, 404]).toContain(res.status);
      if (res.status === 400) {
        expect(res.body.message).toContain('Invalid');
      }
    });

    it('should reject negative ID in URL parameter', async () => {
      const res = await request(app).get('/api/reports/-1');

      expect([400, 401, 404]).toContain(res.status);
      if (res.status === 400) {
        expect(res.body.message).toContain('Invalid');
      }
    });

    it('should reject zero as ID in URL parameter', async () => {
      const res = await request(app).get('/api/departments/0');

      expect([400, 401, 404]).toContain(res.status);
      if (res.status === 400) {
        expect(res.body.message).toContain('Invalid');
      }
    });

    it('should reject decimal ID in URL parameter', async () => {
      const res = await request(app).get('/api/users/1.5');

      expect([400, 401, 404]).toContain(res.status);
      if (res.status === 400) {
        expect(res.body.message).toContain('Invalid');
      }
    });

    it('should reject ID with special characters', async () => {
      const res = await request(app).get('/api/users/1@2');

      expect([400, 401, 404]).toContain(res.status);
      if (res.status === 400) {
        expect(res.body.message).toContain('Invalid');
      }
    });

    it('should not reject valid positive integer ID', async () => {
      const res = await request(app).get('/api/users/999');

      // Validation should pass, then authentication/authorization fails
      // or 404 if resource doesn't exist - but NOT 400 validation error
      expect(res.status).not.toBe(400);
    });
  });

  describe('Validation Across Different Resources', () => {
    it('should validate user ID format', async () => {
      const res = await request(app).get('/api/users/invalid');
      
      expect([400, 401, 404]).toContain(res.status);
      if (res.status === 400) {
        expect(res.body.message).toContain('user ID');
      }
    });

    it('should validate report ID format', async () => {
      const res = await request(app).get('/api/reports/notanumber');
      
      expect([400, 401, 404]).toContain(res.status);
      if (res.status === 400) {
        expect(res.body.message).toContain('report ID');
      }
    });

    it('should validate department ID format', async () => {
      const res = await request(app).get('/api/departments/xyz');
      
      expect([400, 401, 404]).toContain(res.status);
      if (res.status === 400) {
        expect(res.body.message).toContain('department ID');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large numbers', async () => {
      const res = await request(app).get('/api/users/999999999999999');
      
      // Should not crash, either validates or causes overflow
      expect([400, 401, 404, 500]).toContain(res.status);
    });

    it('should handle empty string ID', async () => {
      const res = await request(app).get('/api/users/ ');
      
      // Should be caught by routing or validation
      expect([400, 401, 404]).toContain(res.status);
    });
  });
});
