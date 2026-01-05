import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point, multiPolygon } from '@turf/helpers';
import * as path from 'node:path';
import * as fs from 'node:fs';
import axios from 'axios';

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
    
    if (!turinFeature?.geometry) {
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
    !Number.isNaN(latitude) &&
    !Number.isNaN(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/**
 * Parses a coordinate string and validates it's a valid number
 * @param coordStr Coordinate string to parse
 * @param coordName Name of the coordinate (for error messages)
 * @returns Parsed coordinate number
 * @throws Error if parsing fails
 */
function parseCoordinate(coordStr: string, coordName: string): number {
  const coord = Number.parseFloat(coordStr);
  if (Number.isNaN(coord)) {
    throw new TypeError(`${coordName} must be a valid number`);
  }
  return coord;
}

/**
 * Validates and parses bounding box coordinates
 * @param minLat Minimum latitude string
 * @param maxLat Maximum latitude string
 * @param minLng Minimum longitude string
 * @param maxLng Maximum longitude string
 * @returns Parsed bounding box object
 * @throws Error if validation fails
 */
export function validateBoundingBox(
  minLat: string,
  maxLat: string,
  minLng: string,
  maxLng: string
): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  const minLatNum = parseCoordinate(minLat, 'minLat');
  const maxLatNum = parseCoordinate(maxLat, 'maxLat');
  const minLngNum = parseCoordinate(minLng, 'minLng');
  const maxLngNum = parseCoordinate(maxLng, 'maxLng');

  // Validate coordinate ranges using existing utility
  if (!isValidCoordinate(minLatNum, minLngNum)) {
    throw new Error('Invalid minimum coordinates: latitude must be between -90 and 90, longitude must be between -180 and 180');
  }
  if (!isValidCoordinate(maxLatNum, maxLngNum)) {
    throw new Error('Invalid maximum coordinates: latitude must be between -90 and 90, longitude must be between -180 and 180');
  }

  // Validate logical bounds
  if (minLatNum >= maxLatNum) {
    throw new Error('minLat must be less than maxLat');
  }
  if (minLngNum >= maxLngNum) {
    throw new Error('minLng must be less than maxLng');
  }

  return {
    minLat: minLatNum,
    maxLat: maxLatNum,
    minLng: minLngNum,
    maxLng: maxLngNum
  };
}

/**
 * Validates and parses zoom level for map visualization
 * @param zoom Zoom level string
 * @returns Parsed zoom level number (between 1 and 20)
 * @throws Error if validation fails
 */
export function validateZoomLevel(zoom: string): number {
  const zoomLevel = parseCoordinate(zoom, 'Zoom level');
  if (zoomLevel < 1 || zoomLevel > 20) {
    throw new Error('Zoom level must be between 1 and 20');
  }
  return zoomLevel;
}

/**
 * Parses a coordinate string in the format "latitude, longitude" and validates the coordinates
 * @param text - The coordinate string to parse (e.g., "45.0703, 7.6869")
 * @returns Parsed coordinates object or null if parsing fails
 */
export function parseCoordinates(text: string): { latitude: number; longitude: number } | null {
  const regex = new RegExp(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
  const match = regex.exec(text.trim());
  if (!match) return null;

  const lat = Number.parseFloat(match[1]);
  const lng = Number.parseFloat(match[3]);

  // Validazione base
  if (!isValidCoordinate(lat, lng)) return null;

  return { latitude: lat, longitude: lng };
}

/**
 * Geocodes an address to coordinates using Nominatim
 * @param address - The address string to geocode
 * @returns Object containing location coordinates and formatted address
 * @throws Error if geocoding fails
 */
export async function geocodeAddress(address: string): Promise<{ location: { latitude: number; longitude: number }; address: string }> {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: address + ', Torino, Italia',
        format: 'jsonv2',
        limit: 1,
        addressdetails: 1
      },
      headers: {
        'User-Agent': 'Partecipium-App-Dev/1.0 (admin@tuo-dominio.com)',
        'Referer': 'http://localhost'
      }
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('Address not found');
    }

    const result = response.data[0];
    return {
      location: {
        latitude: Number.parseFloat(result.lat),
        longitude: Number.parseFloat(result.lon)
      },
      address: result.display_name || address
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error('Address not found');
  }
}

/**
 * Reverse geocodes coordinates to an address using Nominatim
 * @param location - The coordinates to reverse geocode
 * @returns Formatted address string
 */
export async function reverseGeocode(location: { latitude: number; longitude: number }): Promise<string> {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        lat: location.latitude,
        lon: location.longitude,
        format: 'jsonv2',
        zoom: 18,
        addressdetails: 1
      },
      headers: {
        'User-Agent': 'Partecipium-App-Dev/1.0 (admin@tuo-dominio.com)',
        'Referer': 'http://localhost'
      }
    });

    return response.data?.display_name || `${location.latitude}, ${location.longitude}`;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return `${location.latitude}, ${location.longitude}`;
  }
}
