
import express from 'express';
import UserController from '@controllers/userController';
import { validateRegisterInput } from '../middleware/registerUserMiddleware';

const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   post:
 *     tags: [Citizens]
 *     summary: Register new citizen
 *     description: Register as a citizen to access Participium and submit reports
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Citizen registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *             example:
 *               id: 1
 *               username: "m.rossi"
 *               email: "m.rossi@comune.torino.it"
 *               first_name: "Mario"
 *               last_name: "Rossi"
 *               role: "Citizen"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "All fields are required: username, email, password, first_name, last_name"
 *       409:
 *         description: Username or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Username already exists"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Internal server error"
 */
router.post('/', validateRegisterInput, UserController.register);

export default router;
