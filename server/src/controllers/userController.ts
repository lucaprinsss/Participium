import { Request, Response, NextFunction } from 'express';

/**
 * Controller for User-related HTTP requests
 */
class UserController {
  /**
   * Register a new citizen
   * TODO: Implement citizen registration logic
   */
  register(req: Request, res: Response, next: NextFunction) {
    res.status(501).json({ error: 'Citizen registration not implemented yet' });
  }
}

export default new UserController();
