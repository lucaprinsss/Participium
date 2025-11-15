import { ErrorDTO } from "@models/errors/ErrorDTO";
import { UserResponse } from "@models/dto/UserResponse";
import { userEntity } from "@models/entity/userEntity";


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