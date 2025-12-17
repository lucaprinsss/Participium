import { reportRepository } from '@repositories/reportRepository';
import { AppDataSource } from '@database/connection';
import { ReportEntity } from '@entity/reportEntity';
import { Repository } from 'typeorm';
import { photoRepository } from '@repositories/photoRepository';
import { ReportStatus } from '@dto/ReportStatus';
import { ReportCategory } from '@models/dto/ReportCategory';

// Mock the AppDataSource and its getRepository method
jest.mock('@database/connection', () => {
  const mockRepo = {
    createQueryBuilder: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
    getMany: jest.fn(),
    query: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(), // Needed for internal calls if not using findReportById mock
  };
  return {
    AppDataSource: {
      getRepository: jest.fn(() => mockRepo),
    },
  };
});

// Mock photoRepository
jest.mock('@repositories/photoRepository', () => ({
  photoRepository: {
    savePhotosForReport: jest.fn(),
  },
}));

describe('ReportRepository', () => {
  let mockReportRepository: jest.Mocked<Repository<ReportEntity>>;
  let mockPhotoRepository: jest.Mocked<typeof photoRepository>;

  beforeAll(() => {
    mockReportRepository = AppDataSource.getRepository(ReportEntity) as unknown as jest.Mocked<Repository<ReportEntity>>;
    mockPhotoRepository = photoRepository as jest.Mocked<typeof photoRepository>;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createReport', () => {
    const reportData = {
      reporterId: 1,
      title: 'Test Report',
      description: 'Description for test report',
      category: ReportCategory.OTHER,
      location: 'POINT(7.0 45.0)',
      address: 'Test Address',
      isAnonymous: false,
    };
    const filePaths = ['path/to/photo1.jpg'];
    const createdReportId = 1;

    it('should create a report and save photos successfully', async () => {
      mockReportRepository.query.mockResolvedValue([{ id: createdReportId }]);
      mockReportRepository.findOne.mockResolvedValue({ id: createdReportId, ...reportData, status: ReportStatus.PENDING_APPROVAL } as ReportEntity);
      mockPhotoRepository.savePhotosForReport.mockResolvedValue([]);

      const result = await reportRepository.createReport(reportData as any, filePaths);

      expect(mockReportRepository.query).toHaveBeenCalledTimes(1);
      expect(mockPhotoRepository.savePhotosForReport).toHaveBeenCalledWith(createdReportId, filePaths);
      expect(mockReportRepository.findOne).toHaveBeenCalledWith({
        where: { id: createdReportId },
        relations: [
          'reporter', 
          'assignee', 
          'externalAssignee',
          'photos'
        ]
      });
      expect(result).toHaveProperty('id', createdReportId);
    });

    // Test for line 204: throw new Error('Error creating report: unable to retrieve created entity');
    it('should throw an error if the created report cannot be retrieved (line 204)', async () => {
      mockReportRepository.query.mockResolvedValue([{ id: createdReportId }]);
      mockReportRepository.findOne.mockResolvedValue(null); // Simulate failure to retrieve
      mockPhotoRepository.savePhotosForReport.mockResolvedValue([]);

      await expect(reportRepository.createReport(reportData as any, filePaths)).rejects.toThrow(
        'Error creating report: unable to retrieve created entity'
      );

      expect(mockReportRepository.query).toHaveBeenCalledTimes(1);
      expect(mockPhotoRepository.savePhotosForReport).toHaveBeenCalledWith(createdReportId, filePaths);
      expect(mockReportRepository.findOne).toHaveBeenCalledWith({
        where: { id: createdReportId },
        relations: [
          'reporter', 
          'assignee', 
          'externalAssignee',
          'photos'
        ]
      });
    });
  });

  describe('save', () => {
    const reportToSave = { id: 1, title: 'Existing Report' } as ReportEntity;
    const savedReport = { ...reportToSave, title: 'Updated Report' } as ReportEntity;

    it('should save and reload the report successfully', async () => {
      mockReportRepository.save.mockResolvedValue(savedReport);
      mockReportRepository.findOne.mockResolvedValue(savedReport);

      const result = await reportRepository.save(reportToSave);

      expect(mockReportRepository.save).toHaveBeenCalledWith(reportToSave);
      expect(mockReportRepository.findOne).toHaveBeenCalledWith({
        where: { id: savedReport.id },
        relations: [
          'reporter', 
          'assignee', 
          'externalAssignee',
          'photos'
        ]
      });
      expect(result).toEqual(savedReport);
    });

    // Test for line 270: throw new Error(`Failed to reload report with id ${savedReport.id}`);
    it('should throw an error if the saved report cannot be reloaded (line 270)', async () => {
      mockReportRepository.save.mockResolvedValue(savedReport);
      mockReportRepository.findOne.mockResolvedValue(null); // Simulate failure to reload

      await expect(reportRepository.save(reportToSave)).rejects.toThrow(
        `Failed to reload report with id ${savedReport.id}`
      );

      expect(mockReportRepository.save).toHaveBeenCalledWith(reportToSave);
      expect(mockReportRepository.findOne).toHaveBeenCalledWith({
        where: { id: savedReport.id },
        relations: [
          'reporter', 
          'assignee', 
          'externalAssignee',
          'photos'
        ]
      });
    });
  });
});