import { departmentRepository } from "@repositories/departmentRepository";
import { departmentRoleRepository } from "@repositories/departmentRoleRepository";
import { Department } from "@dto/Department";
import { Role } from "@dto/Role";
import { mapDepartmentEntityToDTO, mapRoleEntityToDTO } from "./mapperService";
import { NotFoundError } from "@errors/NotFoundError";

/**
 * Service for department-related business logic
 */
class DepartmentService {
  /**
   * Get all municipality departments (excluding Organization)
   * @returns Array of department DTOs
   */
  public async getMunicipalityDepartments(): Promise<Department[]> {
    const allDepartments = await departmentRepository.findAll();
    
    // Filter out "Organization" department
    const municipalityDepts = allDepartments.filter(dept => dept.name !== 'Organization');
    
    return municipalityDepts.map(dept => mapDepartmentEntityToDTO(dept));
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

    // Extract and map the roles
    return departmentRoles.map(dr => mapRoleEntityToDTO(dr.role));
  }
}

export const departmentService = new DepartmentService();
