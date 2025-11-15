"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const municipalityUserController_1 = __importDefault(require("@controllers/municipalityUserController"));
const authMiddleware_1 = require("@middleware/authMiddleware");
const router = express_1.default.Router();
/**
 * @swagger
 * /api/roles:
 *   get:
 *     tags: [Roles]
 *     summary: List municipality roles
 *     description: Returns all available municipality roles (excluding Citizen and Administrator)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of municipality role names
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *               example:
 *                 - "Municipal Public Relations Officer"
 *                 - "Municipal Administrator"
 *                 - "Technical Office Staff Member"
 *                 - "Urban Planning Manager"
 *                 - "Private Building Manager"
 *                 - "Infrastructure Manager"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *              error: "Not authenticated"
 *       403:
 *         description: Forbidden (requires admin role)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Insufficient rights"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Internal server error"
 */
router.get('/', authMiddleware_1.isAdmin, municipalityUserController_1.default.getAllRoles);
exports.default = router;
