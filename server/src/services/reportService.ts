import { ReportCategory } from '../models/dto/ReportCategory';
import { Location } from '../models/dto/Location';
import { BadRequestError } from '../models/errors/BadRequestError';
import { isWithinTurinBoundaries, isValidCoordinate } from '../utils/geoValidationUtils';
import { dataUriToBuffer, extractMimeType } from '../utils/photoValidationUtils';
import { storageService } from './storageService';
import { reportRepository } from '../repositories/reportRepository';
import { photoRepository } from '../repositories/photoRepository';
import { CreateReportRequest } from '../models/dto/input/CreateReportRequest';
import { ReportResponse } from '../models/dto/output/ReportResponse';
import { reportEntity } from '../models/entity/reportEntity';
import { validatePhotos } from '../utils/photoValidationUtils';
import { mapReportEntityToResponse } from './mapperService';

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
   * Saves photo data URIs using storage service
   * @param photoDataUris - Array of base64 data URIs
   * @param reportId - The ID of the report (for organizing files)
   * @returns Array of storage URLs/paths where photos were saved
   */
  private async savePhotos(photoDataUris: string[], reportId: number): Promise<string[]> {
    const storagePaths: string[] = [];

    for (const dataUri of photoDataUris) {
      const buffer = dataUriToBuffer(dataUri);
      const mimeType = extractMimeType(dataUri)!;
      
      // Upload using storage service (handles both local and R2)
      const storagePath = await storageService.uploadPhoto(buffer, mimeType, reportId);
      storagePaths.push(storagePath);
    }

    return storagePaths;
  }

  /**
   * Create a new report
   * @param reportData - The report data from the request
   * @param userId - The ID of the user creating the report
   * @returns The created report response
   * @throws BadRequestError if validation fails
   */
  async createReport(reportData: CreateReportRequest, userId: number): Promise<ReportResponse> {
    // Validate location (business logic - Turin boundaries)
    this.validateLocation(reportData.location);

    // Validate photos (business logic - detailed validation)
    const photoValidation = validatePhotos(reportData.photos);
    if (!photoValidation.isValid) {
      throw new BadRequestError(photoValidation.error!);
    }

    let createdReport: reportEntity | null = null;

    try {
      // Prepare report data for repository
      const reportEntityData = {
        reporterId: reportData.isAnonymous ? null as any : userId,
        reporter: reportData.isAnonymous ? null as any : undefined,
        title: reportData.title.trim(),
        description: reportData.description.trim(),
        category: reportData.category,
        location: `POINT(${reportData.location.longitude} ${reportData.location.latitude})`,
        isAnonymous: reportData.isAnonymous || false,
      };

      // Create report in database first to get the ID
      createdReport = await reportRepository.createReport(reportEntityData, []);

      // Save photos to disk in report-specific folder
      const photoFilePaths = await this.savePhotos(reportData.photos, createdReport.id);

      // Save photo paths to database
      await photoRepository.savePhotosForReport(createdReport.id, photoFilePaths);

      // Get photos for response
      const photos = await photoRepository.getPhotosByReportId(createdReport.id);

      // Map to response DTO
      return mapReportEntityToResponse(createdReport, photos, reportData.location);
    } catch (error) {
      // Clean up: delete report photos if database operation fails
      if (createdReport?.id) {
        try {
          await storageService.deleteReportPhotos(createdReport.id);
        } catch (cleanupError) {
          console.error('Failed to cleanup report photos:', cleanupError);
        }
      }
      throw error;
    }
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
