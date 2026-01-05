import { departmentRepository } from "@repositories/departmentRepository";
import { departmentRoleRepository } from "@repositories/departmentRoleRepository";
import { roleRepository } from "@repositories/roleRepository";
import { Department } from "@dto/Department";
import { Role } from "@dto/Role";
import { mapDepartmentEntityToDTO, mapRoleEntityToDTO } from "./mapperService";
import { NotFoundError } from "@errors/NotFoundError";

/**
 * Service for department-related business logic
 */
class DepartmentService {
  /**
   * Get all departments categorized as municipalities excluding "Organization"
   * @returns Array of department DTOs
   */
  public async getMunicipalityDepartments(): Promise<Department[]> {
    const allDepartments = await departmentRepository.findAll();

    // Filter out "Organization" department as it's not a municipality department
    const municipalityDepartments = allDepartments.filter(dept => dept.name !== 'Organization');

    return municipalityDepartments.map(dept => mapDepartmentEntityToDTO(dept));
  }

  /**
   * Get all roles available in a specific department
   * @param departmentId Department ID
   * @returns Array of role DTOs
   * @throws NotFoundError if department not found
   */
  public async getRolesByDepartment(departmentId: number): Promise<Role[]> {
    // Verify department exists
    const department = await departmentRepository.findById(departmentId);
    if (!department) {
      throw new NotFoundError(`Department with ID ${departmentId} not found`);
    }

    // Get all department_roles for this department
    const departmentRoles = await departmentRoleRepository.findByDepartment(departmentId);

    // Filter logic: if department is "Organization", exclude "Citizen" and "Administrator" roles
    const filteredDepartmentRoles = departmentRoles.filter(dr => {
      if (department.name === 'Organization') {
        return dr.role.name !== 'Citizen' && dr.role.name !== 'Administrator';
      }
      return true;
    });

    // Extract and map the roles
    return filteredDepartmentRoles.map(dr => mapRoleEntityToDTO(dr.role));
  }

  /**
   * Get all available roles including Citizen and Administrator
   * @returns Array of all user role names
   */
  public async getAllRoles(): Promise<string[]> {
    const roles = await roleRepository.findAll();
    return roles.map(role => role.name);
  }

  /**
   * Get all available municipality staff roles excluding Citizen and Administrator
   * @returns Array of municipality staff role names
   */
  public async getAllMunicipalityRoles(): Promise<string[]> {
    const roles = await roleRepository.findMunicipalityRoles();
    return roles.map(role => role.name);
  }

  /**
   * Get all available department roles (positions) for municipality staff
   * @returns Array of department role objects with id, department, and role
   */
  public async getAllMunicipalityDepartmentRoles(): Promise<Array<{ id: number, department: string, role: string }>> {
    const departmentRoles = await departmentRoleRepository.findMunicipalityDepartmentRoles();
    return departmentRoles.map(dr => ({
      id: dr.id,
      department: dr.department?.name || '',
      role: dr.role?.name || ''
    }));
  }

  /**
   * Get the department role ID for a given department and role name
   * @param departmentName The department name
   * @param roleName The role name
   * @returns The department role ID or null if not found
   */
  public async getDepartmentRoleId(departmentName: string, roleName: string): Promise<number | null> {
    const departmentRole = await departmentRoleRepository.findByDepartmentAndRole(departmentName, roleName);
    return departmentRole?.id || null;
  }

  /**
   * Get all department role IDs for a specific role name
   * Useful for roles that appear across multiple departments or standalone roles like Citizen/Administrator
   * @param roleName The role name (e.g., "Citizen", "Administrator")
   * @returns Array of department role IDs
   */
  public async getDepartmentRoleIdsByRoleName(roleName: string): Promise<number[]> {
    const departmentRoles = await departmentRoleRepository.findByRoleName(roleName);
    return departmentRoles.map(dr => dr.id);
  }
}

export const departmentService = new DepartmentService();
