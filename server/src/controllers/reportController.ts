import { Request, Response, NextFunction } from 'express';
import { reportService } from '../services/reportService';
import { CreateReportRequest } from '../models/dto/input/CreateReportRequest';
import { UpdateReportStatusRequest } from '../models/dto/input/UpdateReportStatusRequest';
import { ReportStatus } from '@models/dto/ReportStatus';
import { ReportCategory } from '@models/dto/ReportCategory';
import { UnauthorizedError } from '@models/errors/UnauthorizedError';
import { User } from '@models/dto/User';
import { parseAndValidateId } from '@utils/idValidationUtils';

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
   * Get reports for interactive map
   * GET /api/reports/map
   */
  async getMapReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category } = req.query;
      // Get validated values from middleware (if provided)
      const zoom = (req as any).validatedZoom;
      const boundingBox = (req as any).validatedBoundingBox;

      const reports = await reportService.getMapReports({
        zoom,
        minLat: boundingBox?.minLat,
        maxLat: boundingBox?.maxLat,
        minLng: boundingBox?.minLng,
        maxLng: boundingBox?.maxLng,
        category: category as string | undefined
      });

      res.status(200).json(reports);
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
      if (!req.user) {
        throw new UnauthorizedError('Not authenticated');
      }

      const userId = (req.user as User).id;
      const reportData: CreateReportRequest = req.body;

      const newReport = await reportService.createReport(reportData, userId);
      
      res.status(201).json(newReport);
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

      const reports = await reportService.getAllReports(
        userId,
        status as ReportStatus | undefined,
        category as ReportCategory | undefined
      );
      
      res.status(200).json(reports);
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
   * Get reports assigned to a specific external maintainer
   * GET /api/reports/assigned/external/:externalMaintainerId
   */
  async getAssignedReportsToExternalMaintainer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const externalMaintainerId = parseAndValidateId(req.params.externalMaintainerId, 'external maintainer');
      const status = req.query.status as ReportStatus | undefined;

      const reports = await reportService.getAssignedReportsToExternalMaintainer(externalMaintainerId, status);
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
   * Update the status of a report
   * PUT /api/reports/:id/status
   */
  async updateReportStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Not authenticated');
      }

      const userId = (req.user as any).id;
      const reportId = parseAndValidateId(req.params.id, 'report');
      const { newStatus, status, ...body } = req.body;
      const finalStatus = newStatus || status;

      const updatedReport = await reportService.updateReportStatus(
        reportId, 
        finalStatus as ReportStatus, 
        body, 
        userId
      );
      
      res.status(200).json(updatedReport);
    } catch (error) {
      next(error);
    }
  }
}

export const reportController = new ReportController();
