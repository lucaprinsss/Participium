import express from 'express';
import departmentController from '@controllers/departmentController';
import { requireRole } from '@middleware/authMiddleware';
import { UserRole } from '@dto/UserRole';

const router = express.Router();

/**
 * @swagger
 * /api/departments:
 *   get:
 *     tags: [Departments]
 *     summary: Get municipality departments
 *     description: Returns all municipality departments (excluding Organization). Admin only.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of municipality departments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Department'
 *             example:
 *               - id: 2
 *                 name: "Water and Sewer Services Department"
 *               - id: 3
 *                 name: "Public Lighting Department"
 *       401:
 *         description: Unauthorized - User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "Not authenticated"
 *       403:
 *         description: Forbidden - User is not an administrator
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "Access denied. Admin role required."
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "Internal server error"
 */
router.get('/', requireRole(UserRole.ADMINISTRATOR), departmentController.getMunicipalityDepartments);

/**
 * @swagger
 * /api/departments/{id}/roles:
 *   get:
 *     tags: [Departments]
 *     summary: Get roles by department
 *     description: Returns all roles available in a specific department. Admin only.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Department ID (must be a positive integer)
 *     responses:
 *       200:
 *         description: List of roles in the department
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Role'
 *             example:
 *               - id: 4
 *                 name: "Department Director"
 *                 description: "Director of a department"
 *               - id: 10
 *                 name: "Electrical Engineer"
 *                 description: "Engineering professional for electrical systems"
 *       400:
 *         description: Bad Request - Invalid department ID (not a positive integer)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "Invalid department ID. Must be a positive integer."
 *       401:
 *         description: Unauthorized - User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "Not authenticated"
 *       403:
 *         description: Forbidden - User is not an administrator
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "Access denied. Admin role required."
 *       404:
 *         description: Not Found - Department does not exist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "Department with ID 999 not found"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "Internal server error"
 */
router.get('/:id/roles', requireRole(UserRole.ADMINISTRATOR), departmentController.getRolesByDepartment);

export default router;
