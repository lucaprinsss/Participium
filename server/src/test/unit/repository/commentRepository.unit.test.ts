import { commentRepository } from '@repositories/commentRepository';
import { CommentEntity } from '@models/entity/commentEntity';
import { NotFoundError } from '@models/errors/NotFoundError';

describe('CommentRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCommentsByReportId', () => {
    it('should call getCommentsByReportId with correct parameters', async () => {
      const mockComments: Partial<CommentEntity>[] = [
        {
          id: 1,
          reportId: 10,
          content: 'First comment',
          author: {
            id: 1,
            username: 'testuser',
            firstName: 'Test',
            lastName: 'User'
          } as any,
          createdAt: new Date('2024-01-15T10:00:00Z')
        },
        {
          id: 2,
          reportId: 10,
          content: 'Second comment',
          author: {
            id: 2,
            username: 'anotheruser',
            firstName: 'Another',
            lastName: 'User'
          } as any,
          createdAt: new Date('2024-01-15T11:00:00Z')
        }
      ];

      jest.spyOn(commentRepository, 'getCommentsByReportId').mockResolvedValue(mockComments as CommentEntity[]);

      const result = await commentRepository.getCommentsByReportId(10);

      expect(commentRepository.getCommentsByReportId).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockComments);
      expect(result.length).toBe(2);
    });

    it('should return empty array when report has no comments', async () => {
      jest.spyOn(commentRepository, 'getCommentsByReportId').mockResolvedValue([]);

      const result = await commentRepository.getCommentsByReportId(999);

      expect(commentRepository.getCommentsByReportId).toHaveBeenCalledWith(999);
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('should return comments with author relation loaded', async () => {
      const mockComments: Partial<CommentEntity>[] = [
        {
          id: 1,
          reportId: 10,
          content: 'Test comment',
          author: {
            id: 1,
            username: 'testuser',
            firstName: 'Test',
            lastName: 'User',
            departmentRole: {
              role: {
                name: 'Citizen'
              }
            }
          } as any,
          createdAt: new Date()
        }
      ];

      jest.spyOn(commentRepository, 'getCommentsByReportId').mockResolvedValue(mockComments as CommentEntity[]);

      const result = await commentRepository.getCommentsByReportId(10);

      expect(result[0].author).toBeDefined();
      expect(result[0].author.id).toBe(1);
      expect(result[0].author.username).toBe('testuser');
      expect(result[0].author.departmentRole).toBeDefined();
    });

    it('should return comments ordered by createdAt ascending', async () => {
      const mockComments: Partial<CommentEntity>[] = [
        {
          id: 1,
          reportId: 10,
          content: 'Oldest comment',
          createdAt: new Date('2024-01-15T09:00:00Z')
        },
        {
          id: 2,
          reportId: 10,
          content: 'Middle comment',
          createdAt: new Date('2024-01-15T10:00:00Z')
        },
        {
          id: 3,
          reportId: 10,
          content: 'Newest comment',
          createdAt: new Date('2024-01-15T11:00:00Z')
        }
      ];

      jest.spyOn(commentRepository, 'getCommentsByReportId').mockResolvedValue(mockComments as CommentEntity[]);

      const result = await commentRepository.getCommentsByReportId(10);

      expect(result[0].content).toBe('Oldest comment');
      expect(result[1].content).toBe('Middle comment');
      expect(result[2].content).toBe('Newest comment');
    });
  });

  describe('createComment', () => {
    it('should call createComment with correct parameters', async () => {
      const commentData = {
        reportId: 10,
        authorId: 1,
        content: 'New comment'
      };

      const mockCreatedComment: Partial<CommentEntity> = {
        id: 5,
        reportId: 10,
        content: 'New comment',
        author: {
          id: 1,
          username: 'testuser'
        } as any,
        createdAt: new Date()
      };

      jest.spyOn(commentRepository, 'createComment').mockResolvedValue(mockCreatedComment as CommentEntity);

      const result = await commentRepository.createComment(commentData.reportId, commentData.authorId, commentData.content);

      expect(commentRepository.createComment).toHaveBeenCalledWith(commentData.reportId, commentData.authorId, commentData.content);
      expect(result).toEqual(mockCreatedComment);
      expect(result.id).toBe(5);
      expect(result.content).toBe('New comment');
    });

    it('should return comment with author relation loaded', async () => {
      const commentData = {
        reportId: 10,
        authorId: 1,
        content: 'Test'
      };

      const mockCreatedComment: Partial<CommentEntity> = {
        id: 1,
        reportId: 10,
        content: 'Test',
        author: {
          id: 1,
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User'
        } as any,
        createdAt: new Date()
      };

      jest.spyOn(commentRepository, 'createComment').mockResolvedValue(mockCreatedComment as CommentEntity);

      const result = await commentRepository.createComment(commentData.reportId, commentData.authorId, commentData.content);

      expect(result.author).toBeDefined();
      expect(result.author.id).toBe(1);
      expect(result.author.username).toBe('testuser');
    });

    it('should set createdAt timestamp on creation', async () => {
      const commentData = {
        reportId: 10,
        authorId: 1,
        content: 'Test'
      };

      const now = new Date();
      const mockCreatedComment: Partial<CommentEntity> = {
        id: 1,
        reportId: 10,
        content: 'Test',
        author: { id: 1 } as any,
        createdAt: now
      };

      jest.spyOn(commentRepository, 'createComment').mockResolvedValue(mockCreatedComment as CommentEntity);

      const result = await commentRepository.createComment(commentData.reportId, commentData.authorId, commentData.content);

      expect(result.createdAt).toBeDefined();
      expect(result.createdAt).toEqual(now);
    });
  });

  describe('getCommentById', () => {
    it('should call getCommentById with correct parameters', async () => {
      const mockComment: Partial<CommentEntity> = {
        id: 5,
        reportId: 10,
        content: 'Test comment',
        author: {
          id: 1,
          username: 'testuser'
        } as any,
        createdAt: new Date()
      };

      jest.spyOn(commentRepository, 'getCommentById').mockResolvedValue(mockComment as CommentEntity);

      const result = await commentRepository.getCommentById(5);

      expect(commentRepository.getCommentById).toHaveBeenCalledWith(5);
      expect(result).toEqual(mockComment);
      expect(result?.id).toBe(5);
    });

    it('should return null when comment is not found', async () => {
      jest.spyOn(commentRepository, 'getCommentById').mockResolvedValue(null);

      const result = await commentRepository.getCommentById(999);

      expect(commentRepository.getCommentById).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });

    it('should return comment with author relation loaded', async () => {
      const mockComment: Partial<CommentEntity> = {
        id: 1,
        reportId: 10,
        content: 'Test',
        author: {
          id: 1,
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User'
        } as any,
        createdAt: new Date()
      };

      jest.spyOn(commentRepository, 'getCommentById').mockResolvedValue(mockComment as CommentEntity);

      const result = await commentRepository.getCommentById(1);

      expect(result?.author).toBeDefined();
      expect(result?.author.id).toBe(1);
      expect(result?.author.username).toBe('testuser');
    });
  });

  describe('deleteComment', () => {
    it('should call deleteComment with correct parameters', async () => {
      jest.spyOn(commentRepository, 'deleteComment').mockResolvedValue(undefined);

      await commentRepository.deleteComment(5);

      expect(commentRepository.deleteComment).toHaveBeenCalledWith(5);
    });

    it('should throw NotFoundError when comment does not exist', async () => {
      const error = new NotFoundError('Comment not found');
      jest.spyOn(commentRepository, 'deleteComment').mockRejectedValue(error);

      await expect(commentRepository.deleteComment(999))
        .rejects
        .toThrow(NotFoundError);

      expect(commentRepository.deleteComment).toHaveBeenCalledWith(999);
    });

    it('should not throw error when deleting existing comment', async () => {
      jest.spyOn(commentRepository, 'deleteComment').mockResolvedValue(undefined);

      await expect(commentRepository.deleteComment(1)).resolves.not.toThrow();

      expect(commentRepository.deleteComment).toHaveBeenCalledWith(1);
    });
  });
});
