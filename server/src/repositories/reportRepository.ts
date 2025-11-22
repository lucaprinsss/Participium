import { AppDataSource } from '../database/connection';
import { reportEntity } from '../models/entity/reportEntity';
import { ReportStatus } from '@models/dto/ReportStatus';

/**
 * Report Repository
 * Handles database operations for reports
 */
class ReportRepository {
  private repository = AppDataSource.getRepository(reportEntity);

  /**
   * Find reports assigned to a specific user
   * @param assigneeId - ID of the user to whom reports are assigned
   * @param status - Optional status filter
   * @returns Array of report entities
   */
  async findByAssigneeId(assigneeId: number, status?: ReportStatus): Promise<reportEntity[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.reporter', 'reporter')
      .leftJoinAndSelect('report.assignee', 'assignee')
      .where('report.assigneeId = :assigneeId', { assigneeId });

    if (status) {
      queryBuilder.andWhere('report.status = :status', { status });
    }

    return queryBuilder
      .orderBy('report.createdAt', 'DESC')
      .getMany();
  }
}

export const reportRepository = new ReportRepository();
