import { ReportCategory } from '../models/dto/ReportCategory';
import { Location } from '../models/dto/Location';
import { BadRequestError } from '../models/errors/BadRequestError';
import { isWithinTurinBoundaries, isValidCoordinate } from '../utils/geoValidationUtils';
import { dataUriToBuffer, extractMimeType, getExtensionFromMimeType } from '../utils/photoValidationUtils';
import * as fs from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';

/**
 * Report Service
 * Business logic for report-related operations
 */
class ReportService {
  /**
   * Get all available report categories
   * @returns Array of category strings
   */
  async getAllCategories(): Promise<string[]> {
    // Return all enum values as an array of strings
    return Object.values(ReportCategory);
  }

  /**
   * Validate if a location is within Turin city boundaries
   * @param location - The location object with latitude and longitude
   * @throws BadRequestError if location is missing or coordinates are invalid or outside Turin boundaries
   */
  validateLocation(location: Location): void {
    // Check if location exists
    if (!location) {
      throw new BadRequestError('Location is required');
    }

    const { latitude, longitude } = location;

    // Check if latitude and longitude are provided
    if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
      throw new BadRequestError('Location must include both latitude and longitude');
    }

    // Validate coordinate format
    if (!isValidCoordinate(latitude, longitude)) {
      throw new BadRequestError(
        `Invalid coordinates: latitude must be between -90 and 90, longitude must be between -180 and 180`
      );
    }

    // Validate precise boundary
    if (!isWithinTurinBoundaries(latitude, longitude)) {
      throw new BadRequestError(
        `Location is outside Turin city boundaries. Please select a location within the city of Turin`
      );
    }
  }

  /**
   * Saves photo data URIs to disk
   * @param photoDataUris - Array of base64 data URIs
   * @param reportId - The ID of the report (for organizing files)
   * @returns Array of file paths where photos were saved
   */
  private async savePhotos(photoDataUris: string[], reportId: number): Promise<string[]> {
    // Create report-specific directory
    const uploadDir = path.join(process.cwd(), 'uploads', 'reports', reportId.toString());
    
    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePaths: string[] = [];

    for (const dataUri of photoDataUris) {
      const buffer = dataUriToBuffer(dataUri);
      const mimeType = extractMimeType(dataUri);
      const extension = getExtensionFromMimeType(mimeType!);
      const filename = `${Date.now()}-${randomBytes(8).toString('hex')}.${extension}`;
      const filePath = path.join(uploadDir, filename);

      await fs.promises.writeFile(filePath, buffer);
      filePaths.push(filePath);
    }

    return filePaths;
  }

  /**
   * Get all reports with optional filters
   * TODO: Implement when needed
   */
  async getAllReports(): Promise<void> {
    throw new Error('Not implemented yet');
  }

  /**
   * Get reports for map visualization
   * TODO: Implement when needed
   */
  async getMapReports(): Promise<void> {
    throw new Error('Not implemented yet');
  }

  /**
   * Get reports assigned to a specific user
   * TODO: Implement when needed
   */
  async getAssignedReports(): Promise<void> {
    throw new Error('Not implemented yet');
  }

  /**
   * Get a specific report by ID
   * TODO: Implement when needed
   */
  async getReportById(): Promise<void> {
    throw new Error('Not implemented yet');
  }

  /**
   * Approve a report
   * TODO: Implement when needed
   */
  async approveReport(): Promise<void> {
    throw new Error('Not implemented yet');
  }

  /**
   * Reject a report
   * TODO: Implement when needed
   */
  async rejectReport(): Promise<void> {
    throw new Error('Not implemented yet');
  }
}

export const reportService = new ReportService();
