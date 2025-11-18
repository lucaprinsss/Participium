import { ReportCategory } from '../models/dto/ReportCategory';

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
