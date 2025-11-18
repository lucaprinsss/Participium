import { Location } from '../Location';
import { ReportCategory } from '../ReportCategory';

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateReportRequest:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - category
 *         - location
 *         - photos
 *       properties:
 *         title:
 *           type: string
 *           minLength: 5
 *           maxLength: 200
 *           description: Report title
 *           example: "Dangerous pothole on Via Roma"
 *         description:
 *           type: string
 *           minLength: 10
 *           maxLength: 2000
 *           description: Detailed description of the problem
 *           example: "Presence of a pothole approximately 20cm deep that poses a danger to pedestrians and vehicles"
 *         category:
 *           $ref: '#/components/schemas/ReportCategory'
 *         location:
 *           $ref: '#/components/schemas/Location'
 *         photos:
 *           type: array
 *           minItems: 1
 *           maxItems: 3
 *           description: Array of base64-encoded photo strings (minimum 1, maximum 3)
 *           items:
 *             type: string
 *             description: Base64-encoded image data (e.g., data:image/jpeg;base64,...)
 *           example:
 *             - "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
 *             - "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
 *         isAnonymous:
 *           type: boolean
 *           default: false
 *           description: If true, the report will be anonymous
 *           example: false
 */

export interface CreateReportRequest {
  title: string;
  description: string;
  category: ReportCategory;
  location: Location;
  photos: string[]; // Array of base64-encoded images (min 1, max 3)
  isAnonymous?: boolean;
}
