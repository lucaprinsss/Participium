import { ErrorDTO } from "@models/errors/ErrorDTO";
import { UserResponse } from "@models/dto/output/UserResponse";
import { userEntity } from "@models/entity/userEntity";
import { Department } from "@dto/Department";
import { Role } from "@dto/Role";
import { DepartmentEntity } from "@entity/departmentEntity";
import { RoleEntity } from "@entity/roleEntity";
import { reportEntity } from "@models/entity/reportEntity";
import { ReportResponse } from "@models/dto/output/ReportResponse";
import { ReportCategory } from "@models/dto/ReportCategory";
import { ReportStatus } from "@models/dto/ReportStatus";


export function createErrorDTO(
  code: number,
  message?: string,
  name?: string
): ErrorDTO {
  return removeNullAttributes({
    code,
    name,
    message
  }) as ErrorDTO;
}

/**
 * Maps a DepartmentEntity to Department DTO
 */
export function mapDepartmentEntityToDTO(entity: DepartmentEntity): Department {
  return {
    id: entity.id,
    name: entity.name
  };
}

/**
 * Maps a RoleEntity to Role DTO
 */
export function mapRoleEntityToDTO(entity: RoleEntity): Role {
  return removeNullAttributes({
    id: entity.id,
    name: entity.name,
    description: entity.description
  }) as Role;
}

/**
 * Maps a userEntity to UserResponse DTO
 * Excludes sensitive information like password hash
 */
export function mapUserEntityToUserResponse(entity: userEntity | null | undefined): UserResponse | null {
  
  if (!entity) {
    return null;
  }

  // Extract role name from the department_role relation
  const roleName = entity.departmentRole?.role?.name;
  const departmentName = entity.departmentRole?.department?.name;

  return removeNullAttributes({
    id: entity.id,
    username: entity.username,
    email: entity.email,
    first_name: entity.firstName,
    last_name: entity.lastName,
    department_name: departmentName,
    role_name: roleName
  }) as UserResponse;
}

/**
 * Maps a reportEntity to ReportResponse DTO
 * Handles location parsing and photo extraction
 */
export function mapReportEntityToReportResponse(entity: reportEntity): ReportResponse {
  // Parse PostGIS geography point to lat/lng
  // Format: "POINT(longitude latitude)" or JSON format depending on query
  let location = { latitude: 0, longitude: 0 };
  
  if (typeof entity.location === 'string') {
    // Parse WKT format: "POINT(lng lat)"
    const match = entity.location.match(/POINT\(([^ ]+) ([^ ]+)\)/);
    if (match) {
      location = {
        longitude: parseFloat(match[1]),
        latitude: parseFloat(match[2])
      };
    }
  } else if (entity.location && typeof entity.location === 'object') {
    // Already parsed as object
    location = entity.location;
  }

  return {
    id: entity.id,
    reporterId: entity.isAnonymous ? null : entity.reporterId,
    title: entity.title,
    description: entity.description,
    category: entity.category as ReportCategory,
    location,
    photos: [], // TODO: Load photos from photoEntity if needed
    isAnonymous: entity.isAnonymous,
    status: entity.status as ReportStatus,
    rejectionReason: entity.rejectionReason || null,
    assigneeId: entity.assigneeId || null,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt
  };
}

function removeNullAttributes<T extends Record<string, any>>(
  dto: T
): Partial<T> {
  const filtered = Object.entries(dto).filter(
    ([_, value]) =>
      value !== null &&
      value !== undefined &&
      (!Array.isArray(value) || value.length > 0)
  );
  
  return Object.fromEntries(filtered) as Partial<T>;
}