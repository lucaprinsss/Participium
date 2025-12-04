//reportRoutes.ts

import express from 'express';
import { reportController } from '@controllers/reportController';
import { isLoggedIn, requireRole } from '@middleware/authMiddleware';
import { validateCreateReport } from '@middleware/reportMiddleware';
import { validateId } from '@middleware/validateId';
import { validateMapQuery } from '@middleware/validateMapQuery';
import { validateReportStatus, validateReportCategory } from '@middleware/validateReportQueryParams';
import { validateStatusUpdate } from '@middleware/validateStatusUpdate';
import { SystemRoles } from '@dto/UserRole';

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
 *       - cookieAuth: []
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
 *             example:
 *               code: 400
 *               name: "BadRequestError"
 *               message: "Validation error or invalid input"
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 401
 *               name: "UnauthorizedError"
 *               message: "Not authenticated"
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 403
 *               name: "ForbiddenError"
 *               message: "Insufficient permissions"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 500
 *               name: "InternalServerError"
 *               message: "Internal server error"
 *   get:
 *     summary: Get all reports
 *     description: |
 *       Returns the list of all reports with their geographic coordinates.
 *       Coordinates are provided in WGS84 format (OpenStreetMap standard).
 *       
 *     tags: [Reports]
 *     security:
 *       - cookieAuth: []
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
 *             example:
 *               code: 401
 *               name: "UnauthorizedError"
 *               message: "User not authenticated"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 500
 *               name: "InternalServerError"
 *               message: "An unexpected error occurred"
 */
router.post('/', requireRole(SystemRoles.CITIZEN), validateCreateReport, reportController.createReport);
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
 *       - cookieAuth: []
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
 *             example:
 *               code: 401
 *               name: "UnauthorizedError"
 *               message: "User not authenticated"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 500
 *               name: "InternalServerError"
 *               message: "An unexpected error occurred"
 */
router.get('/assigned/me', isLoggedIn, validateReportStatus, reportController.getMyAssignedReports);

/**
 * @swagger
 * /api/reports/{id}/status:
 *   put:
 *     summary: Update report status
 *     description: |
 *       Update the status of a report with proper validation and role-based restrictions.
 *       
 *       **Allowed transitions and required roles:**
 *       - `Pending Approval` → `Assigned` (approve): Only Public Relations Officers
 *       - `Pending Approval` → `Rejected`: Only Public Relations Officers
 *       - `Assigned`/`In Progress`/`Suspended` → `Resolved`: Technical Managers, Technical Assistants, or External Maintainers
 *       - `Assigned` → `In Progress`: Technical Managers or Technical Assistants, or External Maintainers
 *       - `In Progress` → `Suspended`: Technical Managers or Technical Assistants, or External Maintainers
 *       
 *       **Required fields per status:**
 *       - `Assigned`: Optional `category` to override/correct the category
 *       - `Rejected`: Required `rejectionReason` explaining why the report is invalid
 *       - `Resolved`: Optional `resolutionNotes` with details about the resolution
 *       - `In Progress`: No additional fields required
 *       - `Suspended`: No additional fields required
 *       
 *     tags: [Reports]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the report to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newStatus
 *             properties:
 *               newStatus:
 *                 type: string
 *                 enum: [Assigned, Rejected, Resolved, In Progress, Suspended]
 *                 description: The new status to set for the report
 *               category:
 *                 type: string
 *                 enum: 
 *                   - Water Supply - Drinking Water
 *                   - Architectural Barriers
 *                   - Sewer System
 *                   - Public Lighting
 *                   - Waste
 *                   - Road Signs and Traffic Lights
 *                   - Roads and Urban Furnishings
 *                   - Public Green Areas and Playgrounds
 *                   - Other
 *                 description: Optional category override when approving (status=Assigned). If not provided, uses existing category.
 *               rejectionReason:
 *                 type: string
 *                 description: Required when newStatus is Rejected. Explanation for why the report is invalid.
 *               resolutionNotes:
 *                 type: string
 *                 description: Optional notes when newStatus is Resolved. Details about how the issue was resolved.
 *           examples:
 *             approve:
 *               summary: Approve report (change to Assigned)
 *               value:
 *                 newStatus: "Assigned"
 *             approveWithCategoryChange:
 *               summary: Approve report with category correction
 *               value:
 *                 newStatus: "Assigned"
 *                 category: "Roads and Urban Furnishings"
 *             reject:
 *               summary: Reject report
 *               value:
 *                 newStatus: "Rejected"
 *                 rejectionReason: "The report does not contain sufficient details to identify the issue location"
 *             resolve:
 *               summary: Resolve report (mark as completed)
 *               value:
 *                 newStatus: "Resolved"
 *                 resolutionNotes: "Pothole filled and road surface repaired on 2025-12-03"
 *             inProgress:
 *               summary: Mark report as in progress
 *               value:
 *                 newStatus: "In Progress"
 *             suspend:
 *               summary: Suspend report (temporary hold)
 *               value:
 *                 newStatus: "Suspended"
 *     responses:
 *       200:
 *         description: Report status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 *             example:
 *               id: 15
 *               title: "Pothole on Main Street"
 *               status: "In Progress"
 *               assigneeId: 5
 *       400:
 *         description: Invalid request (invalid status transition, missing required fields, or validation errors)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidTransition:
 *                 summary: Invalid status transition
 *                 value:
 *                   code: 400
 *                   name: "BadRequestError"
 *                   message: "Invalid status transition"

 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 401
 *               name: "UnauthorizedError"
 *               message: "User not authenticated"
 *       403:
 *         description: Insufficient permissions for requested status change
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 403
 *               name: "ForbiddenError"
 *               message: "Insufficient permissions for requested status change"
 *       404:
 *         description: Report not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 404
 *               name: "NotFoundError"
 *               message: "Report not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 500
 *               name: "InternalServerError"
 *               message: "An unexpected error occurred"
 */

router.put('/:id/status', isLoggedIn, validateId('id', 'report'), validateStatusUpdate, reportController.updateReportStatus);

/**
 * @swagger
 * /api/reports/{id}/assign-external:
 *   patch:
 *     summary: Assign report to external maintainer
 *     description: |
 *       Assigns a report to an external maintainer. The report must be in "Assigned" status.
 *       Only technical staff (Department Directors and technical staff members) can perform this action.
 *       
 *       **Requirements:**
 *       - Report must be in `Assigned` status
 *       - External maintainer must have role "External Maintainer"
 *       - External maintainer's company must handle the report's category
 *       
 *       **Use Case:**
 *       After a report is approved and assigned internally, technical staff can reassign it to an external contractor
 *       whose company specializes in that category (e.g., Enel X for public lighting).
 *     tags: [Reports]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the report to assign
 *         example: 15
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - externalAssigneeId
 *             properties:
 *               externalAssigneeId:
 *                 type: integer
 *                 description: ID of the external maintainer to assign the report to
 *                 example: 8
 *           example:
 *             externalAssigneeId: 8
 *     responses:
 *       200:
 *         description: Report successfully assigned to external maintainer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 *             example:
 *               id: 15
 *               title: "Broken streetlight"
 *               status: "Assigned"
 *               assigneeId: 8
 *               assignee:
 *                 id: 8
 *                 username: "enelx"
 *                 firstName: "Enel X"
 *                 lastName: "Support Team"
 *                 companyName: "Enel X S.p.A."
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidStatus:
 *                 summary: Report not in Assigned status
 *                 value:
 *                   code: 400
 *                   name: "BadRequestError"
 *                   message: "Report must be in Assigned status to be assigned to an external maintainer"
 *               notExternalMaintainer:
 *                 summary: Assignee is not an external maintainer
 *                 value:
 *                   code: 400
 *                   name: "BadRequestError"
 *                   message: "Assignee is not an external maintainer"
 *               categoryMismatch:
 *                 summary: Company doesn't handle category
 *                 value:
 *                   code: 400
 *                   name: "BadRequestError"
 *                   message: "External maintainer's company does not handle Public Lighting category"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 401
 *               name: "UnauthorizedError"
 *               message: "User not authenticated"
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 403
 *               name: "ForbiddenError"
 *               message: "Only technical staff can assign reports to external maintainers"
 *       404:
 *         description: Report or external maintainer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               reportNotFound:
 *                 summary: Report not found
 *                 value:
 *                   code: 404
 *                   name: "NotFoundError"
 *                   message: "Report not found"
 *               assigneeNotFound:
 *                 summary: External maintainer not found
 *                 value:
 *                   code: 404
 *                   name: "NotFoundError"
 *                   message: "External maintainer not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 500
 *               name: "InternalServerError"
 *               message: "An unexpected error occurred"
 */
router.patch('/:id/assign-external', isLoggedIn, validateId('id', 'report'), reportController.assignToExternalMaintainer);

/**
 * @swagger
 * /api/reports/assigned/external/{externalMaintainerId}:
 *   get:
 *     summary: Get reports assigned to a specific external maintainer
 *     description: |
 *       Returns all reports assigned to a specific external maintainer, identified by their ID.
 *       Accessible by Technical Managers, Technical Assistants, and Public Relations Officers.
 *     tags: [Reports]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: externalMaintainerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the external maintainer
 *         example: 8
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/ReportStatus'
 *         description: Filter assigned reports by status
 *         required: false
 *     responses:
 *       200:
 *         description: List of reports assigned to the specified external maintainer
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ReportResponse'
 *       400:
 *         description: Invalid external maintainer ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 400
 *               name: "BadRequestError"
 *               message: "Invalid external maintainer ID"
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 401
 *               name: "UnauthorizedError"
 *               message: "User not authenticated"
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 403
 *               name: "ForbiddenError"
 *               message: "Insufficient permissions"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 500
 *               name: "InternalServerError"
 *               message: "An unexpected error occurred"
 */
router.get(
  '/assigned/external/:externalMaintainerId',
  requireRole([UserRole.TECHNICAL_MANAGER, UserRole.TECHNICAL_ASSISTANT, UserRole.PUBLIC_RELATIONS_OFFICER]),
  validateId('externalMaintainerId', 'external maintainer'),
  reportController.getAssignedReportsToExternalMaintainer
);

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
 *       - cookieAuth: []
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
 *                   code: 400
 *                   name: "BadRequestError"
 *                   message: "Zoom level must be between 1 and 20"
 *               invalidBounds:
 *                 summary: Invalid bounding box
 *                 value:
 *                   code: 400
 *                   name: "BadRequestError"
 *                   message: "Invalid bounding box coordinates"
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 401
 *               name: "UnauthorizedError"
 *               message: "Not authenticated"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 500
 *               name: "InternalServerError"
 *               message: "An unexpected error occurred while retrieving map reports"
 *  
 */
router.get('/map', isLoggedIn, validateMapQuery, reportController.getMapReports);

/**
 * @swagger
 * /api/reports/{id}/internal-comments:
 *   get:
 *     summary: Get internal comments for a report
 *     description: |
 *       Retrieve all internal comments for a specific report. Internal comments
 *       are used for coordination between staff members and external maintainers
 *       and are NOT visible to citizens.
 *       
 *       **Access Control:**
 *       - Staff members (Technical Manager, Technical Assistant, Public Relations Officer)
 *       - External Maintainers assigned to the report
 *       - NOT accessible to Citizens or Administrators
 *       
 *       **Security:** This endpoint ensures internal communication remains private
 *       and separate from citizen-facing information.
 *     tags: [Reports]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report ID to get internal comments for
 *         example: 15
 *     responses:
 *       200:
 *         description: List of internal comments for the report
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   content:
 *                     type: string
 *                     example: "Checked the site, pipe replacement needed. Will coordinate with external team."
 *                   author:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 5
 *                       username:
 *                         type: string
 *                         example: "m.rossi"
 *                       first_name:
 *                         type: string
 *                         example: "Mario"
 *                       last_name:
 *                         type: string
 *                         example: "Rossi"
 *                       role:
 *                         type: string
 *                         example: "Water Network staff member"
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-15T14:30:00Z"
 *             example:
 *               - id: 1
 *                 content: "Checked the site, pipe replacement needed. Will coordinate with external team."
 *                 author:
 *                   id: 5
 *                   username: "m.rossi"
 *                   first_name: "Mario"
 *                   last_name: "Rossi"
 *                   role: "Water Network staff member"
 *                 created_at: "2024-01-15T14:30:00Z"
 *               - id: 2
 *                 content: "Team dispatched, ETA 2 hours"
 *                 author:
 *                   id: 8
 *                   username: "acea"
 *                   first_name: "Acea"
 *                   last_name: "Water Services"
 *                   role: "External Maintainer"
 *                   company_name: "Acea S.p.A."
 *                 created_at: "2024-01-15T15:00:00Z"
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 401
 *               name: "UnauthorizedError"
 *               message: "User not authenticated"
 *       403:
 *         description: User is not authorized to view internal comments
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 403
 *               name: "ForbiddenError"
 *               message: "Access denied. Internal comments are only accessible to staff and external maintainers"
 *       404:
 *         description: Report not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 404
 *               name: "NotFoundError"
 *               message: "Report not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     summary: Add an internal comment to a report
 *     description: |
 *       Add a new internal comment to a report. Internal comments facilitate
 *       coordination between staff members and external maintainers without
 *       exposing notes to citizens.
 *       
 *       **Access Control:**
 *       - Staff members (Technical Manager, Technical Assistant, Public Relations Officer)
 *       - External Maintainers assigned to the report
 *       - NOT accessible to Citizens or Administrators
 *       
 *       **Use Cases:**
 *       - Coordination between technical staff
 *       - Communication with external maintainers
 *       - Internal status updates and notes
 *     tags: [Reports]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report ID to add comment to
 *         example: 15
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: The comment text
 *                 minLength: 1
 *                 maxLength: 1000
 *                 example: "Checked the site, pipe replacement needed. Will coordinate with external team."
 *     responses:
 *       201:
 *         description: Internal comment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 3
 *                 content:
 *                   type: string
 *                   example: "Checked the site, pipe replacement needed. Will coordinate with external team."
 *                 author:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 5
 *                     username:
 *                       type: string
 *                       example: "m.rossi"
 *                     first_name:
 *                       type: string
 *                       example: "Mario"
 *                     last_name:
 *                       type: string
 *                       example: "Rossi"
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T16:30:00Z"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingContent:
 *                 summary: Missing comment content
 *                 value:
 *                   code: 400
 *                   name: "BadRequestError"
 *                   message: "content is required"
 *               contentTooLong:
 *                 summary: Content exceeds maximum length
 *                 value:
 *                   code: 400
 *                   name: "BadRequestError"
 *                   message: "content must be between 1 and 1000 characters"
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 401
 *               name: "UnauthorizedError"
 *               message: "User not authenticated"
 *       403:
 *         description: User is not authorized to add internal comments
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 403
 *               name: "ForbiddenError"
 *               message: "Access denied. Only staff and external maintainers can add internal comments"
 *       404:
 *         description: Report not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 404
 *               name: "NotFoundError"
 *               message: "Report not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// router.get('/:id/internal-comments',
//   isLoggedIn,
//   requireRole([
//     UserRole.TECHNICAL_MANAGER,
//     UserRole.TECHNICAL_ASSISTANT,
//     UserRole.PUBLIC_RELATIONS_OFFICER,
//     UserRole.EXTERNAL_MAINTAINER
//   ]),
//   validateId,
//   reportController.getInternalComments
// );
//
// router.post('/:id/internal-comments',
//   isLoggedIn,
//   requireRole([
//     UserRole.TECHNICAL_MANAGER,
//     UserRole.TECHNICAL_ASSISTANT,
//     UserRole.PUBLIC_RELATIONS_OFFICER,
//     UserRole.EXTERNAL_MAINTAINER
//   ]),
//   validateId,
//   reportController.addInternalComment
// );

export default router;


