import { Repository } from "typeorm";
import { PhotoEntity } from "@models/entity/photoEntity";
import { AppDataSource } from "@database/connection";

/**
 * Repository for Photo data access.
 * Handles all database operations for the Photo entity.
 */
class PhotoRepository {

    private readonly photoRepository: Repository<PhotoEntity>;

    constructor() {
        this.photoRepository = AppDataSource.getRepository(PhotoEntity);
    }

    /**
     * Saves the relative paths of report images (es. /uploads/reports/{reportId}/{filename}) to the DB.
     * @param reportId The ID of the report.
     * @param filePaths Array of relative file paths where photos are stored.
     * @returns Array of saved photo entities.
     */
    public async savePhotosForReport(reportId: number, filePaths: string[]): Promise<PhotoEntity[]> {
        const photos: PhotoEntity[] = filePaths.map((relativePath) => {
            const photo = new PhotoEntity();
            photo.reportId = reportId;
            photo.storageUrl = relativePath;
            return photo;
        });
        return this.photoRepository.save(photos);
    }

    /**
     * Retrieves all photos associated with a specific report,
     * returning photo data in snake_case format.
     * @param reportId The ID of the report.
     * @returns Array of photo objects with storage_url and other fields.
     */
    public async getPhotosByReportId(reportId: number): Promise<Array<{ id: number, report_id: number, storage_url: string, created_at: Date }>> {
        const photos = await this.photoRepository.find({ where: { reportId } });
        return photos.map(photo => ({
            id: photo.id,
            report_id: photo.reportId,
            storage_url: photo.storageUrl,
            created_at: photo.createdAt
        }));
    }
}

export const photoRepository = new PhotoRepository();