import { roleRepository } from "@repositories/roleRepository";
import { departmentRoleRepository } from "@repositories/departmentRoleRepository";

/**
 * Class providing utility functions for user roles.
 */
export class RoleUtils {
 
    /**
     * Get all available roles included Citizen and Administrator
     * @returns {Promise<string[]>} Array of all user role names
     */
    public static async getAllRoles(): Promise<string[]> {
        const roles = await roleRepository.findAll();
        return roles.map(role => role.name);
    }

    /**
     * Get all available municipality staff roles excluding Citizen and Administrator
     * @returns {Promise<string[]>} Array of municipality staff role names
     */
    public static async getAllMunicipalityRoles(): Promise<string[]> {
        const roles = await roleRepository.findMunicipalityRoles();
        return roles.map(role => role.name);
    }

    /**
     * Get all available department roles (positions) for municipality staff
     * @returns {Promise<Array<{id: number, department: string, role: string}>>} Array of department role objects
     */
    public static async getAllMunicipalityDepartmentRoles(): Promise<Array<{id: number, department: string, role: string}>> {
        const departmentRoles = await departmentRoleRepository.findMunicipalityDepartmentRoles();
        return departmentRoles.map(dr => ({
            id: dr.id,
            department: dr.department?.name || '',
            role: dr.role?.name || ''
        }));
    }

    /**
     * Check if the provided role name is valid
     * @returns {Promise<boolean>} True if the role is valid, false otherwise
     */
    public static async isRoleValid(roleName: string): Promise<boolean> {
        const role = await roleRepository.findByName(roleName);
        return role !== null;
    }

    /**
     * Get the department role ID for a given department and role name
     * @param departmentName The department name
     * @param roleName The role name
     * @returns {Promise<number | null>} The department role ID or null if not found
     */
    public static async getDepartmentRoleId(departmentName: string, roleName: string): Promise<number | null> {
        const departmentRole = await departmentRoleRepository.findByDepartmentAndRole(departmentName, roleName);
        return departmentRole?.id || null;
    }

}