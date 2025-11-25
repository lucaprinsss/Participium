import { Request, Response, NextFunction } from 'express';
import { reportService } from '../services/reportService';
import { CreateReportRequest } from '../models/dto/input/CreateReportRequest';
import { ReportStatus } from '@models/dto/ReportStatus';
import { ReportCategory } from '@models/dto/ReportCategory';
import { UnauthorizedError } from '@models/errors/UnauthorizedError';
import { BadRequestError } from '@models/errors/BadRequestError';
import { User } from '@models/dto/User';

/**
 * Report Controller
 * Handles HTTP requests for report-related operations
 */
class ReportController {
  /**
   * Get all available report categories
   * GET /api/reports/categories
   */
  async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await reportService.getAllCategories();
      res.status(200).json(categories);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new report
   * POST /api/reports
   */
  async createReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reportData: CreateReportRequest = req.body;
      const userId = (req.user as any).id;

      const createdReport = await reportService.createReport(reportData, userId);
      res.status(201).json(createdReport);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all reports with optional filters
   * GET /api/reports
   */
  async getAllReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Not authenticated');
      }

      const userId = (req.user as User).id;
      const { status, category } = req.query;
      
      let reportStatus: ReportStatus | undefined;
      if (status && typeof status === 'string') {
        if (!Object.values(ReportStatus).includes(status as ReportStatus)) {
          throw new BadRequestError(
            `Invalid status. Must be one of: ${Object.values(ReportStatus).join(', ')}`
          );
        }
        reportStatus = status as ReportStatus;
      }

      let reportCategory: ReportCategory | undefined;
      if (category && typeof category === 'string') {
        if (!Object.values(ReportCategory).includes(category as ReportCategory)) {
          throw new BadRequestError(
            `Invalid category. Must be one of: ${Object.values(ReportCategory).join(', ')}`
          );
        }
        reportCategory = category as ReportCategory;
      }

      const reports = await reportService.getAllReports(
        userId,
        reportStatus,
        reportCategory
      );
      
      res.status(200).json(reports);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get reports for interactive map
   * GET /api/reports/map
   */
  async getMapReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: Implement map reports logic
      res.status(501).json({ error: 'Not implemented yet' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get reports assigned to current user
   * GET /api/reports/assigned/me
   */
  async getMyAssignedReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Not authenticated');
      }

      const userId = (req.user as any).id;
      const status = req.query.status as ReportStatus | undefined;

      const reports = await reportService.getMyAssignedReports(userId, status);
      res.status(200).json(reports);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a specific report by ID
   * GET /api/reports/:id
   */
  async getReportById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: Implement get report by ID logic
      res.status(501).json({ error: 'Not implemented yet' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve a report
   * PUT /api/reports/:id/approve
   */
  async approveReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Not authenticated');
      }

      const userId = (req.user as User).id;
      const reportId = parseInt(req.params.id);
      const { category } = req.body;

      const approvedReport = await reportService.approveReport(
        reportId, 
        userId,
        category as ReportCategory | undefined
      );
      
      res.status(200).json(approvedReport);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject a report
   * PUT /api/reports/:id/reject
   */
  async rejectReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Not authenticated');
      }

      const userId = (req.user as User).id;
      const reportId = parseInt(req.params.id);
      const { rejectionReason } = req.body;

      const rejectedReport = await reportService.rejectReport(
        reportId, 
        rejectionReason, 
        userId
      );
      
      res.status(200).json(rejectedReport);
    } catch (error) {
      next(error);
    }
  }
}

export const reportController = new ReportController();
