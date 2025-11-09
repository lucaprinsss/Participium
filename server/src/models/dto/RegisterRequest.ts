import { UserRole } from "./UserRole";

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
 *         - role
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
 *         role:
 *           type: string
 *           enum: [CITIZEN, ADMINISTRATOR, MUNICIPAL_PUBLIC_RELATIONS_OFFICER, TECHNICAL_OFFICE_STAFF_MEMBER, INFRASTRUCTURE_MANAGER, URBAN_PLANNING_OFFICER, SUSTAINABILITY_COORDINATOR, ADMINISTRATIVE_ASSISTANT, PROJECT_COORDINATOR, COMMUNITY_ENGAGEMENT_SPECIALIST]
 *           description: User role
 *           example: "CITIZEN"
 *       description: User registration request with role
 */
export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: UserRole; // Required - set by controller based on context
}