import { Request, Response, NextFunction } from 'express';
import { ReportStatus } from '@dto/ReportStatus';
import { UserRole } from '@dto/UserRole';
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
    [ReportStatus.ASSIGNED]: [UserRole.PUBLIC_RELATIONS_OFFICER],
    [ReportStatus.REJECTED]: [UserRole.PUBLIC_RELATIONS_OFFICER],
    [ReportStatus.RESOLVED]: [
      UserRole.TECHNICAL_MANAGER,
      UserRole.TECHNICAL_ASSISTANT,
      UserRole.EXTERNAL_MAINTAINER
    ],
    [ReportStatus.IN_PROGRESS]: [
      UserRole.TECHNICAL_MANAGER,
      UserRole.TECHNICAL_ASSISTANT
    ],
    [ReportStatus.SUSPENDED]: [
      UserRole.TECHNICAL_MANAGER,
      UserRole.TECHNICAL_ASSISTANT
    ]
  };

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

