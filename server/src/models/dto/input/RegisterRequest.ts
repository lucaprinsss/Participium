/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *         - first_name
 *         - last_name
 *         - role_name
 *       properties:
 *         username:
 *           type: string
 *           description: Unique username
 *           example: "m.rossi"
 *         email:
 *           type: string
 *           format: email
 *           description: Email address
 *           example: "m.rossi@comune.torino.it"
 *         password:
 *           type: string
 *           description: Password
 *           example: "SecurePass123!"
 *         first_name:
 *           type: string
 *           description: First name
 *           example: "Mario"
 *         last_name:
 *           type: string
 *           description: Last name
 *           example: "Rossi"
 *         role_name:
 *           type: string
 *           description: Role name
 *           example: "Citizen"
 *         department_name:
 *           type: string
 *           description: Department name (optional)
 *           example: "Organization"
 *         company_name:
 *           type: string
 *           description: Company name (optional, required for External Maintainers)
 *           example: "Enel X"
 */
export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role_name: string;
    department_name?: string;
    company_name?: string;
}