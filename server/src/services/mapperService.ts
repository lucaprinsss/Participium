import { ErrorDTO } from "@models/errors/ErrorDTO";
import { UserResponse } from "@models/dto/output/UserResponse";
import { ReportResponse, PhotoResponse } from "@models/dto/output/ReportResponse";
import { UserEntity } from "@models/entity/userEntity";
import { ReportEntity } from "@models/entity/reportEntity";
import { Photo } from "@models/dto/Photo";
import { Department } from "@dto/Department";
import { Role } from "@dto/Role";
import { DepartmentEntity } from "@entity/departmentEntity";
import { RoleEntity } from "@entity/roleEntity";
import { Location } from "@models/dto/Location";
import { ReportCategory } from "@models/dto/ReportCategory";
import { Report } from "@dto/Report";
import { CategoryRoleMapping } from '../models/dto/CategoryRoleMapping';
import { CategoryRoleEntity } from '../models/entity/categoryRoleEntity';
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
 * Generate full URL for photo storage path
 */ 
function getPhotoUrl(storageUrl: string): string {
  return storageUrl;
}

/**
 * Maps a reportEntity to Report DTO
 * Converts from camelCase entity to snake_case DTO
 */
export function mapReportEntityToDTO(entity: ReportEntity): Report {
  return removeNullAttributes({
    id: entity.id,
    reporter_id: entity.reporterId,
    title: entity.title,
    description: entity.description,
    category: entity.category,
    location: entity.location,
    address: entity.address,
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
export function mapUserEntityToUserResponse(entity: UserEntity | null | undefined, companyName?: string): UserResponse | null {
  
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
    role_name: roleName,
    company_name: companyName
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
export function mapReportEntityToResponse(report: ReportEntity, photos: any[], location: Location): ReportResponse {
  return {
    id: report.id,
    reporterId: report.isAnonymous ? null : report.reporterId,
    title: report.title,
    description: report.description,
    category: report.category as ReportCategory,
    location: location,
    address: report.address,
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
export function mapReportEntityToReportResponse(entity: ReportEntity, assigneeCompanyName?: string): ReportResponse {
  // Parse PostGIS geography point to lat/lng
  // Format: "POINT(longitude latitude)" or JSON format depending on query
  let location = { latitude: 0, longitude: 0 };
  
  if (typeof entity.location === 'string') {
    // Parse WKT format: "POINT(lng lat)"
    const match = new RegExp(/POINT\(([^ ]+) ([^ ]+)\)/).exec(entity.location);
    if (match) {
      location = {
        longitude: Number.parseFloat(match[1]),
        latitude: Number.parseFloat(match[2])
      };
    }
  } else if (entity.location && typeof entity.location === 'object') {
    // Already parsed as object
    location = entity.location;
  }

  // Map reporter info if available and not anonymous
  const reporter = !entity.isAnonymous && entity.reporter ? {
    id: entity.reporter.id,
    first_name: entity.reporter.firstName,
    last_name: entity.reporter.lastName,
    username: entity.reporter.username
  } : null;

  // Map assignee info if available
  const assignee = entity.assignee ? {
    id: entity.assignee.id,
    first_name: entity.assignee.firstName,
    last_name: entity.assignee.lastName,
    username: entity.assignee.username,
    company_name: assigneeCompanyName
  } : null;

  // Map photos if available with full URLs
  const photos = entity.photos ? entity.photos.map(photo => ({
    id: photo.id,
    reportId: photo.reportId,
    storageUrl: getPhotoUrl(photo.storageUrl),
    createdAt: photo.createdAt
  })) : [];

  return {
    id: entity.id,
    reporterId: entity.isAnonymous ? null : entity.reporterId,
    reporter,
    title: entity.title,
    description: entity.description,
    category: entity.category as ReportCategory,
    location,
    address: entity.address,
    photos,
    isAnonymous: entity.isAnonymous,
    status: entity.status as ReportStatus,
    rejectionReason: entity.rejectionReason || null,
    assigneeId: entity.assigneeId || null,
    assignee,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt
  };
}

/**
 * Map CategoryRoleMappingEntity to CategoryRoleMapping DTO
 */
export function mapCategoryRoleMappingToDTO(
  entity: CategoryRoleEntity
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
  entities: CategoryRoleEntity[]
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