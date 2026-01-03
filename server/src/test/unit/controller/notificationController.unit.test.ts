import { Request, Response, NextFunction } from 'express';
import { notificationController } from '@controllers/notificationController';
import { notificationService } from '@services/notificationService';
import { NotificationEntity } from '@models/entity/notificationEntity';
import { NotFoundError } from '@models/errors/NotFoundError';
import { InsufficientRightsError } from '@models/errors/InsufficientRightsError';
import { User } from '@models/dto/User';

jest.mock('@services/notificationService');

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

describe('NotificationController Unit Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  const mockUser: User = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    password_hash: 'hashed_password',
    department_role_id: 1,
    email_notifications_enabled: true,
    is_verified: true,
    created_at: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      user: mockUser,
      params: {},
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = jest.fn();
  });

  describe('getNotifications', () => {
    it('should return all notifications for the authenticated user', async () => {
      // Arrange
      const mockNotifications = [
        createMockNotification({ id: 1, userId: 1, content: 'Notification 1' }),
        createMockNotification({ id: 2, userId: 1, content: 'Notification 2' }),
      ];

      (notificationService.getUserNotifications as jest.Mock).mockResolvedValue(mockNotifications);

      // Act
      await notificationController.getNotifications(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(notificationService.getUserNotifications).toHaveBeenCalledWith(1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockNotifications);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return empty array when user has no notifications', async () => {
      // Arrange
      (notificationService.getUserNotifications as jest.Mock).mockResolvedValue([]);

      // Act
      await notificationController.getNotifications(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(notificationService.getUserNotifications).toHaveBeenCalledWith(1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith([]);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error when service throws error', async () => {
      // Arrange
      const error = new Error('Database error');
      (notificationService.getUserNotifications as jest.Mock).mockRejectedValue(error);

      // Act
      await notificationController.getNotifications(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(statusMock).not.toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it('should use the authenticated user id from req.user', async () => {
      // Arrange
      const differentUser: User = { ...mockUser, id: 5 };
      mockRequest.user = differentUser;
      (notificationService.getUserNotifications as jest.Mock).mockResolvedValue([]);

      // Act
      await notificationController.getNotifications(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(notificationService.getUserNotifications).toHaveBeenCalledWith(5);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read successfully', async () => {
      // Arrange
      mockRequest.params = { id: '1' };
      (notificationService.markAsRead as jest.Mock).mockResolvedValue(undefined);

      // Act
      await notificationController.markAsRead(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(notificationService.markAsRead).toHaveBeenCalledWith(1, 1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Notification marked as read' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should parse notification id from params', async () => {
      // Arrange
      mockRequest.params = { id: '42' };
      (notificationService.markAsRead as jest.Mock).mockResolvedValue(undefined);

      // Act
      await notificationController.markAsRead(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(notificationService.markAsRead).toHaveBeenCalledWith(42, 1);
    });

    it('should call next with NotFoundError when notification does not exist', async () => {
      // Arrange
      mockRequest.params = { id: '999' };
      const error = new NotFoundError('Notification not found');
      (notificationService.markAsRead as jest.Mock).mockRejectedValue(error);

      // Act
      await notificationController.markAsRead(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(statusMock).not.toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it('should call next with InsufficientRightsError when user does not own notification', async () => {
      // Arrange
      mockRequest.params = { id: '1' };
      const error = new InsufficientRightsError('You can only mark your own notifications as read');
      (notificationService.markAsRead as jest.Mock).mockRejectedValue(error);

      // Act
      await notificationController.markAsRead(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should use the authenticated user id from req.user', async () => {
      // Arrange
      const differentUser: User = { ...mockUser, id: 10 };
      mockRequest.user = differentUser;
      mockRequest.params = { id: '5' };
      (notificationService.markAsRead as jest.Mock).mockResolvedValue(undefined);

      // Act
      await notificationController.markAsRead(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(notificationService.markAsRead).toHaveBeenCalledWith(5, 10);
    });

    it('should handle generic errors', async () => {
      // Arrange
      mockRequest.params = { id: '1' };
      const error = new Error('Unexpected error');
      (notificationService.markAsRead as jest.Mock).mockRejectedValue(error);

      // Act
      await notificationController.markAsRead(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read successfully', async () => {
      // Arrange
      (notificationService.markAllAsRead as jest.Mock).mockResolvedValue(undefined);

      // Act
      await notificationController.markAllAsRead(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(notificationService.markAllAsRead).toHaveBeenCalledWith(1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'All notifications marked as read' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should use the authenticated user id from req.user', async () => {
      // Arrange
      const differentUser: User = { ...mockUser, id: 7 };
      mockRequest.user = differentUser;
      (notificationService.markAllAsRead as jest.Mock).mockResolvedValue(undefined);

      // Act
      await notificationController.markAllAsRead(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(notificationService.markAllAsRead).toHaveBeenCalledWith(7);
    });

    it('should call next with error when service throws error', async () => {
      // Arrange
      const error = new Error('Database error');
      (notificationService.markAllAsRead as jest.Mock).mockRejectedValue(error);

      // Act
      await notificationController.markAllAsRead(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(statusMock).not.toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it('should work when user has no notifications to mark as read', async () => {
      // Arrange
      (notificationService.markAllAsRead as jest.Mock).mockResolvedValue(undefined);

      // Act
      await notificationController.markAllAsRead(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(notificationService.markAllAsRead).toHaveBeenCalledWith(1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'All notifications marked as read' });
    });
  });
});
