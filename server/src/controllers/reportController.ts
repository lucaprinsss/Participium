import { Request, Response, NextFunction } from 'express';
import { reportService } from '../services/reportService';
import { UnauthorizedError } from '@models/errors/UnauthorizedError';
import { ReportStatus } from '@models/dto/ReportStatus';

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
      // TODO: Implement report creation logic
      res.status(501).json({ error: 'Not implemented yet' });
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
      // TODO: Implement get all reports logic
      res.status(501).json({ error: 'Not implemented yet' });
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
      // TODO: Implement approve report logic
      res.status(501).json({ error: 'Not implemented yet' });
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
      // TODO: Implement reject report logic
      res.status(501).json({ error: 'Not implemented yet' });
    } catch (error) {
      next(error);
    }
  }
}

export const reportController = new ReportController();
