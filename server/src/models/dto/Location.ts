/**
 * @swagger
 * components:
 *   schemas:
 *     Location:
 *       type: object
 *       required:
 *         - latitude
 *         - longitude
 *       properties:
 *         latitude:
 *           type: number
 *           format: double
 *           minimum: -90
 *           maximum: 90
 *           description: Location latitude (WGS84)
 *           example: 45.4642
 *         longitude:
 *           type: number
 *           format: double
 *           minimum: -180
 *           maximum: 180
 *           description: Location longitude (WGS84)
 *           example: 9.1900
 *       description: Geographic coordinates in WGS84 system (EPSG:4326) used by OpenStreetMap
 */

export interface Location {
  latitude: number;
  longitude: number;
}
