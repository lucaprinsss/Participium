import { messageRepository } from '@repositories/messageRepository';
import { MessageEntity } from '@entity/messageEntity';

// Mock delle dipendenze
jest.mock('@database/connection');

describe('MessageRepository Unit Tests', () => {
  let mockRepository: any;
  let mockQueryBuilder: any;

  beforeEach(() => {
    // Reset dei mock prima di ogni test
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
        relations: ['sender', 'sender.departmentRole', 'sender.departmentRole.role'],
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
        relations: ['sender', 'sender.departmentRole', 'sender.departmentRole.role']
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
  });
});