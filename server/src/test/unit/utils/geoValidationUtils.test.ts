import { isWithinTurinBoundaries, isValidCoordinate } from '../../../utils/geoValidationUtils';

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
});
