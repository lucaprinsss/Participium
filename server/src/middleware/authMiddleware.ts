import { User } from "@dto/User";
import { UserRole } from "@models/dto/UserRole";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { NextFunction, Response, Request } from "express";

/**
 * Estende Express Request con user tipizzato
 */
interface AuthenticatedRequest extends Request {
  user?: User;
}

/**
 * Middleware to check if the user is logged in
 */
export const isLoggedIn = (
  req:AuthenticatedRequest , 
  res: Response, 
  next: NextFunction
): void => {
  if (req.isAuthenticated()) {
    return next();
  }
  throw new UnauthorizedError("Not authenticated");
};

/**
 * Middleware to check if the user is a citizen
 */
export const isCitizen = (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): void => {
  if (!req.isAuthenticated()) {
      throw new UnauthorizedError("Not authenticated");
  }
  if (req.user.role !== 'citizen') {
    throw new InsufficientRightsError('Access denied. Citizen role required');
  }
  return next();
};

/**
 * Middleware to check if the user is an admin
 */
export const isAdmin = (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): void => {
  if (!req.isAuthenticated()) {
    throw new UnauthorizedError('Not authenticated');
  }
  if (req.user.role !== UserRole.ADMINISTRATOR) {
    throw new InsufficientRightsError('Access denied. Admin role required.');
  }
  return next();
};

/**
 * Role-based authorization middleware factory
 * @param {string} requiredRole The role required to access the route
 * @returns {function} Middleware function
 */
export const requireRole = (requiredRole: UserRole) => {
  return (
    req: AuthenticatedRequest, 
    res: Response, 
    next: NextFunction
  ): void => {
    if (!req.isAuthenticated()) {
      throw new UnauthorizedError('Not authenticated');
    }

    if (!req.user || req.user.role !== requiredRole) {
      throw new InsufficientRightsError(`Access denied. ${requireRole} role required.`)
    }
    
    next();
  };
};
