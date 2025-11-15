"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const passport_1 = __importDefault(require("passport"));
const express_session_1 = __importDefault(require("express-session"));
const swagger_1 = require("@config/swagger");
const passport_2 = require("@config/passport");
const authRoutes_1 = __importDefault(require("@routes/authRoutes"));
const userRoutes_1 = __importDefault(require("@routes/userRoutes"));
const roleRoutes_1 = __importDefault(require("@routes/roleRoutes"));
const municipalityUserRoutes_1 = __importDefault(require("@routes/municipalityUserRoutes"));
const errorMiddelware_1 = require("@middleware/errorMiddelware");
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    // allow dev server on 5173 and 5174 (Vite may switch ports)
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true
}));
app.use(express_1.default.json());
// Session configuration
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || 'participium-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        // In production we require secure cookies (HTTPS) and allow cross-site cookies
        secure: process.env.NODE_ENV === 'production',
        // For development (non-production) use 'lax' so browsers accept the cookie from the dev server/proxy.
        // In production, set to 'none' so cookies are sent in cross-site contexts (requires secure=true).
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));
// Passport configuration
(0, passport_2.configurePassport)();
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// Swagger setup
(0, swagger_1.setupSwagger)(app);
// API routes
app.use("/api/sessions", authRoutes_1.default);
app.use("/api/users", userRoutes_1.default);
app.use("/api/roles", roleRoutes_1.default);
app.use("/api/municipality/users", municipalityUserRoutes_1.default);
// Check endpoint to verify server is running
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});
// Error handling middleware (must be last!)
app.use(errorMiddelware_1.errorHandler);
exports.default = app;
