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
 *         department_name:
 *           type: string
 *           description: Department name
 *         role_name:
 *           type: string
 *           description: Role name
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
    department_name?: string,
    role_name?: string
}