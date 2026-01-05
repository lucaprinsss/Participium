import { Request, Response, NextFunction } from "express";
import { departmentService } from "@services/departmentService";
import { parseAndValidateId } from "@utils/idValidationUtils";

/**
 * Controller for department-related endpoints
 */
class DepartmentController {
  /**
   * GET /api/departments
   * Get all municipality departments (excluding Organization)
   */
  public getMunicipalityDepartments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const departments = await departmentService.getMunicipalityDepartments();
      res.status(200).json(departments);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/departments/:id/roles
   * Get all roles available in a specific department
   */
  public getRolesByDepartment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const departmentId = parseAndValidateId(req.params.id, 'department');
      const roles = await departmentService.getRolesByDepartment(departmentId);
      res.status(200).json(roles);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/departments/roles/mapping
   * Get all department roles mapping
   */
  public getDepartmentRolesMapping = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const mapping = await departmentService.getAllMunicipalityDepartmentRoles();
      res.status(200).json(mapping);
    } catch (error) {
      next(error);
    }
  };
}

export default new DepartmentController();
