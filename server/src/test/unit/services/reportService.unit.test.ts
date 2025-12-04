import { userRepository } from '@repositories/userRepository';
import { reportService } from '../../../services/reportService';
import { BadRequestError } from '../../../models/errors/BadRequestError';
import { ReportCategory } from '../../../models/dto/ReportCategory';
import { reportEntity } from '@models/entity/reportEntity';
import { userEntity } from '@models/entity/userEntity';
import { ReportStatus } from '@models/dto/ReportStatus';
import { UnauthorizedError } from '@models/errors/UnauthorizedError';
import { InsufficientRightsError } from '@models/errors/InsufficientRightsError';
import { reportRepository } from '@repositories/reportRepository';
import { categoryRoleRepository } from '@repositories/categoryRoleRepository';
import { NotFoundError } from '@models/errors/NotFoundError';
import { photoRepository } from '@repositories/photoRepository';
import { storageService } from '@services/storageService';
import * as photoValidationUtils from '@utils/photoValidationUtils';
import * as mapperService from '@services/mapperService';
import { mapReportEntityToReportResponse } from '../../../services/mapperService';
import { createMockUser } from '@test/utils/mockEntities';

jest.mock('@repositories/userRepository');
jest.mock('@repositories/reportRepository');
jest.mock('@repositories/photoRepository');
jest.mock('@services/storageService');
jest.mock('@services/mapperService');
jest.mock('@repositories/userRepository');
jest.mock('@repositories/reportRepository');
jest.mock('@repositories/categoryRoleRepository');
jest.mock('@repositories/photoRepository');
jest.mock('@services/storageService');
jest.mock('@utils/photoValidationUtils');
jest.mock('@services/mapperService');


// Helper function to create mock report entities
const createMockReport = (overrides?: Partial<reportEntity>): reportEntity => {
  const mockReport: reportEntity = {
    id: 1,
    reporterId: 100,
    title: 'Test Report',
    description: 'Test Description',
    category: ReportCategory.ROADS,
    location: 'POINT(7.6869005 45.0703393)',
    status: ReportStatus.ASSIGNED,
    isAnonymous: false,
    assigneeId: 50,
    rejectionReason: '',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    reporter: {} as userEntity,
    assignee: {} as userEntity,
    photos: [],
    ...overrides,
  };
  return mockReport;
};

describe('ReportService', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllCategories', () => {
    it('should return all report categories', async () => {
      const categories = await reportService.getAllCategories();

      expect(categories).toBeDefined();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
      expect(categories).toContain(ReportCategory.ROADS);
      expect(categories).toContain(ReportCategory.PUBLIC_LIGHTING);
    });
  });

  describe('validateLocation', () => {
    describe('missing location', () => {
      it('should throw BadRequestError when location is undefined', () => {
        expect(() => {
          reportService.validateLocation(undefined as any);
        }).toThrow(BadRequestError);

        expect(() => {
          reportService.validateLocation(undefined as any);
        }).toThrow('Location is required');
      });

      it('should throw BadRequestError when location is null', () => {
        expect(() => {
          reportService.validateLocation(null as any);
        }).toThrow(BadRequestError);

        expect(() => {
          reportService.validateLocation(null as any);
        }).toThrow('Location is required');
      });
    });

    describe('incomplete location', () => {
      it('should throw BadRequestError when latitude is missing', () => {
        expect(() => {
          reportService.validateLocation({ longitude: 7.6869005 } as any);
        }).toThrow(BadRequestError);

        expect(() => {
          reportService.validateLocation({ longitude: 7.6869005 } as any);
        }).toThrow('Location must include both latitude and longitude');
      });

      it('should throw BadRequestError when longitude is missing', () => {
        expect(() => {
          reportService.validateLocation({ latitude: 45.0703393 } as any);
        }).toThrow(BadRequestError);

        expect(() => {
          reportService.validateLocation({ latitude: 45.0703393 } as any);
        }).toThrow('Location must include both latitude and longitude');
      });

      it('should throw BadRequestError when both coordinates are missing', () => {
        expect(() => {
          reportService.validateLocation({} as any);
        }).toThrow(BadRequestError);

        expect(() => {
          reportService.validateLocation({} as any);
        }).toThrow('Location must include both latitude and longitude');
      });
    });

    describe('invalid coordinates', () => {
      it('should throw BadRequestError when latitude > 90', () => {
        expect(() => {
          reportService.validateLocation({ latitude: 91, longitude: 7.6869005 });
        }).toThrow(BadRequestError);

        expect(() => {
          reportService.validateLocation({ latitude: 91, longitude: 7.6869005 });
        }).toThrow('Invalid coordinates');
      });

      it('should throw BadRequestError when latitude < -90', () => {
        expect(() => {
          reportService.validateLocation({ latitude: -91, longitude: 7.6869005 });
        }).toThrow(BadRequestError);

        expect(() => {
          reportService.validateLocation({ latitude: -91, longitude: 7.6869005 });
        }).toThrow('Invalid coordinates');
      });

      it('should throw BadRequestError when longitude > 180', () => {
        expect(() => {
          reportService.validateLocation({ latitude: 45.0703393, longitude: 181 });
        }).toThrow(BadRequestError);

        expect(() => {
          reportService.validateLocation({ latitude: 45.0703393, longitude: 181 });
        }).toThrow('Invalid coordinates');
      });

      it('should throw BadRequestError when longitude < -180', () => {
        expect(() => {
          reportService.validateLocation({ latitude: 45.0703393, longitude: -181 });
        }).toThrow(BadRequestError);

        expect(() => {
          reportService.validateLocation({ latitude: 45.0703393, longitude: -181 });
        }).toThrow('Invalid coordinates');
      });

      it('should throw BadRequestError when coordinates are NaN', () => {
        expect(() => {
          reportService.validateLocation({ latitude: NaN, longitude: 7.6869005 });
        }).toThrow(BadRequestError);

        expect(() => {
          reportService.validateLocation({ latitude: 45.0703393, longitude: NaN });
        }).toThrow(BadRequestError);
      });
    });

    describe('outside Turin boundaries', () => {
      it('should throw BadRequestError for Milan coordinates', () => {
        expect(() => {
          reportService.validateLocation({ latitude: 45.464, longitude: 9.19 });
        }).toThrow(BadRequestError);

        expect(() => {
          reportService.validateLocation({ latitude: 45.464, longitude: 9.19 });
        }).toThrow('outside Turin city boundaries');
      });

      it('should throw BadRequestError for Rome coordinates', () => {
        expect(() => {
          reportService.validateLocation({ latitude: 41.9028, longitude: 12.4964 });
        }).toThrow(BadRequestError);

        expect(() => {
          reportService.validateLocation({ latitude: 41.9028, longitude: 12.4964 });
        }).toThrow('outside Turin city boundaries');
      });

      it('should throw BadRequestError for coordinates just outside Turin (Moncalieri)', () => {
        expect(() => {
          reportService.validateLocation({ latitude: 45.0016, longitude: 7.6814 });
        }).toThrow(BadRequestError);

        expect(() => {
          reportService.validateLocation({ latitude: 45.0016, longitude: 7.6814 });
        }).toThrow('outside Turin city boundaries');
      });
    });

    describe('valid locations within Turin', () => {
      it('should not throw error for Turin city center (Piazza Castello)', () => {
        expect(() => {
          reportService.validateLocation({ latitude: 45.0703393, longitude: 7.6869005 });
        }).not.toThrow();
      });

      it('should not throw error for Mole Antonelliana', () => {
        expect(() => {
          reportService.validateLocation({ latitude: 45.0692403, longitude: 7.6932941 });
        }).not.toThrow();
      });

      it('should not throw error for Porta Nuova station', () => {
        expect(() => {
          reportService.validateLocation({ latitude: 45.0625748, longitude: 7.6782069 });
        }).not.toThrow();
      });
    });
  });

  describe('getMyAssignedReports', () => {
    describe('without status filter', () => {
      it('should return all reports assigned to the user', async () => {
        // Arrange
        const userId = 50;
        const mockReports: reportEntity[] = [
          createMockReport({ id: 1, assigneeId: userId, status: ReportStatus.ASSIGNED }),
          createMockReport({ id: 2, assigneeId: userId, status: ReportStatus.IN_PROGRESS }),
          createMockReport({ id: 3, assigneeId: userId, status: ReportStatus.RESOLVED }),
        ];

        const mockMappedReports = mockReports.map(r => ({
          id: r.id,
          title: r.title,
          status: r.status,
        }));

        jest.spyOn(reportRepository, 'findByAssigneeId').mockResolvedValue(mockReports);
        (mapReportEntityToReportResponse as jest.Mock).mockImplementation((report) =>
          mockMappedReports.find(m => m.id === report.id)
        );

        // Act
        const result = await reportService.getMyAssignedReports(userId);

        // Assert
        expect(reportRepository.findByAssigneeId).toHaveBeenCalledWith(userId, undefined);
        expect(reportRepository.findByAssigneeId).toHaveBeenCalledTimes(1);
        expect(result).toHaveLength(3);
        expect(mapReportEntityToReportResponse).toHaveBeenCalledTimes(3);
      });

      it('should return empty array when user has no assigned reports', async () => {
        // Arrange
        const userId = 50;
        jest.spyOn(reportRepository, 'findByAssigneeId').mockResolvedValue([]);

        // Act
        const result = await reportService.getMyAssignedReports(userId);

        // Assert
        expect(reportRepository.findByAssigneeId).toHaveBeenCalledWith(userId, undefined);
        expect(result).toHaveLength(0);
        expect(mapReportEntityToReportResponse).not.toHaveBeenCalled();
      });

      it('should call repository with correct userId parameter', async () => {
        // Arrange
        const userId = 123;
        jest.spyOn(reportRepository, 'findByAssigneeId').mockResolvedValue([]);

        // Act
        await reportService.getMyAssignedReports(userId);

        // Assert
        const findByAssigneeIdCall = (reportRepository.findByAssigneeId as jest.Mock).mock.calls[0];
        expect(typeof findByAssigneeIdCall[0]).toBe('number');
        expect(findByAssigneeIdCall[0]).toBe(userId);
      });
    });

    describe('with status filter', () => {
      it('should return only ASSIGNED reports when status filter is ASSIGNED', async () => {
        // Arrange
        const userId = 50;
        const status = ReportStatus.ASSIGNED;
        const mockReports: reportEntity[] = [
          createMockReport({ id: 1, assigneeId: userId, status: ReportStatus.ASSIGNED }),
          createMockReport({ id: 2, assigneeId: userId, status: ReportStatus.ASSIGNED }),
        ];

        const mockMappedReports = mockReports.map(r => ({ id: r.id, status: r.status }));

        jest.spyOn(reportRepository, 'findByAssigneeId').mockResolvedValue(mockReports);
        (mapReportEntityToReportResponse as jest.Mock).mockImplementation((report) =>
          mockMappedReports.find(m => m.id === report.id)
        );

        // Act
        const result = await reportService.getMyAssignedReports(userId, status);

        // Assert
        expect(reportRepository.findByAssigneeId).toHaveBeenCalledWith(userId, ReportStatus.ASSIGNED);
        expect(result).toHaveLength(2);
        expect(result.every(r => r.status === ReportStatus.ASSIGNED)).toBe(true);
      });

      it('should return only IN_PROGRESS reports when status filter is IN_PROGRESS', async () => {
        // Arrange
        const userId = 50;
        const status = ReportStatus.IN_PROGRESS;
        const mockReports: reportEntity[] = [
          createMockReport({ id: 1, assigneeId: userId, status: ReportStatus.IN_PROGRESS }),
          createMockReport({ id: 3, assigneeId: userId, status: ReportStatus.IN_PROGRESS }),
        ];

        const mockMappedReports = mockReports.map(r => ({ id: r.id, status: r.status }));

        jest.spyOn(reportRepository, 'findByAssigneeId').mockResolvedValue(mockReports);
        (mapReportEntityToReportResponse as jest.Mock).mockImplementation((report) =>
          mockMappedReports.find(m => m.id === report.id)
        );

        // Act
        const result = await reportService.getMyAssignedReports(userId, status);

        // Assert
        expect(reportRepository.findByAssigneeId).toHaveBeenCalledWith(userId, ReportStatus.IN_PROGRESS);
        expect(result).toHaveLength(2);
        expect(result.every(r => r.status === ReportStatus.IN_PROGRESS)).toBe(true);
      });

      it('should return only RESOLVED reports when status filter is RESOLVED', async () => {
        // Arrange
        const userId = 50;
        const status = ReportStatus.RESOLVED;
        const mockReports: reportEntity[] = [
          createMockReport({ id: 1, assigneeId: userId, status: ReportStatus.RESOLVED }),
          createMockReport({ id: 2, assigneeId: userId, status: ReportStatus.RESOLVED }),
        ];

        const mockMappedReports = mockReports.map(r => ({ id: r.id, status: r.status }));

        jest.spyOn(reportRepository, 'findByAssigneeId').mockResolvedValue(mockReports);
        (mapReportEntityToReportResponse as jest.Mock).mockImplementation((report) =>
          mockMappedReports.find(m => m.id === report.id)
        );

        // Act
        const result = await reportService.getMyAssignedReports(userId, status);

        // Assert
        expect(reportRepository.findByAssigneeId).toHaveBeenCalledWith(userId, ReportStatus.RESOLVED);
        expect(result).toHaveLength(2);
        expect(result.every(r => r.status === ReportStatus.RESOLVED)).toBe(true);
      });

      it('should return empty array when no reports match the status filter', async () => {
        // Arrange
        const userId = 50;
        const status = ReportStatus.ASSIGNED;
        jest.spyOn(reportRepository, 'findByAssigneeId').mockResolvedValue([]);

        // Act
        const result = await reportService.getMyAssignedReports(userId, status);

        // Assert
        expect(reportRepository.findByAssigneeId).toHaveBeenCalledWith(userId, status);
        expect(result).toHaveLength(0);
      });
    });

    describe('with different report categories', () => {

      it('should return reports for a specific category', async () => {
        // Arrange
        const userId = 50;
        const mockReports: reportEntity[] = [
          createMockReport({ id: 1, assigneeId: userId, category: ReportCategory.ROADS }),
          createMockReport({ id: 2, assigneeId: userId, category: ReportCategory.ROADS }),
        ];

        const mockMappedReports = mockReports.map(r => ({ id: r.id, category: r.category }));

        jest.spyOn(reportRepository, 'findByAssigneeId').mockResolvedValue(mockReports);
        (mapReportEntityToReportResponse as jest.Mock).mockImplementation((report) =>
          mockMappedReports.find(m => m.id === report.id)
        );

        // Act
        const result = await reportService.getMyAssignedReports(userId);

        // Assert
        expect(result).toHaveLength(2);
        expect(result.every(r => r.category === ReportCategory.ROADS)).toBe(true);
      });
    });

    describe('mapper integration', () => {
      it('should call mapper for each report entity', async () => {
        // Arrange
        const userId = 50;
        const mockReports: reportEntity[] = [
          createMockReport({ id: 1, assigneeId: userId }),
          createMockReport({ id: 2, assigneeId: userId }),
          createMockReport({ id: 3, assigneeId: userId }),
        ];

        jest.spyOn(reportRepository, 'findByAssigneeId').mockResolvedValue(mockReports);
        (mapReportEntityToReportResponse as jest.Mock).mockReturnValue({});

        // Act
        await reportService.getMyAssignedReports(userId);

        // Assert
        expect(mapReportEntityToReportResponse).toHaveBeenCalledTimes(3);
        expect(mapReportEntityToReportResponse).toHaveBeenNthCalledWith(1, mockReports[0]);
        expect(mapReportEntityToReportResponse).toHaveBeenNthCalledWith(2, mockReports[1]);
        expect(mapReportEntityToReportResponse).toHaveBeenNthCalledWith(3, mockReports[2]);
      });

      it('should return mapped responses', async () => {
        // Arrange
        const userId = 50;
        const mockReports: reportEntity[] = [
          createMockReport({ id: 1, assigneeId: userId, title: 'Report 1' }),
        ];

        const mockMappedResponse = {
          id: 1,
          title: 'Report 1',
          status: ReportStatus.ASSIGNED,
          category: ReportCategory.ROADS,
        };

        jest.spyOn(reportRepository, 'findByAssigneeId').mockResolvedValue(mockReports);
        (mapReportEntityToReportResponse as jest.Mock).mockReturnValue(mockMappedResponse);

        // Act
        const result = await reportService.getMyAssignedReports(userId);

        // Assert
        expect(result[0]).toEqual(mockMappedResponse);
      });
    });

    describe('error handling', () => {
      it('should propagate repository errors', async () => {
        // Arrange
        const userId = 50;
        const error = new Error('Database connection error');
        jest.spyOn(reportRepository, 'findByAssigneeId').mockRejectedValue(error);

        // Act & Assert
        await expect(reportService.getMyAssignedReports(userId))
          .rejects
          .toThrow('Database connection error');
      });

      it('should propagate mapper errors', async () => {
        // Arrange
        const userId = 50;
        const mockReports: reportEntity[] = [createMockReport({ id: 1, assigneeId: userId })];

        jest.spyOn(reportRepository, 'findByAssigneeId').mockResolvedValue(mockReports);
        (mapReportEntityToReportResponse as jest.Mock).mockImplementation(() => {
          throw new Error('Mapping error');
        });

        // Act & Assert
        await expect(reportService.getMyAssignedReports(userId))
          .rejects
          .toThrow('Mapping error');
      });

      it('should handle repository returning null', async () => {
        // Arrange
        const userId = 50;
        jest.spyOn(reportRepository, 'findByAssigneeId').mockResolvedValue(null as any);

        // Act & Assert
        await expect(reportService.getMyAssignedReports(userId))
          .rejects
          .toThrow();
      });
    });

    describe('edge cases', () => {
      it('should handle reports with anonymous reporters', async () => {
        // Arrange
        const userId = 50;
        const mockReports: reportEntity[] = [
          createMockReport({
            id: 1,
            assigneeId: userId,
            isAnonymous: true,
            reporterId: null as any,
            reporter: null as any
          }),
        ];

        const mockMappedReports = [{ id: 1, isAnonymous: true }];

        jest.spyOn(reportRepository, 'findByAssigneeId').mockResolvedValue(mockReports);
        (mapReportEntityToReportResponse as jest.Mock).mockReturnValue(mockMappedReports[0]);

        // Act
        const result = await reportService.getMyAssignedReports(userId);

        // Assert
        expect(result).toHaveLength(1);
        expect(result[0].isAnonymous).toBe(true);
      });

      it('should handle reports with different user IDs correctly', async () => {
        // Arrange
        const userId = 50;
        const anotherUserId = 99;

        // Mock should only return reports for the requested user
        const mockReports: reportEntity[] = [
          createMockReport({ id: 1, assigneeId: userId }),
          createMockReport({ id: 2, assigneeId: userId }),
        ];

        jest.spyOn(reportRepository, 'findByAssigneeId').mockResolvedValue(mockReports);
        (mapReportEntityToReportResponse as jest.Mock).mockImplementation((report) => ({
          id: report.id,
          assigneeId: report.assigneeId
        }));

        // Act
        const result = await reportService.getMyAssignedReports(userId);

        // Assert
        expect(reportRepository.findByAssigneeId).toHaveBeenCalledWith(userId, undefined);
        expect(result.every(r => r.assigneeId === userId)).toBe(true);
      });

      it('should handle large number of assigned reports', async () => {
        // Arrange
        const userId = 50;
        const mockReports: reportEntity[] = Array.from({ length: 100 }, (_, i) =>
          createMockReport({ id: i + 1, assigneeId: userId })
        );

        jest.spyOn(reportRepository, 'findByAssigneeId').mockResolvedValue(mockReports);
        (mapReportEntityToReportResponse as jest.Mock).mockImplementation((report) => ({
          id: report.id
        }));

        // Act
        const result = await reportService.getMyAssignedReports(userId);

        // Assert
        expect(result).toHaveLength(100);
        expect(mapReportEntityToReportResponse).toHaveBeenCalledTimes(100);
      });
    });
  });

  describe('getAssignedReportsToExternalMaintainer', () => {
    const externalMaintainerId = 50;
    const mockReportAssigned: reportEntity = createMockReport({ 
      id: 1, 
      assigneeId: externalMaintainerId, 
      status: ReportStatus.ASSIGNED 
    });
    const mockReportInProgress: reportEntity = createMockReport({ 
      id: 2, 
      assigneeId: externalMaintainerId, 
      status: ReportStatus.IN_PROGRESS 
    });
    const mockReportResolved: reportEntity = createMockReport({ 
      id: 3, 
      assigneeId: externalMaintainerId, 
      status: ReportStatus.RESOLVED 
    });

    const mockMappedReportAssigned = { id: 1, title: 'Test Assigned', status: ReportStatus.ASSIGNED };
    const mockMappedReportInProgress = { id: 2, title: 'Test In Progress', status: ReportStatus.IN_PROGRESS };
    const mockMappedReportResolved = { id: 3, title: 'Test Resolved', status: ReportStatus.RESOLVED };


    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return all reports assigned to the external maintainer without status filter', async () => {
      // Arrange
      const mockReports: reportEntity[] = [mockReportAssigned, mockReportInProgress, mockReportResolved];
      jest.spyOn(reportRepository, 'findByExternalAssigneeId').mockResolvedValue(mockReports);
      (mapReportEntityToReportResponse as jest.Mock).mockImplementation((report) => {
        if (report.id === 1) return mockMappedReportAssigned;
        if (report.id === 2) return mockMappedReportInProgress;
        if (report.id === 3) return mockMappedReportResolved;
        return {};
      });

      // Act
      const result = await reportService.getAssignedReportsToExternalMaintainer(externalMaintainerId);

      // Assert
      expect(reportRepository.findByExternalAssigneeId).toHaveBeenCalledWith(externalMaintainerId, undefined);
      expect(result).toHaveLength(3);
      expect(result).toEqual([mockMappedReportAssigned, mockMappedReportInProgress, mockMappedReportResolved]);
      expect(mapReportEntityToReportResponse).toHaveBeenCalledTimes(3);
    });

    it('should return only ASSIGNED reports when status filter is ASSIGNED', async () => {
      // Arrange
      const mockReports: reportEntity[] = [mockReportAssigned];
      jest.spyOn(reportRepository, 'findByExternalAssigneeId').mockResolvedValue(mockReports);
      (mapReportEntityToReportResponse as jest.Mock).mockReturnValue(mockMappedReportAssigned);

      // Act
      const result = await reportService.getAssignedReportsToExternalMaintainer(externalMaintainerId, ReportStatus.ASSIGNED);

      // Assert
      expect(reportRepository.findByExternalAssigneeId).toHaveBeenCalledWith(externalMaintainerId, ReportStatus.ASSIGNED);
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(ReportStatus.ASSIGNED);
      expect(mapReportEntityToReportResponse).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when external maintainer has no assigned reports', async () => {
      // Arrange
      jest.spyOn(reportRepository, 'findByExternalAssigneeId').mockResolvedValue([]);

      // Act
      const result = await reportService.getAssignedReportsToExternalMaintainer(externalMaintainerId);

      // Assert
      expect(reportRepository.findByExternalAssigneeId).toHaveBeenCalledWith(externalMaintainerId, undefined);
      expect(result).toHaveLength(0);
      expect(mapReportEntityToReportResponse).not.toHaveBeenCalled();
    });

    it('should propagate repository errors', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      jest.spyOn(reportRepository, 'findByExternalAssigneeId').mockRejectedValue(error);

      // Act & Assert
      await expect(reportService.getAssignedReportsToExternalMaintainer(externalMaintainerId))
        .rejects
        .toThrow('Database connection failed');
    });

    it('should propagate mapper errors', async () => {
      // Arrange
      const mockReports: reportEntity[] = [mockReportAssigned];
      jest.spyOn(reportRepository, 'findByExternalAssigneeId').mockResolvedValue(mockReports);
      (mapReportEntityToReportResponse as jest.Mock).mockImplementation(() => {
        throw new Error('Mapping failed');
      });

      // Act & Assert
      await expect(reportService.getAssignedReportsToExternalMaintainer(externalMaintainerId))
        .rejects
        .toThrow('Mapping failed');
    });
  });
});

describe('ReportService additional unit tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllCategories', () => {
    it('returns all enum values', async () => {
      const result = await reportService.getAllCategories();
      expect(result).toEqual(Object.values(ReportCategory));
    });
  });

  describe('createReport', () => {
    const request = {
      title: 'Title',
      description: 'Desc',
      category: ReportCategory.WASTE,
      location: { latitude: 45.0703393, longitude: 7.6869005 },
      photos: ['data:image/png;base64,iVBORw0KGgo='],
      isAnonymous: false,
    };

    it('creates report and saves photos', async () => {
      jest.spyOn(photoValidationUtils, 'validatePhotos').mockReturnValue({ isValid: true });
      jest.spyOn(storageService, 'uploadPhoto').mockResolvedValue('uploads/reports/1/photo1.png');
      const created = { id: 1, status: ReportStatus.PENDING_APPROVAL } as any;
      jest.spyOn(reportRepository, 'createReport').mockResolvedValue(created);
      jest.spyOn(photoRepository, 'savePhotosForReport').mockResolvedValue(undefined as any);
      const photos = [{ id: 1, storageUrl: 'uploads/reports/1/photo1.png' } as any];
      jest.spyOn(photoRepository, 'getPhotosByReportId').mockResolvedValue(photos as any);
      const expected = { id: 1 } as any;
      jest.spyOn(mapperService, 'mapReportEntityToResponse').mockReturnValue(expected);

      const result = await reportService.createReport(request as any, 123);
      expect(result).toBe(expected);
      expect(reportRepository.createReport).toHaveBeenCalled();
      expect(photoRepository.savePhotosForReport).toHaveBeenCalledWith(1, ['uploads/reports/1/photo1.png']);
      expect(photoRepository.getPhotosByReportId).toHaveBeenCalledWith(1);
      expect(mapperService.mapReportEntityToResponse).toHaveBeenCalledWith(created, photos, request.location);
    });

    it('throws when photo validation fails', async () => {
      jest.spyOn(photoValidationUtils, 'validatePhotos').mockReturnValue({ isValid: false, error: 'Invalid' });
      await expect(reportService.createReport(request as any, 123)).rejects.toThrow(BadRequestError);
    });

    it('cleans up photos on database error after creation', async () => {
      jest.spyOn(photoValidationUtils, 'validatePhotos').mockReturnValue({ isValid: true });
      const created = { id: 55, status: ReportStatus.PENDING_APPROVAL } as any;
      jest.spyOn(reportRepository, 'createReport').mockResolvedValue(created);
      jest.spyOn(storageService, 'uploadPhoto').mockResolvedValue('uploads/reports/55/photo1.png');
      jest.spyOn(photoRepository, 'savePhotosForReport').mockRejectedValue(new Error('DB error'));
      const cleanup = jest.spyOn(storageService, 'deleteReportPhotos').mockResolvedValue(undefined as any);

      await expect(reportService.createReport(request as any, 999)).rejects.toThrow('DB error');
      expect(cleanup).toHaveBeenCalledWith(55);
    });
  });

  describe('getAllReports', () => {
    const makeUser = (roleName: string) => ({
      id: 1,
      departmentRole: { role: { name: roleName } },
    }) as userEntity;

    it('throws UnauthorizedError when user not found', async () => {
      (userRepository.findUserById as jest.Mock).mockResolvedValue(null);
      await expect(reportService.getAllReports(999)).rejects.toThrow(UnauthorizedError);
    });

    it('throws UnauthorizedError when user role missing', async () => {
      (userRepository.findUserById as jest.Mock).mockResolvedValue({ id: 1 } as userEntity);
      await expect(reportService.getAllReports(1)).rejects.toThrow(UnauthorizedError);
    });

    it('throws InsufficientRightsError when requesting pending without proper role', async () => {
      const user = makeUser('Citizen');
      (userRepository.findUserById as jest.Mock).mockResolvedValue(user);
      
      await expect(
        reportService.getAllReports(user.id, ReportStatus.PENDING_APPROVAL)
      ).rejects.toThrow(InsufficientRightsError);
    });

    it('returns filtered reports for non-officer users', async () => {
      const user = makeUser('Citizen');
      (userRepository.findUserById as jest.Mock).mockResolvedValue(user);
    });
  });
  describe('getAllReports', () => {
    const createMockUser = (role: string, overrides?: Partial<userEntity>): userEntity => ({
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      passwordHash: 'hashedpassword',
      firstName: 'Test',
      lastName: 'User',
      departmentRoleId: 1,
      emailNotificationsEnabled: true,
      isVerified: true,
      createdAt: new Date(),
      departmentRole: {
        id: 1,
        departmentId: 1,
        roleId: 1,
        department: {} as any,
        users: [],
        role: {
          id: 1,
          name: role,
          description: 'Test role',
          departmentRoles: []
        }
      },
      ...overrides
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('authorization checks', () => {
      it('should throw UnauthorizedError when user is not found', async () => {
        jest.spyOn(userRepository, 'findUserById').mockResolvedValue(null);

        await expect(reportService.getAllReports(999))
          .rejects
          .toThrow(UnauthorizedError);
        
        await expect(reportService.getAllReports(999))
          .rejects
          .toThrow('User not found');
      });

      it('should throw UnauthorizedError when user has no role', async () => {
        const mockUser = createMockUser('Citizen');
        mockUser.departmentRole = null as any;
        
        jest.spyOn(userRepository, 'findUserById').mockResolvedValue(mockUser);

        await expect(reportService.getAllReports(1))
          .rejects
          .toThrow(UnauthorizedError);
        
        await expect(reportService.getAllReports(1))
          .rejects
          .toThrow('User role not found');
      });

      it('should throw InsufficientRightsError when non-PRO user tries to view pending reports', async () => {
        const mockUser = createMockUser('Technical Staff');
        jest.spyOn(userRepository, 'findUserById').mockResolvedValue(mockUser);

        await expect(
          reportService.getAllReports(1, ReportStatus.PENDING_APPROVAL)
        ).rejects.toThrow(InsufficientRightsError);
        
        await expect(
          reportService.getAllReports(1, ReportStatus.PENDING_APPROVAL)
        ).rejects.toThrow('Only Municipal Public Relations Officers can view pending reports');
      });

      it('should allow PRO to view pending reports', async () => {
        const mockUser = createMockUser('Municipal Public Relations Officer');
        const mockReports = [
          createMockReport({ id: 1, status: ReportStatus.PENDING_APPROVAL })
        ];

        jest.spyOn(userRepository, 'findUserById').mockResolvedValue(mockUser);
        jest.spyOn(reportRepository, 'findAllReports').mockResolvedValue(mockReports);
        (mapReportEntityToReportResponse as jest.Mock).mockReturnValue({ id: 1 });

        const result = await reportService.getAllReports(1, ReportStatus.PENDING_APPROVAL);

        expect(result).toHaveLength(1);
        expect(reportRepository.findAllReports).toHaveBeenCalledWith(
          ReportStatus.PENDING_APPROVAL,
          undefined
        );
      });
    });

    describe('filtering by status', () => {
      it('should return reports filtered by status', async () => {
        const mockUser = createMockUser('Municipal Public Relations Officer');
        const mockReports = [
          createMockReport({ id: 1, status: ReportStatus.ASSIGNED }),
          createMockReport({ id: 2, status: ReportStatus.ASSIGNED })
        ];

        jest.spyOn(userRepository, 'findUserById').mockResolvedValue(mockUser);
        jest.spyOn(reportRepository, 'findAllReports').mockResolvedValue(mockReports);
        (mapReportEntityToReportResponse as jest.Mock).mockImplementation(r => ({ id: r.id }));

        const result = await reportService.getAllReports(1, ReportStatus.ASSIGNED);

        expect(result).toHaveLength(2);
        expect(reportRepository.findAllReports).toHaveBeenCalledWith(
          ReportStatus.ASSIGNED,
          undefined
        );
      });

      it('should filter out pending reports for non-PRO users', async () => {
        const mockUser = createMockUser('Technical Staff');
        const mockReports = [
          createMockReport({ id: 1, status: ReportStatus.ASSIGNED }),
          createMockReport({ id: 2, status: ReportStatus.PENDING_APPROVAL }),
          createMockReport({ id: 3, status: ReportStatus.IN_PROGRESS })
        ];

        jest.spyOn(userRepository, 'findUserById').mockResolvedValue(mockUser);
        jest.spyOn(reportRepository, 'findAllReports').mockResolvedValue(mockReports);
        (mapReportEntityToReportResponse as jest.Mock).mockImplementation(r => ({ id: r.id, status: r.status }));

        const result = await reportService.getAllReports(1);

        expect(result).toHaveLength(2);
        expect(result.every(r => r.status !== ReportStatus.PENDING_APPROVAL)).toBe(true);
      });
    });

    describe('filtering by category', () => {
      it('should return reports filtered by category', async () => {
        const mockUser = createMockUser('Technical Staff');
        const mockReports = [
          createMockReport({ id: 1, category: ReportCategory.ROADS, status: ReportStatus.ASSIGNED })
        ];

        jest.spyOn(userRepository, 'findUserById').mockResolvedValue(mockUser);
        jest.spyOn(reportRepository, 'findAllReports').mockResolvedValue(mockReports);
        (mapReportEntityToReportResponse as jest.Mock).mockImplementation(r => ({ id: r.id }));

        const result = await reportService.getAllReports(1, undefined, ReportCategory.ROADS);

        expect(result).toHaveLength(1);
        expect(reportRepository.findAllReports).toHaveBeenCalledWith(
          undefined,
          ReportCategory.ROADS
        );
      });

      it('should return reports filtered by both status and category', async () => {
        const mockUser = createMockUser('Municipal Public Relations Officer');
        const mockReports = [
          createMockReport({ 
            id: 1, 
            status: ReportStatus.PENDING_APPROVAL, 
            category: ReportCategory.PUBLIC_LIGHTING 
          })
        ];

        jest.spyOn(userRepository, 'findUserById').mockResolvedValue(mockUser);
        jest.spyOn(reportRepository, 'findAllReports').mockResolvedValue(mockReports);
        (mapReportEntityToReportResponse as jest.Mock).mockImplementation(r => ({ id: r.id }));

        const result = await reportService.getAllReports(
          1, 
          ReportStatus.PENDING_APPROVAL, 
          ReportCategory.PUBLIC_LIGHTING
        );

        expect(result).toHaveLength(1);
        expect(reportRepository.findAllReports).toHaveBeenCalledWith(
          ReportStatus.PENDING_APPROVAL,
          ReportCategory.PUBLIC_LIGHTING
        );
      });
    });

    describe('without filters', () => {
      it('should return all accessible reports for PRO', async () => {
        const mockUser = createMockUser('Municipal Public Relations Officer');
        const mockReports = [
          createMockReport({ id: 1, status: ReportStatus.PENDING_APPROVAL }),
          createMockReport({ id: 2, status: ReportStatus.ASSIGNED }),
          createMockReport({ id: 3, status: ReportStatus.IN_PROGRESS })
        ];

        jest.spyOn(userRepository, 'findUserById').mockResolvedValue(mockUser);
        jest.spyOn(reportRepository, 'findAllReports').mockResolvedValue(mockReports);
        (mapReportEntityToReportResponse as jest.Mock).mockImplementation(r => ({ id: r.id }));

        const result = await reportService.getAllReports(1);

        expect(result).toHaveLength(3);
        expect(reportRepository.findAllReports).toHaveBeenCalledWith(undefined, undefined);
      });

      it('should return empty array when no reports exist', async () => {
        const mockUser = createMockUser('Technical Staff');
        
        jest.spyOn(userRepository, 'findUserById').mockResolvedValue(mockUser);
        jest.spyOn(reportRepository, 'findAllReports').mockResolvedValue([]);

        const result = await reportService.getAllReports(1);

        expect(result).toHaveLength(0);
      });
    });
  });

  describe('updateReportStatus', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('approval workflow', () => {
      it('should throw BadRequestError for invalid report ID (NaN) when approving', async () => {
        const mockUser = createMockUser('Municipal Public Relations Officer', undefined, { id: 1 });
        jest.spyOn(userRepository, 'findUserById').mockResolvedValue(mockUser);
        
        await expect(
          reportService.updateReportStatus(NaN, ReportStatus.ASSIGNED, {}, 1)
        ).rejects.toThrow(BadRequestError);
        
        await expect(
          reportService.updateReportStatus(NaN, ReportStatus.ASSIGNED, {}, 1)
        ).rejects.toThrow('Invalid report ID');
      });

      it('should throw NotFoundError when report does not exist for approval', async () => {
        const mockUser = createMockUser('Municipal Public Relations Officer', undefined, { id: 1 });
        jest.spyOn(userRepository, 'findUserById').mockResolvedValue(mockUser);
        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(null);

        await expect(
          reportService.updateReportStatus(999, ReportStatus.ASSIGNED, {}, 1)
        ).rejects.toThrow(NotFoundError);
        
        await expect(
          reportService.updateReportStatus(999, ReportStatus.ASSIGNED, {}, 1)
        ).rejects.toThrow('Report not found');
      });

      it('should throw BadRequestError when report status is not PENDING_APPROVAL for approval', async () => {
        const mockReport = createMockReport({ 
          id: 1, 
          status: ReportStatus.ASSIGNED 
        });
        const mockUser = createMockUser('Municipal Public Relations Officer', undefined, { id: 1 });
        jest.spyOn(userRepository, 'findUserById').mockResolvedValue(mockUser);
        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);

        await expect(
          reportService.updateReportStatus(1, ReportStatus.ASSIGNED, {}, 1)
        ).rejects.toThrow(BadRequestError);
        
        await expect(
          reportService.updateReportStatus(1, ReportStatus.ASSIGNED, {}, 1)
        ).rejects.toThrow('Cannot approve report with status Assigned. Only reports with status Pending Approval can be approved.');
      });

      it('should throw InsufficientRightsError when user is not a PRO', async () => {
        const mockReport = createMockReport({ 
          id: 1, 
          status: ReportStatus.PENDING_APPROVAL 
        });
        const mockUser = createMockUser('Citizen', undefined, { id: 1 });
        jest.spyOn(userRepository, 'findUserById').mockResolvedValue(mockUser);
        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);

        await expect(
          reportService.updateReportStatus(1, ReportStatus.ASSIGNED, {}, 1)
        ).rejects.toThrow(InsufficientRightsError);
      });

      it('should throw BadRequestError when no role mapping exists for category', async () => {
        const mockReport = createMockReport({ 
          id: 1, 
          status: ReportStatus.PENDING_APPROVAL 
        });
        const mockUser = createMockUser('Municipal Public Relations Officer', undefined, { id: 1 });
        jest.spyOn(userRepository, 'findUserById').mockResolvedValue(mockUser);
        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
        jest.spyOn(categoryRoleRepository, 'findRoleIdByCategory').mockResolvedValue(null);

        await expect(
          reportService.updateReportStatus(1, ReportStatus.ASSIGNED, {}, 1)
        ).rejects.toThrow(BadRequestError);
        
        await expect(
          reportService.updateReportStatus(1, ReportStatus.ASSIGNED, {}, 1)
        ).rejects.toThrow('No role mapping found for category: Roads and Urban Furnishings.');
      });

      it('should throw BadRequestError when no available staff found', async () => {
        const mockReport = createMockReport({ 
          id: 1, 
          status: ReportStatus.PENDING_APPROVAL 
        });
        const mockUser = createMockUser('Municipal Public Relations Officer', undefined, { id: 1 });
        jest.spyOn(userRepository, 'findUserById').mockResolvedValue(mockUser);
        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
        jest.spyOn(categoryRoleRepository, 'findRoleIdByCategory').mockResolvedValue(5);
        jest.spyOn(userRepository, 'findAvailableStaffByRoleId').mockResolvedValue(null);

        await expect(
          reportService.updateReportStatus(1, ReportStatus.ASSIGNED, {}, 1)
        ).rejects.toThrow(BadRequestError);
        
        await expect(
          reportService.updateReportStatus(1, ReportStatus.ASSIGNED, {}, 1)
        ).rejects.toThrow('No available technical staff found for category: Roads and Urban Furnishings. All staff members may be overloaded or the role has no assigned users.');
      });
    });
  });



  describe('rejection workflow', () => {

    it('should throw BadRequestError for invalid report ID (NaN) when rejecting', async () => {
      const mockUser = createMockUser('Municipal Public Relations Officer', undefined, { id: 1 });
      jest.spyOn(userRepository, 'findUserById').mockResolvedValue(mockUser);

      await expect(
        reportService.updateReportStatus(NaN, ReportStatus.REJECTED, { rejectionReason: 'Test reason' }, 1)
      ).rejects.toThrow(BadRequestError);
      await expect(
        reportService.updateReportStatus(NaN, ReportStatus.REJECTED, { rejectionReason: 'Test reason' }, 1)
      ).rejects.toThrow('Invalid report ID');
    });

    it('should throw BadRequestError when rejection reason is empty string', async () => {
      const mockReport = createMockReport({ 
        id: 1, 
        status: ReportStatus.PENDING_APPROVAL 
      });

      const mockUser = createMockUser('Municipal Public Relations Officer', undefined, { id: 1 });
      jest.spyOn(userRepository, 'findUserById').mockResolvedValue(mockUser);
      jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);

      await expect(
        reportService.updateReportStatus(1, ReportStatus.REJECTED, { rejectionReason: '' }, 1)
      ).rejects.toThrow(BadRequestError);

      await expect(
        reportService.updateReportStatus(1, ReportStatus.REJECTED, { rejectionReason: '' }, 1)
      ).rejects.toThrow('Rejection reason is required');
    });

    it('should throw BadRequestError when report status is not PENDING_APPROVAL for rejection', async () => {
      const mockReport = createMockReport({ 
        id: 1, 
        status: ReportStatus.ASSIGNED 
      });

      const mockUser = createMockUser('Municipal Public Relations Officer', undefined, { id: 1 });
      jest.spyOn(userRepository, 'findUserById').mockResolvedValue(mockUser);
      jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);

      await expect(
        reportService.updateReportStatus(1, ReportStatus.REJECTED, { rejectionReason: 'Test reason' }, 1)
      ).rejects.toThrow(BadRequestError);

      await expect(
        reportService.updateReportStatus(1, ReportStatus.REJECTED, { rejectionReason: 'Test reason' }, 1)
      ).rejects.toThrow('Cannot reject report with status Assigned.');

    });

    it('should throw InsufficientRightsError when user is not a PRO for rejection', async () => {

      const mockReport = createMockReport({ 
        id: 1, 
        status: ReportStatus.PENDING_APPROVAL 
      });

      const mockUser = createMockUser('Citizen', undefined, { id: 1 });
      jest.spyOn(userRepository, 'findUserById').mockResolvedValue(mockUser);
      jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);

      await expect(
        reportService.updateReportStatus(1, ReportStatus.REJECTED, { rejectionReason: 'Test reason' }, 1)
      ).rejects.toThrow(InsufficientRightsError);
    });

  });

  describe('resolution workflow', () => {

    const reportId = 1;
    const externalMaintainerId = 50;
    const technicalManagerId = 60;
    const technicalAssistantId = 70;
    const citizenId = 80;
    const proId = 90;
    const mockReportAssigned = createMockReport({
      id: reportId,
      status: ReportStatus.ASSIGNED,
      assigneeId: externalMaintainerId,
    });

    const mockReportAssignedToTechManager = createMockReport({
      id: reportId,
      status: ReportStatus.ASSIGNED,
      assigneeId: technicalManagerId,
    });

    const mockReportInProgress = createMockReport({
      id: reportId,
      status: ReportStatus.IN_PROGRESS,
      assigneeId: externalMaintainerId,
    });
    const mockReportSuspended = createMockReport({
      id: reportId,
      status: ReportStatus.SUSPENDED,
      assigneeId: externalMaintainerId,
    });
    const mockExternalMaintainer = createMockUser('External Maintainer', undefined, { id: externalMaintainerId });
    const mockTechnicalManager = createMockUser('Technical Manager', undefined, { id: technicalManagerId });
    const mockTechnicalAssistant = createMockUser('Technical Assistant', undefined, { id: technicalAssistantId });
    const mockCitizen = createMockUser('Citizen', undefined, { id: citizenId });
    const mockPRO = createMockUser('Municipal Public Relations Officer', undefined, { id: proId });

    beforeEach(() => {
      jest.clearAllMocks();
      // Reset mock report status to prevent mutation between tests
      mockReportAssigned.status = ReportStatus.ASSIGNED;
      mockReportAssignedToTechManager.status = ReportStatus.ASSIGNED;
      mockReportInProgress.status = ReportStatus.IN_PROGRESS;
      mockReportSuspended.status = ReportStatus.SUSPENDED;
    });

    it('should successfully resolve a report by an assigned External Maintainer', async () => {

      jest.spyOn(userRepository, 'findUserById')
        .mockResolvedValueOnce(mockExternalMaintainer) // for user validation
        .mockResolvedValueOnce(mockExternalMaintainer); // for report update authorization
      jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReportAssigned);
      jest.spyOn(reportRepository, 'save').mockImplementation(async (report) => ({ ...report, updated_at: new Date() }));
      (mapperService.mapReportEntityToDTO as jest.Mock).mockImplementation((report) => report);

      const result = await reportService.updateReportStatus(reportId, ReportStatus.RESOLVED, {}, externalMaintainerId);

      expect(userRepository.findUserById).toHaveBeenCalledWith(externalMaintainerId);
      expect(reportRepository.findReportById).toHaveBeenCalledWith(reportId);
      expect(reportRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: reportId,
        status: ReportStatus.RESOLVED,
      }));
      expect(result.status).toBe(ReportStatus.RESOLVED);
      expect(result.updated_at).toBeInstanceOf(Date);

    });

    it('should successfully resolve a report by a Technical Manager', async () => {

      jest.spyOn(userRepository, 'findUserById').mockResolvedValue(mockTechnicalManager);
      jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReportAssignedToTechManager);
      jest.spyOn(reportRepository, 'save').mockImplementation(async (report) => ({ ...report, updated_at: new Date() }));
      (mapperService.mapReportEntityToDTO as jest.Mock).mockImplementation((report) => report);

      const result = await reportService.updateReportStatus(reportId, ReportStatus.RESOLVED, {}, technicalManagerId);

      expect(userRepository.findUserById).toHaveBeenCalledWith(technicalManagerId);
      expect(reportRepository.findReportById).toHaveBeenCalledWith(reportId);
      expect(reportRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: reportId,
        status: ReportStatus.RESOLVED,
      }));

      expect(result.status).toBe(ReportStatus.RESOLVED);
      expect(result.updated_at).toBeInstanceOf(Date);

    });

    it('should successfully resolve a report by a Technical Assistant', async () => {

      jest.spyOn(userRepository, 'findUserById').mockResolvedValue(mockTechnicalAssistant);
      jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReportInProgress);
      jest.spyOn(reportRepository, 'save').mockImplementation(async (report) => ({ ...report, updated_at: new Date() }));
      (mapperService.mapReportEntityToDTO as jest.Mock).mockImplementation((report) => report);

      const result = await reportService.updateReportStatus(reportId, ReportStatus.RESOLVED, {}, technicalAssistantId);

      expect(userRepository.findUserById).toHaveBeenCalledWith(technicalAssistantId);
      expect(reportRepository.findReportById).toHaveBeenCalledWith(reportId);
      expect(reportRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: reportId,
        status: ReportStatus.RESOLVED,
      }));
      expect(result.status).toBe(ReportStatus.RESOLVED);
      expect(result.updated_at).toBeInstanceOf(Date);

    });

    it('should throw InsufficientRightsError when non-assigned External Maintainer tries to resolve', async () => {

      const anotherExternalMaintainer = createMockUser('External Maintainer', undefined, { id: 99 });
      jest.spyOn(userRepository, 'findUserById')
        .mockResolvedValueOnce(anotherExternalMaintainer)
        .mockResolvedValueOnce(anotherExternalMaintainer);
      jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReportAssigned);

      await expect(
        reportService.updateReportStatus(reportId, ReportStatus.RESOLVED, {}, anotherExternalMaintainer.id)
      ).rejects.toThrow(InsufficientRightsError);
      expect(reportRepository.save).not.toHaveBeenCalled();

    });

    it('should throw InsufficientRightsError when a Citizen tries to resolve a report', async () => {
      jest.spyOn(userRepository, 'findUserById').mockResolvedValue(mockCitizen);
      jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReportAssigned);

      await expect(
        reportService.updateReportStatus(reportId, ReportStatus.RESOLVED, {}, citizenId)
      ).rejects.toThrow(InsufficientRightsError);
      expect(reportRepository.save).not.toHaveBeenCalled();

    });

    it('should throw InsufficientRightsError when a PRO tries to resolve a report', async () => {
      
      jest.spyOn(userRepository, 'findUserById').mockResolvedValue(mockPRO);
      jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReportAssigned);

      await expect(
        reportService.updateReportStatus(reportId, ReportStatus.RESOLVED, {}, proId)
      ).rejects.toThrow(InsufficientRightsError);
      expect(reportRepository.save).not.toHaveBeenCalled();

    });

    it('should throw NotFoundError when report does not exist', async () => {

      jest.spyOn(userRepository, 'findUserById').mockResolvedValue(mockTechnicalManager);
      jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(null);

      await expect(
        reportService.updateReportStatus(999, ReportStatus.RESOLVED, {}, technicalManagerId)
      ).rejects.toThrow(NotFoundError);
      expect(reportRepository.save).not.toHaveBeenCalled();

    });

    it('should throw BadRequestError for invalid report ID (NaN)', async () => {

      jest.spyOn(userRepository, 'findUserById').mockResolvedValue(mockTechnicalManager);

      await expect(
        reportService.updateReportStatus(NaN, ReportStatus.RESOLVED, {}, technicalManagerId)
      ).rejects.toThrow(BadRequestError);
      expect(reportRepository.save).not.toHaveBeenCalled();

    });

    it('should throw BadRequestError if current status does not allow resolution (e.g., PENDING_APPROVAL)', async () => {

      const mockReportPending = createMockReport({
        id: reportId,
        status: ReportStatus.PENDING_APPROVAL,
        assigneeId: technicalManagerId, // Assignee irrelevant here
      });

      jest.spyOn(userRepository, 'findUserById').mockResolvedValue(mockTechnicalManager);
      jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReportPending);

      await expect(
        reportService.updateReportStatus(reportId, ReportStatus.RESOLVED, {}, technicalManagerId)
      ).rejects.toThrow(BadRequestError);
      expect(reportRepository.save).not.toHaveBeenCalled();

    });

  });
});

