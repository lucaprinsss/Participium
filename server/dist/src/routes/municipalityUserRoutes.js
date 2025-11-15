"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("@middleware/authMiddleware");
const municipalityUserController_1 = __importDefault(require("@controllers/municipalityUserController"));
const router = express_1.default.Router();
/**
 * @swagger
 * /api/municipality/users:
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
 *               - first_name
 *               - last_name
 *               - role_name
 *             properties:
 *               username:
 *                 type: string
 *                 example: "m.rossi"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "m.rossi@comune.torino.it"
 *               password:
 *                 type: string
 *                 example: "SecurePass123!"
 *               first_name:
 *                 type: string
 *                 example: "Mario"
 *               last_name:
 *                 type: string
 *                 example: "Rossi"
 *               role_name:
 *                 type: string
 *                 description: Role name for the user
 *                 example: "Municipal Administrator"
 *               department_name:
 *                 type: string
 *                 description: Department name (optional, defaults to "Organization")
 *                 example: "Administration"
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
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Internal server error"
 *       409:
 *         description: Conflict error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Username or email already exists"
 */
router.post('/', authMiddleware_1.isAdmin, municipalityUserController_1.default.createMunicipalityUser);
/**
 * @swagger
 * /api/municipality/users:
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
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Internal server error"
 */
router.get('/', authMiddleware_1.isAdmin, municipalityUserController_1.default.getAllMunicipalityUsers);
/**
 * @swagger
 * /api/municipality/users/{id}:
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
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "All fields are required"
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
router.get('/:id', authMiddleware_1.isAdmin, municipalityUserController_1.default.getMunicipalityUserById);
/**
 * @swagger
 * /api/municipality/users/{id}:
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
 *                 example: "Mario"
 *               last_name:
 *                 type: string
 *                 example: "Rossi"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "mario.rossi@comune.it"
 *               role_name:
 *                 type: string
 *                 description: New role name for the user
 *                 example: "Technical Office Staff Member"
 *               department_name:
 *                 type: string
 *                 description: New department name (optional)
 *                 example: "Technical Office"
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
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "All fields are required"
 *       403:
 *         description: Forbidden (requires admin role)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Insufficient rights"
 *       409:
 *         description: Conflict error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Username or email already exists"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Internal server error"
 */
router.put('/:id', authMiddleware_1.isAdmin, municipalityUserController_1.default.updateMunicipalityUser);
/**
 * @swagger
 * /api/municipality/users/{id}:
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
router.delete('/:id', authMiddleware_1.isAdmin, municipalityUserController_1.default.deleteMunicipalityUser);
/**
 * @swagger
 * /api/municipality/users/{id}/role:
 *   put:
 *     tags: [Municipality Users]
 *     summary: Assign role to municipality user
 *     description: Assigns or updates the role for a municipality user (PT03)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Municipality user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role_name
 *             properties:
 *               role_name:
 *                 type: string
 *                 description: Name of the role to assign
 *                 example: "Urban Planning Manager"
 *               department_name:
 *                 type: string
 *                 description: Name of the department (optional, defaults to existing or "Organization")
 *                 example: "Urban Planning"
 *     responses:
 *       200:
 *         description: Role assigned successfully
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
 *       404:
 *         description: User or role not found
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
router.put('/:id/role', authMiddleware_1.isAdmin, municipalityUserController_1.default.assignRole);
exports.default = router;
