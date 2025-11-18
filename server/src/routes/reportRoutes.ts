import express from 'express';
// import { reportController } from '../controllers/reportController';
import { isCitizen, isLoggedIn } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Reports
 *
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
 *                 isAnonymous: false
 *             wastereport:
 *               summary: Anonymous waste report
 *               value:
 *                 title: "Waste accumulation on Via Manzoni"
 *                 description: "Abandoned waste on the sidewalk causing bad odors and discomfort to residents"
 *                 category: "Waste"
 *                 location:
 *                   latitude: 45.4638
 *                   longitude: 9.1895
 *                 isAnonymous: true
 *             barrier:
 *               summary: Architectural barrier
 *               value:
 *                 title: "Sidewalk without ramp on Via Verdi"
 *                 description: "The sidewalk at the intersection with Via Garibaldi does not have a ramp for disabled people, making it difficult to cross"
 *                 category: "Architectural Barriers"
 *                 location:
 *                   latitude: 45.4650
 *                   longitude: 9.1910
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
 *               photos:
 *                 - id: 1
 *                   reportId: 42
 *                   storageUrl: "https://storage.example.com/photos/abc123.jpg"
 *                   createdAt: "2025-11-15T10:30:00Z"
 *                 - id: 2
 *                   reportId: 42
 *                   storageUrl: "https://storage.example.com/photos/def456.jpg"
 *                   createdAt: "2025-11-15T10:30:01Z"
 *               isAnonymous: false
 *               status: "Pending Approval"
 *               rejectionReason: null
 *               assigneeId: null
 *               createdAt: "2025-11-15T10:30:00Z"
 *               updatedAt: "2025-11-15T10:30:00Z"
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidCoordinates:
 *                 summary: Invalid coordinates
 *                 value:
 *                   error: "Bad Request"
 *                   message: "Invalid latitude: 95. Must be between -90 and 90"
 *               missingFields:
 *                 summary: Missing fields
 *                 value:
 *                   error: "Bad Request"
 *                   message: "Missing required fields: title, description, category, location"
 *               invalidCategory:
 *                 summary: Invalid category
 *                 value:
 *                   error: "Bad Request"
 *                   message: "Invalid category. Must be one of: Water Supply - Drinking Water, Architectural Barriers, Sewer System, Public Lighting, Waste, Road Signs and Traffic Lights, Roads and Urban Furnishings, Public Green Areas and Playgrounds, Other"
 *               invalidPhotos:
 *                 summary: Invalid photos count
 *                 value:
 *                   error: "Bad Request"
 *                   message: "Photos must contain between 1 and 3 images"
 *               missingLocation:
 *                 summary: Missing coordinates
 *                 value:
 *                   error: "Bad Request"
 *                   message: "Location must include both latitude and longitude"
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Unauthorized"
 *               message: "Not authenticated"
 *       403:
 *         description: Access denied - only citizens can create reports
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Forbidden"
 *               message: "Access denied. Citizen role required."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Internal Server Error"
 *               message: "An unexpected error occurred while creating the report"
 *
 *   get:
 *     summary: Get all reports
 *     description: |
 *       Returns the list of all reports with their geographic coordinates.
 *       Coordinates are provided in WGS84 format (OpenStreetMap standard) and can be
 *       used directly to display markers on a map.
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
 *         example: "Pending Approval"
 *       - in: query
 *         name: category
 *         schema:
 *           $ref: '#/components/schemas/ReportCategory'
 *         description: Filter by category
 *         required: false
 *         example: "Roads and Urban Furnishings"
 *     responses:
 *       200:
 *         description: List of reports
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ReportResponse'
 *             example:
 *               - id: 1
 *                 reporterId: 15
 *                 title: "Pothole on Via Roma"
 *                 description: "Dangerous pothole"
 *                 category: "Roads and Urban Furnishings"
 *                 location:
 *                   latitude: 45.4642
 *                   longitude: 9.1900
 *                 photos: []
 *                 isAnonymous: false
 *                 status: "Pending Approval"
 *                 rejectionReason: null
 *                 assigneeId: null
 *                 createdAt: "2025-11-15T10:30:00Z"
 *                 updatedAt: "2025-11-15T10:30:00Z"
 *               - id: 2
 *                 reporterId: null
 *                 title: "Broken streetlight"
 *                 description: "Streetlight not working"
 *                 category: "Public Lighting"
 *                 location:
 *                   latitude: 45.4655
 *                   longitude: 9.1905
 *                 photos: []
 *                 isAnonymous: true
 *                 status: "Assigned"
 *                 rejectionReason: null
 *                 assigneeId: 8
 *                 createdAt: "2025-11-14T15:20:00Z"
 *                 updatedAt: "2025-11-15T09:00:00Z"
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
 *
 * /api/reports/{id}:
 *   get:
 *     summary: Get a specific report
 *     description: |
 *       Returns the complete details of a single report including geographic coordinates
 *       that can be used to display the exact location on an OpenStreetMap map.
 *     tags: [Reports]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Unique report identifier
 *         example: 42
 *     responses:
 *       200:
 *         description: Report details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReportResponse'
 *             example:
 *               id: 42
 *               reporterId: 15
 *               title: "Dangerous pothole on Via Roma"
 *               description: "Presence of a pothole approximately 20cm deep"
 *               category: "Roads and Urban Furnishings"
 *               location:
 *                 latitude: 45.4642
 *                 longitude: 9.1900
 *               photos: []
 *               isAnonymous: false
 *               status: "In Progress"
 *               rejectionReason: null
 *               assigneeId: 8
 *               createdAt: "2025-11-15T10:30:00Z"
 *               updatedAt: "2025-11-16T14:20:00Z"
 *       400:
 *         description: Invalid ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Bad Request"
 *               message: "Invalid report ID"
 *       404:
 *         description: Report not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Not Found"
 *               message: "Report with id 42 not found"
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
 * 
 * /api/reports/{id}/approve:
 *   put:
 *     summary: Approve a report
 *     description: |
 *       Municipal Public Relations Officer can approve a report in "Pending Approval" status.
 *       Upon approval, the report is automatically assigned to the technical office
 *       responsible for the report category and status changes to "Assigned".
 *     tags: [Reports]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report ID to approve
 *         example: 42
 *     responses:
 *       200:
 *         description: Report approved successfully and assigned to technical office
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReportResponse'
 *             example:
 *               id: 42
 *               reporterId: 15
 *               title: "Dangerous pothole on Via Roma"
 *               description: "Presence of a pothole approximately 20cm deep"
 *               category: "Roads and Urban Furnishings"
 *               location:
 *                 latitude: 45.4642
 *                 longitude: 9.1900
 *               photos: []
 *               isAnonymous: false
 *               status: "Assigned"
 *               rejectionReason: null
 *               assigneeId: 5
 *               createdAt: "2025-11-15T10:30:00Z"
 *               updatedAt: "2025-11-16T14:20:00Z"
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidStatus:
 *                 summary: Report not in pending approval status
 *                 value:
 *                   error: "Bad Request"
 *                   message: "Report must be in 'Pending Approval' status to be approved"
 *               noTechnicalOffice:
 *                 summary: No technical office available
 *                 value:
 *                   error: "Bad Request"
 *                   message: "No technical office staff available for this category"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Unauthorized"
 *               message: "Not authenticated"
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Forbidden"
 *               message: "Access denied. Municipal Public Relations Officer role required."
 *       404:
 *         description: Report not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Not Found"
 *               message: "Report with id 42 not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /api/reports/{id}/reject:
 *   put:
 *     summary: Reject a report
 *     description: |
 *       Municipal Public Relations Officer can reject a report in "Pending Approval" status.
 *       A rejection reason must be provided to explain why the report is not valid.
 *       The report status changes to "Rejected" and citizens are notified.
 *     tags: [Reports]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report ID to reject
 *         example: 42
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RejectReportRequest'
 *           example:
 *             rejectionReason: "The report does not contain sufficient information to identify the exact location of the problem. Please provide a more specific address or reference point."
 *     responses:
 *       200:
 *         description: Report rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReportResponse'
 *             example:
 *               id: 42
 *               reporterId: 15
 *               title: "Dangerous pothole on Via Roma"
 *               description: "Presence of a pothole approximately 20cm deep"
 *               category: "Roads and Urban Furnishings"
 *               location:
 *                 latitude: 45.4642
 *                 longitude: 9.1900
 *               photos: []
 *               isAnonymous: false
 *               status: "Rejected"
 *               rejectionReason: "The report does not contain sufficient information to identify the exact location of the problem. Please provide a more specific address or reference point."
 *               assigneeId: null
 *               createdAt: "2025-11-15T10:30:00Z"
 *               updatedAt: "2025-11-16T14:25:00Z"
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidStatus:
 *                 summary: Report not in pending approval status
 *                 value:
 *                   error: "Bad Request"
 *                   message: "Report must be in 'Pending Approval' status to be rejected"
 *               missingReason:
 *                 summary: Missing rejection reason
 *                 value:
 *                   error: "Bad Request"
 *                   message: "Rejection reason is required and must be at least 10 characters"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Unauthorized"
 *               message: "Not authenticated"
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Forbidden"
 *               message: "Access denied. Municipal Public Relations Officer role required."
 *       404:
 *         description: Report not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Not Found"
 *               message: "Report with id 42 not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 * 
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
 */

// Create a new report (Citizens only)
// router.post('/', isCitizen, reportController.createReport);

// Get reports for interactive map (authenticated users)
// router.get('/map', isLoggedIn, reportController.getMapReports);

// Get all reports (authenticated users)
// router.get('/', isLoggedIn, reportController.getAllReports);

// Get a specific report (authenticated users)
// router.get('/:id', isLoggedIn, reportController.getReportById);

// Approve a report (Municipal Public Relations Officer only)
// router.put('/:id/approve', isPublicRelationsOfficer, reportController.approveReport);

// Reject a report (Municipal Public Relations Officer only)
// router.put('/:id/reject', isPublicRelationsOfficer, reportController.rejectReport);

export default router;