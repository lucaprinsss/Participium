import { AppDataSource } from "@database/connection";
import { reportEntity } from "@models/entity/reportEntity";
import { ReportStatus } from "@models/dto/ReportStatus";
import { ReportCategory } from "@models/dto/ReportCategory";

class ReportRepository {
  private repository = AppDataSource.getRepository(reportEntity);


  async findReportById(id: number): Promise<reportEntity | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['reporter', 'assignee', 'photos']
    });
  }

 
  async findAllReports(
    status?: ReportStatus,
    category?: ReportCategory
  ): Promise<reportEntity[]> {
    const query = this.repository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.reporter', 'reporter')
      .leftJoinAndSelect('report.assignee', 'assignee')
      .leftJoinAndSelect('report.photos', 'photos')
      .orderBy('report.createdAt', 'DESC');

    if (status) {
      query.andWhere('report.status = :status', { status });
    }

    if (category) {
      query.andWhere('report.category = :category', { category });
    }

    return await query.getMany();
  }


  async findPendingReports(): Promise<reportEntity[]> {
    return await this.findAllReports(ReportStatus.PENDING_APPROVAL);
  }

}

export const reportRepository = new ReportRepository();