import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point, multiPolygon } from '@turf/helpers';
import * as path from 'path';
import * as fs from 'fs';

// Load Turin boundaries GeoJSON
// In development with ts-node, __dirname is the compiled path
// We need to go up to the server root and then into src/public
const turinBoundariesPath = path.join(__dirname, '..', '..', 'src', 'public', 'boundaries_turin_city.geojson');
const turinBoundaries = JSON.parse(fs.readFileSync(turinBoundariesPath, 'utf8'));

/**
 * Validates if a given coordinate (latitude, longitude) is within Turin city boundaries
 * @param latitude - The latitude coordinate
 * @param longitude - The longitude coordinate
 * @returns true if the point is within Turin boundaries, false otherwise
 */
export function isWithinTurinBoundaries(latitude: number, longitude: number): boolean {
  try {
    
    if (!isValidCoordinate(latitude, longitude)) {
      return false;
    }

    // Create a point from the coordinates (GeoJSON uses [longitude, latitude] order)
    const pointToCheck = point([longitude, latitude]);

    // Get the Turin boundaries geometry
    const turinFeature = turinBoundaries.features[0];
    
    if (!turinFeature || !turinFeature.geometry) {
      throw new Error('Turin boundaries data is invalid or missing');
    }

    // Create a MultiPolygon from the Turin boundaries
    const turinPolygon = multiPolygon(turinFeature.geometry.coordinates);

    // Check if the point is within the polygon
    return booleanPointInPolygon(pointToCheck, turinPolygon);
  } catch (error) {
    console.error('Error validating coordinates against Turin boundaries:', error);
    return false;
  }
}

/**
 * Validates if coordinates are within valid ranges
 * @param latitude - The latitude coordinate (-90 to 90)
 * @param longitude - The longitude coordinate (-180 to 180)
 * @returns true if coordinates are valid, false otherwise
 */
export function isValidCoordinate(latitude: number, longitude: number): boolean {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}
