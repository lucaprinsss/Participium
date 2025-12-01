import express from 'express';
import { reportController } from '@controllers/reportController';
import { isLoggedIn, requireRole } from '@middleware/authMiddleware';
import { validateCreateReport, validateReportUpdate } from '@middleware/reportMiddleware';
import { validateId } from '@middleware/validateId';
import { validateMapQuery } from '@middleware/validateMapQuery';
import { validateReportStatus, validateReportCategory } from '@middleware/validateReportQueryParams';
import { UserRole } from '@dto/UserRole';

const router = express.Router();

/**
 * @swagger
 * /api/reports:
 *   post:
 *     summary: Create a new geolocated report
 *     description: |
 *       Allows an authenticated citizen to create a new geolocated report.
 *       The location is specified through geographic coordinates (latitude and longitude)
 *       obtained by selecting a point on an OpenStreetMap map.
 *       
 *       **Validations:**
 *       - Latitude: between -90 and 90
 *       - Longitude: between -180 and 180
 *       - Title: min 5, max 200 characters
 *       - Description: min 10, max 2000 characters
 *       - Category: must be one of the valid categories
 *       
 *     tags: [Reports]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReportRequest'
 *           examples:
 *             pothole:
 *               summary: Pothole report
 *               value:
 *                 title: "Dangerous pothole on Via Roma"
 *                 description: "There is a deep pothole approximately 20cm deep that poses a danger to pedestrians and vehicles. The pothole is located near building number 15."
 *                 category: "Roads and Urban Furnishings"
 *                 location:
 *                   latitude: 45.4642
 *                   longitude: 9.1900
 *                 photos:
 *                   - "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
 *                   - "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
 *                 isAnonymous: false
 *             streetlight:
 *               summary: Non-functioning streetlight
 *               value:
 *                 title: "Broken streetlight in Piazza Garibaldi"
 *                 description: "The streetlight in Piazza Garibaldi at the corner with Via Verdi has not been working for a week, creating a dangerous dark area in the evening."
 *                 category: "Public Lighting"
 *                 location:
 *                   latitude: 45.4655
 *                   longitude: 9.1905
 *                 photos:
 *                   - "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
 *                 isAnonymous: false
 *     responses:
 *       201:
 *         description: Report created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReportResponse'
 *             example:
 *               id: 42
 *               reporterId: 15
 *               title: "Dangerous pothole on Via Roma"
 *               description: "Presence of a pothole approximately 20cm deep that poses a danger to pedestrians and vehicles"
 *               category: "Roads and Urban Furnishings"
 *               location:
 *                 latitude: 45.4642
 *                 longitude: 9.1900
 *               photos: []
 *               isAnonymous: false
 *               status: "Pending Approval"
 *               rejectionReason: null
 *               assigneeId: null
 *               createdAt: "2025-11-15T10:30:00Z"
 *               updatedAt: "2025-11-15T10:30:00Z"
 *       400:
 *         description: Validation error or invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   get:
 *     summary: Get all reports
 *     description: |
 *       Returns the list of all reports with their geographic coordinates.
 *       Coordinates are provided in WGS84 format (OpenStreetMap standard).
 *       
 *     tags: [Reports]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/ReportStatus'
 *         description: Filter by report status
 *         required: false
 *       - in: query
 *         name: category
 *         schema:
 *           $ref: '#/components/schemas/ReportCategory'
 *         description: Filter by category
 *         required: false
 *     responses:
 *       200:
 *         description: List of reports
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ReportResponse'
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', requireRole(UserRole.CITIZEN), validateCreateReport, reportController.createReport);
router.get('/', isLoggedIn, validateReportStatus, validateReportCategory, reportController.getAllReports);

/**
 * @swagger
 * /api/reports/categories:
 *   get:
 *     summary: Get all available report categories
 *     description: |
 *       Returns the list of all valid report categories that can be used when creating a report.
 *     tags: [Reports]
 *     responses:
 *       200:
 *         description: List of available report categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/categories', reportController.getCategories);

/**
 * @swagger
 * /api/reports/assigned/me:
 *   get:
 *     summary: Get reports assigned to the current user
 *     description: |
 *       Returns all reports assigned to the authenticated technical office staff member.
 *     tags: [Reports]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/ReportStatus'
 *         description: Filter assigned reports by status
 *         required: false
 *     responses:
 *       200:
 *         description: List of reports assigned to current user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ReportResponse'
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/assigned/me', isLoggedIn, reportController.getMyAssignedReports);

/**
 * @swagger
 * /api/reports/{id}/status:
 *   put:
 *     summary: Update the status of a report
 *     description: |
 *       Allows a Municipal Public Relations Officer to update the status of a report.
 *       Supported status transitions:
 *       - Assigned: Approves the report and assigns it to the technical office.
 *       - Rejected: Rejects the report. A rejection reason is required.
 *       
 *       Allows a Technical Office Staff to update the status of a report.
 *       Supported status transitions:
 *       - Resolved: Marks the report as resolved.
 *     tags:
 *       - Reports
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the report to update
     requestBody:
       required: true
       content:
         application/json:
           schema:
             $ref: '#/components/schemas/UpdateReportStatusRequest'
           examples:
             approve:
               summary: Approve a report
               value:
                 status: Assigned
             reject:
               summary: Reject a report
               value:
                 status: Rejected
                 reason: "Duplicate report"
             resolve:
               summary: Resolve a report
               value:
                 status: Resolved
 *     responses:
 *       '200':
 *         description: Report status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReportResponse'
 *       '400':
 *         description: Invalid request or missing fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Report not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
const allowedToUpdateRoles = [
  'Municipal Public Relations Officer',
  'Department Director',
  'Water Network staff member',
  'Sewer System staff member',
  'Road Maintenance staff member',
  'Accessibility staff member',
  'Electrical staff member',
  'Recycling Program staff member',
  'Traffic management staff member',
  'Parks Maintenance staff member',
  'Customer Service staff member',
  'Building Maintenance staff member',
  'Support Officer'
];

router.put('/:id/status', requireRole(allowedToUpdateRoles), validateId(), validateReportUpdate, reportController.updateReportStatus);

/**
 * @swagger
* /api/reports/map:
 *   get:
 *     summary: Get reports for interactive map visualization
 *     description: |
 *       Returns approved reports optimized for map display.
 *       Only returns reports that are NOT in "Pending Approval" or "Rejected" status.
 *       
 *       **Zoom behavior:**
 *       - High zoom (zoomed in, zoom > 12): Returns individual reports with title and reporter name
 *       - Low zoom (zoomed out, zoom ≤ 12): Returns clustered reports grouped by proximity
 *       
 *       **Optional filters:**
 *       - Bounding box: Filter reports within visible map area
 *       - Zoom level: Controls clustering behavior
 *     tags: [Reports]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: zoom
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 20
 *         description: Map zoom level (1-20). Zoom > 12 returns individual reports, ≤ 12 returns clusters
 *         required: false
 *         example: 13
 *       - in: query
 *         name: minLat
 *         schema:
 *           type: number
 *           minimum: -90
 *           maximum: 90
 *         description: Minimum latitude of bounding box
 *         required: false
 *         example: 45.45
 *       - in: query
 *         name: maxLat
 *         schema:
 *           type: number
 *           minimum: -90
 *           maximum: 90
 *         description: Maximum latitude of bounding box
 *         required: false
 *         example: 45.48
 *       - in: query
 *         name: minLng
 *         schema:
 *           type: number
 *           minimum: -180
 *           maximum: 180
 *         description: Minimum longitude of bounding box
 *         required: false
 *         example: 9.18
 *       - in: query
 *         name: maxLng
 *         schema:
 *           type: number
 *           minimum: -180
 *           maximum: 180
 *         description: Maximum longitude of bounding box
 *         required: false
 *         example: 9.20
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category (optional)
 *         required: false
 *         example: "Roads and Urban Furnishings"
 *     responses:
 *       200:
 *         description: Reports for map visualization (individual or clustered based on zoom)
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   description: Individual reports (when zoomed in)
 *                   items:
 *                     $ref: '#/components/schemas/MapReportResponse'
 *                 - type: array
 *                   description: Clustered reports (when zoomed out)
 *                   items:
 *                     $ref: '#/components/schemas/ClusteredReportResponse'
 *             examples:
 *               individualReports:
 *                 summary: Individual reports (zoom > 12)
 *                 value:
 *                   - id: 1
 *                     title: "Pothole on Via Roma"
 *                     category: "Roads and Urban Furnishings"
 *                     location:
 *                       latitude: 45.4642
 *                       longitude: 9.1900
 *                     status: "In Progress"
 *                     reporterName: "Mario Rossi"
 *                     isAnonymous: false
 *                     createdAt: "2025-11-15T10:30:00Z"
 *                   - id: 2
 *                     title: "Broken streetlight"
 *                     category: "Public Lighting"
 *                     location:
 *                       latitude: 45.4655
 *                       longitude: 9.1905
 *                     status: "Assigned"
 *                     reporterName: "Anonymous"
 *                     isAnonymous: true
 *                     createdAt: "2025-11-14T15:20:00Z"
 *               clusteredReports:
 *                 summary: Clustered reports (zoom ≤ 12)
 *                 value:
 *                   - clusterId: "cluster_45.464_9.190"
 *                     location:
 *                       latitude: 45.464
 *                       longitude: 9.190
 *                     reportCount: 15
 *                     reportIds: [1, 5, 12, 23, 34, 45, 56, 67, 78, 89, 90, 91, 92, 93, 94]
 *                   - clusterId: "cluster_45.470_9.195"
 *                     location:
 *                       latitude: 45.470
 *                       longitude: 9.195
 *                     reportCount: 8
 *                     reportIds: [2, 3, 4, 6, 7, 8, 9, 10]
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidZoom:
 *                 summary: Invalid zoom level
 *                 value:
 *                   error: "Bad Request"
 *                   message: "Zoom level must be between 1 and 20"
 *               invalidBounds:
 *                 summary: Invalid bounding box
 *                 value:
 *                   error: "Bad Request"
 *                   message: "Invalid bounding box coordinates"
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Unauthorized"
 *               message: "Not authenticated"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Internal Server Error"
 *               message: "An unexpected error occurred while retrieving map reports"
 *  
 */
router.get('/map', isLoggedIn, validateMapQuery, reportController.getMapReports);

export default router;
