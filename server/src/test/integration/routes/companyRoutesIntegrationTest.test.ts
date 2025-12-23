// Mock middleware BEFORE any imports - with full logic using headers
jest.mock('@middleware/authMiddleware', () => ({
    isLoggedIn: jest.fn((req: any, res: any, next: any) => {
        const userType = req.headers['x-test-user-type'];
        if (userType) {
            req.user = { id: 99, role: userType };
            next();
        } else {
            res.status(401).json({ error: 'Not authenticated' });
        }
    }),
    requireRole: jest.fn(() => (req: any, res: any, next: any) => {
        const userType = req.headers['x-test-user-type'];
        if (userType === 'ADMIN') {
            req.user = { id: 99, role: 'ADMIN' };
            next();
        } else if (userType === 'CITIZEN' || userType === 'STAFF') {
            res.status(403).json({ error: 'Insufficient rights' });
        } else {
            res.status(401).json({ error: 'Not authenticated' });
        }
    }),
}));

jest.mock('@controllers/companyController', () => ({
    companyController: {
        createCompany: jest.fn((req: any, res: any) => {
            const { name, category } = req.body;
            if (!name || !category) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            if (!['Public Lighting', 'Waste', 'Roads and Urban Furnishings', 'Water', 'Parks'].includes(category)) {
                return res.status(400).json({ error: `Invalid category "${category}"` });
            }
            res.status(201).json({
                id: 1,
                name,
                category,
                created_at: new Date().toISOString(),
            });
        }),
        getAllCompanies: jest.fn((req: any, res: any) => {
            res.status(200).json([
                { id: 1, name: 'Company A', category: 'Public Lighting', created_at: new Date().toISOString() },
                { id: 2, name: 'Company B', category: 'Waste', created_at: new Date().toISOString() },
                { id: 3, name: 'Company C', category: 'Roads and Urban Furnishings', created_at: new Date().toISOString() },
            ]);
        }),
    },
}));

import request from 'supertest';
import express, { Express } from 'express';
import companyRouter from '../../../routes/companyRoutes';

import { companyController } from '@controllers/companyController';
import { isLoggedIn, requireRole } from '@middleware/authMiddleware';

const app: Express = express();

app.use(express.json());
app.use('/api/companies', companyRouter);

const mockCreateCompany = companyController.createCompany as jest.Mock;
const mockGetAllCompanies = companyController.getAllCompanies as jest.Mock;
const mockIsLoggedIn = isLoggedIn as jest.Mock;
const mockRequireRole = requireRole as jest.Mock;

describe('Company Routes Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Reset default implementations
        mockIsLoggedIn.mockImplementation((req, res, next) => {
            const userType = req.headers['x-test-user-type'];
            if (userType) {
                req.user = { id: 99, role: userType };
                next();
            } else {
                res.status(401).json({ error: 'Not authenticated' });
            }
        });

        mockRequireRole.mockImplementation(() => (req: any, res: any, next: any) => {
            const userType = req.headers['x-test-user-type'];
            if (userType === 'ADMIN') {
                req.user = { id: 99, role: 'ADMIN' };
                next();
            } else if (userType === 'CITIZEN' || userType === 'STAFF') {
                res.status(403).json({ error: 'Insufficient rights' });
            } else {
                res.status(401).json({ error: 'Not authenticated' });
            }
        });

        mockCreateCompany.mockImplementation((req, res) => {
            const { name, category } = req.body;
            if (!name || !category) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            if (!['Public Lighting', 'Waste', 'Roads and Urban Furnishings', 'Water', 'Parks'].includes(category)) {
                return res.status(400).json({ error: `Invalid category "${category}"` });
            }
            res.status(201).json({
                id: 1,
                name,
                category,
                created_at: new Date().toISOString(),
            });
        });

        mockGetAllCompanies.mockImplementation((req, res) => {
            res.status(200).json([
                { id: 1, name: 'Company A', category: 'Public Lighting', created_at: new Date().toISOString() },
                { id: 2, name: 'Company B', category: 'Waste', created_at: new Date().toISOString() },
                { id: 3, name: 'Company C', category: 'Roads and Urban Furnishings', created_at: new Date().toISOString() },
            ]);
        });
    });

    // --- POST /api/companies (Create Company) ---
    describe('POST /api/companies', () => {
        it('should return 201 and created company if user is admin', async () => {
            const createData = {
                name: 'New Company',
                category: 'Waste',
            };

            const res = await request(app)
                .post('/api/companies')
                .set('X-Test-User-Type', 'ADMIN')
                .send(createData);

            expect(res.status).toBe(201);
            expect(res.body.name).toBe('New Company');
            expect(res.body.category).toBe('Waste');
            expect(res.body).toHaveProperty('id');
            expect(mockCreateCompany).toHaveBeenCalledTimes(1);
        });

        it('should return 401 if not authenticated', async () => {
            const res = await request(app)
                .post('/api/companies')
                .send({ name: 'Test', category: 'Waste' });

            expect(res.status).toBe(401);
            expect(res.body.error).toContain('Not authenticated');
        });

        it('should return 403 if user is citizen', async () => {
            const res = await request(app)
                .post('/api/companies')
                .set('X-Test-User-Type', 'CITIZEN')
                .send({ name: 'Test', category: 'Waste' });

            expect(res.status).toBe(403);
            expect(res.body.error).toContain('Insufficient rights');
        });

        it('should return 403 if user is non-admin staff', async () => {
            const res = await request(app)
                .post('/api/companies')
                .set('X-Test-User-Type', 'STAFF')
                .send({ name: 'Test', category: 'Waste' });

            expect(res.status).toBe(403);
        });

        it('should return 400 if name is missing', async () => {
            const res = await request(app)
                .post('/api/companies')
                .set('X-Test-User-Type', 'ADMIN')
                .send({ category: 'Waste' });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('Missing required fields');
        });

        it('should return 400 if category is missing', async () => {
            const res = await request(app)
                .post('/api/companies')
                .set('X-Test-User-Type', 'ADMIN')
                .send({ name: 'Test Company' });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('Missing required fields');
        });

        it('should return 400 if category is invalid', async () => {
            const res = await request(app)
                .post('/api/companies')
                .set('X-Test-User-Type', 'ADMIN')
                .send({ name: 'Test Company', category: 'InvalidCategory' });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('Invalid category');
        });

        it('should call isLoggedIn middleware', async () => {
            await request(app)
                .post('/api/companies')
                .set('X-Test-User-Type', 'ADMIN')
                .send({ name: 'Test', category: 'Waste' });

            expect(mockIsLoggedIn).toHaveBeenCalled();
        });
    });

    // --- GET /api/companies (Get All Companies) ---
    describe('GET /api/companies', () => {
        it('should return 200 and companies list if user is admin', async () => {
            const res = await request(app)
                .get('/api/companies')
                .set('X-Test-User-Type', 'ADMIN');

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(3);
            expect(mockGetAllCompanies).toHaveBeenCalledTimes(1);
        });

        it('should return 401 if not authenticated', async () => {
            const res = await request(app).get('/api/companies');

            expect(res.status).toBe(401);
            expect(res.body.error).toContain('Not authenticated');
        });

        it('should return 403 if user is citizen', async () => {
            const res = await request(app)
                .get('/api/companies')
                .set('X-Test-User-Type', 'CITIZEN');

            expect(res.status).toBe(403);
            expect(res.body.error).toContain('Insufficient rights');
        });

        it('should return 403 if user is non-admin staff', async () => {
            const res = await request(app)
                .get('/api/companies')
                .set('X-Test-User-Type', 'STAFF');

            expect(res.status).toBe(403);
        });

        it('should return companies with proper structure', async () => {
            const res = await request(app)
                .get('/api/companies')
                .set('X-Test-User-Type', 'ADMIN');

            expect(res.status).toBe(200);
            res.body.forEach((company: any) => {
                expect(company).toHaveProperty('id');
                expect(company).toHaveProperty('name');
                expect(company).toHaveProperty('category');
                expect(company).toHaveProperty('created_at');
            });
        });

        it('should return empty array if no companies exist', async () => {
            mockGetAllCompanies.mockImplementation((req, res) => {
                res.status(200).json([]);
            });

            const res = await request(app)
                .get('/api/companies')
                .set('X-Test-User-Type', 'ADMIN');

            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });
    });

    // --- Error Handling ---
    describe('Error Handling', () => {
        it('should return 500 if createCompany throws unexpected error', async () => {
            mockCreateCompany.mockImplementation((req, res) => {
                res.status(500).json({ error: 'Internal server error' });
            });

            const res = await request(app)
                .post('/api/companies')
                .set('X-Test-User-Type', 'ADMIN')
                .send({ name: 'Test', category: 'Waste' });

            expect(res.status).toBe(500);
        });

        it('should return 500 if getAllCompanies throws unexpected error', async () => {
            mockGetAllCompanies.mockImplementation((req, res) => {
                res.status(500).json({ error: 'Internal server error' });
            });

            const res = await request(app)
                .get('/api/companies')
                .set('X-Test-User-Type', 'ADMIN');

            expect(res.status).toBe(500);
        });

        it('should return 409 for duplicate company name', async () => {
            mockCreateCompany.mockImplementation((req, res) => {
                res.status(409).json({ error: `Company "${req.body.name}" already exists` });
            });

            const res = await request(app)
                .post('/api/companies')
                .set('X-Test-User-Type', 'ADMIN')
                .send({ name: 'Existing Company', category: 'Waste' });

            expect(res.status).toBe(409);
            expect(res.body.error).toContain('already exists');
        });
    });
});
