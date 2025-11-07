/**
 * @swagger
 * components:
 *   schemas:
 *     UserRole:
 *       type: string
 *       enum:
 *         - citizen
 *         - organization_staff
 *         - technical_staff
 *         - administrator
 *       description: Possible roles for a user
 */

/**
 * Possible roles for a user
 */
export enum UserRole {
  CITIZEN = 'citizen',
  ORGANIZATION_STAFF = 'organization_staff',
  TECHNICAL_STAFF = 'technical_staff',
  ADMINISTRATOR = 'administrator'
}