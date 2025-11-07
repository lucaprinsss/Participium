/**
 * @swagger
 * components:
 *   schemas:
 *     MunicipalityUserRequest:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *         - first_name
 *         - last_name
 *         - role
 *       properties:
 *         username:
 *           type: string
 *           description: Unique username
 *         email:
 *           type: string
 *           format: email
 *           description: Email address
 *         password:
 *           type: string
 *           description: Password
 *         first_name:
 *           type: string
 *           description: First name
 *         last_name:
 *           type: string
 *           description: Last name
 *         role:
 *           type: string
 *           enum: [organization_staff, technical_staff]
 *           description: Municipality user role
 *         department:
 *           type: string
 *           description: Department name
 */
export interface MunicipalityUserRequest{
    username: string, 
    email: string, 
    first_name: string, 
    last_name: string, 
    password: string, 
    role: string, 
    department: string
}