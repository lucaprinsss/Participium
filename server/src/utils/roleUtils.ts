import { UserEntity } from "@models/entity/userEntity";
import { roleRepository } from "@repositories/roleRepository";

/**
 * Utility class providing helper functions for user role operations.
 * These are pure utility functions that operate on UserEntity instances.
 * For database queries to retrieve role catalogs, use DepartmentService instead.
 */
export class RoleUtils {

    /**
     * Check if the provided role name is valid
     * @param roleName The role name to validate
     * @returns True if the role is valid, false otherwise
     */
    public static async isRoleValid(roleName: string): Promise<boolean> {
        const role = await roleRepository.findByName(roleName);
        return role !== null;
    }

    /**
     * Helper: Check if user works in a specific department
     * @param user - User entity with loaded userRoles
     * @param departmentName - Department name to check (e.g., "Water Network")
     * @returns true if user works in the department
     */
    public static userInDepartment(user: UserEntity, departmentName: string): boolean {
      return user.userRoles?.some(
        ur => ur.departmentRole?.department?.name === departmentName
      ) || false;
    }
    
    /**
     * Helper: Get all role names for a user
     * @param user - User entity with loaded userRoles
     * @returns Array of role names
     */
    public static getUserRoleNames(user: UserEntity): string[] {
      return user.userRoles?.map(
        ur => ur.departmentRole?.role?.name || ''
      ).filter(name => name !== '') || [];
    }
    
    /**
     * Helper: Get all department names for a user
     * @param user - User entity with loaded userRoles
     * @returns Array of department names
     */
    public static getUserDepartmentNames(user: UserEntity): string[] {
      return user.userRoles?.map(
        ur => ur.departmentRole?.department?.name || ''
      ).filter(name => name !== '') || [];
    }

    /**
     * Helper: Check if user has a specific role
     * @param user - User entity with loaded userRoles
     * @param roleName - Role name to check (e.g., "Administrator", "Staff Member")
     * @returns true if user has the role
     */
    public static userHasRole(user: UserEntity, roleName: string): boolean {
      return user.userRoles?.some(
        ur => ur.departmentRole?.role?.name === roleName
      ) || false;
    }

}