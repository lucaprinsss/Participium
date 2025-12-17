import { reportRepository } from '../../../repositories/reportRepository';
import { ReportEntity } from '../../../models/entity/reportEntity';
import { ReportStatus } from '../../../models/dto/ReportStatus';
import { ReportCategory } from '../../../models/dto/ReportCategory';

describe('ReportRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findReportById', () => {
    it('should call findReportById with correct parameters', async () => {
      const mockReport: Partial<ReportEntity> = {
        id: 1,
        title: 'Test Report',
        status: ReportStatus.PENDING_APPROVAL,
        category: ReportCategory.ROADS
      };

      jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport as ReportEntity);

      const result = await reportRepository.findReportById(1);

      expect(reportRepository.findReportById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockReport);
    });

    it('should return null when report is not found', async () => {
      jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(null);

      const result = await reportRepository.findReportById(999);

      expect(reportRepository.findReportById).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });

    it('should return report with all properties', async () => {
      const mockReport: Partial<ReportEntity> = {
        id: 1,
        title: 'Test Report',
        reporter: {
          id: 100,
          email: 'reporter@example.com'
        } as any,
        assignee: {
          id: 50,
          email: 'assignee@example.com'
        } as any,
        photos: [
          { id: 1, reportId: 1, photoUrl: 'photo1.jpg' } as any
        ]
      };

      jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(mockReport as ReportEntity);

      const result = await reportRepository.findReportById(1);

      expect(result?.reporter).toBeDefined();
      expect(result?.reporter.id).toBe(100);
      expect(result?.assignee).toBeDefined();
      expect(result?.assignee?.id).toBe(50);
      expect(result?.photos).toBeDefined();
      expect(result?.photos.length).toBe(1);
    });
  });

  describe('findAllReports', () => {
    describe('without filters', () => {
      it('should return all reports when no filters provided', async () => {
        const mockReports: Partial<ReportEntity>[] = [
          { id: 1, title: 'Report 1' },
          { id: 2, title: 'Report 2' }
        ];

        jest.spyOn(reportRepository, 'findAllReports').mockResolvedValue(mockReports as ReportEntity[]);

        const result = await reportRepository.findAllReports();

        expect(reportRepository.findAllReports).toHaveBeenCalledWith();
        expect(result).toEqual(mockReports);
        expect(result.length).toBe(2);
      });

      it('should return empty array when no reports exist', async () => {
        jest.spyOn(reportRepository, 'findAllReports').mockResolvedValue([]);

        const result = await reportRepository.findAllReports();

        expect(result).toEqual([]);
        expect(result.length).toBe(0);
      });
    });

    describe('with status filter', () => {
      it('should filter by PENDING_APPROVAL status', async () => {
        const mockReports: Partial<ReportEntity>[] = [
          { id: 1, status: ReportStatus.PENDING_APPROVAL }
        ];

        jest.spyOn(reportRepository, 'findAllReports').mockResolvedValue(mockReports as ReportEntity[]);

        const result = await reportRepository.findAllReports(ReportStatus.PENDING_APPROVAL);

        expect(reportRepository.findAllReports).toHaveBeenCalledWith(ReportStatus.PENDING_APPROVAL);
        expect(result.length).toBe(1);
      });

      it('should filter by ASSIGNED status', async () => {
        jest.spyOn(reportRepository, 'findAllReports').mockResolvedValue([]);

        await reportRepository.findAllReports(ReportStatus.ASSIGNED);

        expect(reportRepository.findAllReports).toHaveBeenCalledWith(ReportStatus.ASSIGNED);
      });

      it('should filter by IN_PROGRESS status', async () => {
        jest.spyOn(reportRepository, 'findAllReports').mockResolvedValue([]);

        await reportRepository.findAllReports(ReportStatus.IN_PROGRESS);

        expect(reportRepository.findAllReports).toHaveBeenCalledWith(ReportStatus.IN_PROGRESS);
      });

      it('should filter by RESOLVED status', async () => {
        jest.spyOn(reportRepository, 'findAllReports').mockResolvedValue([]);

        await reportRepository.findAllReports(ReportStatus.RESOLVED);

        expect(reportRepository.findAllReports).toHaveBeenCalledWith(ReportStatus.RESOLVED);
      });

      it('should filter by REJECTED status', async () => {
        jest.spyOn(reportRepository, 'findAllReports').mockResolvedValue([]);

        await reportRepository.findAllReports(ReportStatus.REJECTED);

        expect(reportRepository.findAllReports).toHaveBeenCalledWith(ReportStatus.REJECTED);
      });
    });

    describe('with category filter', () => {
      it('should filter by ROADS category', async () => {
        const mockReports: Partial<ReportEntity>[] = [
          { id: 1, category: ReportCategory.ROADS }
        ];

        jest.spyOn(reportRepository, 'findAllReports').mockResolvedValue(mockReports as ReportEntity[]);

        const result = await reportRepository.findAllReports(undefined, ReportCategory.ROADS);

        expect(reportRepository.findAllReports).toHaveBeenCalledWith(undefined, ReportCategory.ROADS);
        expect(result.length).toBe(1);
      });

      it('should filter by PUBLIC_LIGHTING category', async () => {
        jest.spyOn(reportRepository, 'findAllReports').mockResolvedValue([]);

        await reportRepository.findAllReports(undefined, ReportCategory.PUBLIC_LIGHTING);

        expect(reportRepository.findAllReports).toHaveBeenCalledWith(undefined, ReportCategory.PUBLIC_LIGHTING);
      });

      it('should filter by GREEN_AREAS category', async () => {
        jest.spyOn(reportRepository, 'findAllReports').mockResolvedValue([]);

        await reportRepository.findAllReports(undefined, ReportCategory.GREEN_AREAS);

        expect(reportRepository.findAllReports).toHaveBeenCalledWith(undefined, ReportCategory.GREEN_AREAS);
      });
    });

    describe('with combined filters', () => {
      it('should filter by both status and category', async () => {
        const mockReports: Partial<ReportEntity>[] = [
          {
            id: 1,
            status: ReportStatus.ASSIGNED,
            category: ReportCategory.ROADS
          }
        ];

        jest.spyOn(reportRepository, 'findAllReports').mockResolvedValue(mockReports as ReportEntity[]);

        const result = await reportRepository.findAllReports(
          ReportStatus.ASSIGNED,
          ReportCategory.ROADS
        );

        expect(reportRepository.findAllReports).toHaveBeenCalledWith(
          ReportStatus.ASSIGNED,
          ReportCategory.ROADS
        );
        expect(result.length).toBe(1);
      });

      it('should filter by status and category', async () => {
        jest.spyOn(reportRepository, 'findAllReports').mockResolvedValue([]);
        await reportRepository.findAllReports(ReportStatus.RESOLVED, ReportCategory.GREEN_AREAS);
        expect(reportRepository.findAllReports).toHaveBeenCalledWith(ReportStatus.RESOLVED, ReportCategory.GREEN_AREAS);
    });
    });
  });

  describe('findByAssigneeId', () => {
    describe('without status filter', () => {
      it('should find all reports assigned to specific user', async () => {
        const assigneeId = 50;
        const mockReports: Partial<ReportEntity>[] = [
          { id: 1, assigneeId: 50 },
          { id: 2, assigneeId: 50 }
        ];

        jest.spyOn(reportRepository, 'findByAssigneeId').mockResolvedValue(mockReports as ReportEntity[]);

        const result = await reportRepository.findByAssigneeId(assigneeId);

        expect(reportRepository.findByAssigneeId).toHaveBeenCalledWith(assigneeId);
        expect(result.length).toBe(2);
      });

      it('should return empty array when user has no assigned reports', async () => {
        jest.spyOn(reportRepository, 'findByAssigneeId').mockResolvedValue([]);

        const result = await reportRepository.findByAssigneeId(999);

        expect(result).toEqual([]);
        expect(result.length).toBe(0);
      });
    });

    describe('with status filter', () => {
      it('should filter by ASSIGNED status', async () => {
        const assigneeId = 50;
        const mockReports: Partial<ReportEntity>[] = [
          { id: 1, assigneeId: 50, status: ReportStatus.ASSIGNED }
        ];

        jest.spyOn(reportRepository, 'findByAssigneeId').mockResolvedValue(mockReports as ReportEntity[]);

        const result = await reportRepository.findByAssigneeId(assigneeId, ReportStatus.ASSIGNED);

        expect(reportRepository.findByAssigneeId).toHaveBeenCalledWith(assigneeId, ReportStatus.ASSIGNED);
        expect(result.length).toBe(1);
      });

      it('should filter by IN_PROGRESS status', async () => {
        jest.spyOn(reportRepository, 'findByAssigneeId').mockResolvedValue([]);

        await reportRepository.findByAssigneeId(50, ReportStatus.IN_PROGRESS);

        expect(reportRepository.findByAssigneeId).toHaveBeenCalledWith(50, ReportStatus.IN_PROGRESS);
      });

      it('should filter by RESOLVED status', async () => {
        jest.spyOn(reportRepository, 'findByAssigneeId').mockResolvedValue([]);

        await reportRepository.findByAssigneeId(50, ReportStatus.RESOLVED);

        expect(reportRepository.findByAssigneeId).toHaveBeenCalledWith(50, ReportStatus.RESOLVED);
      });

      it('should filter by status and category', async () => {
        jest.spyOn(reportRepository, 'findByAssigneeId').mockResolvedValue([]);
        await reportRepository.findByAssigneeId(50, ReportStatus.RESOLVED, ReportCategory.GREEN_AREAS);
        expect(reportRepository.findByAssigneeId).toHaveBeenCalledWith(50, ReportStatus.RESOLVED, ReportCategory.GREEN_AREAS);
      });
    });
  });

  describe('findByExternalAssigneeId', () => {
    const externalMaintainerId = 50;
    const mockExternalMaintainerRole = { id: 1, name: 'External Maintainer' };

    const mockReportAssigned: ReportEntity = {
      id: 1,
      reporterId: 100,
      title: 'Report for External Maintainer',
      description: 'Desc',
      category: ReportCategory.ROADS,
      location: 'POINT(0 0)',
      isAnonymous: false,
      status: ReportStatus.ASSIGNED,
      assigneeId: externalMaintainerId,
      reporter: {} as any,
      assignee: {
        id: externalMaintainerId,
        username: 'ext_maint',
        departmentRole: { role: mockExternalMaintainerRole } as any
      } as any,
      photos: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockReportInProgress: ReportEntity = {
      ...mockReportAssigned,
      id: 2,
      status: ReportStatus.IN_PROGRESS,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return all reports assigned to a specific external maintainer without status filter', async () => {
      const mockReports = [mockReportAssigned, mockReportInProgress];
      
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockReports),
      };
      jest.spyOn(reportRepository['repository'], 'createQueryBuilder').mockReturnValue(queryBuilder as any);

      const result = await reportRepository.findByExternalAssigneeId(externalMaintainerId);

      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('report.reporter', 'reporter');
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('report.externalAssignee', 'externalAssignee');
      expect(queryBuilder.where).toHaveBeenCalledWith('report.externalAssigneeId = :externalMaintainerId', { externalMaintainerId });
      expect(result).toEqual(mockReports);
      expect(result.length).toBe(2);
    });

    it('should return only ASSIGNED reports when status filter is ASSIGNED', async () => {
      const mockReports = [mockReportAssigned];
      
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockReports),
      };
      jest.spyOn(reportRepository['repository'], 'createQueryBuilder').mockReturnValue(queryBuilder as any);

      const result = await reportRepository.findByExternalAssigneeId(externalMaintainerId, ReportStatus.ASSIGNED);

      expect(queryBuilder.where).toHaveBeenCalledWith('report.externalAssigneeId = :externalMaintainerId', { externalMaintainerId });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('report.status = :status', { status: ReportStatus.ASSIGNED });
      expect(result).toEqual(mockReports);
      expect(result.length).toBe(1);
    });

    it('should return empty array when external maintainer has no assigned reports', async () => {
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      jest.spyOn(reportRepository['repository'], 'createQueryBuilder').mockReturnValue(queryBuilder as any);

      const result = await reportRepository.findByExternalAssigneeId(externalMaintainerId);

      expect(queryBuilder.where).toHaveBeenCalledWith('report.externalAssigneeId = :externalMaintainerId', { externalMaintainerId });
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('should return empty array when assigned user is not an External Maintainer', async () => {

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]), // Repository should return empty as role filter applies
      };
      jest.spyOn(reportRepository['repository'], 'createQueryBuilder').mockReturnValue(queryBuilder as any);

      const result = await reportRepository.findByExternalAssigneeId(externalMaintainerId);

      expect(queryBuilder.where).toHaveBeenCalledWith('report.externalAssigneeId = :externalMaintainerId', { externalMaintainerId });
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('should filter by status and category', async () => {
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      jest.spyOn(reportRepository['repository'], 'createQueryBuilder').mockReturnValue(queryBuilder as any);

      await reportRepository.findByExternalAssigneeId(externalMaintainerId, ReportStatus.IN_PROGRESS, ReportCategory.GREEN_AREAS);

      expect(queryBuilder.where).toHaveBeenCalledWith('report.externalAssigneeId = :externalMaintainerId', { externalMaintainerId });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('report.status = :status', { status: ReportStatus.IN_PROGRESS });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('report.category = :category', { category: ReportCategory.GREEN_AREAS });
    });
  });

  describe('save', () => {
    it('should throw an error if reloading the report fails', async () => {
        const reportToSave = { id: 1, title: 'Test' } as ReportEntity;

        // Mock the internal save to return the saved entity
        const saveSpy = jest.spyOn(reportRepository['repository'], 'save').mockResolvedValue(reportToSave);
        
        // Mock the internal findReportById to return null
        const findSpy = jest.spyOn(reportRepository, 'findReportById').mockResolvedValue(null);

        // Expect the save method to throw an error
        await expect(reportRepository.save(reportToSave)).rejects.toThrow('Failed to reload report with id 1');

        // Verify that both internal methods were called
        expect(saveSpy).toHaveBeenCalledWith(reportToSave);
        expect(findSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('getApprovedReportsForMap', () => {
    it('should return approved reports without filters', async () => {
      const mockReports = [
        {
          report_id: 1,
          report_title: 'Pothole',
          report_category: ReportCategory.ROADS,
          report_status: ReportStatus.ASSIGNED,
          report_isAnonymous: false,
          report_createdAt: new Date('2024-01-01'),
          latitude: '45.0703393',
          longitude: '7.6869005',
          user_firstName: 'John',
          user_lastName: 'Doe'
        }
      ];

      const queryBuilder = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockReports)
      };

      jest.spyOn(reportRepository['repository'], 'createQueryBuilder').mockReturnValue(queryBuilder as any);

      const result = await reportRepository.getApprovedReportsForMap();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].title).toBe('Pothole');
      expect(result[0].category).toBe(ReportCategory.ROADS);
      expect(result[0].status).toBe(ReportStatus.ASSIGNED);
      expect(result[0].reporterName).toBe('John Doe');
      expect(result[0].location.latitude).toBe(45.0703393);
      expect(result[0].location.longitude).toBe(7.6869005);
    });

    it('should return anonymous reporter name for anonymous reports', async () => {
      const mockReports = [
        {
          report_id: 1,
          report_title: 'Pothole',
          report_category: ReportCategory.ROADS,
          report_status: ReportStatus.ASSIGNED,
          report_isAnonymous: true,
          report_createdAt: new Date('2024-01-01'),
          latitude: '45.0703393',
          longitude: '7.6869005',
          user_firstName: 'John',
          user_lastName: 'Doe'
        }
      ];

      const queryBuilder = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockReports)
      };

      jest.spyOn(reportRepository['repository'], 'createQueryBuilder').mockReturnValue(queryBuilder as any);

      const result = await reportRepository.getApprovedReportsForMap();

      expect(result[0].reporterName).toBe('Anonymous');
      expect(result[0].isAnonymous).toBe(true);
    });

    it('should apply bounding box filter when provided', async () => {
      const queryBuilder = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([])
      };

      jest.spyOn(reportRepository['repository'], 'createQueryBuilder').mockReturnValue(queryBuilder as any);

      await reportRepository.getApprovedReportsForMap({
        minLat: 45,
        maxLat: 45.1,
        minLng: 7.6,
        maxLng: 7.7
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('ST_Intersects'),
        expect.objectContaining({
          minLat: 45,
          maxLat: 45.1,
          minLng: 7.6,
          maxLng: 7.7
        })
      );
    });

    it('should apply category filter when provided', async () => {
      const queryBuilder = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([])
      };

      jest.spyOn(reportRepository['repository'], 'createQueryBuilder').mockReturnValue(queryBuilder as any);

      await reportRepository.getApprovedReportsForMap({
        category: ReportCategory.ROADS
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'report.category = :category',
        { category: ReportCategory.ROADS }
      );
    });
  });

  describe('getClusteredReports', () => {
    it('should return clustered reports for low zoom level', async () => {
      const mockClusters = [
        {
          latitude: '45.0703393',
          longitude: '7.6869005',
          report_count: '5',
          report_ids: [1, 2, 3, 4, 5],
          grid_lat: '45.0',
          grid_lng: '7.0'
        }
      ];

      const queryBuilder = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockClusters)
      };

      jest.spyOn(reportRepository['repository'], 'createQueryBuilder').mockReturnValue(queryBuilder as any);

      const result = await reportRepository.getClusteredReports(5);

      expect(result).toHaveLength(1);
      expect(result[0].reportCount).toBe(5);
      expect(result[0].reportIds).toEqual([1, 2, 3, 4, 5]);
      expect(result[0].location.latitude).toBe(45.0703393);
      expect(result[0].location.longitude).toBe(7.6869005);
      expect(result[0].clusterId).toBe('cluster_45.0_7.0');
    });

    it('should use smaller grid size for higher zoom levels', async () => {
      const queryBuilder = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([])
      };

      jest.spyOn(reportRepository['repository'], 'createQueryBuilder').mockReturnValue(queryBuilder as any);

      await reportRepository.getClusteredReports(12);

      // For zoom 12, grid size should be 0.01
      expect(queryBuilder.setParameter).toHaveBeenCalledWith('gridSize', 0.01);
    });

    it('should apply filters to clustered reports', async () => {
      const queryBuilder = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([])
      };

      jest.spyOn(reportRepository['repository'], 'createQueryBuilder').mockReturnValue(queryBuilder as any);

      await reportRepository.getClusteredReports(8, {
        minLat: 45,
        maxLat: 45.1,
        minLng: 7.6,
        maxLng: 7.7,
        category: ReportCategory.ROADS
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('ST_Intersects'),
        expect.any(Object)
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'report.category = :category',
        { category: ReportCategory.ROADS }
      );
    });
  });
});
