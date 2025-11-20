import { ReportCategory } from '../models/dto/ReportCategory';
import { ReportStatus } from '@models/dto/ReportStatus';
import { User } from '@models/dto/User';
import { UnauthorizedError } from '../models/errors/UnauthorizedError';
import { InsufficientRightsError } from '../models/errors/InsufficientRightsError';
import { reportRepository } from '../repositories/reportRepository';
import { mapReportEntityToDTO } from './mapperService';
import { Report } from '@models/dto/Report'; 
import { userEntity } from '@models/entity/userEntity';




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
   * Create a new report
   * TODO: Implement when needed
   */
  async createReport(): Promise<void> {
    throw new Error('Not implemented yet');
  }

  /**
   * Get all reports with optional filters
   * Enforces authorization: pending reports only for public relations officers
   */
async getAllReports(
  user: userEntity, 
  status?: ReportStatus,
  category?: ReportCategory
): Promise<Report[]> {
  
   const userRole = user.departmentRole?.role?.name;
  
  if (!userRole) {
    throw new UnauthorizedError('User role not found');
  }
  
  // Se filtering by Pending Approval, check authorization
  if (status === ReportStatus.PENDING_APPROVAL) {
    if (userRole !== 'Municipal Public Relations Officer') {
      throw new InsufficientRightsError(
        'Only Municipal Public Relations Officers can view pending reports'
      );
    }
  }
    const reports = await reportRepository.findAllReports(status, category);
    
    // Filter out pending reports for non-authorized users
    const filteredReports = reports.filter(report => {
      if (report.status === ReportStatus.PENDING_APPROVAL) {
        return userRole === 'Municipal Public Relations Officer';
      }
      return true;
    });

    return filteredReports.map(report => mapReportEntityToDTO(report));
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
