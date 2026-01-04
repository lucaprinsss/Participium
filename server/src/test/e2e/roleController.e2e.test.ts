import request from 'supertest';
import app from '../../app';
import {
    setupTestDatabase,
    teardownTestDatabase,
    ensureTestDatabase
} from '@test/utils/dbTestUtils';
import { AppDataSource } from '@database/connection';

/**
 * E2E Tests for Role Controller
 * Tests the roles endpoint: GET /api/roles
 * This endpoint returns all available municipality staff roles (excluding Citizen and Administrator)
 */
describe('RoleController E2E Tests', () => {
    let adminCookies: string[];
    let citizenCookies: string[];
    let municipalityCookies: string[];

    // Test users from test-data.sql
    const ADMIN_USERNAME = 'testadmin';
    const ADMIN_PASSWORD = 'AdminPass123!';
    const CITIZEN_USERNAME = 'testcitizen';
    const CITIZEN_PASSWORD = 'TestPass123!';
    const MUNICIPALITY_USERNAME = 'testmunicipality';
    const MUNICIPALITY_PASSWORD = 'MuniPass123!';


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

        // Login as different users
        adminCookies = await loginAs(ADMIN_USERNAME, ADMIN_PASSWORD);
        citizenCookies = await loginAs(CITIZEN_USERNAME, CITIZEN_PASSWORD);
        municipalityCookies = await loginAs(MUNICIPALITY_USERNAME, MUNICIPALITY_PASSWORD);
    });

    afterAll(async () => {
        await teardownTestDatabase();
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    });

    describe('GET /api/roles', () => {
        // --- Authentication Tests ---
        describe('Authentication', () => {
            it('should return 401 if not authenticated', async () => {
                const response = await request(app)
                    .get('/api/roles')
                    .expect('Content-Type', /json/)
                    .expect(401);

                expect(response.body).toHaveProperty('message');
                expect(response.body.message).toContain('Not authenticated');
            });
        });

        // --- Authorization Tests ---
        describe('Authorization', () => {
            it('should return 403 if authenticated as Citizen', async () => {
                const response = await request(app)
                    .get('/api/roles')
                    .set('Cookie', citizenCookies)
                    .expect('Content-Type', /json/)
                    .expect(403);

                expect(response.body).toHaveProperty('message');
                expect(response.body.message).toContain('Access denied');
            });

            it('should return 403 if authenticated as Municipality Staff', async () => {
                const response = await request(app)
                    .get('/api/roles')
                    .set('Cookie', municipalityCookies)
                    .expect('Content-Type', /json/)
                    .expect(403);

                expect(response.body).toHaveProperty('message');
                expect(response.body.message).toContain('Access denied');
            });

            it('should return 200 if authenticated as Administrator', async () => {
                const response = await request(app)
                    .get('/api/roles')
                    .set('Cookie', adminCookies)
                    .expect('Content-Type', /json/)
                    .expect(200);

                expect(Array.isArray(response.body)).toBe(true);
            });
        });

        // --- Response Content Tests ---
        describe('Response Content', () => {
            it('should return an array of municipality role names', async () => {
                const response = await request(app)
                    .get('/api/roles')
                    .set('Cookie', adminCookies)
                    .expect(200);

                expect(Array.isArray(response.body)).toBe(true);
                expect(response.body.length).toBeGreaterThan(0);

                // All items should be strings
                for (const role of response.body) {
                    expect(typeof role).toBe('string');
                }
            });

            it('should NOT include Citizen role', async () => {
                const response = await request(app)
                    .get('/api/roles')
                    .set('Cookie', adminCookies)
                    .expect(200);

                expect(response.body).not.toContain('Citizen');
            });

            it('should NOT include Administrator role', async () => {
                const response = await request(app)
                    .get('/api/roles')
                    .set('Cookie', adminCookies)
                    .expect(200);

                expect(response.body).not.toContain('Administrator');
            });

            it('should include expected municipality staff roles', async () => {
                const response = await request(app)
                    .get('/api/roles')
                    .set('Cookie', adminCookies)
                    .expect(200);

                // Check for some key municipality roles
                expect(response.body).toContain('Municipal Public Relations Officer');
                expect(response.body).toContain('Department Director');
                expect(response.body).toContain('External Maintainer');
            });

            it('should return at least 10 municipality roles', async () => {
                const response = await request(app)
                    .get('/api/roles')
                    .set('Cookie', adminCookies)
                    .expect(200);

                // We have 14 municipality roles defined in test-data.sql
                expect(response.body.length).toBeGreaterThanOrEqual(10);
            });

            it('should not have duplicate role names', async () => {
                const response = await request(app)
                    .get('/api/roles')
                    .set('Cookie', adminCookies)
                    .expect(200);

                const uniqueRoles = [...new Set(response.body)];
                expect(response.body.length).toBe(uniqueRoles.length);
            });

            it('should contain only non-empty strings', async () => {
                const response = await request(app)
                    .get('/api/roles')
                    .set('Cookie', adminCookies)
                    .expect(200);

                for (const role of response.body) {
                    expect(role.trim().length).toBeGreaterThan(0);
                }
            });
        });

        // --- Session Tests ---
        describe('Session Handling', () => {
            it('should maintain session across multiple requests', async () => {
                // First request
                const response1 = await request(app)
                    .get('/api/roles')
                    .set('Cookie', adminCookies)
                    .expect(200);

                // Second request with same session
                const response2 = await request(app)
                    .get('/api/roles')
                    .set('Cookie', adminCookies)
                    .expect(200);

                // Results should be identical
                expect(response1.body).toEqual(response2.body);
            });

            it('should work after logout and re-login', async () => {
                // Logout
                await request(app)
                    .delete('/api/sessions/current')
                    .set('Cookie', adminCookies)
                    .expect(200);

                // Re-login
                const newCookies = await loginAs(ADMIN_USERNAME, ADMIN_PASSWORD);

                // Make request with new session
                const response = await request(app)
                    .get('/api/roles')
                    .set('Cookie', newCookies)
                    .expect(200);

                expect(Array.isArray(response.body)).toBe(true);

                // Restore original cookies for other tests
                adminCookies = newCookies;
            });
        });

        // --- Edge Cases ---
        describe('Edge Cases', () => {
            it('should return consistent results on repeated calls', async () => {
                const results = [];

                for (let i = 0; i < 3; i++) {
                    const response = await request(app)
                        .get('/api/roles')
                        .set('Cookie', adminCookies)
                        .expect(200);
                    results.push(response.body);
                }

                // All results should be identical
                expect(results[0]).toEqual(results[1]);
                expect(results[1]).toEqual(results[2]);
            });

            it('should not allow POST method', async () => {
                const response = await request(app)
                    .post('/api/roles')
                    .set('Cookie', adminCookies)
                    .send({ name: 'New Role' });

                // Should return 404 (route not found for POST)
                expect(response.status).toBe(404);
            });

            it('should not allow PUT method', async () => {
                const response = await request(app)
                    .put('/api/roles')
                    .set('Cookie', adminCookies)
                    .send({ name: 'Updated Role' });

                // Should return 404 (route not found for PUT)
                expect(response.status).toBe(404);
            });

            it('should not allow DELETE method', async () => {
                const response = await request(app)
                    .delete('/api/roles')
                    .set('Cookie', adminCookies);

                // Should return 404 (route not found for DELETE)
                expect(response.status).toBe(404);
            });
        });

        // --- Response Headers ---
        describe('Response Headers', () => {
            it('should return proper Content-Type header', async () => {
                const response = await request(app)
                    .get('/api/roles')
                    .set('Cookie', adminCookies)
                    .expect(200);

                expect(response.headers['content-type']).toMatch(/application\/json/);
            });
        });
    });
});
