import { AppDataSource } from '../database/connection';
import { NotificationEntity } from '../models/entity/notificationEntity';

export const notificationRepository = AppDataSource.getRepository(NotificationEntity);

export async function createNotification(params: {
  userId: number;
  reportId?: number;
  content: string;
}): Promise<NotificationEntity> {
  const notification = notificationRepository.create({
    userId: params.userId,
    reportId: params.reportId,
    content: params.content,
    isRead: false,
  });
  return await notificationRepository.save(notification);
}
