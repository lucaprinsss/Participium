import express from 'express';
import citizenController from '@controllers/citizenController';

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
 */
router.post('/', (req, res, next) => 
  citizenController.register(req, res, next)
);

export default router;
