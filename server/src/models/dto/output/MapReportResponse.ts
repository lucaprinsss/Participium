import { Location } from '../Location';
import { ReportCategory } from '../ReportCategory';
import { ReportStatus } from '../ReportStatus';

/**
 * @swagger
 * components:
 *   schemas:
 *     MapReportResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique report identifier
 *           example: 42
 *         title:
 *           type: string
 *           description: Report title
 *           example: "Dangerous pothole on Via Roma"
 *         category:
 *           $ref: '#/components/schemas/ReportCategory'
 *         location:
 *           $ref: '#/components/schemas/Location'
 *         address:
 *           type: string
 *           nullable: true
 *           description: Human-readable address of the report location
 *           example: "Via Roma 15, 10121 Turin, Italy"
 *         status:
 *           $ref: '#/components/schemas/ReportStatus'
 *         reporterName:
 *           type: string
 *           description: Full name of the reporter, or "Anonymous" if the report is anonymous
 *           example: "Mario Rossi"
 *         isAnonymous:
 *           type: boolean
 *           description: Whether the report is anonymous
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Report creation timestamp
 *           example: "2025-11-15T10:30:00Z"
 *       description: Lightweight report data optimized for map visualization
 */

export interface MapReportResponse {
  id: number;
  title: string;
  category: ReportCategory;
  location: Location;
  address?: string;
  status: ReportStatus;
  reporterName: string; // "Anonymous" if is_anonymous = true
  isAnonymous: boolean;
  createdAt: Date;
}
