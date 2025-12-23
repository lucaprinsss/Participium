import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { NextFunction, Response, Request, RequestHandler } from "express";
import { UserEntity } from "@models/entity/userEntity";
import { isTechnicalStaff } from "@dto/UserRole";
import { RoleUtils } from "@utils/roleUtils";

/**
 * Helper function to get all role names from a user entity
 * @param user The user entity
 * @returns Array of role names the user has
 */
function getUserRoleNames(user: any): string[] {
  if (!user) return [];

  const userEntityData = user as UserEntity;
  return RoleUtils.getUserRoleNames(userEntityData);
}

/**
 * Helper function to check if user has a specific role
 * @param user The user entity
 * @param roleName The role name to check
 * @returns True if user has the role
 */
function userHasRole(user: any, roleName: string): boolean {
  if (!user) return false;

  const userEntityData = user as UserEntity;
  return RoleUtils.userHasRole(userEntityData, roleName);
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
 * Supports users with multiple roles
 * @param {string | string[]} requiredRole The role or roles required to access the route
 * @returns {function} Middleware function
 */
export const requireRole = (requiredRole: string | string[]): RequestHandler => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    // First check authentication using isLoggedIn
    isLoggedIn(req, res, (err?: any) => {
      if (err) return next(err);

      const userRoles = getUserRoleNames(req.user);
      if (userRoles.length === 0) {
        return next(new InsufficientRightsError('Access denied. No role assigned'));
      }

      // Check if user has at least one of the required roles
      const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      const hasRequiredRole = userRoles.some(role => requiredRoles.includes(role));

      if (!hasRequiredRole) {
        return next(new InsufficientRightsError(`Access denied. Required role: ${requiredRole}`));
      }

      next();
    });
  };
};

/**
 * Middleware to check if user is technical staff or has specific roles
 * Technical staff is any role that is not a system role (Citizen, Administrator, PRO, External Maintainer)
 * Supports users with multiple roles - passes if user has at least one qualifying role
 * @param {string[]} additionalRoles Optional additional roles that are allowed (e.g., PRO)
 * @returns {function} Middleware function
 */
export const requireTechnicalStaffOrRole = (additionalRoles: string[] = []): RequestHandler => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    // First check authentication using isLoggedIn
    isLoggedIn(req, res, (err?: any) => {
      if (err) return next(err);

      const userRoles = getUserRoleNames(req.user);
      if (userRoles.length === 0) {
        return next(new InsufficientRightsError('Access denied. No role assigned'));
      }

      // Check if user has at least one technical staff role OR one of the additional roles
      const hasAccess = userRoles.some(role =>
        isTechnicalStaff(role) || additionalRoles.includes(role)
      );

      if (!hasAccess) {
        return next(new InsufficientRightsError(`Access denied. Technical staff or specific role required. Found roles: ${JSON.stringify(userRoles)}`));
      }

      next();
    });
  };
};