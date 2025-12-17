import { commentRepository } from '@repositories/commentRepository';
import { AppDataSource } from '@database/connection';
import { CommentEntity } from '@entity/commentEntity';
import { Repository } from 'typeorm';

// Mock the AppDataSource and its getRepository method
jest.mock('@database/connection', () => {
  const mockCommentRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  };
  return {
    AppDataSource: {
      getRepository: jest.fn(() => mockCommentRepo),
    },
  };
});

describe('CommentRepository', () => {
  let mockCommentRepository: jest.Mocked<Repository<CommentEntity>>;

  beforeAll(() => {
    mockCommentRepository = AppDataSource.getRepository(CommentEntity) as unknown as jest.Mocked<Repository<CommentEntity>>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createComment', () => {
    const reportId = 1;
    const authorId = 2;
    const content = 'Test comment content';
    const savedCommentId = 10;

    it('should create and return a complete comment', async () => {
      const createdComment = { reportId, authorId, content, id: undefined } as unknown as CommentEntity;
      const savedComment = { ...createdComment, id: savedCommentId } as unknown as CommentEntity;
      const completeComment = {
        ...savedComment,
        author: { id: authorId, username: 'testuser' },
        report: { id: reportId },
      } as CommentEntity;

      mockCommentRepository.create.mockReturnValue(createdComment);
      mockCommentRepository.save.mockResolvedValue(savedComment);
      mockCommentRepository.findOne.mockResolvedValue(completeComment);

      const result = await commentRepository.createComment(reportId, authorId, content);

      expect(mockCommentRepository.create).toHaveBeenCalledWith({ reportId, authorId, content });
      expect(mockCommentRepository.save).toHaveBeenCalledWith(createdComment);
      expect(mockCommentRepository.findOne).toHaveBeenCalledWith({
        where: { id: savedCommentId },
        relations: ['author', 'author.departmentRole', 'author.departmentRole.role'],
      });
      expect(result).toEqual(completeComment);
    });

    it('should throw an error if the created comment cannot be retrieved', async () => {
      const createdComment = { reportId, authorId, content, id: undefined } as unknown as CommentEntity;
      const savedComment = { ...createdComment, id: savedCommentId } as CommentEntity;

      mockCommentRepository.create.mockReturnValue(createdComment);
      mockCommentRepository.save.mockResolvedValue(savedComment);
      mockCommentRepository.findOne.mockResolvedValue(null);

      await expect(commentRepository.createComment(reportId, authorId, content)).rejects.toThrow(
        'Failed to retrieve created comment'
      );

      expect(mockCommentRepository.create).toHaveBeenCalledWith({ reportId, authorId, content });
      expect(mockCommentRepository.save).toHaveBeenCalledWith(createdComment);
      expect(mockCommentRepository.findOne).toHaveBeenCalledWith({
        where: { id: savedCommentId },
        relations: ['author', 'author.departmentRole', 'author.departmentRole.role'],
      });
    });
  });

  describe('getCommentsByReportId', () => {
    const reportId = 1;

    it('should return comments for a given report', async () => {
      const comments = [
        { id: 1, reportId, content: 'Comment 1' },
        { id: 2, reportId, content: 'Comment 2' },
      ] as CommentEntity[];

      mockCommentRepository.find.mockResolvedValue(comments);

      const result = await commentRepository.getCommentsByReportId(reportId);

      expect(mockCommentRepository.find).toHaveBeenCalledWith({
        where: { reportId },
        relations: ['author', 'author.departmentRole', 'author.departmentRole.role'],
        order: { createdAt: 'ASC' },
      });
      expect(result).toEqual(comments);
    });

    it('should return empty array if no comments found', async () => {
      mockCommentRepository.find.mockResolvedValue([]);

      const result = await commentRepository.getCommentsByReportId(reportId);

      expect(mockCommentRepository.find).toHaveBeenCalledWith({
        where: { reportId },
        relations: ['author', 'author.departmentRole', 'author.departmentRole.role'],
        order: { createdAt: 'ASC' },
      });
      expect(result).toEqual([]);
    });
  });

  describe('deleteComment', () => {
    const commentId = 1;

    it('should delete a comment successfully', async () => {
      mockCommentRepository.delete.mockResolvedValue({ affected: 1, raw: [] });

      await commentRepository.deleteComment(commentId);

      expect(mockCommentRepository.delete).toHaveBeenCalledWith(commentId);
    });
  });
});
