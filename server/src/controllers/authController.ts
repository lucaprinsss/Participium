import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { authService } from '@services/authService';
import { UnauthorizedError } from '@models/errors/UnauthorizedError';


/**
 * Controller for Authentication-related HTTP requests
 */
class AuthController {
  /**
   * Login handler
   * Authenticates user with Passport LocalStrategy
   */
  login(req: Request, res: Response, next: NextFunction): void {
    passport.authenticate('local', (err: Error | null, user: Express.User | false, info: { message: string }) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        return next(new UnauthorizedError(info?.message || 'Invalid credentials'));
      }

      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        
        const userResponse = authService.createUserResponse(user);
        return res.status(200).json(userResponse);
      });
    })(req, res, next);
  }

  /**
   * Get current authenticated user
   * Returns user data from session
   */
  getCurrentUser(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Not authenticated');
      }

      const userResponse = authService.createUserResponse(req.user);
      res.status(200).json(userResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout handler
   * Destroys session and logs user out
   */
  logout(req: Request, res: Response, next: NextFunction): void {
    req.logout((err) => {
      if (err) {
        return next(err);
      }

      req.session.destroy((err) => {
        if (err) {
          return next(err);
        }
        
        res.clearCookie('connect.sid');
        res.status(200).json({ message: 'Logged out successfully' });
      });
    });
  }
}

export default new AuthController();
