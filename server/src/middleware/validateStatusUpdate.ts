import { Request, Response, NextFunction } from 'express';
import { ReportStatus } from '@dto/ReportStatus';
import { SystemRoles, isTechnicalStaff } from '@models/dto/UserRole';
import { InsufficientRightsError } from '@errors/InsufficientRightsError';
import { BadRequestError } from '@errors/BadRequestError';
import { UserEntity } from '@models/entity/userEntity';

/**
 * Helper function to get the role name from a user entity
 * Normalizes the role name to Title Case (first letter of each word capitalized)
 */
function getUserRoleName(user: any): string | undefined {
  if (!user) return undefined;
  const userEntityData = user as UserEntity;
  const roleName = userEntityData.departmentRole?.role?.name;
  
  if (!roleName) return undefined;
  
  // Convert to Title Case: capitalize first letter of each word
  return roleName
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Middleware to validate status update permissions
 * Different status transitions require different roles
 */
export const validateStatusUpdate = (req: Request, res: Response, next: NextFunction) => {
  const { newStatus } = req.body;
  const roleName = getUserRoleName(req.user);

  if (!newStatus) {
    return next(new BadRequestError('newStatus is required'));
  }

  if (!roleName) {
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
    if (roleName !== SystemRoles.EXTERNAL_MAINTAINER && !isTechnicalStaff(roleName)) {
      return next(new InsufficientRightsError(
        'Only technical staff and external maintainers can resolve reports'
      ));
    }
    return next();
  }

  // Special handling for IN_PROGRESS and SUSPENDED - allow technical staff and external maintainers
  if ([ReportStatus.IN_PROGRESS, ReportStatus.SUSPENDED].includes(newStatus as ReportStatus)) {
    if (!isTechnicalStaff(roleName) && roleName !== SystemRoles.EXTERNAL_MAINTAINER) {
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

  if (!allowedRoles.includes(roleName)) {
    return next(new InsufficientRightsError(
      `Only users with roles [${allowedRoles.join(', ')}] can set status to ${newStatus}`
    ));
  }

  next();
};

