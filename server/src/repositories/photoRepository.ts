import { Repository } from "typeorm";
import { photoEntity } from "@models/entity/photoEntity";
import { AppDataSource } from "@database/connection";

/**
 * Repository for Photo data access.
 * Handles all database operations for the Photo entity.
 */
class PhotoRepository {

    private photoRepository: Repository<photoEntity>;

    constructor() {
        this.photoRepository = AppDataSource.getRepository(photoEntity);
    }

    /**
     * Saves multiple photos associated with a report.
     * @param reportId The ID of the report.
     * @param filePaths Array of file paths where photos are stored.
     * @returns Array of saved photo entities.
     */
    public async savePhotosForReport(reportId: number, filePaths: string[]): Promise<photoEntity[]> {
        const photos: photoEntity[] = filePaths.map((pathStorage) => {
            const photo = new photoEntity();
            photo.reportId = reportId;
            photo.storageUrl = pathStorage;
            return photo;
        });
        return this.photoRepository.save(photos);
    }

    /**
     * Retrieves all photos associated with a specific report.
     * @param reportId The ID of the report.
     * @returns Array of photo entities.
     */
    public async getPhotosByReportId(reportId: number): Promise<photoEntity[]> {
        return this.photoRepository.find({ where: { reportId } });
    }
}

export const photoRepository = new PhotoRepository();