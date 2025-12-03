import { ReportCategory } from '../models/dto/ReportCategory';
import { MapReportResponse } from '../models/dto/output/MapReportResponse';
import { ClusteredReportResponse } from '../models/dto/output/ClusteredReportResponse';
import { reportRepository } from '../repositories/reportRepository';
import { ReportStatus } from '@models/dto/ReportStatus';
import { Location } from '../models/dto/Location';
import { BadRequestError } from '../models/errors/BadRequestError';
import { UnauthorizedError } from '../models/errors/UnauthorizedError';
import { InsufficientRightsError } from '../models/errors/InsufficientRightsError';
import { NotFoundError } from '../models/errors/NotFoundError';
import { isWithinTurinBoundaries, isValidCoordinate } from '../utils/geoValidationUtils';
import { dataUriToBuffer, extractMimeType, validatePhotos } from '../utils/photoValidationUtils';
import { storageService } from './storageService';
import { photoRepository } from '../repositories/photoRepository';
import { categoryRoleRepository } from '../repositories/categoryRoleRepository';
import { userRepository } from '../repositories/userRepository';
import { CreateReportRequest } from '../models/dto/input/CreateReportRequest';
import { ReportResponse } from '../models/dto/output/ReportResponse';
import { UserRole } from '@models/dto/UserRole';
import { reportEntity } from '../models/entity/reportEntity';
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
   * Get reports for interactive map visualization
   * Returns individual reports when zoomed in (zoom > 12) or clustered reports when zoomed out (zoom ≤ 12)
   * Only returns approved reports (excludes "Pending Approval" and "Rejected")
   * 
   * @param params - Query parameters for filtering and zoom level
   * @returns Array of individual reports or clustered reports based on zoom level
   */
  async getMapReports(params: {
    zoom?: number;
    minLat?: number;
    maxLat?: number;
    minLng?: number;
    maxLng?: number;
    category?: string;
  }): Promise<MapReportResponse[] | ClusteredReportResponse[]> {
    const { zoom, minLat, maxLat, minLng, maxLng, category } = params;

    // Convert category string to enum if provided
    const categoryEnum = category ? (category as ReportCategory) : undefined;

    // Build filters object
    const filters = {
      minLat,
      maxLat,
      minLng,
      maxLng,
      category: categoryEnum
    };

    // Determine zoom threshold: > 12 = individual reports, ≤ 12 = clusters
    const ZOOM_THRESHOLD = 12;

    // If no zoom provided or zoom > threshold, return individual reports
    if (!zoom || zoom > ZOOM_THRESHOLD) {
      return await reportRepository.getApprovedReportsForMap(filters);
    }

    // Otherwise, return clustered reports
    return await reportRepository.getClusteredReports(zoom, filters);
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
    userId: number, 
    status?: ReportStatus,
    category?: ReportCategory
  ): Promise<ReportResponse[]> {
    
    const userEntity = await userRepository.findUserById(userId);
    
    if (!userEntity) {
      throw new UnauthorizedError('User not found');
    }
    
    const userRole = userEntity.departmentRole?.role?.name;
    
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
   * Not yet implemented
   */
  async getReportById(): Promise<void> {
    throw new Error('Not implemented yet');
  }

  /**
   * Update the status of a report
   * @param reportId - The ID of the report to update
   * @param newStatus - The new status of the report
   * @param body - The request body, containing additional data like reason or assignee
   * @param userId - The ID of the user updating the report
   * @returns The updated report
   */
  async updateReportStatus(
    reportId: number,
    newStatus: ReportStatus,
    body: { rejectionReason?: string; externalAssigneeId?: number; resolutionNotes?: string; category?: ReportCategory },
    userId: number
  ): Promise<Report> {
    if (isNaN(reportId) || reportId <= 0) {
      throw new BadRequestError('Invalid report ID.');
    }

    const report = await reportRepository.findReportById(reportId);
    if (!report) {
      throw new NotFoundError('Report not found');
    }

    const user = await userRepository.findUserById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    const userRole = user.departmentRole?.role?.name;

    const currentStatus = report.status;

    switch (newStatus) {
      case ReportStatus.ASSIGNED:
        if (currentStatus !== ReportStatus.PENDING_APPROVAL) {
          throw new BadRequestError(`Cannot approve report with status ${currentStatus}. Only reports with status Pending Approval can be approved.`);
        }
        if (userRole !== UserRole.PUBLIC_RELATIONS_OFFICER) {
          throw new InsufficientRightsError('Only Public Relations Officers can approve reports.');
        }
        if (body.externalAssigneeId) {
          const assignee = await userRepository.findUserById(body.externalAssigneeId);
          if (!assignee) {
            throw new NotFoundError('External assignee not found');
          }
          if (assignee.departmentRole?.role?.name !== UserRole.EXTERNAL_MAINTAINER) {
            throw new BadRequestError('User is not an external maintainer');
          }
          report.assignee = assignee;
          report.assigneeId = assignee.id;
        } else {
          const categoryToAssign = body.category || report.category as ReportCategory;
          const roleId = await categoryRoleRepository.findRoleIdByCategory(categoryToAssign);
          if (!roleId) {
            throw new BadRequestError(`No role mapping found for category: ${categoryToAssign}. Please contact system administrator.`);
          }
          const availableStaff = await userRepository.findAvailableStaffByRoleId(roleId);
          if (!availableStaff) {
            throw new BadRequestError(`No available technical staff found for category: ${categoryToAssign}. All staff members may be overloaded or the role has no assigned users.`);
          }
          report.assignee = availableStaff;
          report.assigneeId = availableStaff.id;
          if (body.category) {
            report.category = body.category;
          }
        }
        break;
      
      case ReportStatus.REJECTED:
        if (currentStatus !== ReportStatus.PENDING_APPROVAL) {
            throw new BadRequestError(`Cannot reject report with status ${currentStatus}. Only reports with status Pending Approval can be rejected.`);
        }
        if (userRole !== UserRole.PUBLIC_RELATIONS_OFFICER) {
            throw new InsufficientRightsError('Only Public Relations Officers can reject reports.');
        }
        if (!body.rejectionReason || body.rejectionReason.trim() === '') {
          throw new BadRequestError('Rejection reason is required when rejecting a report.');
        }
        report.rejectionReason = body.rejectionReason;
        break;

      case ReportStatus.RESOLVED:
        if (![ReportStatus.ASSIGNED, ReportStatus.IN_PROGRESS, ReportStatus.SUSPENDED].includes(currentStatus as ReportStatus)) {
          throw new BadRequestError(`Cannot resolve a report with status ${currentStatus}.`);
        }
        if (userRole === UserRole.EXTERNAL_MAINTAINER) {
          if (report.assigneeId !== userId) {
            throw new InsufficientRightsError('You can only resolve reports assigned to you.');
          }
        } else if (![UserRole.TECHNICAL_MANAGER, UserRole.TECHNICAL_ASSISTANT].includes(userRole as UserRole)) {
          throw new InsufficientRightsError('You are not authorized to resolve reports.');
        }
        if (body.resolutionNotes) {
          // In a real application, you would save the resolution notes
        }
        break;

      case ReportStatus.IN_PROGRESS:
        if (currentStatus !== ReportStatus.ASSIGNED || ![UserRole.TECHNICAL_MANAGER, UserRole.TECHNICAL_ASSISTANT].includes(userRole as UserRole)) {
          throw new InsufficientRightsError('Only Technical Managers or Assistants can mark reports as in progress.');
        }
        break;

      case ReportStatus.SUSPENDED:
        if (currentStatus !== ReportStatus.IN_PROGRESS || ![UserRole.TECHNICAL_MANAGER, UserRole.TECHNICAL_ASSISTANT].includes(userRole as UserRole)) {
          throw new InsufficientRightsError('Only Technical Managers or Assistants can suspend reports.');
        }
        break;

      default:
        throw new BadRequestError(`Invalid status transition to ${newStatus}.`);
    }

    report.status = newStatus;
    report.updatedAt = new Date();
    const updatedReport = await reportRepository.save(report);
    return mapReportEntityToDTO(updatedReport);
  }
}

export const reportService = new ReportService();
