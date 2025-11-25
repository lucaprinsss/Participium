import { ReportCategory } from '../models/dto/ReportCategory';
import { ReportStatus } from '@models/dto/ReportStatus';
import { Location } from '../models/dto/Location';
import { BadRequestError } from '../models/errors/BadRequestError';
import { UnauthorizedError } from '../models/errors/UnauthorizedError';
import { InsufficientRightsError } from '../models/errors/InsufficientRightsError';
import { NotFoundError } from '../models/errors/NotFoundError';
import { isWithinTurinBoundaries, isValidCoordinate } from '../utils/geoValidationUtils';
import { dataUriToBuffer, extractMimeType, validatePhotos } from '../utils/photoValidationUtils';
import { storageService } from './storageService';
import { reportRepository } from '../repositories/reportRepository';
import { photoRepository } from '../repositories/photoRepository';
import { categoryRoleRepository } from '../repositories/categoryRoleRepository';
import { userRepository } from '../repositories/userRepository';
import { CreateReportRequest } from '../models/dto/input/CreateReportRequest';
import { ReportResponse } from '../models/dto/output/ReportResponse';
import { reportEntity } from '../models/entity/reportEntity';
import { userEntity } from '@models/entity/userEntity';
import { Report } from '@models/dto/Report'; 
import { mapReportEntityToResponse, mapReportEntityToDTO, mapReportEntityToReportResponse } from './mapperService';

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
        // Always save the reporter ID, even for anonymous reports
        reporterId: userId,
        title: reportData.title.trim(),
        description: reportData.description.trim(),
        category: reportData.category,
        location: `POINT(${reportData.location.longitude} ${reportData.location.latitude})`,
        isAnonymous: reportData.isAnonymous || false,
        photos: []
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
   * Enforces authorization: pending reports only for public relations officers
   */
  async getAllReports(
    user: userEntity, 
    status?: ReportStatus,
    category?: ReportCategory
  ): Promise<ReportResponse[]> {
    
    const userRole = user.departmentRole?.role?.name;
    
    if (!userRole) {
      throw new UnauthorizedError('User role not found');
    }
    
    if (status === ReportStatus.PENDING_APPROVAL) {
      if (userRole !== 'Municipal Public Relations Officer') {
        throw new InsufficientRightsError(
          'Only Municipal Public Relations Officers can view pending reports'
        );
      }
    }

    const reports = await reportRepository.findAllReports(status, category);

    const filteredReports = reports.filter(report => {
      if (report.status === ReportStatus.PENDING_APPROVAL) {
        return userRole === 'Municipal Public Relations Officer';
      }
      return true;
    });

    return filteredReports.map(report => mapReportEntityToReportResponse(report));
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
   * @param userId - ID of the user to whom reports are assigned
   * @param status - Optional status filter
   * @returns Array of reports assigned to the user
   */
  async getMyAssignedReports(userId: number, status?: ReportStatus): Promise<ReportResponse[]> {
    const reports = await reportRepository.findByAssigneeId(userId, status);
    return reports.map(report => mapReportEntityToReportResponse(report));
  }

  /**
   * Get a specific report by ID
   * TODO: Implement when needed
   */
  async getReportById(): Promise<void> {
    throw new Error('Not implemented yet');
  }

  /**
   * Approve a report and automatically assign to technical staff
   * based on category-role mapping with load balancing
   * Only Municipal Public Relations Officers can approve reports
   */
  async approveReport(
    reportId: number, 
    user: userEntity, 
    newCategory?: ReportCategory
  ): Promise<Report> {

    const report = await reportRepository.findReportById(reportId);
    if (!report) {
      throw new NotFoundError('Report not found');
    }

    if (report.status !== ReportStatus.PENDING_APPROVAL) {
      throw new BadRequestError(
        `Cannot approve report with status ${report.status}. Only reports with status Pending Approval can be approved.`
      );
    }

    if (newCategory) {
      if (!Object.values(ReportCategory).includes(newCategory)) {
        throw new BadRequestError(
          `Invalid category. Must be one of: ${Object.values(ReportCategory).join(', ')}`
        );
      }
      report.category = newCategory;
    }

    const categoryToAssign = report.category as ReportCategory;

    const roleId = await categoryRoleRepository.findRoleIdByCategory(categoryToAssign);
    
    if (!roleId) {
      throw new BadRequestError(
        `No role mapping found for category: ${categoryToAssign}. Please contact system administrator.`
      );
    }

    const availableStaff = await userRepository.findAvailableStaffByRoleId(roleId);
    
    if (!availableStaff) {
      throw new BadRequestError(
        `No available technical staff found for category: ${categoryToAssign}. All staff members may be overloaded or the role has no assigned users.`
      );
    }

    report.status = ReportStatus.ASSIGNED;
    report.rejectionReason = undefined;
    report.assigneeId = availableStaff.id;
    report.updatedAt = new Date();

    const updatedReport = await reportRepository.save(report);

    return mapReportEntityToDTO(updatedReport);
  }

  /**
   * Reject a report (change status from Pending Approval to Rejected)
   * Only Municipal Public Relations Officers can reject reports
   */
  async rejectReport(
    reportId: number, 
    rejectionReason: string, 
    user: userEntity
  ): Promise<Report> {

    if (!rejectionReason || rejectionReason.trim().length === 0) {
      throw new BadRequestError('Rejection reason is required');
    }

    const report = await reportRepository.findReportById(reportId);
    if (!report) {
      throw new NotFoundError('Report not found');
    }

    if (report.status !== ReportStatus.PENDING_APPROVAL) {
      throw new BadRequestError(
        `Cannot reject report with status ${report.status}. Only reports with status Pending Approval can be rejected.`
      );
    }

    report.status = ReportStatus.REJECTED;
    report.rejectionReason = rejectionReason;
    report.updatedAt = new Date();

    const updatedReport = await reportRepository.save(report);

    return mapReportEntityToDTO(updatedReport);
  }
}

export const reportService = new ReportService();
