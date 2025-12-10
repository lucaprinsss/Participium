import { storageConfig } from '../config/storage';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomBytes } from 'node:crypto';

/**
 * Storage Service
 * Handles photo uploads to container filesystem
 */
class StorageService {
  constructor() {
    console.log('Storage initialized: Container filesystem');
  }

  /**
   * Upload a photo
   * @param buffer - Photo buffer
   * @param mimeType - MIME type (e.g., 'image/jpeg')
   * @param reportId - Report ID for organizing files
   * @returns Storage URL or path
   */
  async uploadPhoto(buffer: Buffer, mimeType: string, reportId: number): Promise<string> {
    const extension = this.getExtensionFromMimeType(mimeType);
    const filename = `${Date.now()}-${randomBytes(8).toString('hex')}.${extension}`;
    return await this.savePhoto(buffer, filename, reportId);
  }


  /**
   * Save photo to container filesystem
   */
  private async savePhoto(buffer: Buffer, filename: string, reportId: number): Promise<string> {
    const uploadDir = path.join(
      process.cwd(),
      storageConfig.uploadDir,
      storageConfig.reportsDir,
      reportId.toString()
    );

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    await fs.promises.writeFile(filePath, buffer);

    // Return relative path
    return `/${storageConfig.uploadDir}/${storageConfig.reportsDir}/${reportId}/${filename}`;
  }

  /**
   * Delete a report's photos
   * @param reportId - Report ID
   */
  async deleteReportPhotos(reportId: number): Promise<void> {
    // Delete container directory
    const reportDir = path.join(
      process.cwd(),
      storageConfig.uploadDir,
      storageConfig.reportsDir,
      reportId.toString()
    );

    if (fs.existsSync(reportDir)) {
      await fs.promises.rm(reportDir, { recursive: true, force: true });
    }
  }

  /**
   * Get file extension from MIME type
   */
  private getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    return mimeToExt[mimeType] || 'jpg';
  }
}

export const storageService = new StorageService();
