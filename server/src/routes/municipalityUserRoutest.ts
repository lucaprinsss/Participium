import express from 'express';
import { isAdmin } from '@middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * /api/municipality-users:
 *   post:
 *     tags: [Municipality Users]
 *     summary: Create new municipality user
 *     description: Registers a new municipality user with appropriate role
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - role_id
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               role_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Municipality user created successfully
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
 *               error: "All fields are required"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Not authenticated"
 *       403:
 *         description: Forbidden (requires admin role)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Insufficient rights"
 */
router.post('/', isAdmin, (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

/**
 * @swagger
 * /api/municipality-users:
 *   get:
 *     tags: [Municipality Users]
 *     summary: List all municipality users
 *     description: Returns all municipality users (requires admin access)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of municipality users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Not authenticated"
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Insufficient rights"
 */
router.get('/', isAdmin, (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

/**
 * @swagger
 * /api/municipality-users/{id}:
 *   get:
 *     tags: [Municipality Users]
 *     summary: Get municipality user by ID
 *     description: Returns detailed information about a municipality user
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Municipality user not found"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Not authenticated"
 */
router.get('/:id', isAdmin, (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

/**
 * @swagger
 * /api/municipality-users/{id}:
 *   put:
 *     tags: [Municipality Users]
 *     summary: Update municipality user
 *     description: Updates municipality user information and role
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               role_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Municipality user not found"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Not authenticated"
 */
router.put('/:id', isAdmin, (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

/**
 * @swagger
 * /api/municipality-users/{id}:
 *   delete:
 *     tags: [Municipality Users]
 *     summary: Delete municipality user
 *     description: Permanently deletes a municipality user
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       204:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Municipality user not found"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Not authenticated"
 */
router.delete('/:id', isAdmin, (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

export default router;
