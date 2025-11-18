import { Request, Response, NextFunction } from "express";
import { departmentService } from "@services/departmentService";
import { BadRequestError } from "@errors/BadRequestError";

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
      // Validate department ID (must be positive integer, reject decimals)
      if (req.params.id.includes('.')) {
        throw new BadRequestError("Invalid department ID. Must be a positive integer.");
      }
      
      const departmentId = parseInt(req.params.id, 10);
      
      if (isNaN(departmentId) || departmentId <= 0) {
        throw new BadRequestError("Invalid department ID. Must be a positive integer.");
      }
      
      const roles = await departmentService.getRolesByDepartment(departmentId);
      res.status(200).json(roles);
    } catch (error) {
      next(error);
    }
  };
}

export default new DepartmentController();
