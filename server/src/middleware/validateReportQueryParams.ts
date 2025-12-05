import { Request, Response, NextFunction } from "express";
import { BadRequestError } from "@errors/BadRequestError";
import { ReportStatus } from "../models/dto/ReportStatus";
import { ReportCategory } from "../models/dto/ReportCategory";

/**
 * Middleware to validate report status query parameter
 */
export function validateReportStatus(req: Request, res: Response, next: NextFunction) {
  const { status } = req.query;
  
  if (status && !Object.values(ReportStatus).includes(status as ReportStatus)) {
    return next(new BadRequestError(
      `Invalid status. Must be one of: ${Object.values(ReportStatus).join(', ')}`
    ));
  }
  
  next();
}

/**
 * Middleware to validate report category query parameter
 */
export function validateReportCategory(req: Request, res: Response, next: NextFunction) {
  const { category } = req.query;
  
  if (category && !Object.values(ReportCategory).includes(category as ReportCategory)) {
    return next(new BadRequestError(
      `Invalid category. Must be one of: ${Object.values(ReportCategory).join(', ')}`
    ));
  }
  
  next();
}
