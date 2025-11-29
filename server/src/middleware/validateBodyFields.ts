import { Request, Response, NextFunction } from "express";
import { BadRequestError } from "@errors/BadRequestError";

/**
 * Middleware to validate required fields in request body
 * @param requiredFields Array of required field names
 */
export function validateBodyFields(requiredFields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return next(new BadRequestError(`Missing required field: ${field}`));
      }
    }
    next();
  };
}
