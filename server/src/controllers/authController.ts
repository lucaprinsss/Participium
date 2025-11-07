import { Request, Response, NextFunction } from 'express';

/**
 * Controller for Authentication-related HTTP requests
 */
class authController {
  /**
   * Login handler
   * TODO: Implement authentication logic with Passport
   */
  login(req: Request, res: Response, next: NextFunction) {
    res.status(501).json({ error: 'Login not implemented yet' });
  }

  /**
   * Get current authenticated user
   * TODO: Implement current user retrieval
   */
  getCurrentUser(req: Request, res: Response) {
    res.status(501).json({ error: 'Get current user not implemented yet' });
  }

  /**
   * Logout handler
   * TODO: Implement session destruction
   */
  logout(req: Request, res: Response) {
    res.status(501).json({ error: 'Logout not implemented yet' });
  }
}

export default new authController();
