import express from 'express';
import { isAdmin } from '@middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * /api/roles:
 *   get:
 *     tags: [Roles]
 *     summary: List municipality roles
 *     description: Returns all available municipality roles
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
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Not authenticated"
 */
router.get('/', isAdmin, (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

export default router;
