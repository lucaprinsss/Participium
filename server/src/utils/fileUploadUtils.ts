import fs from 'fs';
import path from 'path';
import { BadRequestError } from '@models/errors/BadRequestError';

/**
 * Maximum file size for profile photos (5MB)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

/**
 * Allowed image MIME types
 */
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

/**
 * Save a base64 encoded image to the filesystem
 * @param base64Image Base64 encoded image with data URI
 * @param userId User ID for filename
 * @returns Relative URL path to the saved image
 */
export async function saveBase64Image(base64Image: string, userId: number): Promise<string> {
  // Extract MIME type and base64 data
  const matches = base64Image.match(/^data:(. +);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new BadRequestError('Invalid base64 image format');
  }

  const mimeType = matches[1];
  const base64Data = matches[2];

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new BadRequestError('Invalid image type.  Allowed types:  JPEG, PNG, GIF, WebP');
  }

  // Convert base64 to buffer
  const imageBuffer = Buffer.from(base64Data, 'base64');

  // Check file size
  if (imageBuffer.length > MAX_FILE_SIZE) {
    throw new BadRequestError('Image too large. Maximum size is 5MB');
  }

  // Get file extension from MIME type
  const extension = mimeType.split('/')[1].replace('jpeg', 'jpg');

  // Generate filename
  const filename = `user_${userId}_profile.${extension}`;

  // Define upload directory
  const uploadDir = path.join(process.cwd(), 'server', 'src', 'public', 'uploads', 'photos');

  // Create directory if it doesn't exist
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Full file path
  const filePath = path.join(uploadDir, filename);

  // Write file to disk
  try {
    fs.writeFileSync(filePath, imageBuffer);
  } catch (error) {
    console.error('Error saving image:', error);
    throw new BadRequestError('Failed to save image');
  }

  // Return relative URL
  return `/uploads/photos/${filename}`;
}

/**
 * Delete an image file from the filesystem
 * @param photoUrl Relative URL path to the image
 */
export function deleteImage(photoUrl: string): void {
  try {
    const filePath = path.join(process. cwd(), 'server', 'src', 'public', photoUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    // Don't throw - just log the error
  }
}