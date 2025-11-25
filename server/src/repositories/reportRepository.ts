import { reportEntity } from "@entity/reportEntity";
import { Repository } from "typeorm";
import { AppDataSource } from "@database/connection";
import { ReportStatus } from "@dto/ReportStatus";
import { ReportCategory } from "@models/dto/ReportCategory";
import { photoRepository } from "./photoRepository";

/**
 * Repository for Report data access.
 * Handles all database operations for the Report entity.
 */
class ReportRepository {

  private repository: Repository<reportEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(reportEntity);
  }

  /**
   * Creates a new report and saves associated photos.
   * @param reportData The data for the new report.
   * @param filePaths Array of file paths where photos are stored.
   * @returns The created report entity with photos saved.
   */
  public async createReport(
        reportData: Omit<reportEntity, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'reporter' | 'assignee' | 'assigneeId'>,
        filePaths: string[]
    ): Promise<reportEntity> {
    
    // Extract location separately since it needs special handling for PostGIS
    const { location, ...otherData } = reportData;
    
    // Create the report using a raw query to properly handle the geography type
    const result = await this.repository.query(
      `INSERT INTO reports 
        (reporter_id, title, description, category, location, is_anonymous, status) 
       VALUES ($1, $2, $3, $4, ST_GeogFromText($5), $6, $7) 
       RETURNING id`,
      [
        otherData.reporterId,
        otherData.title,
        otherData.description,
        otherData.category,
        location, // This is already in WKT format: 'POINT(longitude latitude)'
        otherData.isAnonymous,
        ReportStatus.PENDING_APPROVAL
      ]
    );

    const reportId = result[0].id;

    await photoRepository.savePhotosForReport(reportId, filePaths);
    
    return this.repository.findOne({
        where: { id: reportId },
    }) as Promise<reportEntity>;
  }

  /**
   * Finds a report by its ID with all relations.
   * @param id The ID of the report.
   * @returns The report entity or null if not found.
   */
  public async findReportById(id: number): Promise<reportEntity | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['reporter', 'assignee', 'photos']
    });
  }

  /**
   * Find all reports with optional filters
   * @param status - Optional report status filter
   * @param category - Optional report category filter
   * @returns Array of report entities
   */
  public async findAllReports(
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

  /**
   * Find reports assigned to a specific user
   * @param assigneeId - ID of the user to whom reports are assigned
   * @param status - Optional status filter
   * @returns Array of report entities
   */
  public async findByAssigneeId(assigneeId: number, status?: ReportStatus): Promise<reportEntity[]> {
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

  /**
   * Save a report entity (create or update)
   * @param report - The report entity to save
   * @returns The saved report entity
   */
  public async save(report: reportEntity): Promise<reportEntity> {
    return await this.repository.save(report);
  }
}

export const reportRepository = new ReportRepository();
