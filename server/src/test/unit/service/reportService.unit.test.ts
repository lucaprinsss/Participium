import { userRepository } from '@repositories/userRepository';
import { reportService } from '../../../services/reportService';
import { BadRequestError } from '../../../models/errors/BadRequestError';
import { ReportCategory } from '../../../models/dto/ReportCategory';
import { ReportEntity } from '@models/entity/reportEntity';
import { UserEntity } from '@models/entity/userEntity';
import { ReportStatus } from '@models/dto/ReportStatus';
import { UnauthorizedError } from '@models/errors/UnauthorizedError';
import { InsufficientRightsError } from '@models/errors/InsufficientRightsError';
import { reportRepository } from '@repositories/reportRepository';
import { categoryRoleRepository } from '@repositories/categoryRoleRepository';
import { companyRepository } from '@repositories/companyRepository';
import { NotFoundError } from '@models/errors/NotFoundError';
import { photoRepository } from '@repositories/photoRepository';
import { storageService } from '@services/storageService';
import * as photoValidationUtils from '@utils/photoValidationUtils';
import * as mapperService from '@services/mapperService';
import { mapReportEntityToReportResponse } from '../../../services/mapperService';
import { createMockMunicipalityUser, createMockUser, createMockUserWithRole } from '@test/utils/mockEntities';
import { messageRepository } from '@repositories/messageRepository';
import { createNotification } from '@repositories/notificationRepository';

jest.mock('@repositories/userRepository');
jest.mock('@repositories/reportRepository');
jest.mock('@repositories/photoRepository');
jest.mock('@repositories/commentRepository');
jest.mock('@services/storageService');
jest.mock('@services/mapperService');
jest.mock('@repositories/categoryRoleRepository');
jest.mock('@utils/photoValidationUtils');
jest.mock('@repositories/notificationRepository');
jest.mock('@repositories/messageRepository');
jest.mock('@repositories/messageRepository');


// Helper function to create mock report entities
const createMockReport = (overrides?: Partial<ReportEntity>): ReportEntity => {
  const mockReport: ReportEntity = {
    id: 1,
    reporterId: 100,
    title: 'Test Report',
    description: 'Test Description',
    category: ReportCategory.ROADS,
    location: 'POINT(7.6869005 45.0703393)',
    address: undefined,
    status: ReportStatus.ASSIGNED,
    isAnonymous: false,
    assigneeId: 50,
    rejectionReason: '',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    reporter: {} as UserEntity,
    assignee: {} as UserEntity,
    photos: [],
    ...overrides,
  };
  return mockReport;
};

// Helper functions for mapping reports - moved to module level to reduce nesting
const createMappedReportFinder = (mockMappedReports: any[]) => {
  return (report: any) => mockMappedReports.find(m => m.id === report.id);
};

const mapReportToMock = (r: ReportEntity) => ({
  id: r.id,
  title: r.title,
  status: r.status,
});

const mapReportToIdAndStatus = (r: ReportEntity) => ({
  id: r.id,
  status: r.status
});

const mapReportToIdAndCategory = (r: ReportEntity) => ({
  id: r.id,
  category: r.category
});

const mapReportToId = (r: ReportEntity) => ({
  id: r.id
});

describe('ReportService', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });


    it('should throw BadRequestError when location is undefined', () => {
      const callWithUndefined = () => reportService.validateLocation(undefined as any);

      expect(callWithUndefined).toThrow(BadRequestError);
      expect(callWithUndefined).toThrow('Location is required');
    });

    it('should throw BadRequestError when location is null', () => {
      const callWithNull = () => reportService.validateLocation(null as any);

      expect(callWithNull).toThrow(BadRequestError);
      expect(callWithNull).toThrow('Location is required');
    });

    it('should throw BadRequestError when latitude is missing', () => {
      const callWithoutLatitude = () => reportService.validateLocation({ longitude: 7.6869005 } as any);

      expect(callWithoutLatitude).toThrow(BadRequestError);
      expect(callWithoutLatitude).toThrow('Location must include both latitude and longitude');
    });

    it('should throw BadRequestError when longitude is missing', () => {
      const callWithoutLongitude = () => reportService.validateLocation({ latitude: 45.0703393 } as any);

      expect(callWithoutLongitude).toThrow(BadRequestError);
      expect(callWithoutLongitude).toThrow('Location must include both latitude and longitude');
    });

    it('should throw BadRequestError when both coordinates are missing', () => {
      const callWithEmptyObject = () => reportService.validateLocation({} as any);

      expect(callWithEmptyObject).toThrow(BadRequestError);
      expect(callWithEmptyObject).toThrow('Location must include both latitude and longitude');
    });

    it('should throw BadRequestError when latitude > 90', () => {
      const callWithHighLatitude = () => reportService.validateLocation({ latitude: 91, longitude: 7.6869005 });

      expect(callWithHighLatitude).toThrow(BadRequestError);
      expect(callWithHighLatitude).toThrow('Invalid coordinates');
    });

    it('should throw BadRequestError when latitude < -90', () => {
      const callWithLowLatitude = () => reportService.validateLocation({ latitude: -91, longitude: 7.6869005 });

      expect(callWithLowLatitude).toThrow(BadRequestError);
      expect(callWithLowLatitude).toThrow('Invalid coordinates');
    });

    it('should throw BadRequestError when longitude > 180', () => {
      const callWithHighLongitude = () => reportService.validateLocation({ latitude: 45.0703393, longitude: 181 });

      expect(callWithHighLongitude).toThrow(BadRequestError);
      expect(callWithHighLongitude).toThrow('Invalid coordinates');
    });

    it('should throw BadRequestError when longitude < -180', () => {
      const callWithLowLongitude = () => reportService.validateLocation({ latitude: 45.0703393, longitude: -181 });

      expect(callWithLowLongitude).toThrow(BadRequestError);
      expect(callWithLowLongitude).toThrow('Invalid coordinates');
    });

    it('should throw BadRequestError when coordinates are Number.NaN', () => {
      const callWithNaNLatitude = () => reportService.validateLocation({ latitude: Number.NaN, longitude: 7.6869005 });
      const callWithNaNLongitude = () => reportService.validateLocation({ latitude: 45.0703393, longitude: Number.NaN });

      expect(callWithNaNLatitude).toThrow(BadRequestError);
      expect(callWithNaNLongitude).toThrow(BadRequestError);
    });

    it('should throw BadRequestError for Milan coordinates', () => {
      const callWithMilanCoords = () => reportService.validateLocation({ latitude: 45.464, longitude: 9.19 });

      expect(callWithMilanCoords).toThrow(BadRequestError);
      expect(callWithMilanCoords).toThrow('outside Turin city boundaries');
    });

    it('should throw BadRequestError for Rome coordinates', () => {
      const callWithRomeCoords = () => reportService.validateLocation({ latitude: 41.9028, longitude: 12.4964 });

      expect(callWithRomeCoords).toThrow(BadRequestError);
      expect(callWithRomeCoords).toThrow('outside Turin city boundaries');
    });

    it('should throw BadRequestError for coordinates just outside Turin (Moncalieri)', () => {
      const callWithMoncalieriCoords = () => reportService.validateLocation({ latitude: 45.0016, longitude: 7.6814 });

      expect(callWithMoncalieriCoords).toThrow(BadRequestError);
      expect(callWithMoncalieriCoords).toThrow('outside Turin city boundaries');
    });

    it('should not throw error for Turin city center (Piazza Castello)', () => {
      const callWithTurinCenter = () => reportService.validateLocation({ latitude: 45.0703393, longitude: 7.6869005 });

      expect(callWithTurinCenter).not.toThrow();
    });

    it('should not throw error for Mole Antonelliana', () => {
      const callWithMoleAntonelliana = () => reportService.validateLocation({ latitude: 45.0692403, longitude: 7.6932941 });

      expect(callWithMoleAntonelliana).not.toThrow();
    });

    it('should not throw error for Porta Nuova station', () => {
      const callWithPortaNuova = () => reportService.validateLocation({ latitude: 45.0625748, longitude: 7.6782069 });

      expect(callWithPortaNuova).not.toThrow();
    });
  });

  describe('getMyAssignedReports', () => {
    it('should return all reports assigned to the user (without status filter)', async () => {
      // Arrange
      const userId = 50;
      const mockUser = createMockMunicipalityUser('Water Network staff member', 'Water Network');
      const mockReports: ReportEntity[] = [
        createMockReport({ id: 1, assigneeId: userId, status: ReportStatus.ASSIGNED }),
        createMockReport({ id: 2, assigneeId: userId, status: ReportStatus.IN_PROGRESS }),
        createMockReport({ id: 3, assigneeId: userId, status: ReportStatus.RESOLVED }),
      ];

      const mockMappedReports = mockReports.map(mapReportToMock);

      const findMappedReport = createMappedReportFinder(mockMappedReports);

      (userRepository.findUserById as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(reportRepository, 'findByAssigneeId').mockResolvedValue(mockReports);
      (mapReportEntityToReportResponse as jest.Mock).mockImplementation(findMappedReport);

      // Act
      const result = await reportService.getMyAssignedReports(userId);

      // Assert
      expect(userRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(reportRepository.findByAssigneeId).toHaveBeenCalledWith(userId, undefined, undefined);
      expect(reportRepository.findByAssigneeId).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(3);
      expect(mapReportEntityToReportResponse).toHaveBeenCalledTimes(3);
    });

    it('should return empty array when user has no assigned reports', async () => {
      // Arrange
      const userId = 50;
      const mockUser = createMockMunicipalityUser('Water Network staff member', 'Water Network');
      (userRepository.findUserById as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(reportRepository, 'findByAssigneeId').mockResolvedValue([]);

      // Act
      const result = await reportService.getMyAssignedReports(userId);

      // Assert
      expect(userRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(reportRepository.findByAssigneeId).toHaveBeenCalledWith(userId, undefined, undefined);
      expect(result).toHaveLength(0);
      expect(mapReportEntityToReportResponse).not.toHaveBeenCalled();
    });

    it('should call repository with correct userId parameter', async () => {
      // Arrange
      const userId = 123;
      const mockUser = createMockMunicipalityUser('Water Network staff member', 'Water Network');
      (userRepository.findUserById as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(reportRepository, 'findByAssigneeId').mockResolvedValue([]);

      // Act
      await reportService.getMyAssignedReports(userId);

      // Assert
      const findByAssigneeIdCall = (reportRepository.findByAssigneeId as jest.Mock).mock.calls[0];
      expect(typeof findByAssigneeIdCall[0]).toBe('number');
      expect(findByAssigneeIdCall[0]).toBe(userId);
    });

    it('should return only ASSIGNED reports when status filter is ASSIGNED', async () => {
      // Arrange
      const userId = 50;
      const mockUser = createMockMunicipalityUser('Water Network staff member', 'Water Network');
      const status = ReportStatus.ASSIGNED;
      const mockReports: ReportEntity[] = [
        createMockReport({ id: 1, assigneeId: userId, status: ReportStatus.ASSIGNED }),
        createMockReport({ id: 2, assigneeId: userId, status: ReportStatus.ASSIGNED }),
      ];

      const mockMappedReports = mockReports.map(mapReportToIdAndStatus);
      const findMappedReport = createMappedReportFinder(mockMappedReports);

      (userRepository.findUserById as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(reportRepository, 'findByAssigneeId').mockResolvedValue(mockReports);
      (mapReportEntityToReportResponse as jest.Mock).mockImplementation(findMappedReport);

      // Act
      const result = await reportService.getMyAssignedReports(userId, status);

      // Assert
      expect(reportRepository.findByAssigneeId).toHaveBeenCalledWith(userId, ReportStatus.ASSIGNED, undefined);
      expect(result).toHaveLength(2);
      expect(result.every(r => r.status === ReportStatus.ASSIGNED)).toBe(true);
    });

    it('should return only IN_PROGRESS reports when status filter is IN_PROGRESS', async () => {
      // Arrange
      const userId = 50;
      const mockUser = createMockMunicipalityUser('Water Network staff member', 'Water Network');
      const status = ReportStatus.IN_PROGRESS;
      const mockReports: ReportEntity[] = [
        createMockReport({ id: 1, assigneeId: userId, status: ReportStatus.IN_PROGRESS }),
        createMockReport({ id: 3, assigneeId: userId, status: ReportStatus.IN_PROGRESS }),
      ];

      const mockMappedReports = mockReports.map(mapReportToIdAndStatus);
      const findMappedReport = createMappedReportFinder(mockMappedReports);

      (userRepository.findUserById as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(reportRepository, 'findByAssigneeId').mockResolvedValue(mockReports);
      (mapReportEntityToReportResponse as jest.Mock).mockImplementation(findMappedReport);

      // Act
      const result = await reportService.getMyAssignedReports(userId, status);

      // Assert
      expect(reportRepository.findByAssigneeId).toHaveBeenCalledWith(userId, ReportStatus.IN_PROGRESS, undefined);
      expect(result).toHaveLength(2);
      expect(result.every(r => r.status === ReportStatus.IN_PROGRESS)).toBe(true);
    });

    it('should return only RESOLVED reports when status filter is RESOLVED', async () => {
      // Arrange
      const userId = 50;
      const mockUser = createMockMunicipalityUser('Water Network staff member', 'Water Network');
      const status = ReportStatus.RESOLVED;
      const mockReports: ReportEntity[] = [
        createMockReport({ id: 1, assigneeId: userId, status: ReportStatus.RESOLVED }),
        createMockReport({ id: 2, assigneeId: userId, status: ReportStatus.RESOLVED }),
      ];

      const mockMappedReports = mockReports.map(mapReportToIdAndStatus);
      const findMappedReport = createMappedReportFinder(mockMappedReports);

      (userRepository.findUserById as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(reportRepository, 'findByAssigneeId').mockResolvedValue(mockReports);
      (mapReportEntityToReportResponse as jest.Mock).mockImplementation(findMappedReport);

      // Act
      const result = await reportService.getMyAssignedReports(userId, status);

      // Assert
      expect(reportRepository.findByAssigneeId).toHaveBeenCalledWith(userId, ReportStatus.RESOLVED, undefined);
      expect(result).toHaveLength(2);
      expect(result.every(r => r.status === ReportStatus.RESOLVED)).toBe(true);
    });

    it('should return empty array when no reports match the status filter', async () => {
      // Arrange
      const userId = 50;
      const mockUser = createMockMunicipalityUser('Water Network staff member', 'Water Network');
      const status = ReportStatus.ASSIGNED;
      (userRepository.findUserById as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(reportRepository, 'findByAssigneeId').mockResolvedValue([]);

      // Act
      const result = await reportService.getMyAssignedReports(userId, status);

      // Assert
      expect(reportRepository.findByAssigneeId).toHaveBeenCalledWith(userId, status, undefined);
      expect(result).toHaveLength(0);
    });

    it('should return reports for a specific category', async () => {
      // Arrange
      const userId = 50;
      const mockUser = createMockMunicipalityUser('Water Network staff member', 'Water Network');
      const mockReports: ReportEntity[] = [
        createMockReport({ id: 1, assigneeId: userId, category: ReportCategory.ROADS }),
        createMockReport({ id: 2, assigneeId: userId, category: ReportCategory.ROADS }),
      ];

      const mockMappedReports = mockReports.map(mapReportToIdAndCategory);
      const findMappedReport = createMappedReportFinder(mockMappedReports);

      (userRepository.findUserById as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(reportRepository, 'findByAssigneeId').mockResolvedValue(mockReports);
      (mapReportEntityToReportResponse as jest.Mock).mockImplementation(findMappedReport);

      // Act
      const result = await reportService.getMyAssignedReports(userId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result.every(r => r.category === ReportCategory.ROADS)).toBe(true);
    });

    it('should call mapper for each report entity', async () => {
      // Arrange
      const userId = 50;
      const mockUser = createMockMunicipalityUser('Water Network staff member', 'Water Network');
      const mockReports: ReportEntity[] = [
        createMockReport({ id: 1, assigneeId: userId }),
        createMockReport({ id: 2, assigneeId: userId }),
        createMockReport({ id: 3, assigneeId: userId }),
      ];

      (userRepository.findUserById as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(reportRepository, 'findByAssigneeId').mockResolvedValue(mockReports);
      (mapReportEntityToReportResponse as jest.Mock).mockReturnValue({});

      // Act
      await reportService.getMyAssignedReports(userId);

      // Assert
      expect(mapReportEntityToReportResponse).toHaveBeenCalledTimes(3);
      expect(mapReportEntityToReportResponse).toHaveBeenNthCalledWith(1, mockReports[0], undefined);
      expect(mapReportEntityToReportResponse).toHaveBeenNthCalledWith(2, mockReports[1], undefined);
      expect(mapReportEntityToReportResponse).toHaveBeenNthCalledWith(3, mockReports[2], undefined);
    });

    it('should return mapped responses', async () => {
      // Arrange
      const userId = 50;
      const mockUser = createMockMunicipalityUser('Water Network staff member', 'Water Network');
      const mockReports: ReportEntity[] = [
        createMockReport({ id: 1, assigneeId: userId, title: 'Report 1' }),
      ];

      const mockMappedResponse = {
        id: 1,
        title: 'Report 1',
        status: ReportStatus.ASSIGNED,
        category: ReportCategory.ROADS,
      };

      (userRepository.findUserById as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(reportRepository, 'findByAssigneeId').mockResolvedValue(mockReports);
      (mapReportEntityToReportResponse as jest.Mock).mockReturnValue(mockMappedResponse);

      // Act
      const result = await reportService.getMyAssignedReports(userId);

      // Assert
      expect(result[0]).toEqual(mockMappedResponse);
    });

    it('should propagate repository errors', async () => {
      // Arrange
      const userId = 50;
      const mockUser = createMockMunicipalityUser('Water Network staff member', 'Water Network');
      const error = new Error('Database connection error');
      (userRepository.findUserById as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(reportRepository, 'findByAssigneeId').mockRejectedValue(error);

      // Act & Assert
      await expect(reportService.getMyAssignedReports(userId))
        .rejects
        .toThrow('Database connection error');
    });

    it('should propagate mapper errors', async () => {
      // Arrange
      const userId = 50;
      const mockUser = createMockMunicipalityUser('Water Network staff member', 'Water Network');
      const mockReports: ReportEntity[] = [createMockReport({ id: 1, assigneeId: userId })];

      const mapperErrorImplementation = () => {
        throw new Error('Mapping error');
      };

      (userRepository.findUserById as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(reportRepository, 'findByAssigneeId').mockResolvedValue(mockReports);
      (mapReportEntityToReportResponse as jest.Mock).mockImplementation(mapperErrorImplementation);

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

    it('should handle reports with anonymous reporters', async () => {
      // Arrange
      const userId = 50;
      const mockUser = createMockMunicipalityUser('Water Network staff member', 'Water Network');
      const mockReports: ReportEntity[] = [
        createMockReport({
          id: 1,
          assigneeId: userId,
          isAnonymous: true,
          reporterId: null as any,
          reporter: null as any
        }),
      ];

      const mockMappedReports = [{ id: 1, isAnonymous: true }];

      (userRepository.findUserById as jest.Mock).mockResolvedValue(mockUser);
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
      const mockUser = createMockMunicipalityUser('Water Network staff member', 'Water Network');

      // Mock should only return reports for the requested user
      const mockReports: ReportEntity[] = [
        createMockReport({ id: 1, assigneeId: userId }),
        createMockReport({ id: 2, assigneeId: userId }),
      ];

      (userRepository.findUserById as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(reportRepository, 'findByAssigneeId').mockResolvedValue(mockReports);
      (mapReportEntityToReportResponse as jest.Mock).mockImplementation((report) => ({
        id: report.id,
        assigneeId: report.assigneeId
      }));

      // Act
      const result = await reportService.getMyAssignedReports(userId);

      // Assert
      expect(reportRepository.findByAssigneeId).toHaveBeenCalledWith(userId, undefined, undefined);
      expect(result.every(r => r.assigneeId === userId)).toBe(true);
    });

    it('should handle large number of assigned reports', async () => {
      // Arrange
      const userId = 50;
      const mockUser = createMockMunicipalityUser('Water Network staff member', 'Water Network');
      const mockReports: ReportEntity[] = Array.from({ length: 100 }, (_, i) =>
        createMockReport({ id: i + 1, assigneeId: userId })
      );

      (userRepository.findUserById as jest.Mock).mockResolvedValue(mockUser);
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

    it('should call findByExternalAssigneeId when user is an External Service Provider', async () => {
      // Arrange
      const userId = 77;
      const mockUser = createMockUserWithRole('External Maintainer', 'External Service Providers', {
        id: userId
      });

      const mockReports: ReportEntity[] = [
        createMockReport({ id: 1, assigneeId: userId }),
        createMockReport({ id: 2, assigneeId: userId })
      ];

      const mockMappedReports = mockReports.map(mapReportToId);
      const findMappedReport = createMappedReportFinder(mockMappedReports);

      (userRepository.findUserById as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(reportRepository, 'findByExternalAssigneeId').mockResolvedValue(mockReports);
      jest.spyOn(reportRepository, 'findByAssigneeId');
      (mapReportEntityToReportResponse as jest.Mock).mockImplementation(findMappedReport);

      // Act
      const result = await reportService.getMyAssignedReports(userId);

      // Assert
      expect(userRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(reportRepository.findByExternalAssigneeId).toHaveBeenCalledWith(userId, undefined, undefined);
      expect(reportRepository.findByAssigneeId).not.toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(mapReportEntityToReportResponse).toHaveBeenCalledTimes(2);
    });
  });

  describe('getAssignedReportsToExternalMaintainer', () => {
    const externalMaintainerId = 50;
    const mockReportAssigned: ReportEntity = createMockReport({
      id: 1,
      assigneeId: externalMaintainerId,
      status: ReportStatus.ASSIGNED
    });
    const mockReportInProgress: ReportEntity = createMockReport({
      id: 2,
      assigneeId: externalMaintainerId,
      status: ReportStatus.IN_PROGRESS
    });
    const mockReportResolved: ReportEntity = createMockReport({
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
      const mockReports: ReportEntity[] = [mockReportAssigned, mockReportInProgress, mockReportResolved];
      const mapperImplementation = (report: any) => {
        if (report.id === 1) return mockMappedReportAssigned;
        if (report.id === 2) return mockMappedReportInProgress;
        if (report.id === 3) return mockMappedReportResolved;
        return {};
      };

      jest.spyOn(reportRepository, 'findByExternalAssigneeId').mockResolvedValue(mockReports);
      (mapReportEntityToReportResponse as jest.Mock).mockImplementation(mapperImplementation);

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
      const mockReports: ReportEntity[] = [mockReportAssigned];
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
      const mockReports: ReportEntity[] = [mockReportAssigned];
      const mapperErrorImplementation = () => {
        throw new Error('Mapping failed');
      };

      jest.spyOn(reportRepository, 'findByExternalAssigneeId').mockResolvedValue(mockReports);
      (mapReportEntityToReportResponse as jest.Mock).mockImplementation(mapperErrorImplementation);

      // Act & Assert
      await expect(reportService.getAssignedReportsToExternalMaintainer(externalMaintainerId))
        .rejects
        .toThrow('Mapping failed');
    });
  });


describe('ReportService additional unit tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMapReports', () => {
    it('should return individual reports when zoom is greater than threshold', async () => {
      const params = { zoom: 15, minLat: 45, maxLat: 46, minLng: 7, maxLng: 8, category: 'Waste' };
      const mockReports = [{ id: 1, title: 'Report 1' }];
      jest.spyOn(reportRepository, 'getApprovedReportsForMap').mockResolvedValue(mockReports as any);

      const result = await reportService.getMapReports(params);

      expect(reportRepository.getApprovedReportsForMap).toHaveBeenCalledWith({
        minLat: 45,
        maxLat: 46,
        minLng: 7,
        maxLng: 8,
        category: ReportCategory.WASTE
      });
      expect(result).toBe(mockReports);
    });

    it('should return individual reports when no zoom is provided', async () => {
      const params = { minLat: 45, maxLat: 46, minLng: 7, maxLng: 8 };
      const mockReports = [{ id: 1, title: 'Report 1' }];
      jest.spyOn(reportRepository, 'getApprovedReportsForMap').mockResolvedValue(mockReports as any);

      const result = await reportService.getMapReports(params);

      expect(reportRepository.getApprovedReportsForMap).toHaveBeenCalledWith({
        minLat: 45,
        maxLat: 46,
        minLng: 7,
        maxLng: 8,
        category: undefined
      });
      expect(result).toBe(mockReports);
    });

    it('should return clustered reports when zoom is less than or equal to threshold', async () => {
      const params = { zoom: 10, minLat: 45, maxLat: 46, minLng: 7, maxLng: 8 };
      const mockClusters = [{ id: 1, count: 5 }];
      jest.spyOn(reportRepository, 'getClusteredReports').mockResolvedValue(mockClusters as any);

      const result = await reportService.getMapReports(params);

      expect(reportRepository.getClusteredReports).toHaveBeenCalledWith(10, {
        minLat: 45,
        maxLat: 46,
        minLng: 7,
        maxLng: 8,
        category: undefined
      });
      expect(result).toBe(mockClusters);
    });

    it('should return clustered reports when zoom equals threshold', async () => {
      const params = { zoom: 12, minLat: 45, maxLat: 46, minLng: 7, maxLng: 8 };
      const mockClusters = [{ id: 1, count: 5 }];
      jest.spyOn(reportRepository, 'getClusteredReports').mockResolvedValue(mockClusters as any);

      const result = await reportService.getMapReports(params);

      expect(reportRepository.getClusteredReports).toHaveBeenCalledWith(12, {
        minLat: 45,
        maxLat: 46,
        minLng: 7,
        maxLng: 8,
        category: undefined
      });
      expect(result).toBe(mockClusters);
    });
  });

  describe('getAllCategories', () => {
    it('returns all enum values', async () => {
      const result = await reportService.getAllCategories();
      expect(result).toEqual(Object.values(ReportCategory));
    });
  });

  describe('getReportById', () => {
    it('should throw NotFoundError when report is missing', async () => {
      jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(null as any);
      await expect(reportService.getReportById(1)).rejects.toThrow('Report not found');
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
      const photos = [{ id: 1, storage_url: 'uploads/reports/1/photo1.png' } as any];
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
      userRoles: [{
        id: 1,
        userId: 1,
        departmentRoleId: 1,
        departmentRole: {
          id: 1,
          departmentId: 1,
          roleId: 1,
          department: { id: 1, name: 'Organization', departmentRoles: [] },
          role: { id: 1, name: roleName, description: '', departmentRoles: [] },
          userRoles: []
        },
        createdAt: new Date()
      }]
    }) as unknown as UserEntity;

    it('throws UnauthorizedError when user not found', async () => {
      (userRepository.findUserById as jest.Mock).mockResolvedValue(null);
      await expect(reportService.getAllReports(999)).rejects.toThrow(UnauthorizedError);
    });

    it('throws UnauthorizedError when user role missing', async () => {
      (userRepository.findUserById as jest.Mock).mockResolvedValue({ id: 1 } as UserEntity);
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
    // Using createMockUserWithRole from mockEntities for multi-role support

    beforeEach(() => {
      jest.clearAllMocks();
    });

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
      const mockUser = createMockUserWithRole('Citizen');
      mockUser.userRoles = [];  // Clear userRoles to simulate no role

      jest.spyOn(userRepository, 'findUserById').mockResolvedValue(mockUser);

      await expect(reportService.getAllReports(1))
        .rejects
        .toThrow(UnauthorizedError);

      await expect(reportService.getAllReports(1))
        .rejects
        .toThrow('User has no roles assigned');
    });

    it('should throw InsufficientRightsError when non-PRO user tries to view pending reports', async () => {
      const mockUser = createMockUserWithRole('Technical Staff');
      jest.spyOn(userRepository, 'findUserById').mockResolvedValue(mockUser);

      await expect(
        reportService.getAllReports(1, ReportStatus.PENDING_APPROVAL)
      ).rejects.toThrow(InsufficientRightsError);

      await expect(
        reportService.getAllReports(1, ReportStatus.PENDING_APPROVAL)
      ).rejects.toThrow('Only Municipal Public Relations Officers can view pending reports');
    });

    it('should allow PRO to view pending reports', async () => {
      const mockUser = createMockUserWithRole('Municipal Public Relations Officer');
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

    it('should return reports filtered by status', async () => {
      const mockUser = createMockUserWithRole('Municipal Public Relations Officer');
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
      const mockUser = createMockUserWithRole('Technical Staff');
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

    it('should return reports filtered by category', async () => {
      const mockUser = createMockUserWithRole('Technical Staff');
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
      const mockUser = createMockUserWithRole('Municipal Public Relations Officer');
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

    it('should return all accessible reports for PRO', async () => {
      const mockUser = createMockUserWithRole('Municipal Public Relations Officer');
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
      const mockUser = createMockUserWithRole('Technical Staff');

      jest.spyOn(userRepository, 'findUserById').mockResolvedValue(mockUser);
      jest.spyOn(reportRepository, 'findAllReports').mockResolvedValue([]);

      const result = await reportService.getAllReports(1);

      expect(result).toHaveLength(0);
    });
  });

  describe('updateReportStatus', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should throw BadRequestError for invalid report ID (Number.NaN) when approving', async () => {
      const mockUser = createMockUserWithRole('Municipal Public Relations Officer', undefined, { id: 1 });
      jest.spyOn(userRepository, 'findUserById').mockResolvedValue(mockUser);

      await expect(
        reportService.updateReportStatus(Number.NaN, ReportStatus.ASSIGNED, {}, 1)
      ).rejects.toThrow(BadRequestError);

      await expect(
        reportService.updateReportStatus(Number.NaN, ReportStatus.ASSIGNED, {}, 1)
      ).rejects.toThrow('Invalid report ID');
    });

    it('should throw NotFoundError when report does not exist for approval', async () => {
      const mockUser = createMockUserWithRole('Municipal Public Relations Officer', undefined, { id: 1 });
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
      const mockUser = createMockUserWithRole('Municipal Public Relations Officer', undefined, { id: 1 });
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
      const mockUser = createMockUserWithRole('Citizen', undefined, { id: 1 });
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
      const mockUser = createMockUserWithRole('Municipal Public Relations Officer', undefined, { id: 1 });
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
      const mockUser = createMockUserWithRole('Municipal Public Relations Officer', undefined, { id: 1 });
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

    it('should throw BadRequestError for invalid report ID (Number.NaN) when rejecting', async () => {
      const mockUser = createMockUserWithRole('Municipal Public Relations Officer', undefined, { id: 1 });
      jest.spyOn(userRepository, 'findUserById').mockResolvedValue(mockUser);

      await expect(
        reportService.updateReportStatus(Number.NaN, ReportStatus.REJECTED, { rejectionReason: 'Test reason' }, 1)
      ).rejects.toThrow(BadRequestError);
      await expect(
        reportService.updateReportStatus(Number.NaN, ReportStatus.REJECTED, { rejectionReason: 'Test reason' }, 1)
      ).rejects.toThrow('Invalid report ID');
    });

    it('should throw BadRequestError when rejection reason is empty string', async () => {
      const mockReport = createMockReport({
        id: 1,
        status: ReportStatus.PENDING_APPROVAL
      });

      const mockUser = createMockUserWithRole('Municipal Public Relations Officer', undefined, { id: 1 });
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

      const mockUser = createMockUserWithRole('Municipal Public Relations Officer', undefined, { id: 1 });
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

      const mockUser = createMockUserWithRole('Citizen', undefined, { id: 1 });
      jest.spyOn(userRepository, 'findUserById').mockResolvedValue(mockUser);
      jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);

      await expect(
        reportService.updateReportStatus(1, ReportStatus.REJECTED, { rejectionReason: 'Test reason' }, 1)
      ).rejects.toThrow(InsufficientRightsError);
    });

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
    const mockExternalMaintainer = createMockUserWithRole('External Maintainer', undefined, { id: externalMaintainerId });
    const mockTechnicalManager = createMockUserWithRole('Technical Manager', undefined, { id: technicalManagerId });
    const mockTechnicalAssistant = createMockUserWithRole('Technical Assistant', undefined, { id: technicalAssistantId });
    const mockCitizen = createMockUserWithRole('Citizen', undefined, { id: citizenId });
    const mockPRO = createMockUserWithRole('Municipal Public Relations Officer', undefined, { id: proId });

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

      const anotherExternalMaintainer = createMockUserWithRole('External Maintainer', undefined, { id: 99 });
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

    it('should throw BadRequestError for invalid report ID (Number.NaN)', async () => {

      jest.spyOn(userRepository, 'findUserById').mockResolvedValue(mockTechnicalManager);

      await expect(
        reportService.updateReportStatus(Number.NaN, ReportStatus.RESOLVED, {}, technicalManagerId)
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

  describe('assignToExternalMaintainer', () => {
    const reportId = 1;
    const technicalStaffId = 10;
    const externalMaintainerId = 20;
    const nonTechnicalUserId = 30;

    const mockTechnicalStaff = createMockUserWithRole('Technical Staff', undefined, { id: technicalStaffId });
    const mockExternalMaintainer = createMockUserWithRole('External Maintainer', 'External Service Providers', {
      id: externalMaintainerId,
      companyId: 5,
    });
    const mockNonTechnicalUser = createMockUserWithRole('Citizen', undefined, { id: nonTechnicalUserId });

    const mockReport = createMockReport({
      id: reportId,
      status: ReportStatus.ASSIGNED,
      category: ReportCategory.ROADS,
    });

    const mockCompany = {
      id: 5,
      name: 'Roads Inc.',
      category: ReportCategory.ROADS,
    };

    beforeEach(() => {
      jest.clearAllMocks();
      // Restore mock report to its original state before each test
      mockReport.status = ReportStatus.ASSIGNED;
    });

    it('should successfully assign a report to an external maintainer', async () => {
      // Arrange
      jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
      jest.spyOn(userRepository, 'findUserById')
        .mockResolvedValueOnce(mockTechnicalStaff) // for authorizer
        .mockResolvedValueOnce(mockExternalMaintainer); // for assignee
      jest.spyOn(companyRepository, 'findById').mockResolvedValue(mockCompany as any);
      jest.spyOn(reportRepository, 'save').mockImplementation(async (report) => report);
      (mapperService.mapReportEntityToDTO as jest.Mock).mockImplementation((report) => ({
        external_assignee_id: report.externalAssigneeId,
      }));

      // Act
      const result = await reportService.assignToExternalMaintainer(reportId, externalMaintainerId, technicalStaffId);

      // Assert
      expect(reportRepository.findReportById).toHaveBeenCalledWith(reportId);
      expect(userRepository.findUserById).toHaveBeenCalledWith(technicalStaffId);
      expect(userRepository.findUserById).toHaveBeenCalledWith(externalMaintainerId);
      expect(companyRepository.findById).toHaveBeenCalledWith(mockExternalMaintainer.companyId);
      expect(reportRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: reportId,
        externalAssigneeId: externalMaintainerId,
      }));
      expect(result.external_assignee_id).toBe(externalMaintainerId);
    });

    it('should throw NotFoundError if report is not found', async () => {
      // Arrange
      jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(null);

      // Act & Assert
      await expect(
        reportService.assignToExternalMaintainer(999, externalMaintainerId, technicalStaffId)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw UnauthorizedError if user is not found', async () => {
      // Arrange
      jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
      jest.spyOn(userRepository, 'findUserById').mockResolvedValue(null);

      // Act & Assert
      await expect(
        reportService.assignToExternalMaintainer(reportId, externalMaintainerId, 999)
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw InsufficientRightsError if user is not technical staff', async () => {
      // Arrange
      jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
      jest.spyOn(userRepository, 'findUserById').mockResolvedValue(mockNonTechnicalUser);

      // Act & Assert
      await expect(
        reportService.assignToExternalMaintainer(reportId, externalMaintainerId, nonTechnicalUserId)
      ).rejects.toThrow(InsufficientRightsError);
    });

    it('should throw BadRequestError if report is not in ASSIGNED status', async () => {
      // Arrange
      mockReport.status = ReportStatus.IN_PROGRESS;
      jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
      jest.spyOn(userRepository, 'findUserById').mockResolvedValue(mockTechnicalStaff);

      // Act & Assert
      await expect(
        reportService.assignToExternalMaintainer(reportId, externalMaintainerId, technicalStaffId)
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw NotFoundError if assignee is not found', async () => {
      // Arrange
      jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
      jest.spyOn(userRepository, 'findUserById')
        .mockResolvedValueOnce(mockTechnicalStaff)
        .mockResolvedValueOnce(null);

      // Act & Assert
      await expect(
        reportService.assignToExternalMaintainer(reportId, 999, technicalStaffId)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw BadRequestError if assignee is not an External Maintainer', async () => {
      // Arrange
      jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
      jest.spyOn(userRepository, 'findUserById')
        .mockResolvedValueOnce(mockTechnicalStaff)
        .mockResolvedValueOnce(mockTechnicalStaff); // Assigning to another technical staff

      // Act & Assert
      await expect(
        reportService.assignToExternalMaintainer(reportId, technicalStaffId, technicalStaffId)
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError if external maintainer has no company', async () => {
      // Arrange
      const maintainerWithoutCompany = { ...mockExternalMaintainer, companyId: null };
      jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
      jest.spyOn(userRepository, 'findUserById')
        .mockResolvedValueOnce(mockTechnicalStaff)
        .mockResolvedValueOnce(maintainerWithoutCompany as any);

      // Act & Assert
      await expect(
        reportService.assignToExternalMaintainer(reportId, externalMaintainerId, technicalStaffId)
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError if maintainer company is not found', async () => {
      // Arrange
      jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
      jest.spyOn(userRepository, 'findUserById')
        .mockResolvedValueOnce(mockTechnicalStaff)
        .mockResolvedValueOnce(mockExternalMaintainer);
      jest.spyOn(companyRepository, 'findById').mockResolvedValue(null as any);

      // Act & Assert
      await expect(
        reportService.assignToExternalMaintainer(reportId, externalMaintainerId, technicalStaffId)
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw BadRequestError if maintainer's company does not handle the report category", async () => {
      // Arrange
      const wrongCategoryCompany = { ...mockCompany, category: ReportCategory.WASTE };
      jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
      jest.spyOn(userRepository, 'findUserById')
        .mockResolvedValueOnce(mockTechnicalStaff)
        .mockResolvedValueOnce(mockExternalMaintainer);
      jest.spyOn(companyRepository, 'findById').mockResolvedValue(wrongCategoryCompany as any);

      // Act & Assert
      await expect(
        reportService.assignToExternalMaintainer(reportId, externalMaintainerId, technicalStaffId)
      ).rejects.toThrow(BadRequestError);
    });

    it('should update the updatedAt field of the report', async () => {
      // Arrange
      const originalUpdatedAt = mockReport.updatedAt;
      jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
      jest.spyOn(userRepository, 'findUserById')
        .mockResolvedValueOnce(mockTechnicalStaff)
        .mockResolvedValueOnce(mockExternalMaintainer);
      jest.spyOn(companyRepository, 'findById').mockResolvedValue(mockCompany as any);
      jest.spyOn(reportRepository, 'save').mockImplementation(async (report) => {
        report.updatedAt = new Date();
        return report;
      });
      (mapperService.mapReportEntityToDTO as jest.Mock).mockImplementation((report) => report);

      // Act
      const result = await reportService.assignToExternalMaintainer(reportId, externalMaintainerId, technicalStaffId);

      // Assert
      expect(result.updated_at).not.toBe(originalUpdatedAt);
    });

    it('should update the assignee field of the report', async () => {
      // Arrange
      const updatedMockReport = { ...mockReport, externalAssigneeId: externalMaintainerId };
      jest.spyOn(reportRepository, 'findReportById')
        .mockResolvedValueOnce(mockReport)
        .mockResolvedValueOnce(updatedMockReport);
      jest.spyOn(userRepository, 'findUserById')
        .mockResolvedValueOnce(mockTechnicalStaff)
        .mockResolvedValueOnce(mockExternalMaintainer);
      jest.spyOn(companyRepository, 'findById').mockResolvedValue(mockCompany as any);
      (mapperService.mapReportEntityToDTO as jest.Mock).mockImplementation((report) => ({
        external_assignee_id: report.externalAssigneeId,
      }));

      // Act
      const result = await reportService.assignToExternalMaintainer(reportId, externalMaintainerId, technicalStaffId);

      // Assert
      expect(result.external_assignee_id).toBe(mockExternalMaintainer.id);
    });

    it('should throw UnauthorizedError if the user making the assignment is not found', async () => {
      // Arrange
      jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
      jest.spyOn(userRepository, 'findUserById').mockResolvedValue(null);

      // Act & Assert
      await expect(
        reportService.assignToExternalMaintainer(reportId, externalMaintainerId, 999)
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('Internal Comments', () => {
    const { commentRepository } = require('@repositories/commentRepository');
    const { InsufficientRightsError } = require('@models/errors/InsufficientRightsError');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('getInternalComments', () => {
      it('should return comments for existing report', async () => {
        const mockReport = createMockReport({ id: 10 });
        const mockComments = [
          {
            id: 1,
            reportId: 10,
            content: 'Test comment',
            author: {
              id: 1,
              username: 'testuser',
              firstName: 'Test',
              lastName: 'User',
              departmentRole: {
                role: { name: 'Staff Member' }
              }
            },
            createdAt: new Date('2024-01-15T10:00:00Z')
          }
        ];

        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
        jest.spyOn(commentRepository, 'getCommentsByReportId').mockResolvedValue(mockComments);

        const result = await reportService.getInternalComments(10);

        expect(reportRepository.findReportById).toHaveBeenCalledWith(10);
        expect(commentRepository.getCommentsByReportId).toHaveBeenCalledWith(10);
        expect(result).toHaveLength(1);
        expect(result[0]).toHaveProperty('id', 1);
        expect(result[0]).toHaveProperty('content', 'Test comment');
        expect(result[0]).toHaveProperty('author');
        expect(result[0].author).toHaveProperty('username', 'testuser');
      });

      it('should throw NotFoundError if report does not exist', async () => {
        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(null);

        await expect(reportService.getInternalComments(999))
          .rejects
          .toThrow(NotFoundError);

        expect(reportRepository.findReportById).toHaveBeenCalledWith(999);
        expect(commentRepository.getCommentsByReportId).not.toHaveBeenCalled();
      });

      it('should return empty array if report has no comments', async () => {
        const mockReport = createMockReport({ id: 10 });
        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
        jest.spyOn(commentRepository, 'getCommentsByReportId').mockResolvedValue([]);

        const result = await reportService.getInternalComments(10);

        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
      });

      it('should map comments to response DTOs correctly', async () => {
        const mockReport = createMockReport({ id: 10 });
        const mockComments = [
          {
            id: 1,
            reportId: 10,
            content: 'Comment 1',
            author: {
              id: 1,
              username: 'user1',
              firstName: 'First',
              lastName: 'User',
              userRoles: [{
                id: 1,
                userId: 1,
                departmentRoleId: 1,
                departmentRole: {
                  id: 1,
                  departmentId: 1,
                  roleId: 1,
                  department: { id: 1, name: 'Organization', departmentRoles: [] },
                  role: { id: 1, name: 'Role1', description: '', departmentRoles: [] },
                  userRoles: []
                },
                createdAt: new Date()
              }]
            },
            createdAt: new Date('2024-01-15T10:00:00Z')
          },
          {
            id: 2,
            reportId: 10,
            content: 'Comment 2',
            author: {
              id: 2,
              username: 'user2',
              firstName: 'Second',
              lastName: 'User',
              userRoles: [{
                id: 2,
                userId: 2,
                departmentRoleId: 2,
                departmentRole: {
                  id: 2,
                  departmentId: 1,
                  roleId: 2,
                  department: { id: 1, name: 'Organization', departmentRoles: [] },
                  role: { id: 2, name: 'Role2', description: '', departmentRoles: [] },
                  userRoles: []
                },
                createdAt: new Date()
              }]
            },
            createdAt: new Date('2024-01-15T11:00:00Z')
          }
        ];

        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
        jest.spyOn(commentRepository, 'getCommentsByReportId').mockResolvedValue(mockComments);

        const result = await reportService.getInternalComments(10);

        expect(result).toHaveLength(2);
        expect(result[0].reportId).toBe(10);
        expect(result[0].author.role).toBe('Role1');
        expect(result[1].author.role).toBe('Role2');
      });
    });

    describe('addInternalComment', () => {
      it('should add comment successfully', async () => {
        const mockReport = createMockReport({ id: 10 });
        const mockUser = createMockUserWithRole('Water Network staff member', 'Water and Sewer Services Department', { id: 1, username: 'testuser' });
        const mockCreatedComment = {
          id: 5,
          reportId: 10,
          content: 'New comment',
          author: mockUser,
          createdAt: new Date()
        };

        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
        jest.spyOn(commentRepository, 'createComment').mockResolvedValue(mockCreatedComment);

        const result = await reportService.addInternalComment(10, 1, 'New comment');

        expect(reportRepository.findReportById).toHaveBeenCalledWith(10);
        expect(commentRepository.createComment).toHaveBeenCalledWith(10, 1, 'New comment');
        expect(result).toHaveProperty('id', 5);
        expect(result).toHaveProperty('content', 'New comment');
      });

      it('should throw NotFoundError if report does not exist', async () => {
        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(null);

        await expect(reportService.addInternalComment(999, 1, 'Test'))
          .rejects
          .toThrow(NotFoundError);

        expect(commentRepository.createComment).not.toHaveBeenCalled();
      });

      it('should throw BadRequestError for empty content', async () => {
        const mockReport = createMockReport({ id: 10 });
        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);

        await expect(reportService.addInternalComment(10, 1, ''))
          .rejects
          .toThrow(BadRequestError);

        expect(commentRepository.createComment).not.toHaveBeenCalled();
      });

      it('should throw BadRequestError for whitespace-only content', async () => {
        const mockReport = createMockReport({ id: 10 });
        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);

        await expect(reportService.addInternalComment(10, 1, '   '))
          .rejects
          .toThrow(BadRequestError);

        expect(commentRepository.createComment).not.toHaveBeenCalled();
      });

      it('should throw BadRequestError for content exceeding max length', async () => {
        const mockReport = createMockReport({ id: 10 });
        const longContent = 'a'.repeat(2001);
        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);

        await expect(reportService.addInternalComment(10, 1, longContent))
          .rejects
          .toThrow(BadRequestError);

        expect(commentRepository.createComment).not.toHaveBeenCalled();
      });

      it('should accept content at max length (2000 chars)', async () => {
        const mockReport = createMockReport({ id: 10 });
        const mockUser = createMockUserWithRole('Water Network staff member', 'Water and Sewer Services Department', { id: 1 });
        const maxContent = 'a'.repeat(2000);
        const mockCreatedComment = {
          id: 1,
          reportId: 10,
          content: maxContent,
          author: mockUser,
          createdAt: new Date()
        };

        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
        jest.spyOn(commentRepository, 'createComment').mockResolvedValue(mockCreatedComment);

        const result = await reportService.addInternalComment(10, 1, maxContent);

        expect(result.content).toBe(maxContent);
        expect(commentRepository.createComment).toHaveBeenCalled();
      });

      it('should trim whitespace from content', async () => {
        const mockReport = createMockReport({ id: 10 });
        const mockUser = createMockUserWithRole('Water Network staff member', 'Water and Sewer Services Department', { id: 1 });
        const mockCreatedComment = {
          id: 1,
          reportId: 10,
          content: 'Trimmed content',
          author: mockUser,
          createdAt: new Date()
        };

        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
        jest.spyOn(commentRepository, 'createComment').mockResolvedValue(mockCreatedComment);

        await reportService.addInternalComment(10, 1, '  Trimmed content  ');

        expect(commentRepository.createComment).toHaveBeenCalledWith(10, 1, 'Trimmed content');
      });
    });

    describe('deleteInternalComment', () => {
      it('should delete own comment successfully', async () => {
        const mockReport = createMockReport({ id: 10 });
        const mockComment = {
          id: 5,
          reportId: 10,
          authorId: 1,
          content: 'Comment to delete',
          author: { id: 1 }
        };

        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
        jest.spyOn(commentRepository, 'getCommentById').mockResolvedValue(mockComment);
        jest.spyOn(commentRepository, 'deleteComment').mockResolvedValue(undefined);

        await reportService.deleteInternalComment(10, 5, 1);

        expect(reportRepository.findReportById).toHaveBeenCalledWith(10);
        expect(commentRepository.getCommentById).toHaveBeenCalledWith(5);
        expect(commentRepository.deleteComment).toHaveBeenCalledWith(5);
      });

      it('should throw NotFoundError if report does not exist', async () => {
        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(null);

        await expect(reportService.deleteInternalComment(999, 5, 1))
          .rejects
          .toThrow(NotFoundError);

        expect(commentRepository.getCommentById).not.toHaveBeenCalled();
        expect(commentRepository.deleteComment).not.toHaveBeenCalled();
      });

      it('should throw NotFoundError if comment does not exist', async () => {
        const mockReport = createMockReport({ id: 10 });
        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
        jest.spyOn(commentRepository, 'getCommentById').mockResolvedValue(null);

        await expect(reportService.deleteInternalComment(10, 999, 1))
          .rejects
          .toThrow(NotFoundError);

        expect(commentRepository.deleteComment).not.toHaveBeenCalled();
      });

      it('should throw BadRequestError if comment does not belong to report', async () => {
        const mockReport = createMockReport({ id: 10 });
        const mockComment = {
          id: 5,
          reportId: 20, // Different report ID
          authorId: 1,
          content: 'Comment',
          author: { id: 1 }
        };

        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
        jest.spyOn(commentRepository, 'getCommentById').mockResolvedValue(mockComment);

        await expect(reportService.deleteInternalComment(10, 5, 1))
          .rejects
          .toThrow(BadRequestError);

        expect(commentRepository.deleteComment).not.toHaveBeenCalled();
      });

      it('should throw InsufficientRightsError when trying to delete someone else\'s comment', async () => {
        const mockReport = createMockReport({ id: 10 });
        const mockComment = {
          id: 5,
          reportId: 10,
          authorId: 2, // Different author
          content: 'Comment',
          author: { id: 2 }
        };

        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
        jest.spyOn(commentRepository, 'getCommentById').mockResolvedValue(mockComment);

        await expect(reportService.deleteInternalComment(10, 5, 1))
          .rejects
          .toThrow(InsufficientRightsError);

        expect(commentRepository.deleteComment).not.toHaveBeenCalled();
      });
    });
  });

  describe('getReportByAddress', () => {
    it('should return reports found by address', async () => {
      const mockReports = [createMockReport()];
      const mockMappedReports = [mapReportEntityToReportResponse(createMockReport())];

      jest.spyOn(reportRepository, 'findReportsByAddress').mockResolvedValue(mockReports);
      (reportService as any).mapReportsWithCompanyNames = jest.fn().mockResolvedValue(mockMappedReports);

      const result = await reportService.getReportByAddress('Via Roma 1');

      expect(reportRepository.findReportsByAddress).toHaveBeenCalledWith('Via Roma 1');
      expect((reportService as any).mapReportsWithCompanyNames).toHaveBeenCalledWith(mockReports);
      expect(result).toEqual(mockMappedReports);
    });

    it('should return empty array when no reports found', async () => {
      jest.spyOn(reportRepository, 'findReportsByAddress').mockResolvedValue([]);
      (reportService as any).mapReportsWithCompanyNames = jest.fn().mockResolvedValue([]);

      const result = await reportService.getReportByAddress('Nonexistent Address');

      expect(reportRepository.findReportsByAddress).toHaveBeenCalledWith('Nonexistent Address');
      expect((reportService as any).mapReportsWithCompanyNames).toHaveBeenCalledWith([]);
      expect(result).toEqual([]);
    });
  });

  describe('sendMessage', () => {
    const mockMessage = {
      id: 1,
      reportId: 1,
      senderId: 1,
      content: 'Test message',
      createdAt: new Date(),
      report: {} as any,
      sender: {} as any,
    };

    const mockMessageResponse = {
      id: 1,
      reportId: 1,
      author: {
        id: 1,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: 'TECHNICAL_STAFF',
      },
      content: 'Test message',
      createdAt: new Date(),
    };

    beforeEach(() => {
      jest.spyOn(messageRepository, 'createMessage').mockResolvedValue(mockMessage);
      jest.spyOn(mapperService, 'mapMessageToResponse').mockReturnValue(mockMessageResponse);
    });

    it('should send message successfully', async () => {
      const mockReport = createMockReport({ assigneeId: 1, reporterId: 2 });

      jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
      (createNotification as jest.MockedFunction<typeof createNotification>).mockResolvedValue({} as any);

      const result = await reportService.sendMessage(1, 1, 'Test message content');

      expect(reportRepository.findReportById).toHaveBeenCalledWith(1);
      expect(messageRepository.createMessage).toHaveBeenCalledWith(1, 1, 'Test message content');
      expect(createNotification).toHaveBeenCalledWith({
        userId: 2,
        reportId: 1,
        content: 'You have a new message for report "Test Report"',
      });
      expect(mapperService.mapMessageToResponse).toHaveBeenCalledWith(mockMessage);
      expect(result).toEqual(mockMessageResponse);
    });

    it('should throw BadRequestError for empty content', async () => {
      await expect(reportService.sendMessage(1, 1, ''))
        .rejects
        .toThrow(BadRequestError);
      await expect(reportService.sendMessage(1, 1, '   '))
        .rejects
        .toThrow(BadRequestError);
    });

    it('should throw BadRequestError for content exceeding 2000 characters', async () => {
      const longContent = 'a'.repeat(2001);
      await expect(reportService.sendMessage(1, 1, longContent))
        .rejects
        .toThrow(BadRequestError);
    });

    it('should throw NotFoundError when report not found', async () => {
      jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(null);

      await expect(reportService.sendMessage(1, 1, 'Test message'))
        .rejects
        .toThrow(NotFoundError);
    });

    it('should throw InsufficientRightsError when sender is not the assignee', async () => {
      const mockReport = createMockReport({ assigneeId: 2 }); // Different assignee

      jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);

      await expect(reportService.sendMessage(1, 1, 'Test message'))
        .rejects
        .toThrow(InsufficientRightsError);
    });

    it('should trim content before saving', async () => {
      const mockReport = createMockReport({ assigneeId: 1, reporterId: 2 });

      jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
      (createNotification as jest.MockedFunction<typeof createNotification>).mockResolvedValue({} as any);

      await reportService.sendMessage(1, 1, '  Test message with spaces  ');

      expect(messageRepository.createMessage).toHaveBeenCalledWith(1, 1, 'Test message with spaces');
    });
  });

  describe('getMessages', () => {
    const mockMessage = {
      id: 1,
      reportId: 1,
      senderId: 1,
      content: 'Test message',
      createdAt: new Date(),
      report: {} as any,
      sender: {} as any,
    };

    const mockMessageResponse = {
      id: 1,
      reportId: 1,
      author: {
        id: 1,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: 'TECHNICAL_STAFF',
      },
      content: 'Test message',
      createdAt: new Date(),
    };

    beforeEach(() => {
      jest.spyOn(messageRepository, 'getMessagesByReportId').mockResolvedValue([mockMessage]);
      (mapperService.mapMessageToResponse as jest.Mock).mockReturnValue(mockMessageResponse);
    });

    it('should return messages for assignee', async () => {
      const mockReport = createMockReport({ assigneeId: 1, reporterId: 2 });

      jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);

      const result = await reportService.getMessages(1, 1); // userId = assigneeId

      expect(reportRepository.findReportById).toHaveBeenCalledWith(1);
      expect(messageRepository.getMessagesByReportId).toHaveBeenCalledWith(1);
      expect(mapperService.mapMessageToResponse).toHaveBeenCalled();
      expect(result).toEqual([mockMessageResponse]);
    });

    it('should return messages for reporter', async () => {
      const mockReport = createMockReport({ assigneeId: 1, reporterId: 2 });

      jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);

      const result = await reportService.getMessages(1, 2); // userId = reporterId

      expect(result).toEqual([mockMessageResponse]);
    });

    it('should throw NotFoundError when report not found', async () => {
      jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(null);

      await expect(reportService.getMessages(1, 1))
        .rejects
        .toThrow(NotFoundError);
    });

    it('should throw InsufficientRightsError when user is neither assignee nor reporter', async () => {
      const mockReport = createMockReport({ assigneeId: 1, reporterId: 2 });

      jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);

      await expect(reportService.getMessages(1, 3)) // userId = 3 (neither assignee nor reporter)
        .rejects
        .toThrow(InsufficientRightsError);
    });
  });
});
