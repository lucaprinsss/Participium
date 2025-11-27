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
   * Get all departments categorized as municipalities excluding "Organization"
   * @returns Array of department DTOs
   */
  public async getMunicipalityDepartments(): Promise<Department[]> {
    const allDepartments = await departmentRepository.findAll();

    return allDepartments.map(dept => mapDepartmentEntityToDTO(dept));
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
}

export const departmentService = new DepartmentService();
