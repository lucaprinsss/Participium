import { notificationService } from '../../../services/notificationService';
import { notificationRepository } from '@repositories/notificationRepository';
import { NotificationEntity } from '@models/entity/notificationEntity';
import { NotFoundError } from '@models/errors/NotFoundError';
import { InsufficientRightsError } from '@models/errors/InsufficientRightsError';

jest.mock('@repositories/notificationRepository');

// Helper to create mock notification entity
const createMockNotification = (overrides?: Partial<NotificationEntity>): NotificationEntity => {
  const mockNotification = new NotificationEntity();
  mockNotification.id = 1;
  mockNotification.userId = 1;
  mockNotification.content = 'Test notification';
  mockNotification.isRead = false;
  mockNotification.createdAt = new Date();
  mockNotification.reportId = undefined;
  mockNotification.report = undefined;
  return { ...mockNotification, ...overrides };
};

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserNotifications', () => {
    it('should return all notifications for a user ordered by createdAt DESC', async () => {
      // Arrange
      const userId = 1;
      const mockNotifications = [
        createMockNotification({ id: 2, createdAt: new Date('2024-01-02') }),
        createMockNotification({ id: 1, createdAt: new Date('2024-01-01') }),
      ];

      (notificationRepository.find as jest.Mock).mockResolvedValue(mockNotifications);

      // Act
      const result = await notificationService.getUserNotifications(userId);

      // Assert
      expect(notificationRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
        relations: ['report'],
      });
      expect(result).toEqual(mockNotifications);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when user has no notifications', async () => {
      // Arrange
      const userId = 1;
      (notificationRepository.find as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await notificationService.getUserNotifications(userId);

      // Assert
      expect(notificationRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
        relations: ['report'],
      });
      expect(result).toEqual([]);
    });

    it('should include report relation in the query', async () => {
      // Arrange
      const userId = 1;
      const mockNotification = createMockNotification({
        reportId: 10,
        report: { id: 10 } as any,
      });

      (notificationRepository.find as jest.Mock).mockResolvedValue([mockNotification]);

      // Act
      const result = await notificationService.getUserNotifications(userId);

      // Assert
      expect(notificationRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['report'],
        })
      );
      expect(result[0].report).toBeDefined();
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read when user owns it', async () => {
      // Arrange
      const notificationId = 1;
      const userId = 1;
      const mockNotification = createMockNotification({ id: notificationId, userId, isRead: false });

      (notificationRepository.findOne as jest.Mock).mockResolvedValue(mockNotification);
      (notificationRepository.save as jest.Mock).mockResolvedValue({ ...mockNotification, isRead: true });

      // Act
      await notificationService.markAsRead(notificationId, userId);

      // Assert
      expect(notificationRepository.findOne).toHaveBeenCalledWith({ where: { id: notificationId } });
      expect(notificationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: notificationId,
          userId,
          isRead: true,
        })
      );
    });

    it('should throw NotFoundError when notification does not exist', async () => {
      // Arrange
      const notificationId = 999;
      const userId = 1;

      (notificationRepository.findOne as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(notificationService.markAsRead(notificationId, userId)).rejects.toThrow(NotFoundError);
      await expect(notificationService.markAsRead(notificationId, userId)).rejects.toThrow(
        'Notification not found'
      );
      expect(notificationRepository.save).not.toHaveBeenCalled();
    });

    it('should throw InsufficientRightsError when user does not own the notification', async () => {
      // Arrange
      const notificationId = 1;
      const userId = 1;
      const otherUserId = 2;
      const mockNotification = createMockNotification({ id: notificationId, userId: otherUserId });

      (notificationRepository.findOne as jest.Mock).mockResolvedValue(mockNotification);

      // Act & Assert
      await expect(notificationService.markAsRead(notificationId, userId)).rejects.toThrow(
        InsufficientRightsError
      );
      await expect(notificationService.markAsRead(notificationId, userId)).rejects.toThrow(
        'You can only mark your own notifications as read'
      );
      expect(notificationRepository.save).not.toHaveBeenCalled();
    });

    it('should not fail if notification is already read', async () => {
      // Arrange
      const notificationId = 1;
      const userId = 1;
      const mockNotification = createMockNotification({ id: notificationId, userId, isRead: true });

      (notificationRepository.findOne as jest.Mock).mockResolvedValue(mockNotification);
      (notificationRepository.save as jest.Mock).mockResolvedValue(mockNotification);

      // Act
      await notificationService.markAsRead(notificationId, userId);

      // Assert
      expect(notificationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isRead: true,
        })
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read for a user', async () => {
      // Arrange
      const userId = 1;
      (notificationRepository.update as jest.Mock).mockResolvedValue({ affected: 3 });

      // Act
      await notificationService.markAllAsRead(userId);

      // Assert
      expect(notificationRepository.update).toHaveBeenCalledWith(
        { userId, isRead: false },
        { isRead: true }
      );
    });

    it('should handle case when user has no unread notifications', async () => {
      // Arrange
      const userId = 1;
      (notificationRepository.update as jest.Mock).mockResolvedValue({ affected: 0 });

      // Act
      await notificationService.markAllAsRead(userId);

      // Assert
      expect(notificationRepository.update).toHaveBeenCalledWith(
        { userId, isRead: false },
        { isRead: true }
      );
    });

    it('should only update notifications with isRead: false', async () => {
      // Arrange
      const userId = 1;
      (notificationRepository.update as jest.Mock).mockResolvedValue({ affected: 2 });

      // Act
      await notificationService.markAllAsRead(userId);

      // Assert
      expect(notificationRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({ isRead: false }),
        expect.objectContaining({ isRead: true })
      );
    });
  });

  describe('createNotification', () => {
    it('should create a notification without reportId', async () => {
      // Arrange
      const userId = 1;
      const content = 'New notification';
      const mockNotification = createMockNotification({ userId, content, reportId: undefined });

      (notificationRepository.create as jest.Mock).mockReturnValue(mockNotification);
      (notificationRepository.save as jest.Mock).mockResolvedValue(mockNotification);

      // Act
      const result = await notificationService.createNotification(userId, content);

      // Assert
      expect(notificationRepository.create).toHaveBeenCalledWith({
        userId,
        content,
        reportId: undefined,
        isRead: false,
      });
      expect(notificationRepository.save).toHaveBeenCalledWith(mockNotification);
      expect(result).toEqual(mockNotification);
    });

    it('should create a notification with reportId', async () => {
      // Arrange
      const userId = 1;
      const content = 'Your report was updated';
      const reportId = 10;
      const mockNotification = createMockNotification({ userId, content, reportId });

      (notificationRepository.create as jest.Mock).mockReturnValue(mockNotification);
      (notificationRepository.save as jest.Mock).mockResolvedValue(mockNotification);

      // Act
      const result = await notificationService.createNotification(userId, content, reportId);

      // Assert
      expect(notificationRepository.create).toHaveBeenCalledWith({
        userId,
        content,
        reportId,
        isRead: false,
      });
      expect(notificationRepository.save).toHaveBeenCalledWith(mockNotification);
      expect(result).toEqual(mockNotification);
      expect(result.reportId).toBe(reportId);
    });

    it('should create notification with isRead set to false by default', async () => {
      // Arrange
      const userId = 1;
      const content = 'Test';
      const mockNotification = createMockNotification({ userId, content, isRead: false });

      (notificationRepository.create as jest.Mock).mockReturnValue(mockNotification);
      (notificationRepository.save as jest.Mock).mockResolvedValue(mockNotification);

      // Act
      const result = await notificationService.createNotification(userId, content);

      // Assert
      expect(notificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isRead: false,
        })
      );
      expect(result.isRead).toBe(false);
    });

    it('should save the created notification to the database', async () => {
      // Arrange
      const userId = 1;
      const content = 'Test notification';
      const mockNotification = createMockNotification({ userId, content });

      (notificationRepository.create as jest.Mock).mockReturnValue(mockNotification);
      (notificationRepository.save as jest.Mock).mockResolvedValue(mockNotification);

      // Act
      await notificationService.createNotification(userId, content);

      // Assert
      expect(notificationRepository.save).toHaveBeenCalledTimes(1);
      expect(notificationRepository.save).toHaveBeenCalledWith(mockNotification);
    });
  });
});
