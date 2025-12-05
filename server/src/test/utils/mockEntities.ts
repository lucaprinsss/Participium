/**
 * Mock entities for testing purposes
 * Provides complete mock entities with all required fields and relations
 */

import { UserEntity } from "@models/entity/userEntity";
import { DepartmentRoleEntity } from "@models/entity/departmentRoleEntity";
import { RoleEntity } from "@models/entity/roleEntity";
import { DepartmentEntity } from "@models/entity/departmentEntity";

/**
 * Creates a mock RoleEntity
 */
export function createMockRole(name: string): RoleEntity {
  const role = new RoleEntity();
  role.id = 1;
  role.name = name;
  role.description = `${name} role`;
  role.departmentRoles = [];
  return role;
}

/**
 * Creates a mock DepartmentEntity
 */
export function createMockDepartment(name: string): DepartmentEntity {
  const department = new DepartmentEntity();
  department.id = 1;
  department.name = name;
  department.departmentRoles = [];
  return department;
}

/**
 * Creates a mock DepartmentRoleEntity
 * For Citizen role, department is optional (null)
 */
export function createMockDepartmentRole(
  roleName: string,
  departmentName?: string
): DepartmentRoleEntity {
  const departmentRole = new DepartmentRoleEntity();
  departmentRole.id = 1;
  departmentRole.roleId = 1;
  departmentRole.role = createMockRole(roleName);
  
  if (departmentName) {
    departmentRole.departmentId = 1;
    departmentRole.department = createMockDepartment(departmentName);
  } else {
    // For Citizen role, department is not required
    departmentRole.departmentId = 1;
    departmentRole.department = {} as any; // Simplified mock for testing
  }
  
  departmentRole.users = [];
  return departmentRole;
}

/**
 * Creates a mock userEntity with required departmentRole relation
 * @param roleName - The role name (e.g., 'Citizen', 'Municipal Administrator')
 * @param departmentName - Optional department name (not needed for Citizens)
 * @param overrides - Optional field overrides
 */
export function createMockUser(
  roleName: string,
  departmentName?: string,
  overrides?: Partial<UserEntity>
): UserEntity {
  const user = new UserEntity();
  user.id = 1;
  user.username = 'testuser';
  user.email = 'test@example.com';
  user.firstName = 'Test';
  user.lastName = 'User';
  user.passwordHash = 'salt:hash';
  user.isVerified = true;
  user.departmentRoleId = 1;
  user.departmentRole = createMockDepartmentRole(roleName, departmentName);
  user.emailNotificationsEnabled = true;
  user.createdAt = new Date();
  user.personalPhotoUrl = undefined;
  user.telegramUsername = undefined;
  
  // Apply any overrides
  return { ...user, ...overrides };
}

/**
 * Creates a mock citizen user entity
 */
export function createMockCitizen(overrides?: Partial<UserEntity>): UserEntity {
  return createMockUser('Citizen', undefined, overrides);
}

/**
 * Creates a mock municipality user entity
 */
export function createMockMunicipalityUser(
  roleName: string,
  departmentName: string,
  overrides?: Partial<UserEntity>
): UserEntity {
  return createMockUser(roleName, departmentName, overrides);
}
