import { Request, Response, NextFunction } from 'express';

class MunicipalityUserController {

    /**
   * Assign role to municipality user
   * PUT /api/municipality/users/:id/role
   * Story: As a system administrator, I want to assign roles to municipality users
   */
  async assignRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      const { role } = req.body;

      if (isNaN(userId)) {
        throw new BadRequest('Invalid user ID');
      }

      if (!role) {
        throw new BadRequest('Role is required');
      }

      // Validate role is a valid UserRole enum value
      if (!Object.values(UserRole).includes(role)) {
        throw new BadRequest('Invalid role specified');
      }
      
      const updatedUser = await municipalityUserService.assignRole(userId, role);
      res.status(200).json(updatedUser);
    } catch (error) {
      next(error);
    }
  }

}

export default new MunicipalityUserController();