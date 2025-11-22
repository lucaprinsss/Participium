import { ReportCategory } from '../models/dto/ReportCategory';
import { ReportStatus } from '@models/dto/ReportStatus';
import { ReportResponse } from '@models/dto/output/ReportResponse';
import { reportRepository } from '../repositories/reportRepository';
import { mapReportEntityToReportResponse } from './mapperService';

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
