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
 *         - Technical Manager
 *         - Technical Assistant
 *       description: User role in the system
 *       example: "Citizen"
 */

export enum UserRole {
  CITIZEN = 'Citizen',
  ADMINISTRATOR = 'Administrator',
  PUBLIC_RELATIONS_OFFICER = 'Municipal Public Relations Officer',
  TECHNICAL_MANAGER = 'Technical Manager',
  TECHNICAL_ASSISTANT = 'Technical Assistant'
}
