import { Request, Response, NextFunction } from 'express';
import { userService } from '@services/userService';
import { BadRequestError } from '@models/errors/BadRequestError';
import { RegisterRequest } from '@models/dto/input/RegisterRequest';
import { NotFoundError } from '@models/errors/NotFoundError';
import { UnauthorizedError } from '@models/errors/UnauthorizedError';
import { get } from 'http';

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


}



export default new UserController();