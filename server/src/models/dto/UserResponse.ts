import { UserRole } from "./UserRole"

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
 *         role:
 *           type: string
 *           enum: [citizen, organization_staff, technical_staff, administrator]
 *           description: User role
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 */
export interface UserResponse{
    id: number, 
    username: string, 
    email: string, 
    first_name: string, 
    last_name: string, 
    role: UserRole
}