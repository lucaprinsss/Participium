import {
  createErrorDTO,
  mapReportEntityToDTO,
  mapDepartmentEntityToDTO,
  mapRoleEntityToDTO,
  mapUserEntityToUserResponse,
  mapPhotoToResponse,
  mapReportEntityToResponse,
  mapReportEntityToReportResponse,
  mapCategoryRoleMappingToDTO,
  mapCategoryRoleMappingsToDTOs
} from '@services/mapperService';
import { ReportEntity } from '@entity/reportEntity';
import { UserEntity } from '@entity/userEntity';
import { PhotoEntity } from '@entity/photoEntity';
import { DepartmentEntity } from '@entity/departmentEntity';
import { RoleEntity } from '@entity/roleEntity';
import { CategoryRoleEntity } from '@entity/categoryRoleEntity';
import { ReportCategory } from '@models/dto/ReportCategory';
import { ReportStatus } from '@models/dto/ReportStatus';
import { Location } from '@models/dto/Location';
import { Photo } from '@models/dto/Photo';

describe('MapperService', () => {
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

  describe('mapDepartmentEntityToDTO', () => {
    it('should map department entity to DTO', () => {
      const entity = {
        id: 1,
        name: 'Engineering',
        departmentRoles: []
      } as DepartmentEntity;

      const result = mapDepartmentEntityToDTO(entity);

      expect(result).toEqual({
        id: 1,
        name: 'Engineering'
      });
    });
  });

  describe('mapRoleEntityToDTO', () => {
    it('should map role entity to DTO with all fields', () => {
      const entity = {
        id: 1,
        name: 'Admin',
        description: 'Administrator role',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        departmentRoles: []
      } as RoleEntity;

      const result = mapRoleEntityToDTO(entity);

      expect(result).toEqual({
        id: 1,
        name: 'Admin',
        description: 'Administrator role'
      });
    });

    it('should filter out null description', () => {
      const entity = {
        id: 1,
        name: 'User',
        description: undefined,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        departmentRoles: []
      } as RoleEntity;

      const result = mapRoleEntityToDTO(entity);

      expect(result).toEqual({
        id: 1,
        name: 'User'
      });
    });
  });

  describe('mapUserEntityToUserResponse', () => {
    it('should return null for null entity', () => {
      const result = mapUserEntityToUserResponse(null);

      expect(result).toBeNull();
    });

    it('should return null for undefined entity', () => {
      const result = mapUserEntityToUserResponse(undefined);

      expect(result).toBeNull();
    });

    it('should map user entity to response with all fields', () => {
      const entity = {
        id: 1,
        username: 'testuser',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        departmentRoleId: 1,
        departmentRole: {
          id: 1,
          department: { id: 1, name: 'Engineering' } as any,
          role: { id: 1, name: 'Developer' } as any,
          users: []
        } as any,
        passwordHash: 'hashed',
        personalPhotoUrl: undefined,
        telegramUsername: undefined,
        emailNotificationsEnabled: true,
        companyId: undefined,
        isVerified: true,
        verificationCode: undefined,
        verificationCodeExpiresAt: undefined,
        createdAt: new Date('2023-01-01')
      } as UserEntity;

      const result = mapUserEntityToUserResponse(entity, 'Test Company');

      expect(result).toEqual({
        id: 1,
        username: 'testuser',
        email: 'john@example.com',
        first_name: 'John',
        last_name: 'Doe',
        department_name: 'Engineering',
        role_name: 'Developer',
        company_name: 'Test Company'
      });
    });

    it('should filter out null department and role', () => {
      const entity = {
        id: 1,
        username: 'testuser',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        departmentRoleId: 1,
        departmentRole: undefined as any,
        passwordHash: 'hashed',
        personalPhotoUrl: undefined,
        telegramUsername: undefined,
        emailNotificationsEnabled: true,
        companyId: undefined,
        isVerified: true,
        verificationCode: undefined,
        verificationCodeExpiresAt: undefined,
        createdAt: new Date('2023-01-01')
      } as UserEntity;

      const result = mapUserEntityToUserResponse(entity);

      expect(result).toEqual({
        id: 1,
        username: 'testuser',
        email: 'john@example.com',
        first_name: 'John',
        last_name: 'Doe'
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

  describe('mapReportEntityToResponse', () => {
    it('should map report entity to response', () => {
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

      const location: Location = { latitude: 45.0703393, longitude: 7.6869005 };
      const photos: any[] = [];

      const result = mapReportEntityToResponse(entity, photos, location);

      expect(result).toEqual({
        id: 1,
        reporterId: 10,
        title: 'Test Report',
        description: 'Test Description',
        category: ReportCategory.ROADS,
        location: { latitude: 45.0703393, longitude: 7.6869005 },
        address: 'Test Address',
        photos: [],
        isAnonymous: false,
        status: ReportStatus.PENDING_APPROVAL,
        rejectionReason: null,
        assigneeId: 20,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02')
      });
    });

    it('should handle anonymous reports', () => {
      const entity = {
        id: 1,
        reporterId: 10,
        title: 'Test Report',
        description: 'Test Description',
        category: ReportCategory.ROADS,
        location: 'POINT(7.6869005 45.0703393)',
        address: 'Test Address',
        isAnonymous: true,
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

      const location: Location = { latitude: 45.0703393, longitude: 7.6869005 };
      const photos: any[] = [];

      const result = mapReportEntityToResponse(entity, photos, location);

      expect(result.reporterId).toBeNull();
    });
  });

  describe('mapReportEntityToReportResponse', () => {
    beforeEach(() => {
      // Set environment variable for testing
      process.env.PUBLIC_BASE_URL = 'http://localhost:3001';
    });

    afterEach(() => {
      delete process.env.PUBLIC_BASE_URL;
    });

    it('should map report entity to full response with string location', () => {
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
        reporter: {
          id: 10,
          username: 'reporter',
          firstName: 'John',
          lastName: 'Reporter',
          email: 'reporter@example.com',
          departmentRoleId: 1,
          departmentRole: {} as any,
          passwordHash: 'hash',
          personalPhotoUrl: undefined,
          telegramUsername: undefined,
          emailNotificationsEnabled: true,
          companyId: undefined,
          isVerified: true,
          verificationCode: undefined,
          verificationCodeExpiresAt: undefined,
          createdAt: new Date('2023-01-01')
        } as UserEntity,
        assignee: {
          id: 20,
          username: 'assignee',
          firstName: 'Jane',
          lastName: 'Assignee',
          email: 'assignee@example.com',
          departmentRoleId: 1,
          departmentRole: {} as any,
          passwordHash: 'hash',
          personalPhotoUrl: undefined,
          telegramUsername: undefined,
          emailNotificationsEnabled: true,
          companyId: undefined,
          isVerified: true,
          verificationCode: undefined,
          verificationCodeExpiresAt: undefined,
          createdAt: new Date('2023-01-01')
        } as UserEntity,
        externalAssignee: undefined,
        photos: [
          {
            id: 1,
            reportId: 1,
            storageUrl: '/uploads/photo1.jpg',
            createdAt: new Date('2023-01-01'),
            report: {} as any
          } as PhotoEntity
        ]
      } as ReportEntity;

      const result = mapReportEntityToReportResponse(entity, 'Test Company');

      expect(result).toEqual({
        id: 1,
        reporterId: 10,
        reporter: {
          id: 10,
          first_name: 'John',
          last_name: 'Reporter',
          username: 'reporter',
          email: 'reporter@example.com'
        },
        title: 'Test Report',
        description: 'Test Description',
        category: ReportCategory.ROADS,
        location: { latitude: 45.0703393, longitude: 7.6869005 },
        address: 'Test Address',
        photos: [{
          id: 1,
          reportId: 1,
          storageUrl: 'http://localhost:3001/uploads/photo1.jpg',
          createdAt: new Date('2023-01-01')
        }],
        isAnonymous: false,
        status: ReportStatus.PENDING_APPROVAL,
        rejectionReason: null,
        assigneeId: 20,
        assignee: {
          id: 20,
          first_name: 'Jane',
          last_name: 'Assignee',
          username: 'assignee',
          email: 'assignee@example.com',
          company_name: 'Test Company'
        },
        externalAssigneeId: null,
        externalAssignee: null,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02')
      });
    });

    it('should handle object location', () => {
      const entity = {
        id: 1,
        reporterId: 10,
        title: 'Test Report',
        description: 'Test Description',
        category: ReportCategory.ROADS,
        location: { latitude: 45.0703393, longitude: 7.6869005 } as any,
        address: 'Test Address',
        isAnonymous: true,
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

      const result = mapReportEntityToReportResponse(entity);

      expect(result.location).toEqual({ latitude: 45.0703393, longitude: 7.6869005 });
      expect(result.reporterId).toBeNull();
      expect(result.reporter).toBeNull();
    });

    it('should handle invalid location string format', () => {
      const entity = {
        id: 1,
        reporterId: 10,
        title: 'Test Report',
        description: 'Test Description',
        category: ReportCategory.ROADS,
        location: 'INVALID_FORMAT',
        address: 'Test Address',
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

      const result = mapReportEntityToReportResponse(entity);

      expect(result.location).toEqual({ latitude: 0, longitude: 0 });
    });

    it('should handle photos with full URLs', () => {
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
        assigneeId: undefined,
        externalAssigneeId: undefined,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        reporter: {} as any,
        assignee: undefined,
        externalAssignee: undefined,
        photos: [
          {
            id: 1,
            reportId: 1,
            storageUrl: 'https://storage.example.com/photo1.jpg',
            createdAt: new Date('2023-01-01'),
            report: {} as any
          } as PhotoEntity
        ]
      } as ReportEntity;

      const result = mapReportEntityToReportResponse(entity);

      expect(result.photos[0].storageUrl).toBe('https://storage.example.com/photo1.jpg');
    });

    it('should handle external assignee', () => {
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
        assigneeId: undefined,
        externalAssigneeId: 30,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        reporter: {} as any,
        assignee: undefined,
        externalAssignee: {
          id: 30,
          username: 'external',
          firstName: 'External',
          lastName: 'Assignee',
          email: 'external@example.com',
          departmentRoleId: 1,
          departmentRole: {} as any,
          passwordHash: 'hash',
          personalPhotoUrl: undefined,
          telegramUsername: undefined,
          emailNotificationsEnabled: true,
          companyId: undefined,
          isVerified: true,
          verificationCode: undefined,
          verificationCodeExpiresAt: undefined,
          createdAt: new Date('2023-01-01')
        } as UserEntity,
        photos: []
      } as ReportEntity;

      const result = mapReportEntityToReportResponse(entity, 'Test Company');

      expect(result.externalAssigneeId).toBe(30);
      expect(result.externalAssignee).toEqual({
        id: 30,
        first_name: 'External',
        last_name: 'Assignee',
        username: 'external',
        email: 'external@example.com',
        company_name: 'Test Company'
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