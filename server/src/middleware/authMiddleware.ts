import { UserRole } from "@models/dto/UserRole";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { NextFunction, Response, Request, RequestHandler } from "express";

/**
 * Middleware to check if the user is logged in
 */
export const isLoggedIn: RequestHandler = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  if (req.isAuthenticated()) {
    return next();
  }
  next(new UnauthorizedError("Not authenticated"));
};

/**
 * Middleware to check if the user is a citizen
 */
export const isCitizen: RequestHandler = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  if (!req.isAuthenticated()) {
      return next(new UnauthorizedError("Not authenticated"));
  }
  if ((req.user as any)?.role !== UserRole.CITIZEN) {
    return next(new InsufficientRightsError('Access denied. Citizen role required'));
  }
  next();
};

/**
 * Middleware to check if the user is an admin
 */
export const isAdmin: RequestHandler = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  if (!req.isAuthenticated()) {
    return next(new UnauthorizedError('Not authenticated'));
  }
  if ((req.user as any)?.role !== UserRole.ADMINISTRATOR) {
    return next(new InsufficientRightsError('Access denied. Admin role required.'));
  }
  next();
};

/**
 * Role-based authorization middleware factory
 * @param {string} requiredRole The role required to access the route
 * @returns {function} Middleware function
 */
export const requireRole = (requiredRole: UserRole): RequestHandler => {
  return (
    req: Request, 
    res: Response, 
    next: NextFunction
  ): void => {
    if (!req.isAuthenticated()) {
      return next(new UnauthorizedError('Not authenticated'));
    }

    const user = req.user as any;
    if (!user || user.role !== requiredRole) {
      return next(new InsufficientRightsError(`Access denied. ${requiredRole} role required.`));
    }
    
    next();
  };
};
