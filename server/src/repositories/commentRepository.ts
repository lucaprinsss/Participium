import { AppDataSource } from '../database/connection';
import { CommentEntity } from '@entity/commentEntity';
import { Repository } from 'typeorm';
import { NotFoundError } from '@models/errors/NotFoundError';

/**
 * Comment Repository
 * Handles database operations for comments
 */
class CommentRepository {
  private readonly repository: Repository<CommentEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(CommentEntity);
  }

  /**
   * Get all comments for a specific report
   * @param reportId - The ID of the report
   * @returns Array of comments with author information
   */
  async getCommentsByReportId(reportId: number): Promise<CommentEntity[]> {
    return this.repository.find({
      where: { reportId },
      relations: ['author', 'author.departmentRole', 'author.departmentRole.role'],
      order: { createdAt: 'ASC' }
    });
  }

  /**
   * Create a new comment for a report
   * @param reportId - The ID of the report
   * @param authorId - The ID of the comment author
   * @param content - The comment text content
   * @returns The created comment with author information
   */
  async createComment(reportId: number, authorId: number, content: string): Promise<CommentEntity> {
    const comment = this.repository.create({
      reportId,
      authorId,
      content
    });

    const savedComment = await this.repository.save(comment);

    // Fetch the complete comment with relations
    const completeComment = await this.repository.findOne({
      where: { id: savedComment.id },
      relations: ['author', 'author.departmentRole', 'author.departmentRole.role']
    });

    if (!completeComment) {
      throw new Error('Failed to retrieve created comment');
    }

    return completeComment;
  }

  /**
   * Get a comment by ID with author information
   * @param commentId - The ID of the comment
   * @returns The comment or null if not found
   */
  async getCommentById(commentId: number): Promise<CommentEntity | null> {
    return this.repository.findOne({
      where: { id: commentId },
      relations: ['author', 'author.departmentRole', 'author.departmentRole.role']
    });
  }

  /**
   * Delete a comment
   * @param commentId - The ID of the comment to delete
   */
  async deleteComment(commentId: number): Promise<void> {
    const result = await this.repository.delete(commentId);

    if (result.affected === 0) {
      throw new NotFoundError('Comment not found');
    }
  }
}

export const commentRepository = new CommentRepository();
