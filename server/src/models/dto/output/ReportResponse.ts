import { Location } from '../Location';
import { Photo } from '../Photo';
import { ReportCategory } from '../ReportCategory';
import { ReportStatus } from '../ReportStatus';

/**
 * @swagger
 * components:
 *   schemas:
 *     ReportResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique report identifier
 *           example: 1
 *         reporterId:
 *           type: integer
 *           description: ID of the user who created the report (null if anonymous)
 *           example: 42
 *           nullable: true
 *         title:
 *           type: string
 *           description: Report title
 *           example: "Dangerous pothole on Via Roma"
 *         description:
 *           type: string
 *           description: Problem description
 *           example: "Presence of a pothole approximately 20cm deep"
 *         category:
 *           $ref: '#/components/schemas/ReportCategory'
 *         location:
 *           $ref: '#/components/schemas/Location'
 *         photos:
 *           type: array
 *           description: Array of photos associated with the report
 *           items:
 *             $ref: '#/components/schemas/Photo'
 *         isAnonymous:
 *           type: boolean
 *           description: Indicates whether the report is anonymous
 *           example: false
 *         status:
 *           $ref: '#/components/schemas/ReportStatus'
 *         rejectionReason:
 *           type: string
 *           nullable: true
 *           description: Reason for rejection (present only if status = 'Rejected')
 *           example: null
 *         assigneeId:
 *           type: integer
 *           nullable: true
 *           description: ID of the user assigned to the report
 *           example: null
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation date and time
 *           example: "2025-11-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update date and time
 *           example: "2025-11-15T10:30:00Z"
 */

export interface ReportResponse {
  id: number;
  reporterId: number | null;
  title: string;
  description: string;
  category: ReportCategory;
  location: Location;
  photos: Photo[];
  isAnonymous: boolean;
  status: ReportStatus;
  rejectionReason: string | null;
  assigneeId: number | null;
  createdAt: Date;
  updatedAt: Date;
}
