import { ReportCategory } from '../models/dto/ReportCategory';
import { MapReportResponse } from '../models/dto/output/MapReportResponse';
import { ClusteredReportResponse } from '../models/dto/output/ClusteredReportResponse';
import { reportRepository } from '../repositories/reportRepository';

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
