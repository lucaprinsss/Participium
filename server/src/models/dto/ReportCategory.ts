/**
 * @swagger
 * components:
 *   schemas:
 *     ReportCategory:
 *       type: string
 *       enum:
 *         - Water Supply - Drinking Water
 *         - Architectural Barriers
 *         - Sewer System
 *         - Public Lighting
 *         - Waste
 *         - Road Signs and Traffic Lights
 *         - Roads and Urban Furnishings
 *         - Public Green Areas and Playgrounds
 *         - Other
 *       description: Report category
 *       example: "Roads and Urban Furnishings"
 */

export enum ReportCategory {
  WATER_SUPPLY = 'Water Supply - Drinking Water',
  ARCHITECTURAL_BARRIERS = 'Architectural Barriers',
  SEWER_SYSTEM = 'Sewer System',
  PUBLIC_LIGHTING = 'Public Lighting',
  WASTE = 'Waste',
  ROAD_SIGNS = 'Road Signs and Traffic Lights',
  ROADS = 'Roads and Urban Furnishings',
  GREEN_AREAS = 'Public Green Areas and Playgrounds',
  OTHER = 'Other'
}
