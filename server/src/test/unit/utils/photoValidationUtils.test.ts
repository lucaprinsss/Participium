import {
  SUPPORTED_IMAGE_TYPES,
  SUPPORTED_IMAGE_EXTENSIONS,
  PHOTO_CONSTRAINTS,
  isValidImageDataUri,
  extractMimeType,
  validatePhotos,
  dataUriToBuffer,
  getExtensionFromMimeType,
} from '../../../utils/photoValidationUtils';

describe('photoValidationUtils', () => {
  describe('constants', () => {
    it('supported types and extensions are defined', () => {
      expect(SUPPORTED_IMAGE_TYPES).toEqual(['image/jpeg', 'image/png', 'image/webp']);
      expect(SUPPORTED_IMAGE_EXTENSIONS).toEqual(['jpg', 'jpeg', 'png', 'webp']);
      expect(PHOTO_CONSTRAINTS.MIN_COUNT).toBeGreaterThan(0);
      expect(PHOTO_CONSTRAINTS.MAX_COUNT).toBeGreaterThan(PHOTO_CONSTRAINTS.MIN_COUNT);
      expect(PHOTO_CONSTRAINTS.MAX_SIZE_BYTES).toBe(PHOTO_CONSTRAINTS.MAX_SIZE_MB * 1024 * 1024);
    });
  });

  describe('isValidImageDataUri', () => {
    it('returns true for valid PNG/JPEG/WebP data URIs within size', () => {
      const png = 'data:image/png;base64,iVBORw0KGgo=';
      const jpg = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ';
      const webp = 'data:image/webp;base64,UklGRg==';
      expect(isValidImageDataUri(png)).toBe(true);
      expect(isValidImageDataUri(jpg)).toBe(true);
      expect(isValidImageDataUri(webp)).toBe(true);
    });

    it('returns false for unsupported mime types', () => {
      const gif = 'data:image/gif;base64,AAAA';
      expect(isValidImageDataUri(gif)).toBe(false);
    });

    it('returns false for empty or non-string input', () => {
      expect(isValidImageDataUri('')).toBe(false);
      expect(isValidImageDataUri(undefined as any)).toBe(false);
      expect(isValidImageDataUri(null as any)).toBe(false);
      expect(isValidImageDataUri(123 as any)).toBe(false);
    });

    it('returns false for invalid base64 or missing comma', () => {
      const invalidBase64 = 'data:image/png;base64,***';
      const missingComma = 'data:image/png;base64';
      const emptyBase64 = 'data:image/png;base64,';
      expect(isValidImageDataUri(invalidBase64)).toBe(false);
      expect(isValidImageDataUri(missingComma)).toBe(false);
      expect(isValidImageDataUri(emptyBase64)).toBe(false);
    });

    it('returns false when estimated size exceeds max', () => {
      const big = 'A'.repeat(PHOTO_CONSTRAINTS.MAX_SIZE_BYTES * 2);
      const largePng = `data:image/png;base64,${big}`;
      expect(isValidImageDataUri(largePng)).toBe(false);
    });
  });

  describe('extractMimeType', () => {
    it('extracts image mime type', () => {
      expect(extractMimeType('data:image/png;base64,AAAA')).toBe('image/png');
      expect(extractMimeType('data:image/jpeg;base64,AAAA')).toBe('image/jpeg');
      expect(extractMimeType('data:image/webp;base64,AAAA')).toBe('image/webp');
    });

    it('returns null for invalid data URIs', () => {
      expect(extractMimeType('image/png;base64,AAAA')).toBeNull();
      expect(extractMimeType('data:text/plain;base64,AAAA')).toBeNull();
    });
  });

  describe('validatePhotos', () => {
    it('returns error when input is not an array', () => {
      const result = validatePhotos('not-array' as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/Photos must be an array/);
    });

    it('enforces min and max count', () => {
      const tooFew = validatePhotos([]);
      const tooMany = validatePhotos(new Array(PHOTO_CONSTRAINTS.MAX_COUNT + 1).fill('data:image/png;base64,AAAA'));
      expect(tooFew.isValid).toBe(false);
      expect(tooFew.error).toMatch(/between/);
      expect(tooMany.isValid).toBe(false);
      expect(tooMany.error).toMatch(/between/);
    });

    it('returns error when an element is not a string', () => {
      const result = validatePhotos(['data:image/png;base64,AAAA', 123 as any]);
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/Photo at index 1 must be a string/);
    });

    it('returns unsupported format error for valid-looking GIF', () => {
      const result = validatePhotos(['data:image/gif;base64,AAAA']);
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/unsupported format/i);
    });

    it('returns invalid data URI error for bad base64', () => {
      const result = validatePhotos(['data:image/png;base64,***']);
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/not a valid image data URI/i);
    });

    it('returns valid for a list of proper images', () => {
      const photos = [
        'data:image/png;base64,iVBORw0KGgo=',
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ',
      ];
      const result = validatePhotos(photos);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('returns invalid data URI error for non-image mime type', () => {
      const result = validatePhotos(['data:text/plain;base64,AAAA']);
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/not a valid image data URI/i);
    });
  });

  describe('dataUriToBuffer', () => {
    it('converts base64 data to buffer', () => {
      const buf = dataUriToBuffer('data:image/png;base64,QUJD');
      expect(buf.toString('utf8')).toBe('ABC');
    });
  });

  describe('getExtensionFromMimeType', () => {
    it('maps mime types to extensions', () => {
      expect(getExtensionFromMimeType('image/png')).toBe('png');
      expect(getExtensionFromMimeType('image/jpeg')).toBe('jpg');
      expect(getExtensionFromMimeType('image/webp')).toBe('webp');
      expect(getExtensionFromMimeType('image/unknown')).toBe('jpg');
    });
  });
});

