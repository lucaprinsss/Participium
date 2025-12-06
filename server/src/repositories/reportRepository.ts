import { AppDataSource } from '../database/connection';
import { reportEntity } from '@entity/reportEntity';
import { MapReportResponse } from '../models/dto/output/MapReportResponse';
import { ClusteredReportResponse } from '../models/dto/output/ClusteredReportResponse';
import { ReportCategory } from '../models/dto/ReportCategory';
import { ReportStatus } from '../models/dto/ReportStatus';
import { Repository } from "typeorm";
import { photoRepository } from "./photoRepository";


/**
 * Report Repository
 * Handles database operations for reports with PostGIS support
 */
class ReportRepository {

    private repository : Repository<reportEntity>;

    constructor(){
        this.repository = AppDataSource.getRepository(reportEntity);
    }


    /**
     * Get approved reports for map visualization (individual reports when zoomed in)
     * Excludes reports with status "Pending Approval" or "Rejected"
     * 
     * @param filters - Optional filters for bounding box and category
     * @returns Array of approved reports with geographic coordinates and reporter information
     */
    async getApprovedReportsForMap(filters?: {
        minLat?: number;
        maxLat?: number;
        minLng?: number;
        maxLng?: number;
        category?: ReportCategory;
    }): Promise<MapReportResponse[]> {
        const queryBuilder = this.repository
            .createQueryBuilder('report')
            .leftJoinAndSelect('report.reporter', 'user')
            .select([
                'report.id',
                'report.title',
                'report.category',
                'report.status',
                'report.isAnonymous',
                'report.createdAt',
                'ST_Y(report.location::geometry) AS latitude',
                'ST_X(report.location::geometry) AS longitude',
                'user.firstName',
                'user.lastName'
            ])
            .where('report.status NOT IN (:...excludedStatuses)', {
                excludedStatuses: [ReportStatus.PENDING_APPROVAL, ReportStatus.REJECTED]
            });

        // Apply bounding box filter if provided
        if (filters?.minLat && filters?.maxLat && filters?.minLng && filters?.maxLng) {
            queryBuilder.andWhere(
                `ST_Intersects(
          report.location::geometry,
          ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat, 4326)
        )`,
                {
                    minLat: filters.minLat,
                    maxLat: filters.maxLat,
                    minLng: filters.minLng,
                    maxLng: filters.maxLng
                }
            );
        }

        // Apply category filter if provided
        if (filters?.category) {
            queryBuilder.andWhere('report.category = :category', { category: filters.category });
        }

        const rawResults = await queryBuilder.getRawMany();

        // Map raw results to MapReportResponse format
        return rawResults.map(row => ({
            id: row.report_id,
            title: row.report_title,
            category: row.report_category as ReportCategory,
            location: {
                latitude: parseFloat(row.latitude),
                longitude: parseFloat(row.longitude)
            },
            status: row.report_status as ReportStatus,
            reporterName: row.report_isAnonymous
                ? 'Anonymous'
                : `${row.user_firstName} ${row.user_lastName}`,
            isAnonymous: row.report_isAnonymous,
            createdAt: row.report_createdAt
        }));
    }

    /**
     * Get clustered reports for map visualization (when zoomed out)
     * Groups nearby reports into clusters to improve performance and visualization
     * 
     * @param zoom - Map zoom level (used to determine grid size for clustering)
     * @param filters - Optional filters for bounding box and category
     * @returns Array of clustered reports with center coordinates and report counts
     */
    async getClusteredReports(
        zoom: number,
        filters?: {
            minLat?: number;
            maxLat?: number;
            minLng?: number;
            maxLng?: number;
            category?: ReportCategory;
        }
    ): Promise<ClusteredReportResponse[]> {
        // Calculate grid size based on zoom level
        // Lower zoom = larger grid = more clustering
        // Grid size decreases exponentially with zoom level
        const gridSize = this.calculateGridSize(zoom);

        const queryBuilder = this.repository
            .createQueryBuilder('report')
            .select([
                `ST_Y(ST_Centroid(ST_Collect(report.location::geometry))) AS latitude`,
                `ST_X(ST_Centroid(ST_Collect(report.location::geometry))) AS longitude`,
                `COUNT(*) AS report_count`,
                `ARRAY_AGG(report.id) AS report_ids`,
                `ST_Y(ST_SnapToGrid(report.location::geometry, :gridSize)) AS grid_lat`,
                `ST_X(ST_SnapToGrid(report.location::geometry, :gridSize)) AS grid_lng`
            ])
            .where('report.status NOT IN (:...excludedStatuses)', {
                excludedStatuses: [ReportStatus.PENDING_APPROVAL, ReportStatus.REJECTED]
            })
            .setParameter('gridSize', gridSize);

        // Apply bounding box filter if provided
        if (filters?.minLat && filters?.maxLat && filters?.minLng && filters?.maxLng) {
            queryBuilder.andWhere(
                `ST_Intersects(
          report.location::geometry,
          ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat, 4326)
        )`,
                {
                    minLat: filters.minLat,
                    maxLat: filters.maxLat,
                    minLng: filters.minLng,
                    maxLng: filters.maxLng
                }
            );
        }

        // Apply category filter if provided
        if (filters?.category) {
            queryBuilder.andWhere('report.category = :category', { category: filters.category });
        }

        // Group by grid coordinates and order by count
        queryBuilder
            .groupBy('grid_lat, grid_lng')
            .orderBy('report_count', 'DESC');

        const rawResults = await queryBuilder.getRawMany();

        // Map raw results to ClusteredReportResponse format
        return rawResults.map((row: any) => ({
            clusterId: `cluster_${row.grid_lat}_${row.grid_lng}`,
            location: {
                latitude: parseFloat(row.latitude),
                longitude: parseFloat(row.longitude)
            },
            reportCount: parseInt(row.report_count),
            reportIds: row.report_ids
        }));
    }

    /**
     * Calculate grid size for clustering based on zoom level
     * Lower zoom levels use larger grids to create bigger clusters
     * 
     * @param zoom - Map zoom level (1-20)
     * @returns Grid size in degrees
     */
    private calculateGridSize(zoom: number): number {
        // Zoom levels and corresponding grid sizes (in degrees)
        // zoom 1-5: ~1 degree (~111km at equator)
        // zoom 6-8: ~0.1 degree (~11km)
        // zoom 9-10: ~0.05 degree (~5.5km)
        // zoom 11-12: ~0.01 degree (~1.1km)

        if (zoom <= 5) return 1.0;
        if (zoom <= 8) return 0.1;
        if (zoom <= 10) return 0.05;
        return 0.01;
    }

  /**
   * Creates a new report and saves associated photos.
   * @param reportData The data for the new report.
   * @param filePaths Array of file paths where photos are stored.
   * @returns The created report entity with photos saved.
   */
  public async createReport(
        reportData: Omit<reportEntity, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'reporter' | 'assignee' | 'assigneeId' | 'photos'>,
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
      relations: ['reporter', 'assignee', 'assignee.departmentRole', 'assignee.departmentRole.role', 'photos']
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
      .leftJoinAndSelect('report.photos', 'photos')
      .where('report.assigneeId = :assigneeId', { assigneeId });

    if (status) {
      queryBuilder.andWhere('report.status = :status', { status });
    }

    return queryBuilder
      .orderBy('report.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Find reports assigned to a specific external maintainer
   * @param externalAssigneeId - ID of the external maintainer to whom reports are assigned
   * @param status - Optional status filter
   * @returns Array of report entities
   */
  public async findByExternalAssigneeId(externalMaintainerId: number, status?: ReportStatus): Promise<reportEntity[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.reporter', 'reporter')
      .leftJoinAndSelect('report.externalAssignee', 'externalAssignee') // Join externalAssignee
      .leftJoinAndSelect('externalAssignee.departmentRole', 'departmentRole') // Join departmentRole
      .leftJoinAndSelect('departmentRole.role', 'role') // Join role
      .leftJoinAndSelect('report.photos', 'photos')
      .where('report.externalAssigneeId = :externalMaintainerId', { externalMaintainerId }) // Filter by externalAssigneeId
      .andWhere('role.name = :roleName', { roleName: 'External Maintainer' }); // Filter by role name

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
   * @returns The saved report entity with all relations loaded
   */
  public async save(report: reportEntity): Promise<reportEntity> {
    const savedReport = await this.repository.save(report);
    // Reload with all relations to ensure complete data
    const reloadedReport = await this.findReportById(savedReport.id);
    if (!reloadedReport) {
      throw new Error(`Failed to reload report with id ${savedReport.id}`);
    }
    return reloadedReport;
  }
}

export const reportRepository = new ReportRepository();
