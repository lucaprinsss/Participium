import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notificationService';
import { User } from '../models/dto/User';

class NotificationController {
  async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as User).id;
      const notifications = await notificationService.getUserNotifications(userId);
      res.status(200).json(notifications);
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as User).id;
      const notificationId = Number.parseInt(req.params.id);
      await notificationService.markAsRead(notificationId, userId);
      res.status(200).json({ message: 'Notification marked as read' });
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as User).id;
      await notificationService.markAllAsRead(userId);
      res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
