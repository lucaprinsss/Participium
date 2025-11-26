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
import { mapReportEntityToReportResponse, mapReportEntityToDTO } from '../../../services/mapperService';

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

  describe('approveReport', () => {
    const createMockUser = (id: number): userEntity => ({
      id,
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      passwordHash: 'hashedpassword',
      departmentRoleId: 1,
      departmentRole: null as any,
      emailNotificationsEnabled: true,
      createdAt: new Date()
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('input validation', () => {
      it('should throw BadRequestError for invalid report ID (NaN)', async () => {
        await expect(
          reportService.approveReport(NaN, 1)
        ).rejects.toThrow(BadRequestError);
        
        await expect(
          reportService.approveReport(NaN, 1)
        ).rejects.toThrow('Invalid report ID');
      });

      it('should throw NotFoundError when report does not exist', async () => {
        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(null);

        await expect(
          reportService.approveReport(999, 1)
        ).rejects.toThrow(NotFoundError);
        
        await expect(
          reportService.approveReport(999, 1)
        ).rejects.toThrow('Report not found');
      });

      it('should throw BadRequestError when report status is not PENDING_APPROVAL', async () => {
        const mockReport = createMockReport({ 
          id: 1, 
          status: ReportStatus.ASSIGNED 
        });
        
        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);

        await expect(
          reportService.approveReport(1, 1)
        ).rejects.toThrow(BadRequestError);
        
        await expect(
          reportService.approveReport(1, 1)
        ).rejects.toThrow('Cannot approve report with status');
      });

      it('should throw BadRequestError for invalid category', async () => {
        const mockReport = createMockReport({ 
          id: 1, 
          status: ReportStatus.PENDING_APPROVAL 
        });
        
        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);

        await expect(
          reportService.approveReport(1, 1, 'INVALID_CATEGORY' as any)
        ).rejects.toThrow(BadRequestError);
        
        await expect(
          reportService.approveReport(1, 1, 'INVALID_CATEGORY' as any)
        ).rejects.toThrow('Invalid category');
      });
    });

    describe('category management', () => {
      it('should update category when newCategory is provided', async () => {
        const mockReport = createMockReport({ 
          id: 1, 
          status: ReportStatus.PENDING_APPROVAL,
          category: ReportCategory.ROADS 
        });
        const mockStaff = createMockUser(50);

        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
        jest.spyOn(categoryRoleRepository, 'findRoleIdByCategory').mockResolvedValue(5);
        jest.spyOn(userRepository, 'findAvailableStaffByRoleId').mockResolvedValue(mockStaff);
        jest.spyOn(reportRepository, 'save').mockResolvedValue({
          ...mockReport,
          category: ReportCategory.PUBLIC_LIGHTING,
          status: ReportStatus.ASSIGNED,
          assigneeId: 50
        });
        (mapReportEntityToDTO as jest.Mock).mockReturnValue({ id: 1 });

        await reportService.approveReport(1, 1, ReportCategory.PUBLIC_LIGHTING);

        expect(mockReport.category).toBe(ReportCategory.PUBLIC_LIGHTING);
      });

      it('should keep original category when newCategory is not provided', async () => {
        const mockReport = createMockReport({ 
          id: 1, 
          status: ReportStatus.PENDING_APPROVAL,
          category: ReportCategory.ROADS 
        });
        const mockStaff = createMockUser(50);

        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
        jest.spyOn(categoryRoleRepository, 'findRoleIdByCategory').mockResolvedValue(5);
        jest.spyOn(userRepository, 'findAvailableStaffByRoleId').mockResolvedValue(mockStaff);
        jest.spyOn(reportRepository, 'save').mockResolvedValue({
          ...mockReport,
          status: ReportStatus.ASSIGNED,
          assigneeId: 50
        });
        (mapReportEntityToDTO as jest.Mock).mockReturnValue({ id: 1 });

        await reportService.approveReport(1, 1);

        expect(categoryRoleRepository.findRoleIdByCategory).toHaveBeenCalledWith(ReportCategory.ROADS);
      });
    });

    describe('assignment logic', () => {
      it('should throw BadRequestError when no role mapping exists for category', async () => {
        const mockReport = createMockReport({ 
          id: 1, 
          status: ReportStatus.PENDING_APPROVAL 
        });

        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
        jest.spyOn(categoryRoleRepository, 'findRoleIdByCategory').mockResolvedValue(null);

        await expect(
          reportService.approveReport(1, 1)
        ).rejects.toThrow(BadRequestError);
        
        await expect(
          reportService.approveReport(1, 1)
        ).rejects.toThrow('No role mapping found for category');
      });

      it('should throw BadRequestError when no available staff found', async () => {
        const mockReport = createMockReport({ 
          id: 1, 
          status: ReportStatus.PENDING_APPROVAL 
        });

        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
        jest.spyOn(categoryRoleRepository, 'findRoleIdByCategory').mockResolvedValue(5);
        jest.spyOn(userRepository, 'findAvailableStaffByRoleId').mockResolvedValue(null);

        await expect(
          reportService.approveReport(1, 1)
        ).rejects.toThrow(BadRequestError);
        
        await expect(
          reportService.approveReport(1, 1)
        ).rejects.toThrow('No available technical staff found for category');
      });

      it('should assign report to available staff', async () => {
        const mockReport = createMockReport({ 
          id: 1, 
          status: ReportStatus.PENDING_APPROVAL 
        });
        const mockStaff = createMockUser(50);

        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
        jest.spyOn(categoryRoleRepository, 'findRoleIdByCategory').mockResolvedValue(5);
        jest.spyOn(userRepository, 'findAvailableStaffByRoleId').mockResolvedValue(mockStaff);
        jest.spyOn(reportRepository, 'save').mockResolvedValue({
          ...mockReport,
          status: ReportStatus.ASSIGNED,
          assigneeId: 50
        });
        (mapReportEntityToDTO as jest.Mock).mockReturnValue({ id: 1, assigneeId: 50 });

        const result = await reportService.approveReport(1, 1);

        expect(mockReport.assigneeId).toBe(50);
      });
    });

    describe('status update', () => {
      it('should change status to ASSIGNED', async () => {
        const mockReport = createMockReport({ 
          id: 1, 
          status: ReportStatus.PENDING_APPROVAL 
        });
        const mockStaff = createMockUser(50);

        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
        jest.spyOn(categoryRoleRepository, 'findRoleIdByCategory').mockResolvedValue(5);
        jest.spyOn(userRepository, 'findAvailableStaffByRoleId').mockResolvedValue(mockStaff);
        jest.spyOn(reportRepository, 'save').mockResolvedValue({
          ...mockReport,
          status: ReportStatus.ASSIGNED,
          assigneeId: 50
        });
        (mapReportEntityToDTO as jest.Mock).mockReturnValue({ id: 1, status: ReportStatus.ASSIGNED });

        await reportService.approveReport(1, 1);

        expect(mockReport.status).toBe(ReportStatus.ASSIGNED);
      });

      it('should clear rejection reason', async () => {
        const mockReport = createMockReport({ 
          id: 1, 
          status: ReportStatus.PENDING_APPROVAL,
          rejectionReason: 'Previous rejection'
        });
        const mockStaff = createMockUser(50);

        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
        jest.spyOn(categoryRoleRepository, 'findRoleIdByCategory').mockResolvedValue(5);
        jest.spyOn(userRepository, 'findAvailableStaffByRoleId').mockResolvedValue(mockStaff);
        jest.spyOn(reportRepository, 'save').mockResolvedValue({
          ...mockReport,
          status: ReportStatus.ASSIGNED,
          assigneeId: 50,
          rejectionReason: undefined
        });
        (mapReportEntityToDTO as jest.Mock).mockReturnValue({ id: 1 });

        await reportService.approveReport(1, 1);

        expect(mockReport.rejectionReason).toBeUndefined();
      });

      it('should update updatedAt timestamp', async () => {
        const oldDate = new Date('2024-01-01');
        const mockReport = createMockReport({ 
          id: 1, 
          status: ReportStatus.PENDING_APPROVAL,
          updatedAt: oldDate
        });
        const mockStaff = createMockUser(50);

        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
        jest.spyOn(categoryRoleRepository, 'findRoleIdByCategory').mockResolvedValue(5);
        jest.spyOn(userRepository, 'findAvailableStaffByRoleId').mockResolvedValue(mockStaff);
        jest.spyOn(reportRepository, 'save').mockResolvedValue({
          ...mockReport,
          status: ReportStatus.ASSIGNED,
          assigneeId: 50
        });
        (mapReportEntityToDTO as jest.Mock).mockReturnValue({ id: 1 });

        await reportService.approveReport(1, 1);

        expect(mockReport.updatedAt.getTime()).toBeGreaterThan(oldDate.getTime());
      });
    });

    describe('successful approval', () => {
      it('should save and return approved report', async () => {
        const mockReport = createMockReport({ 
          id: 1, 
          status: ReportStatus.PENDING_APPROVAL 
        });
        const mockStaff = createMockUser(50);
        const savedReport = {
          ...mockReport,
          status: ReportStatus.ASSIGNED,
          assigneeId: 50
        };
        const mappedReport = { id: 1, status: ReportStatus.ASSIGNED };

        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
        jest.spyOn(categoryRoleRepository, 'findRoleIdByCategory').mockResolvedValue(5);
        jest.spyOn(userRepository, 'findAvailableStaffByRoleId').mockResolvedValue(mockStaff);
        jest.spyOn(reportRepository, 'save').mockResolvedValue(savedReport);
        (mapReportEntityToDTO as jest.Mock).mockReturnValue(mappedReport);

        const result = await reportService.approveReport(1, 1);

        expect(reportRepository.save).toHaveBeenCalledWith(mockReport);
        expect(mapReportEntityToDTO).toHaveBeenCalledWith(savedReport);
        expect(result).toEqual(mappedReport);
      });
    });
  });

  describe('rejectReport', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('input validation', () => {
      it('should throw BadRequestError for invalid report ID (NaN)', async () => {
        await expect(
          reportService.rejectReport(NaN, 'Test reason', 1)
        ).rejects.toThrow(BadRequestError);
        
        await expect(
          reportService.rejectReport(NaN, 'Test reason', 1)
        ).rejects.toThrow('Invalid report ID');
      });

      it('should throw BadRequestError when rejection reason is empty string', async () => {
        const mockReport = createMockReport({ 
          id: 1, 
          status: ReportStatus.PENDING_APPROVAL 
        });
        
        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);

        await expect(
          reportService.rejectReport(1, '', 1)
        ).rejects.toThrow(BadRequestError);
        
        await expect(
          reportService.rejectReport(1, '', 1)
        ).rejects.toThrow('Rejection reason is required');
      });

      it('should throw BadRequestError when rejection reason is whitespace only', async () => {
        const mockReport = createMockReport({ 
          id: 1, 
          status: ReportStatus.PENDING_APPROVAL 
        });
        
        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);

        await expect(
          reportService.rejectReport(1, '   ', 1)
        ).rejects.toThrow(BadRequestError);
        
        await expect(
          reportService.rejectReport(1, '   ', 1)
        ).rejects.toThrow('Rejection reason is required');
      });

      it('should throw BadRequestError when rejection reason is undefined', async () => {
        const mockReport = createMockReport({ 
          id: 1, 
          status: ReportStatus.PENDING_APPROVAL 
        });
        
        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);

        await expect(
          reportService.rejectReport(1, undefined as any, 1)
        ).rejects.toThrow(BadRequestError);
        
        await expect(
          reportService.rejectReport(1, undefined as any, 1)
        ).rejects.toThrow('Rejection reason is required');
      });

      it('should throw NotFoundError when report does not exist', async () => {
        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(null);

        await expect(
          reportService.rejectReport(999, 'Valid reason', 1)
        ).rejects.toThrow(NotFoundError);
        
        await expect(
          reportService.rejectReport(999, 'Valid reason', 1)
        ).rejects.toThrow('Report not found');
      });
    });

    describe('status validation', () => {
      it('should throw BadRequestError when report status is ASSIGNED', async () => {
        const mockReport = createMockReport({ 
          id: 1, 
          status: ReportStatus.ASSIGNED 
        });
        
        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);

        await expect(
          reportService.rejectReport(1, 'Test reason', 1)
        ).rejects.toThrow(BadRequestError);
        
        await expect(
          reportService.rejectReport(1, 'Test reason', 1)
        ).rejects.toThrow('Cannot reject report with status');
      });

      it('should throw BadRequestError when report status is IN_PROGRESS', async () => {
        const mockReport = createMockReport({ 
          id: 1, 
          status: ReportStatus.IN_PROGRESS 
        });
        
        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);

        await expect(
          reportService.rejectReport(1, 'Test reason', 1)
        ).rejects.toThrow(BadRequestError);
        
        await expect(
          reportService.rejectReport(1, 'Test reason', 1)
        ).rejects.toThrow('Cannot reject report with status');
      });

      it('should throw BadRequestError when report status is RESOLVED', async () => {
        const mockReport = createMockReport({ 
          id: 1, 
          status: ReportStatus.RESOLVED 
        });
        
        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);

        await expect(
          reportService.rejectReport(1, 'Test reason', 1)
        ).rejects.toThrow(BadRequestError);
        
        await expect(
          reportService.rejectReport(1, 'Test reason', 1)
        ).rejects.toThrow('Cannot reject report with status');
      });

      it('should throw BadRequestError when report is already REJECTED', async () => {
        const mockReport = createMockReport({ 
          id: 1, 
          status: ReportStatus.REJECTED 
        });
        
        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);

        await expect(
          reportService.rejectReport(1, 'Test reason', 1)
        ).rejects.toThrow(BadRequestError);
        
        await expect(
          reportService.rejectReport(1, 'Test reason', 1)
        ).rejects.toThrow('Cannot reject report with status');
      });

      it('should allow rejection when status is PENDING_APPROVAL', async () => {
        const mockReport = createMockReport({ 
          id: 1, 
          status: ReportStatus.PENDING_APPROVAL 
        });
        
        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
        jest.spyOn(reportRepository, 'save').mockResolvedValue({
          ...mockReport,
          status: ReportStatus.REJECTED,
          rejectionReason: 'Valid reason'
        });
        (mapReportEntityToDTO as jest.Mock).mockReturnValue({ id: 1 });

        await expect(
          reportService.rejectReport(1, 'Valid reason', 1)
        ).resolves.toBeDefined();
      });
    });

    describe('rejection logic', () => {
      it('should set status to REJECTED', async () => {
        const mockReport = createMockReport({ 
          id: 1, 
          status: ReportStatus.PENDING_APPROVAL 
        });
        
        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
        jest.spyOn(reportRepository, 'save').mockResolvedValue({
          ...mockReport,
          status: ReportStatus.REJECTED,
          rejectionReason: 'Not valid'
        });
        (mapReportEntityToDTO as jest.Mock).mockReturnValue({ id: 1 });

        await reportService.rejectReport(1, 'Not valid', 1);

        expect(mockReport.status).toBe(ReportStatus.REJECTED);
      });

      it('should set rejection reason', async () => {
        const mockReport = createMockReport({ 
          id: 1, 
          status: ReportStatus.PENDING_APPROVAL 
        });
        const reason = 'Duplicate report';
        
        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
        jest.spyOn(reportRepository, 'save').mockResolvedValue({
          ...mockReport,
          status: ReportStatus.REJECTED,
          rejectionReason: reason
        });
        (mapReportEntityToDTO as jest.Mock).mockReturnValue({ id: 1 });

        await reportService.rejectReport(1, reason, 1);

        expect(mockReport.rejectionReason).toBe(reason);
      });

      it('should update updatedAt timestamp', async () => {
        const oldDate = new Date('2024-01-01');
        const mockReport = createMockReport({ 
          id: 1, 
          status: ReportStatus.PENDING_APPROVAL,
          updatedAt: oldDate
        });
        
        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
        jest.spyOn(reportRepository, 'save').mockResolvedValue({
          ...mockReport,
          status: ReportStatus.REJECTED,
          rejectionReason: 'Test'
        });
        (mapReportEntityToDTO as jest.Mock).mockReturnValue({ id: 1 });

        await reportService.rejectReport(1, 'Test', 1);

        expect(mockReport.updatedAt.getTime()).toBeGreaterThan(oldDate.getTime());
      });

      it('should handle long rejection reasons', async () => {
        const mockReport = createMockReport({ 
          id: 1, 
          status: ReportStatus.PENDING_APPROVAL 
        });
        const longReason = 'A'.repeat(500);
        
        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
        jest.spyOn(reportRepository, 'save').mockResolvedValue({
          ...mockReport,
          status: ReportStatus.REJECTED,
          rejectionReason: longReason
        });
        (mapReportEntityToDTO as jest.Mock).mockReturnValue({ id: 1 });

        await reportService.rejectReport(1, longReason, 1);

        expect(mockReport.rejectionReason).toBe(longReason);
      });
    });

    describe('successful rejection', () => {
      it('should save and return rejected report', async () => {
        const mockReport = createMockReport({ 
          id: 1, 
          status: ReportStatus.PENDING_APPROVAL 
        });
        const savedReport = {
          ...mockReport,
          status: ReportStatus.REJECTED,
          rejectionReason: 'Invalid location'
        };
        const mappedReport = { 
          id: 1, 
          status: ReportStatus.REJECTED,
          rejectionReason: 'Invalid location'
        };

        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
        jest.spyOn(reportRepository, 'save').mockResolvedValue(savedReport);
        (mapReportEntityToDTO as jest.Mock).mockReturnValue(mappedReport);

        const result = await reportService.rejectReport(1, 'Invalid location', 1);

        expect(reportRepository.save).toHaveBeenCalledWith(mockReport);
        expect(mapReportEntityToDTO).toHaveBeenCalledWith(savedReport);
        expect(result).toEqual(mappedReport);
      });

      it('should work with trimmed rejection reason', async () => {
        const mockReport = createMockReport({ 
          id: 1, 
          status: ReportStatus.PENDING_APPROVAL 
        });
        const reasonWithSpaces = '  Some reason  ';
        
        jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport);
        jest.spyOn(reportRepository, 'save').mockResolvedValue({
          ...mockReport,
          status: ReportStatus.REJECTED,
          rejectionReason: reasonWithSpaces
        });
        (mapReportEntityToDTO as jest.Mock).mockReturnValue({ id: 1 });

        await reportService.rejectReport(1, reasonWithSpaces, 1);

        expect(mockReport.rejectionReason).toBe(reasonWithSpaces);
      });
    });
  });
});
