import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { NextFunction, Response, Request, RequestHandler } from "express";
import { userEntity } from "@models/entity/userEntity";

/**
 * Helper function to get the role name from a user entity
 */
function getUserRoleName(user: any): string | undefined {
  if (!user) return undefined;
  
  // If user is a userEntity with departmentRole relation
  const userEntityData = user as userEntity;
  return userEntityData.departmentRole?.role?.name;
}

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
 * Role-based authorization middleware factory
 * @param {string} requiredRole The role required to access the route
 * @returns {function} Middleware function
 */
export const requireRole = (requiredRole: string): RequestHandler => {
  return (
    req: Request, 
    res: Response, 
    next: NextFunction
  ): void => {
    // First check authentication using isLoggedIn
    isLoggedIn(req, res, (err?: any) => {
      if (err) return next(err);

      const roleName = getUserRoleName(req.user);
      if (!roleName || roleName !== requiredRole) {
        return next(new InsufficientRightsError(`Access denied. ${requiredRole} role required.`));
      }
      
      next();
    });
  };
};
