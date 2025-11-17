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
 */

// Create a new report (Citizens only)
// router.post('/', isCitizen, reportController.createReport);

// Get all reports (authenticated users)
// router.get('/', isLoggedIn, reportController.getAllReports);

// Get a specific report (authenticated users)
// router.get('/:id', isLoggedIn, reportController.getReportById);

export default router;