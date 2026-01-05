import { Request, Response, NextFunction } from 'express';
import { ReportStatus } from '@dto/ReportStatus';
import { SystemRoles, isTechnicalStaff } from '@models/dto/UserRole';
import { InsufficientRightsError } from '@errors/InsufficientRightsError';
import { BadRequestError } from '@errors/BadRequestError';
import { UserEntity } from '@models/entity/userEntity';
import { RoleUtils } from '@utils/roleUtils';

/**
 * Helper function to get all role names from a user entity
 * @param user The user entity
 * @returns Array of role names the user has (normalized to Title Case)
 */
function getUserRoleNames(user: any): string[] {
  if (!user) return [];
  const userEntityData = user as UserEntity;
  const roleNames = RoleUtils.getUserRoleNames(userEntityData);
  
  // Convert to Title Case: capitalize first letter of each word
  return roleNames.map(roleName => 
    roleName
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  );
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
 * Middleware to validate status update permissions
 * Different status transitions require different roles
 * Supports users with multiple roles - passes if user has at least one qualifying role
 */
export const validateStatusUpdate = (req: Request, res: Response, next: NextFunction) => {
  const { newStatus } = req.body;
  const userRoles = getUserRoleNames(req.user);

  if (!newStatus) {
    return next(new BadRequestError('newStatus is required'));
  }

  if (userRoles.length === 0) {
    return next(new InsufficientRightsError('Unable to determine user role'));
  }

  // Map of status transitions to allowed roles
  const statusRoleMap: Record<string, string[]> = {
    [ReportStatus.ASSIGNED]: [SystemRoles.PUBLIC_RELATIONS_OFFICER, SystemRoles.EXTERNAL_MAINTAINER],
    [ReportStatus.REJECTED]: [SystemRoles.PUBLIC_RELATIONS_OFFICER],
    [ReportStatus.RESOLVED]: [] // Checked separately below
  };

  // Special handling for RESOLVED status - allow technical staff and external maintainers
  if (newStatus === ReportStatus.RESOLVED) {
    const hasResolvePermission = userRoles.some(role => 
      role === SystemRoles.EXTERNAL_MAINTAINER || isTechnicalStaff(role)
    );
    
    if (!hasResolvePermission) {
      return next(new InsufficientRightsError(
        'Only technical staff and external maintainers can resolve reports'
      ));
    }
    return next();
  }

  // Special handling for IN_PROGRESS and SUSPENDED - allow technical staff and external maintainers
  if ([ReportStatus.IN_PROGRESS, ReportStatus.SUSPENDED].includes(newStatus as ReportStatus)) {
    const hasProgressPermission = userRoles.some(role => 
      isTechnicalStaff(role) || role === SystemRoles.EXTERNAL_MAINTAINER
    );
    
    if (!hasProgressPermission) {
      return next(new InsufficientRightsError(
        `Only technical staff and external maintainers can set status to ${newStatus}`
      ));
    }
    return next();
  }

  const allowedRoles = statusRoleMap[newStatus];

  if (!allowedRoles) {
    return next(new BadRequestError(`Invalid report status: ${newStatus}`));
  }

  // Check if user has at least one of the allowed roles
  const hasAllowedRole = userRoles.some(role => allowedRoles.includes(role));
  
  if (!hasAllowedRole) {
    return next(new InsufficientRightsError(
      `Only users with roles [${allowedRoles.join(', ')}] can set status to ${newStatus}`
    ));
  }

  next();
};

