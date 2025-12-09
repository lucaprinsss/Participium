import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { authService } from '@services/authService';
import { UnauthorizedError } from '@models/errors/UnauthorizedError';
import { userRepository } from '@repositories/userRepository';
import { NotFoundError } from '@models/errors/NotFoundError';
import { BadRequestError } from '@models/errors/BadRequestError';
import { UserEntity } from '@models/entity/userEntity';

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
      
      if (!(user as UserEntity)) {
        return next(new UnauthorizedError(info?.message || 'Invalid credentials'));
      }

      if((user as UserEntity).isVerified === false) {
        return next(new UnauthorizedError('Email not verified. Please verify your email before logging in.'));
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


  /**
   * Verify email code for user
   * @param req Request object containing email and code
   * @param res Response object
   * @param next NextFunction for error handling
   */ 
  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {email, otpCode } = req.body;

      if (!email || !otpCode) {
        throw new BadRequestError('Email and verification code are required.');
      } 

      if(otpCode.length !== 6 || !/^\d{6}$/.test(otpCode)) {
        throw new BadRequestError('Verification code must be exactly 6 digits');
      }

      const userExist = await userRepository.existsUserByEmail(email);

      if(!userExist) {
        throw new NotFoundError('No account found with this email address.');
      }

      await authService.verifyEmailCode(email, otpCode);

      res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
      next(error);
    }
  }

}

export default new AuthController();
