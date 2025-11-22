import { ErrorDTO } from "@models/errors/ErrorDTO";
import { UserResponse } from "@models/dto/output/UserResponse";
import { ReportResponse, PhotoResponse } from "@models/dto/output/ReportResponse";
import { userEntity } from "@models/entity/userEntity";
import { reportEntity } from "@models/entity/reportEntity";
import { Photo } from "@models/dto/Photo";
import { Department } from "@dto/Department";
import { Role } from "@dto/Role";
import { DepartmentEntity } from "@entity/departmentEntity";
import { RoleEntity } from "@entity/roleEntity";
import { Location } from "@models/dto/Location";
import { ReportCategory } from "@models/dto/ReportCategory";
import { Report } from "@dto/Report";
import { CategoryRoleMapping } from '../models/dto/CategoryRoleMapping';
import { categoryRoleEntity } from '../models/entity/categoryRoleEntity';
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
 * Maps a reportEntity to Report DTO
 * Converts from camelCase entity to snake_case DTO
 */
export function mapReportEntityToDTO(entity: reportEntity): Report {
  return removeNullAttributes({
    id: entity.id,
    reporter_id: entity.reporterId,
    title: entity.title,
    description: entity.description,
    category: entity.category,
    location: entity.location,
    is_anonymous: entity.isAnonymous,
    status: entity.status,
    rejection_reason: entity.rejectionReason,
    assignee_id: entity.assigneeId,
    created_at: entity.createdAt,
    updated_at: entity.updatedAt
  }) as Report;
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
 * Maps a Photo DTO (snake_case) to API response format (camelCase)
 * @param photo - Photo DTO from database
 * @returns PhotoResponse for API
 */
export function mapPhotoToResponse(photo: Photo): PhotoResponse {
  return {
    id: photo.id,
    reportId: photo.report_id,
    storageUrl: photo.storage_url,
    createdAt: photo.created_at,
  };
}

/**
 * Maps a reportEntity to ReportResponse DTO
 * @param report - The report entity from database
 * @param photos - Array of photo entities associated with the report
 * @param location - The parsed location object
 * @returns ReportResponse DTO
 */
export function mapReportEntityToResponse(report: reportEntity, photos: any[], location: Location): ReportResponse {
  return {
    id: report.id,
    reporterId: report.isAnonymous ? null : report.reporterId,
    title: report.title,
    description: report.description,
    category: report.category as ReportCategory,
    location: location,
    photos: photos.map(mapPhotoToResponse),
    isAnonymous: report.isAnonymous,
    status: report.status as any,
    rejectionReason: report.rejectionReason || null,
    assigneeId: report.assigneeId || null,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  };
}

/**
 * Maps a reportEntity to ReportResponse DTO
 * Handles location parsing from PostGIS automatically
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
    photos: [], // Photos loaded via relations
    isAnonymous: entity.isAnonymous,
    status: entity.status as ReportStatus,
    rejectionReason: entity.rejectionReason || null,
    assigneeId: entity.assigneeId || null,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt
  };
}

/**
 * Map CategoryRoleMappingEntity to CategoryRoleMapping DTO
 */
export function mapCategoryRoleMappingToDTO(
  entity: categoryRoleEntity
): CategoryRoleMapping {
  return {
    id: entity.id,
    category: entity.category,
    roleId: entity.roleId,
    roleName: entity.role?.name, // Include role name if relation is loaded
    createdAt: entity.createdAt
  };
}

/**
 * Map array of entities to DTOs
 */
export function mapCategoryRoleMappingsToDTOs(
  entities: categoryRoleEntity[]
): CategoryRoleMapping[] {
  return entities.map(mapCategoryRoleMappingToDTO);
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