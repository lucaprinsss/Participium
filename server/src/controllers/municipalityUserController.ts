import { Request, Response, NextFunction } from 'express';
import { municipalityUserService } from '@services/municipalityUserService';
import { RegisterRequest } from '@models/dto/input/RegisterRequest';
import { departmentService } from '@services/departmentService';
import { parseAndValidateId } from '@utils/idValidationUtils';
import { BadRequestError } from '@models/errors/BadRequestError';

/**
 * Controller for Municipality User management
 */
class MunicipalityUserController {
  /**
   * POST /api/municipality/users
   * Create new municipality user (Admin only)
   * Body: { username, email, password, first_name, last_name, department_role_ids: number[], company_name? }
   * Note: Supports multiple roles assignment via department_role_ids array
   */
  async createMunicipalityUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, email, password, first_name, last_name, department_role_ids, company_name } = req.body;

      // Validate department_role_ids
      if (!department_role_ids || !Array.isArray(department_role_ids) || department_role_ids.length === 0) {
        throw new BadRequestError('department_role_ids must be a non-empty array of role IDs');
      }

      // Validate all IDs are positive integers
      if (!department_role_ids.every((id: any) => Number.isInteger(id) && id > 0)) {
        throw new BadRequestError('All department_role_ids must be positive integers');
      }

      const registerData: RegisterRequest = {
        username,
        email,
        password,
        first_name,
        last_name,
        department_role_ids,
        company_name
      };

      const userResponse = await municipalityUserService.createMunicipalityUser(registerData);

      res.status(201).json(userResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/municipality/users
   * List all municipality users (Admin only)
   */
  async getAllMunicipalityUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await municipalityUserService.getAllMunicipalityUsers();
      res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/municipality/users/:id
   * Get municipality user by ID (Admin only)
   */
  async getMunicipalityUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseAndValidateId(req.params.id, 'user');
      const user = await municipalityUserService.getMunicipalityUserById(id);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/municipality/users/:id
   * Update municipality user (Admin only)
   * Body: { first_name?, last_name?, email?, department_role_ids?: number[], company_name? }
   * Note: Supports updating multiple roles via department_role_ids array
   */
  async updateMunicipalityUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseAndValidateId(req.params.id, 'user');
      const { first_name, last_name, email, department_role_ids, company_name } = req.body;

      // Validate department_role_ids if provided
      if (department_role_ids !== undefined) {
        if (!Array.isArray(department_role_ids) || department_role_ids.length === 0) {
          throw new BadRequestError('department_role_ids must be a non-empty array of role IDs when provided');
        }
        if (!department_role_ids.every((id: any) => Number.isInteger(id) && id > 0)) {
          throw new BadRequestError('All department_role_ids must be positive integers');
        }
      }

      const updatedUser = await municipalityUserService.updateMunicipalityUser(id, {
        first_name,
        last_name,
        email,
        department_role_ids,
        company_name
      });
      res.status(200).json(updatedUser);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/municipality/users/:id
   * Delete municipality user (Admin only)
   */
  async deleteMunicipalityUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseAndValidateId(req.params.id, 'user');
      await municipalityUserService.deleteMunicipalityUser(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/municipality/users/:id/roles
   * Update roles for municipality user (Admin only)
   * Body: { department_role_ids: number[] }
   * Note: Replaces all existing roles with the provided ones
   */
  async updateRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseAndValidateId(req.params.id, 'user');
      const { department_role_ids } = req.body;

      // Validate department_role_ids
      if (!department_role_ids || !Array.isArray(department_role_ids) || department_role_ids.length === 0) {
        throw new BadRequestError('department_role_ids must be a non-empty array of role IDs');
      }

      // Validate all IDs are positive integers
      if (!department_role_ids.every((id: any) => Number.isInteger(id) && id > 0)) {
        throw new BadRequestError('All department_role_ids must be positive integers');
      }

      const updatedUser = await municipalityUserService.updateMunicipalityUser(id, {
        department_role_ids
      });
      res.status(200).json(updatedUser);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/municipality/users/:id/role
   * Assign a single role to municipality user (adds to existing roles)
   * Body: { role_name: string, department_name?: string }
   * Note: This adds a role without removing existing ones
   */
  async assignRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseAndValidateId(req.params.id, 'user');
      const { role_name, department_name } = req.body;

      if (!role_name || typeof role_name !== 'string') {
        throw new BadRequestError('role_name is required and must be a string');
      }

      const updatedUser = await municipalityUserService.assignRole(id, role_name, department_name);
      res.status(200).json(updatedUser);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/municipality/users/:id/roles/:roleId
   * Remove a single role from municipality user
   * Note: Users must have at least one role after removal
   */
  async removeRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = parseAndValidateId(req.params.id, 'user');
      const roleId = parseAndValidateId(req.params.roleId, 'role');

      const updatedUser = await municipalityUserService.removeRole(userId, roleId);
      res.status(200).json(updatedUser);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all municipality roles
   * GET /api/roles
   * Story: List all available municipality roles (excluding Citizen and Administrator)
   */
  async getAllRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const municipalityRoles = await departmentService.getAllMunicipalityRoles();
      res.status(200).json(municipalityRoles);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all department roles (combinations of department + role)
   * GET /api/municipality/department-roles
   * Returns: Array<{ id: number, department: string, role: string }>
   * Story: Provides all available department-role combinations for user assignment
   */
  async getAllDepartmentRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const departmentRoles = await departmentService.getAllMunicipalityDepartmentRoles();
      res.status(200).json(departmentRoles);
    } catch (error) {
      next(error);
    }
  }

}

export default new MunicipalityUserController();