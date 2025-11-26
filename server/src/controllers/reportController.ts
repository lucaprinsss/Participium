import { Request, Response, NextFunction } from 'express';
import { reportService } from '../services/reportService';
import { BadRequestError } from '@models/errors/BadRequestError';
import { CreateReportRequest } from '../models/dto/input/CreateReportRequest';
import { ReportStatus } from '@models/dto/ReportStatus';
import { ReportCategory } from '@models/dto/ReportCategory';
import { UnauthorizedError } from '@models/errors/UnauthorizedError';
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
   * Get reports for interactive map
   * GET /api/reports/map
   */
  async getMapReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract and validate query parameters
      const { zoom, minLat, maxLat, minLng, maxLng, category } = req.query;

      // Validate zoom level (optional, 1-20)
      let zoomLevel: number | undefined;
      if (zoom) {
        zoomLevel = parseFloat(zoom as string);
        if (isNaN(zoomLevel) || zoomLevel < 1 || zoomLevel > 20) {
          throw new BadRequestError('Zoom level must be between 1 and 20');
        }
      }

      // Validate bounding box coordinates (all or none must be provided)
      let boundingBox: { minLat: number; maxLat: number; minLng: number; maxLng: number } | undefined;
      if (minLat || maxLat || minLng || maxLng) {
        // Check if all bounding box parameters are provided
        if (!minLat || !maxLat || !minLng || !maxLng) {
          throw new BadRequestError('Bounding box requires all parameters: minLat, maxLat, minLng, maxLng');
        }

        const minLatNum = parseFloat(minLat as string);
        const maxLatNum = parseFloat(maxLat as string);
        const minLngNum = parseFloat(minLng as string);
        const maxLngNum = parseFloat(maxLng as string);

        // Validate coordinate ranges
        if (isNaN(minLatNum) || minLatNum < -90 || minLatNum > 90) {
          throw new BadRequestError('minLat must be between -90 and 90');
        }
        if (isNaN(maxLatNum) || maxLatNum < -90 || maxLatNum > 90) {
          throw new BadRequestError('maxLat must be between -90 and 90');
        }
        if (isNaN(minLngNum) || minLngNum < -180 || minLngNum > 180) {
          throw new BadRequestError('minLng must be between -180 and 180');
        }
        if (isNaN(maxLngNum) || maxLngNum < -180 || maxLngNum > 180) {
          throw new BadRequestError('maxLng must be between -180 and 180');
        }

        // Validate logical bounds
        if (minLatNum >= maxLatNum) {
          throw new BadRequestError('minLat must be less than maxLat');
        }
        if (minLngNum >= maxLngNum) {
          throw new BadRequestError('minLng must be less than maxLng');
        }

        boundingBox = {
          minLat: minLatNum,
          maxLat: maxLatNum,
          minLng: minLngNum,
          maxLng: maxLngNum
        };
      }

      // Get reports from service
      const reports = await reportService.getMapReports({
        zoom: zoomLevel,
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
