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
 *           description: Detailed description of the issue
 *           example: "There is a deep pothole approximately 20cm deep that poses a danger to pedestrians and vehicles"
 *         category:
 *           $ref: '#/components/schemas/ReportCategory'
 *         location:
 *           $ref: '#/components/schemas/Location'
 *         address:
 *           type: string
 *           maxLength: 500
 *           description: Human-readable address of the report location
 *           example: "Via Roma 15, 10121 Turin, Italy"
 *         photos:
 *           type: array
 *           minItems: 1
 *           maxItems: 3
 *           description: Array of 1 to 3 photos in base64 format
 *           example: ["data:image/jpeg;base64,/9j/4AAQSkZJRg..."]
 *           items:
 *             type: string
 *             format: byte
 *         isAnonymous:
 *           type: boolean
 *           default: false
 *           description: Whether the report should be anonymous
 *           example: false
 */
export interface CreateReportRequest {
  title: string;
  description: string;
  category: ReportCategory;
  location: Location;
  address?: string;
  photos: string[];
  isAnonymous: boolean;
}
