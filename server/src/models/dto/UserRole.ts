/**
 * @swagger
 * components:
 *   schemas:
 *     UserRole:
 *       type: string
 *       enum:
 *         - Citizen
 *         - Administrator
 *         - Municipal Public Relations Officer
 *         - Municipal Administrator
 *         - Technical Office Staff Member
 *         - Urban Planning Manager
 *         - Private Building Manager
 *         - Infrastructure Manager
 *         - Maintenance Staff Member
 *         - Public Green Spaces Manager
 *       description: Possible roles for a user
 */

/**
 * Possible roles for a user
 */
export enum UserRole {
  CITIZEN = 'Citizen',
  ADMINISTRATOR = 'Administrator',
  MUNICIPAL_PUBLIC_RELATIONS_OFFICER = 'Municipal Public Relations Officer',
  MUNICIPAL_ADMINISTRATOR = 'Municipal Administrator',
  TECHNICAL_OFFICE_STAFF_MEMBER = 'Technical Office Staff Member',
  URBAN_PLANNING_MANAGER = 'Urban Planning Manager',
  PRIVATE_BUILDING_MANAGER = 'Private Building Manager',
  INFRASTRUCTURE_MANAGER = 'Infrastructure Manager',
  MAINTENANCE_STAFF_MEMBER = 'Maintenance Staff Member',
  PUBLIC_GREEN_SPACES_MANAGER = 'Public Green Spaces Manager'
}