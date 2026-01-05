import { Request, Response, NextFunction } from 'express';
import { userService } from '@services/userService';
import { departmentService } from '@services/departmentService';
import { AppError } from '@models/errors/AppError';
import { BadRequestError } from '@errors/BadRequestError';
import { RegisterRequest } from '@dto/input/RegisterRequest';
import { UnauthorizedError } from '@errors/UnauthorizedError';
import { userRepository } from '@repositories/userRepository';

/**
 * Controller for User-related HTTP requests
 */
class UserController {
  /**
   * Register a new citizen
   * Citizen registration logic
   * Body: { username, email, password, first_name, last_name }
   * Note: Automatically assigns Citizen role via department_role_ids
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, email, password, first_name, last_name } = req.body;

      if (!username || !email || !password || !first_name || !last_name) {
        throw new BadRequestError('All fields are required: username, email, password, first_name, last_name');
      }

      // Get all department role IDs for Citizen role
      const citizenRoleIds = await departmentService.getDepartmentRoleIdsByRoleName('Citizen');
      
      if (citizenRoleIds.length === 0) {
        throw new AppError('Citizen role configuration not found in database', 500);
      }

      const registerData: RegisterRequest = {
        username,
        email,
        password,
        first_name,
        last_name,
        department_role_ids: citizenRoleIds // Assign all Citizen department roles
      };

      const userResponse = await userService.registerCitizen(registerData);

      res.status(201).json(userResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get external maintainers by category
   * Returns list of external maintainers for a specific category
   */
  async getExternalMaintainersByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category } = req.query;

      const externalMaintainers = await userService.getExternalMaintainersByCategory(category as string || category as undefined);
      res.status(200).json(externalMaintainers);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate Telegram link code
   * Generates a verification code for linking Telegram account
   */
  async generateTelegramLinkCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user as any;
      const code = await userService.generateTelegramLinkCode(user.id);
      
      if (!code) {
        res.status(404).json({
          code: 404,
          name: 'NotFoundError',
          message: 'User not found'
        });
        return;
      }

      // Calculate expiration time (10 minutes from now)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);

      res.status(200).json({
        code,
        expiresAt: expiresAt.toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Telegram link status
   * Returns whether the user's account is linked to Telegram and any active link code
   */
  async getTelegramStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user as any;
      const userEntity = await userRepository.findUserById(user.id);
      
      if (!userEntity) {
        res.status(404).json({
          code: 404,
          name: 'NotFoundError',
          message: 'User not found'
        });
        return;
      }

      let activeCode = null;
      if (userEntity.telegramLinkCode && userEntity.telegramLinkCodeExpiresAt && userEntity.telegramLinkCodeExpiresAt > new Date()) {
        activeCode = {
          code: userEntity.telegramLinkCode,
          expiresAt: userEntity.telegramLinkCodeExpiresAt
        };
      }

      res.status(200).json({
        isLinked: !!userEntity.telegramUsername && !!userEntity.telegramLinkConfirmed,
        telegramUsername: userEntity.telegramUsername,
        activeCode: activeCode,
        requiresConfirmation: !!userEntity.telegramUsername && !userEntity.telegramLinkConfirmed
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Confirm Telegram link after the user taps the CTA in the app.
   */
  async confirmTelegramLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user as any;
      const result = await userService.confirmTelegramLink(user.id);

      if (!result.success) {
        res.status(400).json({
          code: 400,
          name: 'BadRequestError',
          message: result.message
        });
        return;
      }

      const refreshed = await userRepository.findUserById(user.id);

      res.status(200).json({
        message: result.message,
        isLinked: !!refreshed?.telegramUsername && !!refreshed?.telegramLinkConfirmed,
        telegramUsername: refreshed?.telegramUsername,
        requiresConfirmation: !!refreshed?.telegramUsername && !refreshed?.telegramLinkConfirmed
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unlink Telegram account
   * Removes the Telegram username from the user's account
   */
  async unlinkTelegramAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user as any;
      const result = await userService.unlinkTelegramAccount(user.id);

      if (!result.success) {
        res.status(400).json({
          code: 400,
          name: 'BadRequestError',
          message: result.message
        });
        return;
      }

      res.status(200).json({
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get notifications for the authenticated user
   */
  async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Not authenticated');
      const userId = (req.user as any).id;
      let isRead: boolean | undefined = undefined;
      if (typeof req.query.is_read === 'string') {
        if (req.query.is_read === 'true') isRead = true;
        else if (req.query.is_read === 'false') isRead = false;
      }
      const notifications = await userService.getUserNotifications(userId, isRead);
      res.json(notifications);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Mark a notification as read/unread
   */
  async markNotificationAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Not authenticated');
      const userId = (req.user as any).id;
      const notificationId = Number(req.params.id);
      const { is_read } = req.body;
      const notification = await userService.markNotificationAsRead(userId, notificationId, !!is_read);
      res.json(notification);
    } catch (err) {
      next(err);
    }
  }

    /**
   * 
  */
  async findUserByUsername(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username } = req.params;
      const user = await userService.getUserByUsername(username);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }
/**
   * Update current user profile settings
   * Allows citizen to update photo, telegram username, and email notifications
   */
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Not authenticated');
      }

      const userId = (req.user as any).id;
      const { 
        firstName, 
        lastName, 
        email, 
        personalPhoto, 
        telegramUsername, 
        emailNotificationsEnabled 
      } = req.body;

      const updatedUser = await userService.updateUserProfile(userId, {
        firstName,
        lastName,
        email,
        personalPhoto,
        telegramUsername,
        emailNotificationsEnabled
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user password
   */
  async updatePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Not authenticated');
      }

      const userId = (req.user as any).id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        throw new BadRequestError('Current password and new password are required');
      }

      // Basic password strength validation (same as registration)
      if (newPassword.length < 6) {
        throw new BadRequestError('New password must be at least 6 characters long');
      }

      await userService.updatePassword(userId, currentPassword, newPassword);

      res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
      next(error);
    }
  }
}




export default new UserController();