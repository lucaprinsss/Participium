import express from 'express';
import { requireRole } from '@middleware/authMiddleware';
import { SystemRoles } from '@dto/UserRole';
import municipalityUserController from '../controllers/municipalityUserController';
import { validateId } from '@middleware/validateId';
import { validateBodyFields } from '@middleware/validateBodyFields';

const router = express.Router();

/**
 * @swagger
 * /api/municipality/users:
 *   post:
 *     tags: [Municipality Users]
 *     summary: Create new municipality user with multiple roles
 *     description: |
 *       Registers a new municipality user with one or more roles.
 *       (PT10 - Supports multiple role assignment)
 *       
 *       **Important Notes:**
 *       - At least one department_role_id must be provided
 *       - Cannot create users with Citizen or Administrator roles through this endpoint
 *       - External Maintainers require a company_name to be specified
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
 *               - department_role_ids
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
 *               department_role_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of department role IDs to assign (supports multiple roles)
 *                 example: [1, 3]
 *               company_name:
 *                 type: string
 *                 description: Company name (optional, required for External Maintainers)
 *                 example: "Enel X S.p.A."
 *           examples:
 *             single_role:
 *               summary: User with single role
 *               value:
 *                 username: "m.rossi"
 *                 email: "m.rossi@comune.torino.it"
 *                 password: "SecurePass123!"
 *                 first_name: "Mario"
 *                 last_name: "Rossi"
 *                 department_role_ids: [1]
 *             multiple_roles:
 *               summary: User serving in multiple technical offices
 *               value:
 *                 username: "g.bianchi"
 *                 email: "g.bianchi@comune.torino.it"
 *                 password: "SecurePass123!"
 *                 first_name: "Giuseppe"
 *                 last_name: "Bianchi"
 *                 department_role_ids: [1, 3, 5]
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
 *             examples:
 *               missing_roles:
 *                 value:
 *                   code: 400
 *                   name: "BadRequestError"
 *                   message: "department_role_ids must be a non-empty array of role IDs"
 *               invalid_role:
 *                 value:
 *                   code: 400
 *                   name: "BadRequestError"
 *                   message: "One or more invalid department role IDs provided"
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 404
 *               name: "NotFoundError"
 *               message: "Company not found"
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
 *       409:
 *         description: Conflict error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 409
 *               name: "ConflictError"
 *               message: "Username or email already exists"
 */
router.post(
	'/',
	requireRole(SystemRoles.ADMINISTRATOR),
	validateBodyFields(['username', 'email', 'password', 'first_name', 'last_name', 'department_role_ids']),
	municipalityUserController.createMunicipalityUser
);


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
 *               code: 401
 *               name: "UnauthorizedError"
 *               message: "Not authenticated"
 *       403:
 *         description: Forbidden
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
router.get('/', requireRole(SystemRoles.ADMINISTRATOR), municipalityUserController.getAllMunicipalityUsers);


/**
 * @swagger
 * /api/municipality/users/department-roles:
 *   get:
 *     tags: [Municipality Users]
 *     summary: Get all department roles
 *     description: |
 *       Returns a list of all available department-role combinations with their IDs.
 *       This endpoint provides the `id` (department_role_id) needed for creating or updating municipality users.
 *       (Admin only)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of department roles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: The department_role_id to use in requests
 *                     example: 1
 *                   department:
 *                     type: string
 *                     description: Department name
 *                     example: "Public Works"
 *                   role:
 *                     type: string
 *                     description: Role name
 *                     example: "Municipal Officer"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/department-roles', requireRole(SystemRoles.ADMINISTRATOR), municipalityUserController.getAllDepartmentRoles);


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
 *               code: 404
 *               name: "NotFoundError"
 *               message: "Municipality user not found"
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
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 400
 *               name: "BadRequestError"
 *               message: "All fields are required"
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
router.get('/:id', requireRole(SystemRoles.ADMINISTRATOR), validateId('id', 'user'), municipalityUserController.getMunicipalityUserById);

/**
 * @swagger
 * /api/municipality/users/{id}:
 *   put:
 *     tags: [Municipality Users]
 *     summary: Update municipality user
 *     description: |
 *       Updates municipality user information and/or roles.
 *       (PT10 - Supports multiple role modification)
 *       
 *       **Important Notes:**
 *       - All fields are optional, at least one must be provided
 *       - When department_role_ids is provided, it replaces ALL existing roles
 *       - Cannot assign Citizen or Administrator roles through this endpoint
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
 *               department_role_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of department role IDs (replaces all existing roles)
 *                 example: [1, 3, 5]
 *               company_name:
 *                 type: string
 *                 description: Company name (optional, required for External Maintainers, use null to remove)
 *                 example: "Lighting Solutions SRL"
 *                 nullable: true
 *           examples:
 *             update_info:
 *               summary: Update user info only
 *               value:
 *                 first_name: "Mario"
 *                 last_name: "Rossi Updated"
 *                 email: "mario.rossi.new@comune.it"
 *             update_roles:
 *               summary: Update roles only
 *               value:
 *                 department_role_ids: [1, 3]
 *             update_all:
 *               summary: Update info and roles
 *               value:
 *                 first_name: "Mario"
 *                 email: "mario.new@comune.it"
 *                 department_role_ids: [1, 3, 5]
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       404:
 *         description: User or Company not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               userNotFound:
 *                 value:
 *                   code: 404
 *                   name: "NotFoundError"
 *                   message: "User not found"
 *               companyNotFound:
 *                 value:
 *                   code: 404
 *                   name: "NotFoundError"
 *                   message: "Company not found"
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
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               no_fields:
 *                 value:
 *                   code: 400
 *                   name: "BadRequestError"
 *                   message: "At least one field must be provided for update"
 *               invalid_roles:
 *                 value:
 *                   code: 400
 *                   name: "BadRequestError"
 *                   message: "One or more invalid department role IDs provided"
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
 *       409:
 *         description: Conflict error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 409
 *               name: "ConflictError"
 *               message: "Username or email already exists"
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
router.put('/:id', requireRole(SystemRoles.ADMINISTRATOR), validateId('id', 'user'), municipalityUserController.updateMunicipalityUser);


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
 *               code: 404
 *               name: "NotFoundError"
 *               message: "Municipality user not found"
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
router.delete('/:id', requireRole(SystemRoles.ADMINISTRATOR), validateId('id', 'user'), municipalityUserController.deleteMunicipalityUser);


/**
 * @swagger
 * /api/municipality/users/{id}/role:
 *   put:
 *     tags: [Municipality Users]
 *     summary: Add a single role to municipality user
 *     description: |
 *       Adds a role to a municipality user without removing existing roles.
 *       This is useful for assigning additional responsibilities to staff members.
 *       (PT10 - Modify roles for municipality users)
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
 *                 description: Name of the role to add
 *                 example: "Technical Office Staff Member"
 *               department_name:
 *                 type: string
 *                 description: Name of the department (optional)
 *                 example: "Water Network"
 *     responses:
 *       200:
 *         description: Role added successfully
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
 *               code: 400
 *               name: "BadRequestError"
 *               message: "role_name is required and must be a string"
 *       404:
 *         description: User or role not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 404
 *               name: "NotFoundError"
 *               message: "Municipality user not found"
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
router.put(
	'/:id/role',
	requireRole(SystemRoles.ADMINISTRATOR),
	validateId('id', 'user'),
	validateBodyFields(['role_name']),
	municipalityUserController.assignRole
);


/**
 * @swagger
 * /api/municipality/users/{id}/roles:
 *   put:
 *     tags: [Municipality Users]
 *     summary: Replace all roles for municipality user
 *     description: |
 *       Replaces ALL existing roles with the provided list of department_role_ids.
 *       This allows complete role management for flexible staff assignment.
 *       (PT10 - Modify roles for municipality users)
 *       
 *       **Important Notes:**
 *       - At least one role must be provided
 *       - Cannot assign Citizen or Administrator roles through this endpoint
 *       - All previous roles will be removed and replaced with the new ones
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
 *               - department_role_ids
 *             properties:
 *               department_role_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of department role IDs to assign
 *                 example: [1, 3, 5]
 *           examples:
 *             single_role:
 *               summary: Assign single role
 *               value:
 *                 department_role_ids: [1]
 *             multiple_roles:
 *               summary: Assign multiple roles (staff in multiple offices)
 *               value:
 *                 department_role_ids: [1, 3, 5]
 *     responses:
 *       200:
 *         description: Roles replaced successfully
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
 *             examples:
 *               empty_array:
 *                 value:
 *                   code: 400
 *                   name: "BadRequestError"
 *                   message: "department_role_ids must be a non-empty array of role IDs"
 *               invalid_ids:
 *                 value:
 *                   code: 400
 *                   name: "BadRequestError"
 *                   message: "All department_role_ids must be positive integers"
 *               invalid_role:
 *                 value:
 *                   code: 400
 *                   name: "BadRequestError"
 *                   message: "One or more invalid department role IDs provided"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 404
 *               name: "NotFoundError"
 *               message: "User not found"
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
router.put(
	'/:id/roles',
	requireRole(SystemRoles.ADMINISTRATOR),
	validateId('id', 'user'),
	municipalityUserController.updateRoles
);


/**
 * @swagger
 * /api/municipality/users/{id}/roles/{roleId}:
 *   delete:
 *     tags: [Municipality Users]
 *     summary: Remove a single role from municipality user
 *     description: |
 *       Removes a specific role from a municipality user while keeping other roles intact.
 *       (PT10 - Modify roles for municipality users - includes cancellation)
 *       
 *       **Important Notes:**
 *       - Users must have at least one role remaining after removal
 *       - Cannot remove roles from Citizen or Administrator users
 *       - The roleId refers to the department_role_id (the specific department+role combination)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Municipality user ID
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Department role ID to remove (from user's roles array)
 *     responses:
 *       200:
 *         description: Role removed successfully
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
 *             examples:
 *               last_role:
 *                 value:
 *                   code: 400
 *                   name: "BadRequestError"
 *                   message: "Cannot remove the last role from a municipality user. Users must have at least one role."
 *               invalid_user:
 *                 value:
 *                   code: 400
 *                   name: "BadRequestError"
 *                   message: "Cannot modify Citizen or Administrator through this endpoint"
 *       404:
 *         description: User or role not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               user_not_found:
 *                 value:
 *                   code: 404
 *                   name: "NotFoundError"
 *                   message: "User not found"
 *               role_not_found:
 *                 value:
 *                   code: 404
 *                   name: "NotFoundError"
 *                   message: "Role not assigned to this user"
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
router.delete(
	'/:id/roles/:roleId',
	requireRole(SystemRoles.ADMINISTRATOR),
	validateId('id', 'user'),
	validateId('roleId', 'role'),
	municipalityUserController.removeRole
);

export default router;
