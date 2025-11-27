/**
 * @swagger
 * components:
 *   schemas:
 *     Photo:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique photo identifier
 *           example: 1
 *         reportId:
 *           type: integer
 *           description: ID of the associated report
 *           example: 42
 *         storageUrl:
 *           type: string
 *           description: URL where the photo is stored
 *           example: "https://storage.example.com/photos/abc123.jpg"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Photo upload timestamp
 *           example: "2025-11-15T10:30:00Z"
 */

/**
 * Photo Interface (photos table)
 */
export interface Photo {
  id: number;
  report_id: number;
  storage_url: string;
  created_at: Date;
}