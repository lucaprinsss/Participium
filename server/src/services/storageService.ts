import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { storageConfig, validateStorageConfig } from '../config/storage';
import * as fs from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';

/**
 * Storage Service
 * Handles file uploads to either local filesystem or Cloudflare R2
 */
class StorageService {
  private s3Client: S3Client | null = null;

  constructor() {
    this.initializeStorage();
  }

  /**
   * Initialize storage based on configuration
   */
  private initializeStorage(): void {
    if (storageConfig.provider === 'r2') {
      validateStorageConfig();
      this.s3Client = new S3Client({
        region: storageConfig.r2.region,
        endpoint: storageConfig.r2.endpoint,
        credentials: {
          accessKeyId: storageConfig.r2.accessKeyId,
          secretAccessKey: storageConfig.r2.secretAccessKey,
        },
      });
      console.log('Storage initialized: Cloudflare R2');
    } else {
      console.log('Storage initialized: Local filesystem');
    }
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

    if (storageConfig.provider === 'r2') {
      return await this.uploadToR2(buffer, filename, mimeType, reportId);
    } else {
      return await this.uploadToLocal(buffer, filename, reportId);
    }
  }

  /**
   * Upload photo to Cloudflare R2
   */
  private async uploadToR2(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    reportId: number
  ): Promise<string> {
    const key = `reports/${reportId}/${filename}`;

    const command = new PutObjectCommand({
      Bucket: storageConfig.r2.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    });

    await this.s3Client!.send(command);

    // Return public URL if configured, otherwise return the key
    if (storageConfig.r2.publicUrl) {
      return `${storageConfig.r2.publicUrl}/${key}`;
    }
    return key;
  }

  /**
   * Upload photo to local filesystem
   */
  private async uploadToLocal(buffer: Buffer, filename: string, reportId: number): Promise<string> {
    const uploadDir = path.join(
      process.cwd(),
      storageConfig.local.uploadDir,
      storageConfig.local.reportsDir,
      reportId.toString()
    );

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    await fs.promises.writeFile(filePath, buffer);

    // Return relative path
    return `${storageConfig.local.reportsDir}/${reportId}/${filename}`;
  }

  /**
   * Delete a report's photos
   * @param reportId - Report ID
   */
  async deleteReportPhotos(reportId: number): Promise<void> {
    if (storageConfig.provider === 'r2') {
      // For R2, we would need to list and delete objects with prefix
      // This is more complex and can be implemented later if needed
      console.warn('R2 batch delete not implemented yet');
    } else {
      // Delete local directory
      const reportDir = path.join(
        process.cwd(),
        storageConfig.local.uploadDir,
        storageConfig.local.reportsDir,
        reportId.toString()
      );

      if (fs.existsSync(reportDir)) {
        await fs.promises.rm(reportDir, { recursive: true, force: true });
      }
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
