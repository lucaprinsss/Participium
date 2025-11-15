"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleUtils = void 0;
const roleRepository_1 = require("@repositories/roleRepository");
const departmentRoleRepository_1 = require("@repositories/departmentRoleRepository");
/**
 * Class providing utility functions for user roles.
 */
class RoleUtils {
    /**
     * Get all available roles included Citizen and Administrator
     * @returns {Promise<string[]>} Array of all user role names
     */
    static async getAllRoles() {
        const roles = await roleRepository_1.roleRepository.findAll();
        return roles.map(role => role.name);
    }
    /**
     * Get all available municipality staff roles excluding Citizen and Administrator
     * @returns {Promise<string[]>} Array of municipality staff role names
     */
    static async getAllMunicipalityRoles() {
        const roles = await roleRepository_1.roleRepository.findMunicipalityRoles();
        return roles.map(role => role.name);
    }
    /**
     * Get all available department roles (positions) for municipality staff
     * @returns {Promise<Array<{id: number, department: string, role: string}>>} Array of department role objects
     */
    static async getAllMunicipalityDepartmentRoles() {
        const departmentRoles = await departmentRoleRepository_1.departmentRoleRepository.findMunicipalityDepartmentRoles();
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
    static async isRoleValid(roleName) {
        const role = await roleRepository_1.roleRepository.findByName(roleName);
        return role !== null;
    }
    /**
     * Get the department role ID for a given department and role name
     * @param departmentName The department name
     * @param roleName The role name
     * @returns {Promise<number | null>} The department role ID or null if not found
     */
    static async getDepartmentRoleId(departmentName, roleName) {
        const departmentRole = await departmentRoleRepository_1.departmentRoleRepository.findByDepartmentAndRole(departmentName, roleName);
        return departmentRole?.id || null;
    }
}
exports.RoleUtils = RoleUtils;
