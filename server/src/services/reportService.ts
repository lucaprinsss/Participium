import { ReportCategory } from '../models/dto/ReportCategory';
import { ReportStatus } from '@models/dto/ReportStatus';
import { User } from '@models/dto/User';
import { UnauthorizedError } from '../models/errors/UnauthorizedError';
import { InsufficientRightsError } from '../models/errors/InsufficientRightsError';
import { reportRepository } from '../repositories/reportRepository';
import { mapReportEntityToDTO } from './mapperService';
import { Report } from '@models/dto/Report'; 
import { userEntity } from '@models/entity/userEntity';

import { NotFoundError } from '../models/errors/NotFoundError';
import { BadRequestError } from '../models/errors/BadRequestError';




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
   * Approve a report (change status from Pending Approval to Assigned)
   * Only Municipal Public Relations Officers can approve reports
   */
  async approveReport(reportId: number, user: userEntity, newCategory?: ReportCategory ): Promise<Report> {

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

    report.status = ReportStatus.ASSIGNED;
    report.rejectionReason = undefined; 
    report.assigneeId = undefined; //TODO: implement automatic assignment service
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

    // Verifica che il report sia in stato Pending Approval
    if (report.status !== ReportStatus.PENDING_APPROVAL) {
      throw new BadRequestError(
        `Cannot reject report with status ${report.status}. Only reports with status Pending Approval can be rejected.`
      );
    }

    // Cambia lo stato a Rejected e salva la ragione
    report.status = ReportStatus.REJECTED;
    report.rejectionReason = rejectionReason;
    report.updatedAt = new Date();

    // Salva nel database
    const updatedReport = await reportRepository.save(report);

    return mapReportEntityToDTO(updatedReport);
  }

}

export const reportService = new ReportService();
