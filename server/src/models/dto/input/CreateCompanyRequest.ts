/**
 * @swagger
 * components:
 *   schemas:
 *     CreateCompanyRequest:
 *       type: object
 *       required:
 *         - name
 *         - category
 *       properties:
 *         name:
 *           type: string
 *           description: Company name
 *           example: "Enel X"
 *         category:
 *           type: string
 *           description: Report category the company handles
 *           enum:
 *             - Water Supply - Drinking Water
 *             - Sewer System
 *             - Architectural Barriers
 *             - Roads and Urban Furnishings
 *             - Public Lighting
 *             - Waste
 *             - Road Signs and Traffic Lights
 *             - Public Green Areas and Playgrounds
 *             - Other
 *           example: "Public Lighting"
 *       description: Request to create a new external maintenance company
 */
export interface CreateCompanyRequest {
    name: string;
    category: string;
}
