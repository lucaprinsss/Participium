import { Department } from "./Department";
import { Role } from "./Role";

/**
 * DepartmentRole DTO - represents a position (department + role combination)
 */
export interface DepartmentRole {
  id: number;
  department_id: number;
  role_id: number;
  department?: Department;
  role?: Role;
}
