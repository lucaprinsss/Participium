"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const authRoutes_1 = __importDefault(require("../../../routes/authRoutes"));
const authController_1 = __importDefault(require("@controllers/authController"));
const authMiddleware_1 = require("@middleware/authMiddleware");
jest.mock('@controllers/authController');
jest.mock('@middleware/authMiddleware');
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, express_session_1.default)({
    secret: 'test-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
}));
app.use('/api/sessions', authRoutes_1.default);
const mockLogin = authController_1.default.login;
const mockGetCurrentUser = authController_1.default.getCurrentUser;
const mockLogout = authController_1.default.logout;
const mockIsLoggedIn = authMiddleware_1.isLoggedIn;
const mockUser = {
    id: '123',
    name: 'Test User',
    email: 'test@example.com',
};
describe('Auth Routes Integration Tests (No Agent)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockIsLoggedIn.mockImplementation((req, res, next) => {
            if (req.session.user) {
                req.user = req.session.user;
                next();
            }
            else {
                res.status(401).json({ error: 'Not authenticated' });
            }
        });
        mockLogin.mockImplementation((req, res) => {
            const { email, password } = req.body;
            if (email === 'test@example.com' && password === 'password123') {
                req.session.user = mockUser;
                res.status(200).json(mockUser);
            }
            else if (email === 'error@example.com') {
                res
                    .status(500)
                    .json({ error: 'Internal server error during authentication' });
            }
            else {
                res.status(401).json({ error: 'Invalid credentials' });
            }
        });
        mockGetCurrentUser.mockImplementation((req, res) => {
            res.status(200).json(req.user);
        });
        mockLogout.mockImplementation((req, res) => {
            req.session.destroy((err) => {
                if (err) {
                    return res
                        .status(500)
                        .json({ error: 'Internal server error during logout' });
                }
                res.clearCookie('connect.sid');
                res.status(200).json({ message: 'Logged out successfully' });
            });
        });
    });
    // --- POST /api/sessions (Login) ---
    describe('POST /api/sessions', () => {
        it('should login with valid credentials and set a session cookie', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/api/sessions')
                .send({ email: 'test@example.com', password: 'password123' });
            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockUser);
            expect(mockLogin).toHaveBeenCalledTimes(1);
            expect(res.headers['set-cookie']).toBeDefined();
        });
        it('should return 401 for invalid credentials', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/api/sessions')
                .send({ email: 'test@example.com', password: 'wrongpassword' });
            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Invalid credentials');
            expect(res.headers['set-cookie']).toBeUndefined();
        });
        it('should return 500 in case of server error during login', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/api/sessions')
                .send({ email: 'error@example.com', password: 'password123' });
            expect(res.status).toBe(500);
            expect(res.body.error).toContain('Internal server error');
        });
    });
    // --- GET /api/sessions/current (User Corrente) ---
    describe('GET /api/sessions/current', () => {
        it('should return 401 if the user is not authenticated', async () => {
            const res = await (0, supertest_1.default)(app).get('/api/sessions/current');
            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Not authenticated');
            expect(mockIsLoggedIn).toHaveBeenCalledTimes(1);
            expect(mockGetCurrentUser).not.toHaveBeenCalled();
        });
        it('should return the current user if authenticated', async () => {
            const loginRes = await (0, supertest_1.default)(app)
                .post('/api/sessions')
                .send({ email: 'test@example.com', password: 'password123' });
            const sessionCookie = loginRes.headers['set-cookie'][0];
            const res = await (0, supertest_1.default)(app)
                .get('/api/sessions/current')
                .set('Cookie', sessionCookie);
            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockUser);
            expect(mockIsLoggedIn).toHaveBeenCalledTimes(1);
            expect(mockGetCurrentUser).toHaveBeenCalledTimes(1);
        });
    });
    // --- DELETE /api/sessions/current (Logout) ---
    describe('DELETE /api/sessions/current', () => {
        it('should return 401 if the user is not authenticated', async () => {
            const res = await (0, supertest_1.default)(app).delete('/api/sessions/current');
            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Not authenticated');
            expect(mockIsLoggedIn).toHaveBeenCalledTimes(1);
            expect(mockLogout).not.toHaveBeenCalled();
        });
        it('should logout the user and destroy the session', async () => {
            const loginRes = await (0, supertest_1.default)(app)
                .post('/api/sessions')
                .send({ email: 'test@example.com', password: 'password123' });
            const sessionCookie = loginRes.headers['set-cookie'][0];
            const logoutRes = await (0, supertest_1.default)(app)
                .delete('/api/sessions/current')
                .set('Cookie', sessionCookie);
            expect(logoutRes.status).toBe(200);
            expect(logoutRes.body.message).toBe('Logged out successfully');
            expect(mockIsLoggedIn).toHaveBeenCalledTimes(1);
            expect(mockLogout).toHaveBeenCalledTimes(1);
            const afterLogoutRes = await (0, supertest_1.default)(app)
                .get('/api/sessions/current')
                .set('Cookie', sessionCookie);
            expect(afterLogoutRes.status).toBe(401);
        });
    });
});
