/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: Username for authentication
 *         password:
 *           type: string
 *           description: Password for authentication
 */
export interface LoginRequest{
    username: string, 
    password: string
}