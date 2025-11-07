import express from 'express';
import authController from '@controllers/authController';
import { isLoggedIn } from '@middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * /api/sessions:
 *   post:
 *     tags: [Authentication]
 *     summary: Login
 *     description: Login and create user session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Invalid username or password"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Internal server error during authentication"
 */
router.post('/', authController.login);

/**
 * @swagger
 * /api/sessions/current:
 *   get:
 *     tags: [Authentication]
 *     summary: Get current user
 *     description: Returns authenticated user data
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *         content:
 *           application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserResponse'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Not authenticated"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Internal server error"
 */
router.get('/current', isLoggedIn, authController.getCurrentUser);

/**
 * @swagger
 * /api/sessions/current:
 *   delete:
 *     tags: [Authentication]
 *     summary: Logout
 *     description: Logout and destroy user session
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "Logged out successfully"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Internal server error during logout"
 */
router.delete('/current', isLoggedIn, authController.logout);

export default router;
