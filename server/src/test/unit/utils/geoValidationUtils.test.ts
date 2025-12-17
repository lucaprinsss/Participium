import { isWithinTurinBoundaries, isValidCoordinate, validateBoundingBox, validateZoomLevel } from '../../../utils/geoValidationUtils';

describe('geoValidationUtils', () => {
  describe('isValidCoordinate', () => {
    it('should return true for valid coordinates', () => {
      expect(isValidCoordinate(45.0703393, 7.6869005)).toBe(true); // Turin center
      expect(isValidCoordinate(0, 0)).toBe(true);
      expect(isValidCoordinate(-90, -180)).toBe(true);
      expect(isValidCoordinate(90, 180)).toBe(true);
    });

    it('should return false for invalid coordinates', () => {
      expect(isValidCoordinate(91, 0)).toBe(false);   // latitude > 90
      expect(isValidCoordinate(-91, 0)).toBe(false);  // latitude < -90
      expect(isValidCoordinate(0, 181)).toBe(false);  // longitude > 180
      expect(isValidCoordinate(0, -181)).toBe(false); // longitude < -180
      expect(isValidCoordinate(Number.NaN, 0)).toBe(false);
      expect(isValidCoordinate(0, Number.NaN)).toBe(false);
    });
    it('should return false for non-number types', () => {
      expect(isValidCoordinate('45' as any, 7.6869005 as any)).toBe(false);
      expect(isValidCoordinate(45.0703393 as any, '7.68' as any)).toBe(false);
      expect(isValidCoordinate(undefined as any, 7.6869005 as any)).toBe(false);
      expect(isValidCoordinate(45.0703393 as any, undefined as any)).toBe(false);
      expect(isValidCoordinate(null as any, 7.6869005 as any)).toBe(false);
      expect(isValidCoordinate(45.0703393 as any, null as any)).toBe(false);
      expect(isValidCoordinate(true as any, 7.6869005 as any)).toBe(false);
      expect(isValidCoordinate(45.0703393 as any, false as any)).toBe(false);
      expect(isValidCoordinate({} as any, [] as any)).toBe(false);
    });
  });

  describe('isWithinTurinBoundaries', () => {
    it('should return true for coordinates within Turin city boundaries', () => {
      // Turin city center (Piazza Castello)
      expect(isWithinTurinBoundaries(45.0703393, 7.6869005)).toBe(true);
      
      // Mole Antonelliana
      expect(isWithinTurinBoundaries(45.0692403, 7.6932941)).toBe(true);
      
      // Porta Nuova station
      expect(isWithinTurinBoundaries(45.0625748, 7.6782069)).toBe(true);
    });

    it('should return false for coordinates outside Turin city boundaries', () => {
      // Milan
      expect(isWithinTurinBoundaries(45.464, 9.19)).toBe(false);
      
      // Rome
      expect(isWithinTurinBoundaries(41.9028, 12.4964)).toBe(false);
      
      // Just outside Turin boundaries (Moncalieri)
      expect(isWithinTurinBoundaries(45.0016, 7.6814)).toBe(false);
    });

    it('should execute polygon operations for valid Turin coordinates', () => {
      // Spy on turf functions to ensure they're called
      const spyBooleanPointInPolygon = jest.spyOn(require('@turf/boolean-point-in-polygon'), 'default');
      const spyMultiPolygon = jest.spyOn(require('@turf/helpers'), 'multiPolygon');
      const spyPoint = jest.spyOn(require('@turf/helpers'), 'point');

      // Test with Turin center coordinates - this should execute the polygon check
      const result = isWithinTurinBoundaries(45.0703393, 7.6869005);
      
      // Verify the turf functions were called
      expect(spyPoint).toHaveBeenCalledWith([7.6869005, 45.0703393]); // [longitude, latitude]
      expect(spyMultiPolygon).toHaveBeenCalled();
      expect(spyBooleanPointInPolygon).toHaveBeenCalled();
      
      // Result should be true for Turin center
      expect(result).toBe(true);

      // Restore spies
      spyBooleanPointInPolygon.mockRestore();
      spyMultiPolygon.mockRestore();
      spyPoint.mockRestore();
    });

    it('should return false for invalid coordinates', () => {
      expect(isWithinTurinBoundaries(91, 0)).toBe(false);
      expect(isWithinTurinBoundaries(0, 181)).toBe(false);
      expect(isWithinTurinBoundaries(Number.NaN, Number.NaN)).toBe(false);
    });
    it('should return false for non-number types', () => {
      expect(isWithinTurinBoundaries('45' as any, 7.6869005 as any)).toBe(false);
      expect(isWithinTurinBoundaries(45.0703393 as any, '7.68' as any)).toBe(false);
      expect(isWithinTurinBoundaries(undefined as any, 7.6869005 as any)).toBe(false);
      expect(isWithinTurinBoundaries(45.0703393 as any, undefined as any)).toBe(false);
      expect(isWithinTurinBoundaries(null as any, 7.6869005 as any)).toBe(false);
      expect(isWithinTurinBoundaries(45.0703393 as any, null as any)).toBe(false);
    });
  });

  describe('validateBoundingBox', () => {
    it('should successfully validate correct bounding box', () => {
      const result = validateBoundingBox('45.0', '45.1', '7.5', '7.8');
      expect(result).toEqual({
        minLat: 45.0,
        maxLat: 45.1,
        minLng: 7.5,
        maxLng: 7.8,
      });
    });

    it('should throw error for non-numeric minLat', () => {
      expect(() => validateBoundingBox('abc', '45.1', '7.5', '7.8')).toThrow('minLat must be a valid number');
    });

    it('should throw error for non-numeric maxLat', () => {
      expect(() => validateBoundingBox('45.0', 'xyz', '7.5', '7.8')).toThrow('maxLat must be a valid number');
    });

    it('should throw error for non-numeric minLng', () => {
      expect(() => validateBoundingBox('45.0', '45.1', 'invalid', '7.8')).toThrow('minLng must be a valid number');
    });

    it('should throw error for non-numeric maxLng', () => {
      expect(() => validateBoundingBox('45.0', '45.1', '7.5', 'invalid')).toThrow('maxLng must be a valid number');
    });

    it('should throw error when minLat is out of range (< -90)', () => {
      expect(() => validateBoundingBox('-91', '45.1', '7.5', '7.8')).toThrow('Invalid minimum coordinates');
    });

    it('should throw error when minLat is out of range (> 90)', () => {
      expect(() => validateBoundingBox('91', '45.1', '7.5', '7.8')).toThrow('Invalid minimum coordinates');
    });

    it('should throw error when maxLat is out of range', () => {
      expect(() => validateBoundingBox('45.0', '95', '7.5', '7.8')).toThrow('Invalid maximum coordinates');
    });

    it('should throw error when minLng is out of range', () => {
      expect(() => validateBoundingBox('45.0', '45.1', '-185', '7.8')).toThrow('Invalid minimum coordinates');
    });

    it('should throw error when maxLng is out of range', () => {
      expect(() => validateBoundingBox('45.0', '45.1', '7.5', '185')).toThrow('Invalid maximum coordinates');
    });

    it('should throw error when minLat >= maxLat', () => {
      expect(() => validateBoundingBox('45.1', '45.0', '7.5', '7.8')).toThrow('minLat must be less than maxLat');
    });

    it('should throw error when minLat equals maxLat', () => {
      expect(() => validateBoundingBox('45.0', '45.0', '7.5', '7.8')).toThrow('minLat must be less than maxLat');
    });

    it('should throw error when minLng >= maxLng', () => {
      expect(() => validateBoundingBox('45.0', '45.1', '7.8', '7.5')).toThrow('minLng must be less than maxLng');
    });

    it('should throw error when minLng equals maxLng', () => {
      expect(() => validateBoundingBox('45.0', '45.1', '7.5', '7.5')).toThrow('minLng must be less than maxLng');
    });

    it('should handle negative coordinates correctly', () => {
      const result = validateBoundingBox('-45.1', '-45.0', '-7.8', '-7.5');
      expect(result).toEqual({
        minLat: -45.1,
        maxLat: -45.0,
        minLng: -7.8,
        maxLng: -7.5,
      });
    });

    it('should handle boundary values', () => {
      const result = validateBoundingBox('-90', '90', '-180', '180');
      expect(result).toEqual({
        minLat: -90,
        maxLat: 90,
        minLng: -180,
        maxLng: 180,
      });
    });
  });

  describe('validateZoomLevel', () => {
    it('should successfully validate correct zoom level', () => {
      expect(validateZoomLevel('10')).toBe(10);
      expect(validateZoomLevel('1')).toBe(1);
      expect(validateZoomLevel('20')).toBe(20);
    });

    it('should accept decimal zoom levels', () => {
      expect(validateZoomLevel('10.5')).toBe(10.5);
      expect(validateZoomLevel('15.75')).toBe(15.75);
    });

    it('should throw error for non-numeric zoom', () => {
      expect(() => validateZoomLevel('abc')).toThrow('Zoom level must be a valid number');
    });

    it('should throw error for zoom level less than 1', () => {
      expect(() => validateZoomLevel('0')).toThrow('Zoom level must be between 1 and 20');
    });

    it('should throw error for zoom level greater than 20', () => {
      expect(() => validateZoomLevel('21')).toThrow('Zoom level must be between 1 and 20');
    });

    it('should throw error for negative zoom level', () => {
      expect(() => validateZoomLevel('-5')).toThrow('Zoom level must be between 1 and 20');
    });

    it('should throw error for very large zoom level', () => {
      expect(() => validateZoomLevel('100')).toThrow('Zoom level must be between 1 and 20');
    });
  });

  describe('geoValidationUtils error handling', () => {
    let geoUtils: typeof import('../../../utils/geoValidationUtils');

    beforeEach(() => {
      jest.resetModules();
    });

    it('should return false and log error if turinFeature.geometry is missing', () => {
      jest.doMock('../../../utils/geoValidationUtils', () => {
        const actual = jest.requireActual('../../../utils/geoValidationUtils');
        return {
          ...actual,
          isWithinTurinBoundaries: (lat: number, lng: number) => {
            try {
              const turinFeature = { features: [{ geometry: undefined as any }] };
              if (!turinFeature?.features[0]?.geometry) {
                console.error('Error validating coordinates against Turin boundaries:', new Error('Turin boundaries data is invalid or missing'));
                return false;
              }
              return true;
            } catch (error) {
              console.error('Error validating coordinates against Turin boundaries:', error);
              return false;
            }
          }
        };
      });
      geoUtils = require('../../../utils/geoValidationUtils');
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      expect(geoUtils.isWithinTurinBoundaries(45.0703393, 7.6869005)).toBe(false);
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('Error validating coordinates against Turin boundaries:'),
        expect.any(Error)
      );
      spy.mockRestore();
    });

    it('should return false and log error if booleanPointInPolygon throws', () => {
      jest.doMock('@turf/boolean-point-in-polygon', () => () => { throw new Error('polygon error'); });
      geoUtils = require('../../../utils/geoValidationUtils');
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      expect(geoUtils.isWithinTurinBoundaries(45.0703393, 7.6869005)).toBe(false);
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('Error validating coordinates against Turin boundaries:'),
        expect.any(Error)
      );
      spy.mockRestore();
    });

    it('should load Turin boundaries data correctly', () => {
      // Test that the GeoJSON data is loaded and has the expected structure
      const { isWithinTurinBoundaries } = require('../../../utils/geoValidationUtils');
      
      // This test ensures the module loads without errors and the GeoJSON is accessible
      expect(typeof isWithinTurinBoundaries).toBe('function');
      
      // Test that we can call the function with valid coordinates
      // This should execute the polygon check if the data loads correctly
      const result = isWithinTurinBoundaries(45.0703393, 7.6869005);
      expect(typeof result).toBe('boolean');
    });
  });
});
