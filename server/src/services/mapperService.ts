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