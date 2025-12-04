/**
 * @swagger
 * components:
 *   schemas:
 *     CompanyResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Company ID
 *           example: 1
 *         name:
 *           type: string
 *           description: Company name
 *           example: "Enel X"
 *         category:
 *           type: string
 *           description: Report category the company handles
 *           example: "Public Lighting"
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Company creation timestamp
 *           example: "2024-01-15T10:30:00Z"
 *       description: Company information response
 */
export interface CompanyResponse {
    id: number;
    name: string;
    category: string;
    created_at: Date;
}
