import { reportService } from '../../../services/reportService';
import { BadRequestError } from '../../../models/errors/BadRequestError';
import { ReportCategory } from '../../../models/dto/ReportCategory';
import { ReportStatus } from '@models/dto/ReportStatus';
import { userEntity } from '@models/entity/userEntity';
import { reportEntity } from '@models/entity/reportEntity';
import { reportRepository } from '@repositories/reportRepository';


// Mock dei repository
jest.mock('@repositories/reportRepository');
jest.mock('@services/mapperService');

import { mapReportEntityToReportResponse } from '../../../services/mapperService';

describe('ReportService', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

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
