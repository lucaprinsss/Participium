/**
 * Mock entities for testing purposes (V5.0 - Multi-Role Support)
 * Provides complete mock entities with all required fields and relations
 */

import { UserEntity } from "@models/entity/userEntity";
import { DepartmentRoleEntity } from "@models/entity/departmentRoleEntity";
import { RoleEntity } from "@models/entity/roleEntity";
import { DepartmentEntity } from "@models/entity/departmentEntity";
import { UserRoleEntity } from "@models/entity/userRoleEntity";

/**
 * Creates a mock RoleEntity
 */
export function createMockRole(name: string, id: number = 1): RoleEntity {
  const role = new RoleEntity();
  role.id = id;
  role.name = name;
  role.description = `${name} role`;
  role.departmentRoles = [];
  return role;
}

/**
 * Creates a mock DepartmentEntity
 */
export function createMockDepartment(name: string, id: number = 1): DepartmentEntity {
  const department = new DepartmentEntity();
  department.id = id;
  department.name = name;
  department.departmentRoles = [];
  return department;
}

/**
 * Creates a mock DepartmentRoleEntity
 */
export function createMockDepartmentRole(
  roleName: string,
  departmentName: string = 'Organization',
  id: number = 1
): DepartmentRoleEntity {
  const departmentRole = new DepartmentRoleEntity();
  departmentRole.id = id;
  departmentRole.roleId = id;
  departmentRole.departmentId = id;
  departmentRole.role = createMockRole(roleName, id);
  departmentRole.department = createMockDepartment(departmentName, id);
  departmentRole.userRoles = [];
  return departmentRole;
}

/**
 * Creates a mock UserRoleEntity
 */
export function createMockUserRole(
  userId: number,
  departmentRoleId: number,
  roleName: string,
  departmentName: string = 'Organization'
): UserRoleEntity {
  const userRole = new UserRoleEntity();
  userRole.id = departmentRoleId;
  userRole.userId = userId;
  userRole.departmentRoleId = departmentRoleId;
  userRole.departmentRole = createMockDepartmentRole(roleName, departmentName, departmentRoleId);
  userRole.createdAt = new Date();
  return userRole;
}

/**
 * Creates a mock UserEntity with userRoles array (V5.0 multi-role support)
 * @param roles - Array of { roleName, departmentName } objects
 * @param overrides - Optional field overrides
 */
export function createMockUser(
  roles: Array<{ roleName: string; departmentName?: string }>,
  overrides?: Partial<UserEntity>
): UserEntity {
  const user = new UserEntity();
  user.id = overrides?.id || 1;
  user.username = overrides?.username || 'testuser';
  user.email = overrides?.email || 'test@example.com';
  user.firstName = overrides?.firstName || 'Test';
  user.lastName = overrides?.lastName || 'User';
  user.passwordHash = 'salt:hash';
  user.isVerified = true;
  user.emailNotificationsEnabled = true;
  user.createdAt = new Date();
  user.personalPhotoUrl = undefined;
  user.telegramUsername = undefined;

  // Create userRoles array for multi-role support
  user.userRoles = roles.map((role, index) =>
    createMockUserRole(
      user.id,
      index + 1,
      role.roleName,
      role.departmentName || 'Organization'
    )
  );

  // Apply any overrides (except userRoles which we handle separately)
  const { userRoles: _, ...otherOverrides } = overrides || {};
  return { ...user, ...otherOverrides };
}

/**
 * Creates a mock user with a single role (backward compatible helper)
 */
export function createMockUserWithRole(
  roleName: string,
  departmentName?: string,
  overrides?: Partial<UserEntity>
): UserEntity {
  return createMockUser(
    [{ roleName, departmentName }],
    overrides
  );
}

/**
 * Creates a mock citizen user entity
 */
export function createMockCitizen(overrides?: Partial<UserEntity>): UserEntity {
  return createMockUser([{ roleName: 'Citizen', departmentName: 'Organization' }], overrides);
}

/**
 * Creates a mock municipality user entity with single role
 */
export function createMockMunicipalityUser(
  roleName: string,
  departmentName: string,
  overrides?: Partial<UserEntity>
): UserEntity {
  return createMockUser([{ roleName, departmentName }], overrides);
}

/**
 * Creates a mock user with multiple roles (PT10 feature)
 */
export function createMockMultiRoleUser(
  roles: Array<{ roleName: string; departmentName: string }>,
  overrides?: Partial<UserEntity>
): UserEntity {
  return createMockUser(roles, overrides);
}

/**
 * Helper to check if a mock user has a specific role
 */
export function mockUserHasRole(user: UserEntity, roleName: string): boolean {
  return user.userRoles?.some(ur =>
    ur.departmentRole?.role?.name === roleName
  ) || false;
}

/**
 * Helper to get role names from mock user
 */
export function getMockUserRoleNames(user: UserEntity): string[] {
  return user.userRoles?.map(ur =>
    ur.departmentRole?.role?.name || ''
  ).filter(Boolean) || [];
}
