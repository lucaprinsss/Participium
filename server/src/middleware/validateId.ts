import { Request, Response, NextFunction } from "express";
import { BadRequestError } from "@errors/BadRequestError";

/**
 * Middleware factory to validate ID parameters
 * @param paramName The name of the parameter to validate (e.g., 'id')
 * @param resourceName The name of the resource for error messages (e.g., 'user', 'department', 'report')
 */
export function validateId(paramName: string = 'id', resourceName: string = 'resource') {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[paramName];
    const numericId = Number(id);
    
    if (
      id.includes('.') ||
      Number.isNaN(numericId) ||
      numericId <= 0 ||
      !Number.isInteger(numericId)
    ) {
      return next(new BadRequestError(`Invalid ${resourceName} ID. Must be a positive integer.`));
    }
    
    next();
  };
}
