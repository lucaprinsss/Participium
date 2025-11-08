import { UserRole } from "@models/dto/UserRole";

/**
 * Class providing utility functions for user roles.
 */
export class RoleUtils {
 
    /**
     * Get all available roles included Citizen and Administrator
     * @returns {UserRole[]} Array of all user roles
     */
    public static getAllRoles(): UserRole[] {
        return Object.values(UserRole);
    }

    /**
     * Get all available municipality staff roles excluding Citizen and Administrator
     * @returns {UserRole[]} Array of municipality staff roles
     */
    public static getAllMunicipalityRoles(): UserRole[] {
        return Object
            .values(UserRole)
            .filter(
                role => role !== UserRole.CITIZEN && role !== UserRole.ADMINISTRATOR
            );
    }

    /**
     * Check if the provided role is valid
     * @returns {boolean} True if the role is valid, false otherwise
     */
    public static isRoleValid(role: string): boolean {
        return Object
            .values(UserRole)
            .includes(role as UserRole);
    }

}