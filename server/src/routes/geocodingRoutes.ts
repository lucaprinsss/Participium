import { Router } from 'express';
import { getAddressFromProxy, getCoordinatesFromAddress } from '../controllers/geocodingController';

const router = Router();

/**
 * @swagger
 * /api/proxy/address:
 *   get:
 *     tags: [Geocoding]
 *     summary: Get address from latitude and longitude
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *         required: true
 *         description: Latitude
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *         required: true
 *         description: Longitude
 *     responses:
 *       200:
 *         description: Address found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 address:
 *                   type: string
 *                   description: Address corresponding to the latitude and longitude
 *       400:
 *         description: Bad Request - Missing or invalid latitude/longitude
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               code: 400
 *               name: "BadRequestError"
 *               message: "Missing or invalid latitude/longitude."
 */
router.get('/address', getAddressFromProxy);

/**
 * @swagger
 * /api/proxy/coordinates:
 *   get:
 *     tags: [Geocoding]
 *     summary: Get geographic coordinates from an address
 *     description: Converts a street address in Turin into geographic coordinates (latitude and longitude) using structured geocoding. Supports precise house number resolution.
 *     parameters:
 *       - in: query
 *         name: address
 *         schema:
 *           type: string
 *         required: true
 *         description: Street address to geocode (e.g., "Corso Bolzano 87" or "Via Roma 15"). The system automatically searches within Turin, Italy.
 *         example: "Corso Bolzano 87"
 *     responses:
 *       200:
 *         description: Coordinates successfully found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 lat:
 *                   type: number
 *                   format: float
 *                   description: Latitude coordinate
 *                   example: 45.0703
 *                 lng:
 *                   type: number
 *                   format: float
 *                   description: Longitude coordinate
 *                   example: 7.6869
 *                 display_name:
 *                   type: string
 *                   description: Full formatted address from the geocoding service
 *                   example: "87, Corso Bolzano, Madonna di Campagna, Circoscrizione 5, Torino, Piedmont, 10134, Italy"
 *                 boundingbox:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Bounding box coordinates [south, north, west, east]
 *                   example: ["45.0702", "45.0704", "7.6868", "7.6870"]
 *       400:
 *         description: Bad Request - Missing or empty address parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Address is required"
 *       404:
 *         description: Address not found - No matching location in Turin
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Address not found"
 *       500:
 *         description: Internal server error during geocoding operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error during address search"
 */
router.get('/coordinates', getCoordinatesFromAddress);

export default router;