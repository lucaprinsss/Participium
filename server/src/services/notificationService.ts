import { notificationRepository } from '../repositories/notificationRepository';
import { NotificationEntity } from '../models/entity/notificationEntity';
import { NotFoundError } from '../models/errors/NotFoundError';
import { InsufficientRightsError } from '../models/errors/InsufficientRightsError';

class NotificationService {
  async getUserNotifications(userId: number): Promise<NotificationEntity[]> {
    return await notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['report'] // Load report relation if needed for links
    });
  }

  async markAsRead(notificationId: number, userId: number): Promise<void> {
    const notification = await notificationRepository.findOne({ where: { id: notificationId } });
    
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new InsufficientRightsError('You can only mark your own notifications as read');
    }

    notification.isRead = true;
    await notificationRepository.save(notification);
  }

  async markAllAsRead(userId: number): Promise<void> {
    await notificationRepository.update({ userId, isRead: false }, { isRead: true });
  }

  async createNotification(userId: number, content: string, reportId?: number): Promise<NotificationEntity> {
    const notification = notificationRepository.create({
      userId,
      content,
      reportId,
      isRead: false
    });
    return await notificationRepository.save(notification);
  }
}

export const notificationService = new NotificationService();
