import { CreateMessageRequest } from '../models/dto/input/CreateMessageRequest';
import { Request, Response, NextFunction } from 'express';
import { reportService } from '../services/reportService';
import { CreateReportRequest } from '../models/dto/input/CreateReportRequest';
import { ReportStatus } from '@models/dto/ReportStatus';
import { ReportCategory } from '@models/dto/ReportCategory';
import { UnauthorizedError } from '@models/errors/UnauthorizedError';
import { User } from '@models/dto/User';
import { parseAndValidateId } from '@utils/idValidationUtils';
import { BadRequestError } from '@models/errors/BadRequestError';
import { CreateCommentRequest } from '../models/dto/input/CreateCommentRequest';

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
      const userId = req.user ? (req.user as User).id : undefined;
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
      const { status, category } = req.query;

      const reports = await reportService.getMyAssignedReports(
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
  // async getReportById(req: Request, res: Response, next: NextFunction): Promise<void> {
  //   try {
  //     // Implement get report by ID logic
  //     res.status(501).json({ error: 'Not implemented yet' });
  //   } catch (error) {
  //     next(error);
  //   }
  // }

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

  /**
   * Assign report to external maintainer
   * PATCH /api/reports/:id/assign-external
   */
  async assignToExternalMaintainer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Not authenticated');
      }

      const userId = (req.user as any).id;
      const reportId = parseAndValidateId(req.params.id, 'report');
      const { externalAssigneeId } = req.body;

      const updatedReport = await reportService.assignToExternalMaintainer(
        reportId,
        externalAssigneeId,
        userId
      );
      
      res.status(200).json(updatedReport);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get internal comments for a report
   * GET /api/reports/:id/internal-comments
   */
  async getInternalComments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reportId = parseAndValidateId(req.params.id, 'report');
      
      const comments = await reportService.getInternalComments(reportId);
      
      res.status(200).json(comments);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add an internal comment to a report
   * POST /api/reports/:id/internal-comments
   */
  async addInternalComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as User).id;
      const reportId = parseAndValidateId(req.params.id, 'report');
      const { content } = req.body as CreateCommentRequest;

      if (!content) {
        throw new BadRequestError('content is required');
      }

      const comment = await reportService.addInternalComment(reportId, userId, content);
      
      res.status(201).json(comment);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete an internal comment from a report
   * DELETE /api/reports/:reportId/internal-comments/:commentId
   */
  async deleteInternalComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as User).id;
      const reportId = parseAndValidateId(req.params.reportId, 'report');
      const commentId = parseAndValidateId(req.params.commentId, 'comment');

      await reportService.deleteInternalComment(reportId, commentId, userId);
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

    /**
   * Retrieve reports located near a specific address
   * @param req 
   * @param res 
   * @param next 
   */
  async getReportByAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Leggiamo 'address' dai query params, non dai params del path
      const address = req.query.address as string;

      if (!address) {
         throw new BadRequestError("Address query parameter is required");
      }

      const reports = await reportService.getReportByAddress(address);
      res.status(200).json(reports);

    } catch (error) {
      next(error);
    }
  }

    /**
   * Send a message from technical staff to the citizen reporter
   * POST /api/reports/:id/messages
   */
  async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as User).id;
      const reportId = parseAndValidateId(req.params.id, 'report');
      const { content } = req.body as CreateMessageRequest;

      if (!content) {
        throw new BadRequestError('content field is required');
      }

      const message = await reportService.sendMessage(reportId, userId, content);
      res.status(201).json(message);
    } catch (error) {
      next(error);
    }
  }


      /**
     * Get all public messages for a report
     * GET /api/reports/:id/messages
     */
    async getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const userId = (req.user as any)?.id;
        const reportId = parseAndValidateId(req.params.id, 'report');
        const messages = await reportService.getMessages(reportId, userId);
        res.status(200).json(messages);
      } catch (error) {
        next(error);
      }
    }

}

export const reportController = new ReportController();
