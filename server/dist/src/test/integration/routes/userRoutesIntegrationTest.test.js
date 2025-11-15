"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const userRoutes_1 = __importDefault(require("../../../routes/userRoutes"));
const userController_1 = __importDefault(require("@controllers/userController"));
jest.mock('@controllers/userController');
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/users', userRoutes_1.default);
const mockRegister = userController_1.default.register;
const mockRegisterRequest = {
    username: 'newuser',
    email: 'new@example.com',
    password: 'password123',
    first_name: 'Test',
    last_name: 'User',
};
const mockUserResponse = {
    id: 'xyz-123-abc',
    username: 'newuser',
    email: 'new@example.com',
    first_name: 'Test',
    last_name: 'User',
};
describe('User Routes Integration Tests (Registration)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockRegister.mockImplementation((req, res) => {
            const { username, email, password, first_name, last_name } = req.body;
            if (!username || !email || !password || !first_name || !last_name) {
                return res.status(400).json({
                    error: 'All fields are required: username, email, password, first_name, last_name',
                });
            }
            if (username === 'existinguser') {
                return res.status(409).json({ error: 'Username already exists' });
            }
            if (email === 'existing@example.com') {
                return res.status(409).json({ error: 'Email already exists' });
            }
            return res.status(201).json(mockUserResponse);
        });
    });
    // ---  POST /api/users (Register) ---
    describe('POST /api/users', () => {
        it('should register a new user successfully (201) with user data', async () => {
            const res = await (0, supertest_1.default)(app)
                .post('/api/users')
                .send(mockRegisterRequest);
            expect(res.status).toBe(201);
            expect(res.body).toEqual(mockUserResponse);
            expect(mockRegister).toHaveBeenCalledTimes(1);
        });
        it('should return 400 if required fields are missing', async () => {
            const incompleteRequest = {
                username: 'test',
                email: 'test@example.com',
            };
            const res = await (0, supertest_1.default)(app)
                .post('/api/users')
                .send(incompleteRequest);
            expect(res.status).toBe(400);
            expect(res.body.error).toContain('All fields are required');
            expect(mockRegister).toHaveBeenCalledTimes(1);
        });
        it('should return 409 if username already exists', async () => {
            const conflictRequest = {
                ...mockRegisterRequest,
                username: 'existinguser',
            };
            const res = await (0, supertest_1.default)(app)
                .post('/api/users')
                .send(conflictRequest);
            expect(res.status).toBe(409);
            expect(res.body.error).toBe('Username already exists');
            expect(mockRegister).toHaveBeenCalledTimes(1);
        });
        it('should return 409 if email already exists', async () => {
            const conflictRequest = {
                ...mockRegisterRequest,
                email: 'existing@example.com',
            };
            const res = await (0, supertest_1.default)(app)
                .post('/api/users')
                .send(conflictRequest);
            expect(res.status).toBe(409);
            expect(res.body.error).toBe('Email already exists');
            expect(mockRegister).toHaveBeenCalledTimes(1);
        });
    });
});
