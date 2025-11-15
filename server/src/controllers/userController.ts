import { Request, Response, NextFunction } from 'express';
import { userService } from '@services/userService';
import { BadRequestError } from '@models/errors/BadRequestError';
import { RegisterRequest } from '@models/dto/RegisterRequest';

/**
 * Controller for User-related HTTP requests
 */
class UserController {
  /**
   * Register a new citizen
   * Citizen registration logic
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, email, password, first_name, last_name } = req.body;

      if (!username || !email || !password || !first_name || !last_name) {
        throw new BadRequestError('All fields are required: username, email, password, first_name, last_name');
      }

      const registerData: RegisterRequest = {
        username,
        email,
        password,
        first_name,
        last_name,
        role_name: 'Citizen' // Default role for citizens
      };

      const userResponse = await userService.registerCitizen(registerData);

      res.status(201).json(userResponse);
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();