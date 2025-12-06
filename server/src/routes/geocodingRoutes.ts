import { Router } from 'express';
import { getAddressFromProxy } from '../controllers/geocodingController';

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

export default router;