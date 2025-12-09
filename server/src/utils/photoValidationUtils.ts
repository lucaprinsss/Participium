/**
 * Supported image MIME types for report photos
 */
export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

/**
 * Supported image file extensions
 */
export const SUPPORTED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const;

/**
 * Photo validation constraints
 */
export const PHOTO_CONSTRAINTS = {
  MIN_COUNT: 1,
  MAX_COUNT: 3,
  MAX_SIZE_MB: 5,
  MAX_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
} as const;

/**
 * Validates if a string is a valid base64 data URI for an image
 * @param dataUri - The data URI string to validate
 * @returns true if valid, false otherwise
 */
export function isValidImageDataUri(dataUri: string): boolean {
  if (typeof dataUri !== 'string' || !dataUri) {
    return false;
  }

  // Check if it starts with data:image/
  const dataUriRegex = /^data:image\/(jpeg|png|webp);base64,/;
  if (!dataUriRegex.test(dataUri)) {
    return false;
  }

  // Extract the base64 part
  const base64Data = dataUri.split(',')[1];
  if (!base64Data) {
    return false;
  }

  // Validate base64 format
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(base64Data)) {
    return false;
  }

  // Check size (approximate, base64 is ~33% larger than binary)
  const estimatedSizeBytes = (base64Data.length * 3) / 4;
  if (estimatedSizeBytes > PHOTO_CONSTRAINTS.MAX_SIZE_BYTES) {
    return false;
  }

  return true;
}

/**
 * Extracts the MIME type from a data URI
 * @param dataUri - The data URI string
 * @returns The MIME type or null if invalid
 */
export function extractMimeType(dataUri: string): string | null {
  const match = /^data:(image\/[a-z]+);base64,/.exec(dataUri);
  return match ? match[1] : null;
}

/**
 * Validates an array of photo data URIs
 * @param photos - Array of photo data URIs
 * @returns Object with isValid flag and optional error message
 */
export function validatePhotos(photos: unknown): { isValid: boolean; error?: string } {
  // Check if photos is an array
  if (!Array.isArray(photos)) {
    return { isValid: false, error: 'Photos must be an array' };
  }

  // Check array length
  if (photos.length < PHOTO_CONSTRAINTS.MIN_COUNT || photos.length > PHOTO_CONSTRAINTS.MAX_COUNT) {
    return {
      isValid: false,
      error: `Photos must contain between ${PHOTO_CONSTRAINTS.MIN_COUNT} and ${PHOTO_CONSTRAINTS.MAX_COUNT} images`,
    };
  }

  // Validate each photo
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];

    if (typeof photo !== 'string') {
      return { isValid: false, error: `Photo at index ${i} must be a string` };
    }

    if (!isValidImageDataUri(photo)) {
      const mimeType = extractMimeType(photo);
      if (mimeType && !SUPPORTED_IMAGE_TYPES.includes(mimeType as any)) {
        return {
          isValid: false,
          error: `Photo at index ${i} has unsupported format. Supported formats: JPEG, PNG, WebP`,
        };
      }
      return { isValid: false, error: `Photo at index ${i} is not a valid image data URI` };
    }
  }

  return { isValid: true };
}

/**
 * Converts a base64 data URI to a buffer
 * @param dataUri - The data URI string
 * @returns Buffer containing the image data
 */
export function dataUriToBuffer(dataUri: string): Buffer {
  const base64Data = dataUri.split(',')[1];
  return Buffer.from(base64Data, 'base64');
}

/**
 * Gets the file extension for a given MIME type
 * @param mimeType - The MIME type (e.g., 'image/jpeg')
 * @returns The file extension (e.g., 'jpg')
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: { [key: string]: string } = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  return mimeToExt[mimeType] || 'jpg';
}
