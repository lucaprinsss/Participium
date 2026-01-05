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

 *         department_role_ids:
 *           type: array
 *           items:
 *             type: integer
 *           description: Array of department role IDs (optional for Citizen, required for Municipality Users)
 *           example: [1]
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
    department_role_ids?: number[];
    company_name?: string;
}