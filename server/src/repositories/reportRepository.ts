import { reportEntity } from "@entity/reportEntity";
import { Repository } from "typeorm";
import { AppDataSource } from "@database/connection";
import { ReportStatus } from "@dto/ReportStatus";
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
        reportData: Omit<reportEntity, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
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
   * Finds a report by its ID.
   * @param id The ID of the report.
   * @returns The report entity or null if not found.
   */
  public async findReportById(id: number): Promise<reportEntity | null> {
    return this.repository.findOneBy({ id });
  }
}

export const reportRepository = new ReportRepository();