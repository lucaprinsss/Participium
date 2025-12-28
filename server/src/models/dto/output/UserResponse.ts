/**
 * @swagger
 * components:
 *   schemas:
 *     UserResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: User ID
 *         username:
 *           type: string
 *           description: Username
 *         email:
 *           type: string
 *           format: email
 *           description: Email address
 *         first_name:
 *           type: string
 *           description: First name
 *         last_name:
 *           type: string
 *           description: Last name
 *         roles:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               department_role_id:
 *                 type: integer
 *               department_name:
 *                 type: string
 *               role_name:
 *                 type: string
 *           description: List of roles assigned to the user
 *         company_name:
 *           type: string
 *           description: Associated company name (for external maintainers)
 *         personal_photo_url:
 *           type: string
 *           description: URL to user's profile photo
 *         telegram_username:
 *           type: string
 *           description: Telegram username
 *         email_notifications_enabled:
 *           type: boolean
 *           description: Whether email notifications are enabled
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 */
export interface UserResponse {
    id: number,
    username: string,
    email: string,
    first_name: string,
    last_name: string,
    roles: Array<{
        department_role_id: number;
        department_name: string;
        role_name: string;
    }>
    role_name?: string;
    company_name?: string;
    personal_photo_url?: string;
    telegram_username?: string;
    email_notifications_enabled?: boolean;
}