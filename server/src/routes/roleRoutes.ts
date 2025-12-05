import express from 'express';
import municipalityUserController from '@controllers/municipalityUserController';
import { requireRole } from '@middleware/authMiddleware';
import { SystemRoles } from '@dto/UserRole'; 

const router = express.Router();

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
 *               code: 401
 *               name: "UnauthorizedError"
 *               message: "Not authenticated"
 *       403:
 *         description: Forbidden (requires admin role)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 403
 *               name: "ForbiddenError"
 *               message: "Insufficient rights"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 500
 *               name: "InternalServerError"
 *               message: "Internal server error"
 */
router.get('/', requireRole(SystemRoles.ADMINISTRATOR), municipalityUserController.getAllRoles);

export default router;

