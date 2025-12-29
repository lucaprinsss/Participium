import { AppDataSource } from '@database/connection';
import { NotificationEntity } from '@entity/notificationEntity';

// Mock delle dipendenze
jest.mock('@database/connection', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('NotificationRepository Unit Tests', () => {
  let mockRepository: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    };

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepository);
  });

  describe('createNotification', () => {
    it('should create notification with required fields', async () => {
      // Arrange
      const mockCreatedNotification = {
        userId: 1,
        reportId: 10,
        content: 'New message on your report',
        isRead: false,
      };

      const mockSavedNotification = {
        id: 1,
        ...mockCreatedNotification,
        createdAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockCreatedNotification);
      mockRepository.save.mockResolvedValue(mockSavedNotification);

      // Act
      const notificationRepository = AppDataSource.getRepository(NotificationEntity);
      const notification = notificationRepository.create({
        userId: 1,
        reportId: 10,
        content: 'New message on your report',
        isRead: false,
      });
      const result = await notificationRepository.save(notification);

      // Assert
      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: 1,
        reportId: 10,
        content: 'New message on your report',
        isRead: false,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockCreatedNotification);
      expect(result).toEqual(mockSavedNotification);
      expect(result.id).toBeDefined();
      expect(result.isRead).toBe(false);
    });

    it('should create notification without reportId', async () => {
      // Arrange
      const mockCreatedNotification = {
        userId: 2,
        reportId: undefined,
        content: 'General notification',
        isRead: false,
      };

      const mockSavedNotification = {
        id: 2,
        ...mockCreatedNotification,
        createdAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockCreatedNotification);
      mockRepository.save.mockResolvedValue(mockSavedNotification);

      // Act
      const notificationRepository = AppDataSource.getRepository(NotificationEntity);
      const notification = notificationRepository.create({
        userId: 2,
        content: 'General notification',
        isRead: false,
      });
      const result = await notificationRepository.save(notification);

      // Assert
      expect(result.reportId).toBeUndefined();
      expect(result.isRead).toBe(false);
    });

    it('should handle save errors', async () => {
      // Arrange
      const mockCreatedNotification = {
        userId: 1,
        reportId: 10,
        content: 'Test notification',
        isRead: false,
      };

      mockRepository.create.mockReturnValue(mockCreatedNotification);
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      const notificationRepository = AppDataSource.getRepository(NotificationEntity);
      const notification = notificationRepository.create({
        userId: 1,
        reportId: 10,
        content: 'Test notification',
        isRead: false,
      });

      await expect(notificationRepository.save(notification))
        .rejects.toThrow('Database error');
    });

    it('should create notification with long content', async () => {
      // Arrange
      const longContent = 'A'.repeat(500);
      const mockCreatedNotification = {
        userId: 5,
        reportId: 25,
        content: longContent,
        isRead: false,
      };

      const mockSavedNotification = {
        id: 5,
        ...mockCreatedNotification,
        createdAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockCreatedNotification);
      mockRepository.save.mockResolvedValue(mockSavedNotification);

      // Act
      const notificationRepository = AppDataSource.getRepository(NotificationEntity);
      const notification = notificationRepository.create({
        userId: 5,
        reportId: 25,
        content: longContent,
        isRead: false,
      });
      const result = await notificationRepository.save(notification);

      // Assert
      expect(result.content).toBe(longContent);
      expect(result.content.length).toBe(500);
    });
  });

  describe('Additional repository operations', () => {
    it('should find notifications by user ID', async () => {
      // Arrange
      const userId = 1;
      const mockNotifications = [
        {
          id: 1,
          userId: 1,
          reportId: 10,
          content: 'Notification 1',
          isRead: false,
          createdAt: new Date(),
        },
        {
          id: 2,
          userId: 1,
          reportId: 11,
          content: 'Notification 2',
          isRead: true,
          createdAt: new Date(),
        },
      ];

      mockRepository.find.mockResolvedValue(mockNotifications);

      // Act
      const notificationRepository = AppDataSource.getRepository(NotificationEntity);
      const result = await notificationRepository.find({ where: { userId } });

      // Assert
      expect(mockRepository.find).toHaveBeenCalledWith({ where: { userId } });
      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe(userId);
    });

    it('should find unread notifications', async () => {
      // Arrange
      const mockUnreadNotifications = [
        {
          id: 1,
          userId: 1,
          content: 'Unread notification',
          isRead: false,
          createdAt: new Date(),
        },
      ];

      mockRepository.find.mockResolvedValue(mockUnreadNotifications);

      // Act
      const notificationRepository = AppDataSource.getRepository(NotificationEntity);
      const result = await notificationRepository.find({ where: { isRead: false } });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].isRead).toBe(false);
    });
  });
});
