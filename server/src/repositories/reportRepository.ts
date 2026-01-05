import { AppDataSource } from '../database/connection';
import { ReportEntity } from '@entity/reportEntity';
import { MapReportResponse } from '../models/dto/output/MapReportResponse';
import { ClusteredReportResponse } from '../models/dto/output/ClusteredReportResponse';
import { ReportCategory } from '../models/dto/ReportCategory';
import { ReportStatus } from '../models/dto/ReportStatus';
import { Repository } from "typeorm";
import { photoRepository } from "./photoRepository";

import { ILike } from "typeorm"; // Important: add ILike to imports

/**
 * Report Repository
 * Handles database operations for reports with PostGIS support
 */
class ReportRepository {

    private readonly repository: Repository<ReportEntity>;

    constructor() {
        this.repository = AppDataSource.getRepository(ReportEntity);
    }

    /**
     * Get approved reports for map visualization (individual reports when zoomed in)
     * Excludes reports with status "Pending Approval" or "Rejected"
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
                'report.address',
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
                latitude: Number.parseFloat(row.latitude),
                longitude: Number.parseFloat(row.longitude)
            },
            address: row.report_address,
            status: row.report_status as ReportStatus,
            reporterName: row.report_isAnonymous
                ? 'Anonymous'
                : `${row.user_firstName} ${row.user_lastName}`,
            isAnonymous: row.report_isAnonymous,
            createdAt: row.report_createdAt
        }));
    }

    /**
     * Get clustered reports for map visualization
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

        if (filters?.category) {
            queryBuilder.andWhere('report.category = :category', { category: filters.category });
        }

        queryBuilder
            .groupBy('grid_lat, grid_lng')
            .orderBy('report_count', 'DESC');

        const rawResults = await queryBuilder.getRawMany();

        return rawResults.map((row: any) => ({
            clusterId: `cluster_${row.grid_lat}_${row.grid_lng}`,
            location: {
                latitude: Number.parseFloat(row.latitude),
                longitude: Number.parseFloat(row.longitude)
            },
            reportCount: Number.parseInt(row.report_count),
            reportIds: row.report_ids
        }));
    }

    private calculateGridSize(zoom: number): number {
        if (zoom <= 5) return 1;
        if (zoom <= 8) return 0.1;
        if (zoom <= 10) return 0.05;
        return 0.01;
    }

    /**
     * Creates a new report and saves associated photos.
     */
    public async createReport(
        reportData: Omit<ReportEntity, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'reporter' | 'assignee' | 'assigneeId' | 'photos' | 'externalAssignee' | 'externalAssigneeId'>,
        filePaths: string[]
    ): Promise<ReportEntity> {

        const { location, ...otherData } = reportData;

        // Create the report using a raw query to properly handle the geography type
        const result = await this.repository.query(
            `INSERT INTO reports 
        (reporter_id, title, description, category, location, address, is_anonymous, status) 
       VALUES ($1, $2, $3, $4, ST_GeogFromText($5), $6, $7, $8) 
       RETURNING id`,
            [
                otherData.reporterId,
                otherData.title,
                otherData.description,
                otherData.category,
                location,
                otherData.address || null,
                otherData.isAnonymous,
                ReportStatus.PENDING_APPROVAL
            ]
        );

        const reportId = result[0].id;

        await photoRepository.savePhotosForReport(reportId, filePaths);

        // Uses findReportById to return the full entity with relations
        const createdReport = await this.findReportById(reportId);
        
        if (!createdReport) {
            throw new Error('Error creating report: unable to retrieve created entity');
        }

        return createdReport;
    }

    /**
     * Finds a report by its ID with ALL relations.
     * Updated to include externalAssignee.
     */
    public async findReportById(id: number): Promise<ReportEntity | null> {
        return await this.repository.findOne({
            where: { id },
            relations: [
                'reporter', 
                'assignee', 
                'externalAssignee', // AGGIUNTO: Cruciale
                'photos'
            ]
        });
    }

    /**
     * Find all reports with optional filters
     */
    public async findAllReports(
        status?: ReportStatus,
        category?: ReportCategory
    ): Promise<ReportEntity[]> {
        const query = this.repository
            .createQueryBuilder('report')
            .leftJoinAndSelect('report.reporter', 'reporter')
            .leftJoinAndSelect('report.assignee', 'assignee')
            .leftJoinAndSelect('report.externalAssignee', 'externalAssignee') // AGGIUNTO
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
     * Find reports assigned to a specific internal staff member
     * Updated to include externalAssignee relation for completeness
     */
    public async findByAssigneeId(assigneeId: number, status?: ReportStatus, category?: ReportCategory): Promise<ReportEntity[]> {
        const queryBuilder = this.repository
            .createQueryBuilder('report')
            .leftJoinAndSelect('report.reporter', 'reporter')
            .leftJoinAndSelect('report.assignee', 'assignee') // Crucial for internal staff
            .leftJoinAndSelect('report.externalAssignee', 'externalAssignee') // ADDED: To avoid null if present
            .leftJoinAndSelect('report.photos', 'photos')
            .where('report.assigneeId = :assigneeId', { assigneeId });

        if (status) {
            queryBuilder.andWhere('report.status = :status', { status });
        }

        if (category) {
            queryBuilder.andWhere('report.category = :category', { category });
        }

        return queryBuilder
            .orderBy('report.createdAt', 'DESC')
            .getMany();
    }

    /**
     * Find reports assigned to a specific external maintainer
     * Updated to include assignee relation for completeness
     */
    public async findByExternalAssigneeId(externalMaintainerId: number, status?: ReportStatus, category?: ReportCategory): Promise<ReportEntity[]> {
        const queryBuilder = this.repository
            .createQueryBuilder('report')
            .leftJoinAndSelect('report.reporter', 'reporter')
            .leftJoinAndSelect('report.assignee', 'assignee') // ADDED: For completeness
            .leftJoinAndSelect('report.externalAssignee', 'externalAssignee') // Crucial for external maintainers
            .leftJoinAndSelect('report.photos', 'photos')
            .where('report.externalAssigneeId = :externalMaintainerId', { externalMaintainerId });
            
        // Note: I removed the strict role filter here. If we're filtering by ID,
        // we assume the ID is correct. Role checking should be done in Service or Middleware.

        if (status) {
            queryBuilder.andWhere('report.status = :status', { status });
        }

        if (category) {
            queryBuilder.andWhere('report.category = :category', { category });
        }

        return queryBuilder
            .orderBy('report.createdAt', 'DESC')
            .getMany();
    }

    /**
     * Save a report entity (create or update)
     */
    public async save(report: ReportEntity): Promise<ReportEntity> {
        const savedReport = await this.repository.save(report);
        // Reload with all relations to ensure complete data
        const reloadedReport = await this.findReportById(savedReport.id);
        if (!reloadedReport) {
            throw new Error(`Failed to reload report with id ${savedReport.id}`);
        }
        return reloadedReport;
    }

    /**
     * Retrieve reports located near a specific address
     * @param address 
     * @returns 
     */
    public async findReportsByAddress(address: string): Promise<ReportEntity[]> {
        return await this.repository.find({
            where: { 
                address: ILike(`%${address}%`) // Cerca qualsiasi indirizzo che CONTIENE la stringa
            },
            relations: [
                'reporter', 
                'assignee', 
                'externalAssignee',
                'photos'
            ],
            order: {
                createdAt: 'DESC'
            }
        });
    }

    /**
     * Find reports created by a specific user
     */
    public async findByReporterId(reporterId: number, status?: ReportStatus, category?: ReportCategory): Promise<ReportEntity[]> {
        const queryBuilder = this.repository
            .createQueryBuilder('report')
            .leftJoinAndSelect('report.reporter', 'reporter')
            .leftJoinAndSelect('report.assignee', 'assignee')
            .leftJoinAndSelect('report.externalAssignee', 'externalAssignee')
            .leftJoinAndSelect('report.photos', 'photos')
            .where('report.reporterId = :reporterId', { reporterId });

        if (status) {
            queryBuilder.andWhere('report.status = :status', { status });
        }

        if (category) {
            queryBuilder.andWhere('report.category = :category', { category });
        }

        return queryBuilder
            .orderBy('report.createdAt', 'DESC')
            .getMany();
    }
}

export const reportRepository = new ReportRepository();