import * as mapperService from '@services/mapperService';
import { UserEntity } from '@models/entity/userEntity';
import { ReportEntity } from '@models/entity/reportEntity';
import { DepartmentEntity } from '@models/entity/departmentEntity';
import { RoleEntity } from '@models/entity/roleEntity';
import { ReportStatus } from '@models/dto/ReportStatus';
import { ReportCategory } from '@models/dto/ReportCategory';
import { createMockUserRole } from '@test/utils/mockEntities';
import { PhotoEntity } from '@entity/photoEntity';
import { CategoryRoleEntity } from '@entity/categoryRoleEntity';
import { Location } from '@models/dto/Location';
import { Photo } from '@models/dto/Photo';
import {
  createErrorDTO,
  mapReportEntityToDTO,
  mapDepartmentEntityToDTO,
  mapRoleEntityToDTO,
  mapPhotoToResponse,
  mapReportEntityToResponse,
  mapReportEntityToReportResponse,
  mapCategoryRoleMappingToDTO,
  mapCategoryRoleMappingsToDTOs
} from '@services/mapperService';

describe('MapperService', () => {

  describe('mapUserEntityToUserResponse', () => {
    it('should map user entity to user response', () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        userRoles: [
          createMockUserRole(1, 1, 'Manager', 'Dep1')
        ]
      } as UserEntity;

      const result = mapperService.mapUserEntityToUserResponse(mockUser);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
      expect(result?.username).toBe('testuser');
      expect(result?.email).toBe('test@example.com');
      expect(result?.first_name).toBe('Test');
      expect(result?.last_name).toBe('User');
      expect(result?.roles).toHaveLength(1);
      expect(result?.roles[0].role_name).toBe('Manager');
      expect(result?.roles[0].department_name).toBe('Dep1');
    });

    it('should return null if entity is null', () => {
      const result = mapperService.mapUserEntityToUserResponse(null);
      expect(result).toBeNull();
    });

    it('should map company name if provided', () => {
      const mockUser = { id: 1, username: 'testuser' } as UserEntity;
      const result = mapperService.mapUserEntityToUserResponse(mockUser, 'Acme Corp');
      expect(result?.company_name).toBe('Acme Corp');
    });
  });

  describe('mapReportEntityToReportResponse', () => {
    it('should map report entity to report response', () => {
      const mockReport = {
        id: 1,
        title: 'Test Report',
        description: 'Test Description',
        category: ReportCategory.ROADS,
        location: 'POINT(10 20)',
        isAnonymous: false,
        status: ReportStatus.ASSIGNED,
        createdAt: new Date(),
        updatedAt: new Date(),
        reporterId: 100,
        reporter: { id: 100, username: 'reporter' } as UserEntity,
        assigneeId: 200,
        assignee: { id: 200, username: 'assignee' } as UserEntity,
        photos: [{ id: 1, storageUrl: 'path/to/photo.jpg', createdAt: new Date() }]
      } as unknown as ReportEntity;

      const result = mapperService.mapReportEntityToReportResponse(mockReport);

      expect(result.id).toBe(1);
      expect(result.title).toBe('Test Report');
      expect(result.location).toEqual({ longitude: 10, latitude: 20 });
      expect(result.reporter).toBeDefined();
      expect(result.reporter?.username).toBe('reporter');
      expect(result.assignee).toBeDefined();
      expect(result.assignee?.username).toBe('assignee');
      expect(result.photos).toHaveLength(1);
      expect(result.photos[0].storageUrl).toContain('path/to/photo.jpg');
    });

    it('should handle anonymous reports', () => {
      const mockReport = {
        id: 1,
        isAnonymous: true,
        location: { latitude: 10, longitude: 20 }, // Object location format
        reporter: { id: 100, username: 'reporter' } as UserEntity // Should be ignored
      } as unknown as ReportEntity;

      const result = mapperService.mapReportEntityToReportResponse(mockReport);

      expect(result.reporterId).toBeNull();
      expect(result.reporter).toBeNull();
    });
  });

  describe('mapDepartmentEntityToDTO', () => {
    it('should map department entity', () => {
      const mockDept = { id: 1, name: 'Dep1' } as DepartmentEntity;
      const result = mapperService.mapDepartmentEntityToDTO(mockDept);
      expect(result).toEqual({ id: 1, name: 'Dep1' });
    });
  });

  describe('mapRoleEntityToDTO', () => {
    it('should map role entity', () => {
      const mockRole = { id: 1, name: 'Role1', description: 'Desc' } as RoleEntity;
      const result = mapperService.mapRoleEntityToDTO(mockRole);
      expect(result).toEqual({ id: 1, name: 'Role1', description: 'Desc' });
    });
  });

  describe('createErrorDTO', () => {
    it('should create error DTO with all fields', () => {
      const result = createErrorDTO(404, 'Not Found', 'NotFoundError');

      expect(result).toEqual({
        code: 404,
        name: 'NotFoundError',
        message: 'Not Found'
      });
    });

    it('should create error DTO with null message', () => {
      const result = createErrorDTO(500, undefined, 'InternalError');

      expect(result).toEqual({
        code: 500,
        name: 'InternalError'
      });
    });

    it('should create error DTO with null name', () => {
      const result = createErrorDTO(400, 'Bad Request');

      expect(result).toEqual({
        code: 400,
        message: 'Bad Request'
      });
    });

    it('should create error DTO with only code', () => {
      const result = createErrorDTO(200);

      expect(result).toEqual({
        code: 200
      });
    });
  });

  describe('mapReportEntityToDTO', () => {
    it('should map report entity to DTO with all fields', () => {
      const entity = {
        id: 1,
        reporterId: 10,
        title: 'Test Report',
        description: 'Test Description',
        category: ReportCategory.ROADS,
        location: 'POINT(7.6869005 45.0703393)',
        address: 'Test Address',
        isAnonymous: false,
        status: ReportStatus.PENDING_APPROVAL,
        rejectionReason: undefined,
        assigneeId: 20,
        externalAssigneeId: undefined,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        reporter: {} as any,
        assignee: {} as any,
        externalAssignee: undefined,
        photos: []
      } as ReportEntity;

      const result = mapReportEntityToDTO(entity);

      expect(result).toEqual({
        id: 1,
        reporter_id: 10,
        title: 'Test Report',
        description: 'Test Description',
        category: ReportCategory.ROADS,
        location: 'POINT(7.6869005 45.0703393)',
        address: 'Test Address',
        is_anonymous: false,
        status: ReportStatus.PENDING_APPROVAL,
        rejection_reason: undefined,
        assignee_id: 20,
        external_assignee_id: undefined,
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-02')
      });
    });

    it('should filter out null and undefined fields', () => {
      const entity = {
        id: 1,
        reporterId: 10,
        title: 'Test Report',
        description: 'Test Description',
        category: ReportCategory.ROADS,
        location: 'POINT(7.6869005 45.0703393)',
        address: undefined,
        isAnonymous: false,
        status: ReportStatus.PENDING_APPROVAL,
        rejectionReason: undefined,
        assigneeId: undefined,
        externalAssigneeId: undefined,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        reporter: {} as any,
        assignee: undefined,
        externalAssignee: undefined,
        photos: []
      } as ReportEntity;

      const result = mapReportEntityToDTO(entity);

      expect(result).toEqual({
        id: 1,
        reporter_id: 10,
        title: 'Test Report',
        description: 'Test Description',
        category: ReportCategory.ROADS,
        location: 'POINT(7.6869005 45.0703393)',
        is_anonymous: false,
        status: ReportStatus.PENDING_APPROVAL,
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-02')
      });
    });
  });

  describe('mapPhotoToResponse', () => {
    it('should map photo DTO to response', () => {
      const photo: Photo = {
        id: 1,
        report_id: 10,
        storage_url: '/uploads/photo.jpg',
        created_at: new Date('2023-01-01')
      };

      const result = mapPhotoToResponse(photo);

      expect(result).toEqual({
        id: 1,
        reportId: 10,
        storageUrl: '/uploads/photo.jpg',
        createdAt: new Date('2023-01-01')
      });
    });
  });

  describe('mapCategoryRoleMappingToDTO', () => {
    it('should map category role entity to DTO with role loaded', () => {
      const entity = {
        id: 1,
        category: ReportCategory.ROADS,
        roleId: 2,
        role: {
          id: 2,
          name: 'Maintainer',
          description: 'Road maintainer',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-02'),
          departmentRoles: []
        } as RoleEntity,
        createdAt: new Date('2023-01-01')
      } as CategoryRoleEntity;

      const result = mapCategoryRoleMappingToDTO(entity);

      expect(result).toEqual({
        id: 1,
        category: ReportCategory.ROADS,
        roleId: 2,
        roleName: 'Maintainer',
        createdAt: new Date('2023-01-01')
      });
    });

    it('should map category role entity to DTO without role loaded', () => {
      const entity = {
        id: 1,
        category: ReportCategory.WASTE,
        roleId: 3,
        role: undefined as any,
        createdAt: new Date('2023-01-01')
      } as CategoryRoleEntity;

      const result = mapCategoryRoleMappingToDTO(entity);

      expect(result).toEqual({
        id: 1,
        category: ReportCategory.WASTE,
        roleId: 3,
        createdAt: new Date('2023-01-01')
      });
    });
  });

  describe('mapCategoryRoleMappingsToDTOs', () => {
    it('should map array of category role entities to DTOs', () => {
      const entities = [
        {
          id: 1,
          category: ReportCategory.ROADS,
          roleId: 2,
          role: {
            id: 2,
            name: 'Maintainer',
            description: 'Road maintainer',
            createdAt: new Date('2023-01-01'),
            updatedAt: new Date('2023-01-02'),
            departmentRoles: []
          } as RoleEntity,
          createdAt: new Date('2023-01-01')
        },
        {
          id: 2,
          category: ReportCategory.WASTE,
          roleId: 3,
          role: undefined as any,
          createdAt: new Date('2023-01-02')
        }
      ] as CategoryRoleEntity[];

      const result = mapCategoryRoleMappingsToDTOs(entities);

      expect(result).toEqual([
        {
          id: 1,
          category: ReportCategory.ROADS,
          roleId: 2,
          roleName: 'Maintainer',
          createdAt: new Date('2023-01-01')
        },
        {
          id: 2,
          category: ReportCategory.WASTE,
          roleId: 3,
          createdAt: new Date('2023-01-02')
        }
      ]);
    });

    it('should handle empty array', () => {
      const result = mapCategoryRoleMappingsToDTOs([]);

      expect(result).toEqual([]);
    });
  });
});
