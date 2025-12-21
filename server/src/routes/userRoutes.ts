
import express from 'express';
import UserController from '@controllers/userController';
import { validateRegisterInput } from '../middleware/registerUserMiddleware';
import { isLoggedIn } from '@middleware/authMiddleware';
import { isTechnicalStaff, isAdmin } from '@dto/UserRole';

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
 *               code: 400
 *               name: "BadRequestError"
 *               message: "All fields are required: username, email, password, first_name, last_name"
 *       409:
 *         description: Username or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 409
 *               name: "ConflictError"
 *               message: "Username already exists"
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
router.post('/', validateRegisterInput, UserController.register);

/**
 * @swagger
 * /api/users/external-maintainers:
 *   get:
 *     summary: Get external maintainers by category
 *     description: |
 *       Retrieve a list of external maintainers filtered by report category.
 *       Only technical staff can access this endpoint to assign reports to external maintainers.
 *       External maintainers are users with role "External Maintainer" whose company
 *       handles the requested category.
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: Category name to filter external maintainers by their competence area
 *         example: "Public Lighting"
 *     responses:
 *       200:
 *         description: List of external maintainers for the specified category
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 8
 *                   username:
 *                     type: string
 *                     example: "testmaintainer"
 *                   first_name:
 *                     type: string
 *                     example: "John"
 *                   last_name:
 *                     type: string
 *                     example: "Doe"
 *                   email:
 *                     type: string
 *                     example: "john.doe@external.com"
 *                   company_name:
 *                     type: string
 *                     example: "Enel X"
 *                     description: Name of the external maintenance company
 *                   department:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *       400:
 *         description: Missing or invalid category parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 400
 *               name: "BadRequestError"
 *               message: "category query parameter is required"
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 401
 *               name: "UnauthorizedError"
 *               message: "User not authenticated"
 *       403:
 *         description: User is not authorized (not a staff member)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 403
 *               name: "ForbiddenError"
 *               message: "User is not authorized"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 500
 *               name: "InternalServerError"
 *               message: "An unexpected error occurred"
 */
router.get(
  '/external-maintainers',
  isLoggedIn,
  (req, res, next) => {

    const user = req.user as any;
    const roleName = user?.departmentRole?.role?.name;
    
    if (!roleName || (!isTechnicalStaff(roleName) && !isAdmin(roleName))) {
      return res.status(403).json({
        code: 403,
        name: 'ForbiddenError',
        message: 'Only technical staff can access this endpoint'
      });
    }
    next();
  },
  UserController.getExternalMaintainersByCategory
);

/**
 * @swagger
 * /api/users/telegram-link-code:
 *   post:
 *     summary: Generate Telegram link code
 *     description: Generate a verification code to link the user's Telegram account
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Code generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: "123456"
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-12-20T10:15:00Z"
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/telegram-link-code', isLoggedIn, UserController.generateTelegramLinkCode);

/**
 * @swagger
 * /api/users/telegram-status:
 *   get:
 *     summary: Get Telegram link status
 *     description: Check if the user's account is linked to Telegram
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isLinked:
 *                   type: boolean
 *                   example: true
 *                 telegramUsername:
 *                   type: string
 *                   nullable: true
 *                   example: "@username"
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/telegram-status', isLoggedIn, UserController.getTelegramStatus);

/**
 * @swagger
 * /api/users/telegram-unlink:
 *   delete:
 *     summary: Unlink Telegram account
 *     description: Remove the Telegram link from the user account
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Account unlinked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/telegram-unlink', isLoggedIn, UserController.unlinkTelegramAccount);

export default router;

