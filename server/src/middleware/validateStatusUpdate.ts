import { Request, Response, NextFunction } from 'express';
import { ReportStatus } from '@dto/ReportStatus';
import { SystemRoles, isTechnicalStaff } from '@dto/UserRole';
import { InsufficientRightsError } from '@errors/InsufficientRightsError';
import { BadRequestError } from '@errors/BadRequestError';
import { userEntity } from '@models/entity/userEntity';

/**
 * Helper function to get the role name from a user entity
 */
function getUserRoleName(user: any): string | undefined {
  if (!user) return undefined;
  const userEntityData = user as userEntity;
  return userEntityData.departmentRole?.role?.name;
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
    [ReportStatus.ASSIGNED]: [SystemRoles.PUBLIC_RELATIONS_OFFICER],
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

  // Special handling for IN_PROGRESS and SUSPENDED - allow only technical staff
  if ([ReportStatus.IN_PROGRESS, ReportStatus.SUSPENDED].includes(newStatus as ReportStatus)) {
    if (!isTechnicalStaff(roleName)) {
      return next(new InsufficientRightsError(
        `Only technical staff can set status to ${newStatus}`
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

