import { messageRepository } from '@repositories/messageRepository';
import { MessageEntity } from '@entity/messageEntity';

// Mock dependencies
jest.mock('@database/connection');

describe('MessageRepository Unit Tests', () => {
  let mockRepository: any;
  let mockQueryBuilder: any;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup mock del QueryBuilder
    mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      relations: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    // Setup mock del repository TypeORM
    mockRepository = {
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    // Mock del repository interno di messageRepository
    (messageRepository as any).repository = mockRepository;
  });

  describe('getMessagesByReportId', () => {
    it('should retrieve messages for a specific report with relations', async () => {
      // Arrange
      const reportId = 1;
      const mockMessages = [
        {
          id: 1,
          reportId: 1,
          senderId: 1,
          content: 'Test message',
          createdAt: new Date(),
          sender: {
            id: 1,
            username: 'testuser',
            departmentRole: {
              id: 1,
              role: { id: 1, name: 'Citizen' }
            }
          }
        }
      ];

      mockRepository.find.mockResolvedValue(mockMessages);

      // Act
      const result = await messageRepository.getMessagesByReportId(reportId);

      // Assert
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { reportId },
        relations: ['sender', 'sender.userRoles', 'sender.userRoles.departmentRole', 'sender.userRoles.departmentRole.role'],
        order: { createdAt: 'ASC' }
      });
      expect(result).toEqual(mockMessages);
    });

    it('should return empty array when no messages found', async () => {
      // Arrange
      const reportId = 999;
      mockRepository.find.mockResolvedValue([]);

      // Act
      const result = await messageRepository.getMessagesByReportId(reportId);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      // Arrange
      const reportId = 1;
      mockRepository.find.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(messageRepository.getMessagesByReportId(reportId))
        .rejects.toThrow('Database error');
    });

    it('should retrieve multiple messages in correct order', async () => {
      // Arrange
      const reportId = 1;
      const mockMessages = [
        {
          id: 1,
          reportId: 1,
          senderId: 1,
          content: 'First message',
          createdAt: new Date('2024-01-01T10:00:00'),
        },
        {
          id: 2,
          reportId: 1,
          senderId: 2,
          content: 'Second message',
          createdAt: new Date('2024-01-01T10:05:00'),
        },
        {
          id: 3,
          reportId: 1,
          senderId: 1,
          content: 'Third message',
          createdAt: new Date('2024-01-01T10:10:00'),
        }
      ];

      mockRepository.find.mockResolvedValue(mockMessages);

      // Act
      const result = await messageRepository.getMessagesByReportId(reportId);

      // Assert
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { reportId },
        relations: ['sender', 'sender.userRoles', 'sender.userRoles.departmentRole', 'sender.userRoles.departmentRole.role'],
        order: { createdAt: 'ASC' }
      });
      expect(result).toHaveLength(3);
      expect(result[0].content).toBe('First message');
      expect(result[2].content).toBe('Third message');
    });

    it('should include all sender relations', async () => {
      // Arrange
      const reportId = 1;
      const mockMessages = [
        {
          id: 1,
          reportId: 1,
          senderId: 1,
          content: 'Test message',
          createdAt: new Date(),
          sender: {
            id: 1,
            username: 'testuser',
            firstName: 'Test',
            lastName: 'User',
            userRoles: [{
              departmentRole: {
                id: 1,
                role: { id: 1, name: 'Municipal Public Relations Officer' }
              }
            }]
          }
        }
      ];

      mockRepository.find.mockResolvedValue(mockMessages);

      // Act
      const result = await messageRepository.getMessagesByReportId(reportId);

      // Assert
      expect(result[0].sender).toBeDefined();
      expect(result[0].sender.username).toBe('testuser');
      expect(result[0].sender.userRoles).toBeDefined();
    });
  });

  describe('createMessage', () => {
    it('should create and save a new message successfully', async () => {
      // Arrange
      const reportId = 1;
      const senderId = 1;
      const content = 'Test message content';
      const mockCreatedMessage = {
        id: 1,
        reportId,
        senderId,
        content,
        createdAt: new Date()
      };
      const mockSavedMessage = { ...mockCreatedMessage, id: 1 };
      const mockCompleteMessage = {
        ...mockSavedMessage,
        sender: {
          id: 1,
          username: 'testuser',
          departmentRole: {
            id: 1,
            role: { id: 1, name: 'Citizen' }
          }
        }
      };

      mockRepository.create.mockReturnValue(mockCreatedMessage);
      mockRepository.save.mockResolvedValue(mockSavedMessage);
      mockRepository.findOne.mockResolvedValue(mockCompleteMessage);

      // Act
      const result = await messageRepository.createMessage(reportId, senderId, content);

      // Assert
      expect(mockRepository.create).toHaveBeenCalledWith({
        reportId,
        senderId,
        content
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockCreatedMessage);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockSavedMessage.id },
        relations: ['sender', 'sender.userRoles', 'sender.userRoles.departmentRole', 'sender.userRoles.departmentRole.role']
      });
      expect(result).toEqual(mockCompleteMessage);
    });

    it('should throw error when message retrieval fails after save', async () => {
      // Arrange
      const reportId = 1;
      const senderId = 1;
      const content = 'Test message content';
      const mockCreatedMessage = {
        id: 1,
        reportId,
        senderId,
        content,
        createdAt: new Date()
      };
      const mockSavedMessage = { ...mockCreatedMessage, id: 1 };

      mockRepository.create.mockReturnValue(mockCreatedMessage);
      mockRepository.save.mockResolvedValue(mockSavedMessage);
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(messageRepository.createMessage(reportId, senderId, content))
        .rejects.toThrow('Failed to retrieve created message');
    });

    it('should handle database errors during save', async () => {
      // Arrange
      const reportId = 1;
      const senderId = 1;
      const content = 'Test message';
      const mockCreatedMessage = {
        id: 1,
        reportId,
        senderId,
        content,
        createdAt: new Date()
      };

      mockRepository.create.mockReturnValue(mockCreatedMessage);
      mockRepository.save.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(messageRepository.createMessage(reportId, senderId, content))
        .rejects.toThrow('Database connection failed');
    });

    it('should create message with empty content', async () => {
      // Arrange
      const reportId = 1;
      const senderId = 1;
      const content = '';
      const mockCreatedMessage = {
        id: 1,
        reportId,
        senderId,
        content,
        createdAt: new Date()
      };
      const mockSavedMessage = { ...mockCreatedMessage, id: 1 };
      const mockCompleteMessage = {
        ...mockSavedMessage,
        sender: {
          id: 1,
          username: 'testuser',
          departmentRole: {
            id: 1,
            role: { id: 1, name: 'Citizen' }
          }
        }
      };

      mockRepository.create.mockReturnValue(mockCreatedMessage);
      mockRepository.save.mockResolvedValue(mockSavedMessage);
      mockRepository.findOne.mockResolvedValue(mockCompleteMessage);

      // Act
      const result = await messageRepository.createMessage(reportId, senderId, content);

      // Assert
      expect(result.content).toBe('');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should create message with long content', async () => {
      // Arrange
      const reportId = 1;
      const senderId = 1;
      const content = 'A'.repeat(1000);
      const mockCreatedMessage = {
        id: 1,
        reportId,
        senderId,
        content,
        createdAt: new Date()
      };
      const mockSavedMessage = { ...mockCreatedMessage, id: 1 };
      const mockCompleteMessage = {
        ...mockSavedMessage,
        sender: {
          id: 1,
          username: 'testuser',
          departmentRole: {
            id: 1,
            role: { id: 1, name: 'Citizen' }
          }
        }
      };

      mockRepository.create.mockReturnValue(mockCreatedMessage);
      mockRepository.save.mockResolvedValue(mockSavedMessage);
      mockRepository.findOne.mockResolvedValue(mockCompleteMessage);

      // Act
      const result = await messageRepository.createMessage(reportId, senderId, content);

      // Assert
      expect(result.content.length).toBe(1000);
      expect(mockRepository.create).toHaveBeenCalledWith({
        reportId,
        senderId,
        content
      });
    });
  });
});
