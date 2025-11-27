import { Location } from '../Location';
import { ReportCategory } from '../ReportCategory';
import { ReportStatus } from '../ReportStatus';

/**
 * User info for reporter/assignee in API response
 */
export interface UserInfo {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
}

/**
 * Photo in API response format (camelCase)
 */
export interface PhotoResponse {
  id: number;
  reportId: number;
  storageUrl: string;
  createdAt: Date;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Photo:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Photo ID
 *           example: 1
 *         reportId:
 *           type: integer
 *           description: Associated report ID
 *           example: 42
 *         storageUrl:
 *           type: string
 *           description: URL or path where the photo is stored
 *           example: "https://storage.example.com/photos/abc123.jpg"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Photo upload timestamp
 *           example: "2025-11-15T10:30:00Z"
 *
 *     ReportResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Report unique identifier
 *           example: 42
 *         reporterId:
 *           type: integer
 *           nullable: true
 *           description: ID of the user who created the report (null if anonymous)
 *           example: 15
 *         title:
 *           type: string
 *           description: Report title
 *           example: "Dangerous pothole on Via Roma"
 *         description:
 *           type: string
 *           description: Detailed description
 *           example: "There is a deep pothole approximately 20cm deep"
 *         category:
 *           $ref: '#/components/schemas/ReportCategory'
 *         location:
 *           $ref: '#/components/schemas/Location'
 *         photos:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Photo'
 *           description: Array of associated photos
 *         isAnonymous:
 *           type: boolean
 *           description: Whether the report is anonymous
 *           example: false
 *         status:
 *           $ref: '#/components/schemas/ReportStatus'
 *         rejectionReason:
 *           type: string
 *           nullable: true
 *           description: Reason for rejection (only if status is Rejected)
 *           example: null
 *         assigneeId:
 *           type: integer
 *           nullable: true
 *           description: ID of the user assigned to handle the report
 *           example: null
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Report creation timestamp
 *           example: "2025-11-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Report last update timestamp
 *           example: "2025-11-15T10:30:00Z"
 */
export interface ReportResponse {
  id: number;
  reporterId: number | null;
  reporter?: UserInfo | null;
  title: string;
  description: string;
  category: ReportCategory;
  location: Location;
  photos: PhotoResponse[];
  isAnonymous: boolean;
  status: ReportStatus;
  rejectionReason: string | null;
  assigneeId: number | null;
  assignee?: UserInfo | null;
  createdAt: Date;
  updatedAt: Date;
}
