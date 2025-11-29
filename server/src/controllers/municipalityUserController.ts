import { Request, Response, NextFunction } from 'express';
import { municipalityUserService } from '@services/municipalityUserService';
import { RegisterRequest } from '@models/dto/input/RegisterRequest';
import { RoleUtils } from '@utils/roleUtils';
import { parseAndValidateId } from '@utils/idValidationUtils';

/**
 * Controller for Municipality User management
 */
class MunicipalityUserController {
  /**
   * POST /api/municipality/users
   * Create new municipality user (Admin only)
   */
  async createMunicipalityUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, email, password, first_name, last_name, role_name, department_name } = req.body;

      const registerData: RegisterRequest = {
        username,
        email,
        password,
        first_name,
        last_name,
        role_name,
        department_name
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
   */
  async updateMunicipalityUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseAndValidateId(req.params.id, 'user');
      const { first_name, last_name, email, role_name, department_name } = req.body;
      
      const updatedUser = await municipalityUserService.updateMunicipalityUser(id, {
        first_name,
        last_name,
        email,
        role_name,
        department_name
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
   * PUT /api/municipality/users/:id/role
   * Assign role to municipality user (Admin only)
   */
  async assignRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseAndValidateId(req.params.id, 'user');
      const { role_name, department_name } = req.body;

      const updatedUser = await municipalityUserService.assignRole(id, role_name, department_name);
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
      const municipalityRoles = await RoleUtils.getAllMunicipalityRoles();
      res.status(200).json(municipalityRoles);
    } catch (error) {
      next(error);
    }
  }

}

export default new MunicipalityUserController();