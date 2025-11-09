import express from 'express';
import { isAdmin } from '@middleware/authMiddleware';
import municipalityUserController from '@controllers/municipalityUserController';

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
 *         description: List of municipality roles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserRole'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
             example:
               error: "Not authenticated"
 */
router.get('/', isAdmin, municipalityUserController.getAllRoles);

export default router;
