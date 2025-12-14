
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
 * /api/users/me:
 *   patch:
 *     summary: Update current user profile settings
 *     description: |
 *       Allows a citizen to configure their account settings.
 *       
 *       **Configurable settings:**
 *       - Personal photo (base64 encoded image)
 *       - Telegram username (for notifications)
 *       - Email notifications (enable/disable)
 *       
 *       **Access:** Only authenticated citizens can update their own profile.
 *       All fields are optional - only provided fields will be updated.
 *     tags: [Citizens]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               personalPhoto:
 *                 type: string
 *                 format: byte
 *                 description: Personal photo in base64 format (data URI). Optional field.
 *                 example: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
 *               telegramUsername:
 *                 type: string
 *                 maxLength: 100
 *                 description: Telegram username (without @) for receiving notifications. Optional field.
 *                 example: "mario_rossi"
 *               emailNotificationsEnabled:
 *                 type: boolean
 *                 description: Enable or disable email notifications. Optional field.
 *                 example: true
 *           examples:
 *             updatePhoto:
 *               summary: Update personal photo
 *               value:
 *                 personalPhoto: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
 *             updateTelegram:
 *               summary: Add Telegram username
 *               value:
 *                 telegramUsername: "mario_rossi"
 *             disableEmailNotifications:
 *               summary: Disable email notifications
 *               value:
 *                 emailNotificationsEnabled: false
 *             updateAll:
 *               summary: Update all settings
 *               value:
 *                 personalPhoto: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
 *                 telegramUsername: "mario_rossi"
 *                 emailNotificationsEnabled: true
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 15
 *                 username:
 *                   type: string
 *                   example: "m.rossi"
 *                 email:
 *                   type: string
 *                   example: "mario.rossi@email.com"
 *                 first_name:
 *                   type: string
 *                   example: "Mario"
 *                 last_name:
 *                   type: string
 *                   example: "Rossi"
 *                 personal_photo_url:
 *                   type: string
 *                   nullable: true
 *                   example: "/uploads/photos/user_15_profile.jpg"
 *                 telegram_username:
 *                   type: string
 *                   nullable: true
 *                   example: "mario_rossi"
 *                 email_notifications_enabled:
 *                   type: boolean
 *                   example: true
 *                 role_name:
 *                   type: string
 *                   example: "Citizen"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidPhoto:
 *                 summary: Invalid photo format
 *                 value:
 *                   code: 400
 *                   name: "BadRequestError"
 *                   message: "Invalid photo format. Must be a valid base64 encoded image"
 *               telegramTaken:
 *                 summary: Telegram username already in use
 *                 value:
 *                   code: 400
 *                   name: "BadRequestError"
 *                   message: "Telegram username already in use by another user"
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 401
 *               name: "UnauthorizedError"
 *               message: "Not authenticated"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 500
 *               name: "InternalServerError"
 *               message: "An unexpected error occurred while updating profile"
 */
//router.patch('/me', isLoggedIn, UserController.updateProfile);

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
 * /api/users/notifications:
 *   get:
 *     summary: Get notifications for current user
 *     description: |
 *       Returns a list of all notifications for the authenticated user.
 *       Notifications are automatically created when:
 *       - A report's status is changed
 *       - A technical staff member sends a message on a report
 *       
 *       Results can be filtered by read/unread status.
 *     tags: [Citizens]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: is_read
 *         schema:
 *           type: boolean
 *         description: Filter by read status. If omitted, returns all notifications.
 *         example: false
 *     responses:
 *       200:
 *         description: List of notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: Unique notification ID
 *                     example: 1
 *                   user_id:
 *                     type: integer
 *                     description: ID of the user receiving the notification
 *                     example: 5
 *                   type:
 *                     type: string
 *                     enum: [status_change, new_message, report_assigned]
 *                     description: Type of notification
 *                     example: "status_change"
 *                   title:
 *                     type: string
 *                     description: Notification title
 *                     example: "Report status updated"
 *                   message:
 *                     type: string
 *                     description: Notification message content
 *                     example: "Your report #123 has been updated to 'In Progress'"
 *                   report_id:
 *                     type: integer
 *                     description: Related report ID
 *                     example: 123
 *                   is_read:
 *                     type: boolean
 *                     description: Whether the notification has been read
 *                     example: false
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                     description: When the notification was created
 *                     example: "2024-01-15T10:30:00.000Z"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 401
 *               name: "UnauthorizedError"
 *               message: "Authentication required"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 500
 *               name: "InternalServerError"
 *               message: "Failed to retrieve notifications"
 */
// router.get('/notifications', isLoggedIn, UserController.getNotifications);

/**
 * @swagger
 * /api/users/notifications/{id}:
 *   patch:
 *     summary: Mark notification as read/unread
 *     description: |
 *       Updates the read status of a notification.
 *       Users can only update their own notifications.
 *       
 *       **Access:** Only the notification owner can mark it as read/unread.
 *     tags: [Citizens]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Notification ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - is_read
 *             properties:
 *               is_read:
 *                 type: boolean
 *                 description: New read status
 *                 example: true
 *     responses:
 *       200:
 *         description: Notification updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: Notification ID
 *                   example: 1
 *                 user_id:
 *                   type: integer
 *                   description: User ID
 *                   example: 5
 *                 type:
 *                   type: string
 *                   enum: [status_change, new_message, report_assigned]
 *                   example: "status_change"
 *                 title:
 *                   type: string
 *                   example: "Report status updated"
 *                 message:
 *                   type: string
 *                   example: "Your report #123 has been updated to 'In Progress'"
 *                 report_id:
 *                   type: integer
 *                   example: 123
 *                 is_read:
 *                   type: boolean
 *                   description: Updated read status
 *                   example: true
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 400
 *               name: "BadRequestError"
 *               message: "is_read field is required and must be a boolean"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 401
 *               name: "UnauthorizedError"
 *               message: "Authentication required"
 *       403:
 *         description: Not authorized to update this notification
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 403
 *               name: "ForbiddenError"
 *               message: "You can only update your own notifications"
 *       404:
 *         description: Notification not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 404
 *               name: "NotFoundError"
 *               message: "Notification not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 500
 *               name: "InternalServerError"
 *               message: "Failed to update notification"
 */
// router.patch('/notifications/:id', isLoggedIn, validateId, UserController.markNotificationAsRead);

export default router;

