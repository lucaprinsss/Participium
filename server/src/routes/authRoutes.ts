import express from 'express';
import AuthController from '@controllers/authController';
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
 *               code: 401
 *               name: "UnauthorizedError"
 *               message: "Invalid credentials"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 500
 *               name: "InternalServerError"
 *               message: "Internal server error during authentication"
 */
router.post('/', AuthController.login);

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
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 401
 *               name: "UnauthorizedError"
 *               message: "Not authenticated"
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
router.get('/current', isLoggedIn, AuthController.getCurrentUser);

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
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 401
 *               name: "UnauthorizedError"
 *               message: "Not authenticated"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 500
 *               name: "InternalServerError"
 *               message: "Internal server error during logout"
 */
router.delete('/current', isLoggedIn, AuthController.logout);

/**
 * @swagger
 * /api/sessions/verify:
 *   post:
 *     tags: [Authentication]
 *     summary: Verify email with confirmation code
 *     description: |
 *       Verify a newly registered citizen account using the 6-digit confirmation code
 *       sent via email. The code is valid for 30 minutes from generation.
 *       
 *       **Flow:**
 *       1. User registers via POST /api/users
 *       2. System sends 6-digit code via email (valid 30 minutes)
 *       3. User submits email and code to this endpoint
 *       4. Upon success, account is activated (is_verified = true)
 *       5. User can now login
 *       
 *       **Validations:**
 *       - Email must exist in the system
 *       - Code must match the one stored for that email
 *       - Code must not be expired (within 30 minutes)
 *       - Account must not already be verified
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The email address used during registration
 *                 example: "mario.rossi@gmail.com"
 *               code:
 *                 type: string
 *                 pattern: '^\d{6}$'
 *                 description: The 6-digit verification code received via email
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email verified successfully, account is now active
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Email verified successfully. You can now login."
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 10
 *                     username:
 *                       type: string
 *                       example: "m.rossi"
 *                     email:
 *                       type: string
 *                       example: "mario.rossi@gmail.com"
 *                     is_verified:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Validation error or invalid verification request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingFields:
 *                 summary: Missing required fields
 *                 value:
 *                   code: 400
 *                   name: "BadRequestError"
 *                   message: "email and code are required"
 *               invalidCode:
 *                 summary: Invalid verification code
 *                 value:
 *                   code: 400
 *                   name: "BadRequestError"
 *                   message: "Invalid verification code"
 *               expiredCode:
 *                 summary: Verification code expired
 *                 value:
 *                   code: 400
 *                   name: "BadRequestError"
 *                   message: "Verification code has expired. Please request a new code."
 *               alreadyVerified:
 *                 summary: Account already verified
 *                 value:
 *                   code: 400
 *                   name: "BadRequestError"
 *                   message: "Email is already verified"
 *               invalidCodeFormat:
 *                 summary: Code must be 6 digits
 *                 value:
 *                   code: 400
 *                   name: "BadRequestError"
 *                   message: "Verification code must be exactly 6 digits"
 *       404:
 *         description: Email not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 404
 *               name: "NotFoundError"
 *               message: "No account found with this email address"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 500
 *               name: "InternalServerError"
 *               message: "Internal server error during verification"
 */
// router.post('/verify', AuthController.verifyEmail);

export default router;

