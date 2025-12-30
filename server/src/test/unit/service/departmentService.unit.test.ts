import { departmentService } from '@services/departmentService';
import { departmentRepository } from '@repositories/departmentRepository';
import { departmentRoleRepository } from '@repositories/departmentRoleRepository';
import { NotFoundError } from '@errors/NotFoundError';
import { DepartmentEntity } from '@models/entity/departmentEntity';
import { DepartmentRoleEntity } from '@models/entity/departmentRoleEntity';
import { RoleEntity } from '@models/entity/roleEntity';
import { createMockUserRole } from '@test/utils/mockEntities';

// Mock dei repository
jest.mock('@repositories/departmentRepository');
jest.mock('@repositories/departmentRepository');
jest.mock('@repositories/departmentRoleRepository');
jest.mock('@repositories/roleRepository');
import { roleRepository } from '@repositories/roleRepository';

describe('DepartmentService Unit Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- Tests for getMunicipalityDepartments() ---
  describe('getMunicipalityDepartments', () => {

    it('should return all departments excluding Organization', async () => {
      // Arrange
      const mockDepartments: DepartmentEntity[] = [
        { id: 1, name: 'Organization', departmentRoles: [] },
        { id: 2, name: 'Public Works', departmentRoles: [] },
        { id: 3, name: 'Environment', departmentRoles: [] },
        { id: 4, name: 'Urban Planning', departmentRoles: [] },
      ];

      jest.spyOn(departmentRepository, 'findAll').mockResolvedValue(mockDepartments);

      // Act
      const result = await departmentService.getMunicipalityDepartments();

      // Assert
      expect(departmentRepository.findAll).toHaveBeenCalledTimes(1);
      // Organization is filtered out
      expect(result).toHaveLength(3);
      expect(result.map(d => d.name)).toEqual(['Public Works', 'Environment', 'Urban Planning']);
    });

    it('should return all departments if no Organization exists', async () => {
      // Arrange
      const mockDepartments: DepartmentEntity[] = [
        { id: 2, name: 'Public Works', departmentRoles: [] },
        { id: 3, name: 'Environment', departmentRoles: [] },
      ];

      jest.spyOn(departmentRepository, 'findAll').mockResolvedValue(mockDepartments);

      // Act
      const result = await departmentService.getMunicipalityDepartments();

      // Assert
      expect(result).toHaveLength(2);
      expect(result.map(d => d.name)).toEqual(['Public Works', 'Environment']);
    });

    it('should return empty array if no departments exist', async () => {
      // Arrange
      jest.spyOn(departmentRepository, 'findAll').mockResolvedValue([]);

      // Act
      const result = await departmentService.getMunicipalityDepartments();

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  // --- Tests for getRolesByDepartment() ---
  describe('getRolesByDepartment', () => {

    it('should return roles for existing department', async () => {
      // Arrange
      const departmentId = 2;
      const mockDepartment: DepartmentEntity = {
        id: departmentId,
        name: 'Public Works',
        departmentRoles: [],
      };

      const mockRoles: RoleEntity[] = [
        { id: 4, name: 'Manager', description: 'Dept manager', departmentRoles: [] },
        { id: 10, name: 'Technician', description: 'Tech staff', departmentRoles: [] },
      ];

      const mockDepartmentRoles: DepartmentRoleEntity[] = [
        {
          id: 1,
          departmentId: departmentId,
          roleId: 4,
          department: mockDepartment,
          role: mockRoles[0],
          userRoles: [createMockUserRole(1, 1, 'Manager', 'Public Works')]
        },
        {
          id: 2,
          departmentId: departmentId,
          roleId: 10,
          department: mockDepartment,
          role: mockRoles[1],
          userRoles: [createMockUserRole(2, 2, 'Technician', 'Public Works')]
        },
      ];

      jest.spyOn(departmentRepository, 'findById').mockResolvedValue(mockDepartment);
      jest.spyOn(departmentRoleRepository, 'findByDepartment').mockResolvedValue(mockDepartmentRoles);

      // Act
      const result = await departmentService.getRolesByDepartment(departmentId);

      // Assert
      expect(departmentRepository.findById).toHaveBeenCalledWith(departmentId);
      expect(departmentRoleRepository.findByDepartment).toHaveBeenCalledWith(departmentId);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Manager');
      expect(result[1].name).toBe('Technician');
      expect(result[0]).not.toHaveProperty('departmentRoles'); // DTO should not have relations
    });

    it('should throw NotFoundError if department does not exist', async () => {
      // Arrange
      const departmentId = 999;
      jest.spyOn(departmentRepository, 'findById').mockResolvedValue(null);

      // Act & Assert
      await expect(departmentService.getRolesByDepartment(departmentId))
        .rejects
        .toThrow(NotFoundError);

      await expect(departmentService.getRolesByDepartment(departmentId))
        .rejects
        .toThrow(`Department with ID ${departmentId} not found`);

      expect(departmentRepository.findById).toHaveBeenCalledWith(departmentId);
      expect(departmentRoleRepository.findByDepartment).not.toHaveBeenCalled();
    });

    it('should return empty array if department has no roles', async () => {
      // Arrange
      const departmentId = 5;
      const mockDepartment: DepartmentEntity = {
        id: departmentId,
        name: 'Empty Dept',
        departmentRoles: [],
      };

      jest.spyOn(departmentRepository, 'findById').mockResolvedValue(mockDepartment);
      jest.spyOn(departmentRoleRepository, 'findByDepartment').mockResolvedValue([]);

      // Act
      const result = await departmentService.getRolesByDepartment(departmentId);

      // Assert
      expect(result).toHaveLength(0);
      expect(departmentRoleRepository.findByDepartment).toHaveBeenCalledWith(departmentId);
    });

    it('should call repository with correct parameter types', async () => {
      // Arrange
      const departmentId = 3;
      const mockDepartment: DepartmentEntity = {
        id: departmentId,
        name: 'Test Dept',
        departmentRoles: [],
      };

      jest.spyOn(departmentRepository, 'findById').mockResolvedValue(mockDepartment);
      jest.spyOn(departmentRoleRepository, 'findByDepartment').mockResolvedValue([]);

      // Act
      await departmentService.getRolesByDepartment(departmentId);

      // Assert
      const findByIdCall = (departmentRepository.findById as jest.Mock).mock.calls[0];
      const findByDeptCall = (departmentRoleRepository.findByDepartment as jest.Mock).mock.calls[0];

      expect(typeof findByIdCall[0]).toBe('number');
      expect(typeof findByDeptCall[0]).toBe('number');
      expect(findByIdCall[0]).toBe(departmentId);
      expect(findByDeptCall[0]).toBe(departmentId);
    });
  });


  describe('getAllRoles', () => {
    it('should return all roles', async () => {
      const mockRoles: RoleEntity[] = [
        { id: 1, name: 'Admin', description: 'Desc', departmentRoles: [] },
        { id: 2, name: 'User', description: 'Desc', departmentRoles: [] }
      ];
      (roleRepository.findAll as jest.Mock).mockResolvedValue(mockRoles);

      const result = await departmentService.getAllRoles();

      expect(roleRepository.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toBe('Admin');
    });
  });

  describe('getAllMunicipalityRoles', () => {
    it('should return municipality roles', async () => {
      const mockRoles: RoleEntity[] = [
        { id: 1, name: 'Mayor', description: 'Desc', departmentRoles: [] }
      ];
      (roleRepository.findMunicipalityRoles as jest.Mock).mockResolvedValue(mockRoles);

      const result = await departmentService.getAllMunicipalityRoles();

      expect(roleRepository.findMunicipalityRoles).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toBe('Mayor');
    });
  });

  describe('getAllMunicipalityDepartmentRoles', () => {
    it('should return all municipality department roles', async () => {
      const mockDeptRoles: DepartmentRoleEntity[] = [
        {
          id: 1,
          departmentId: 1,
          roleId: 1,
          department: { id: 1, name: 'Dep1', departmentRoles: [] },
          role: { id: 1, name: 'Role1', description: '', departmentRoles: [] },
          userRoles: []
        }
      ];
      (departmentRoleRepository.findMunicipalityDepartmentRoles as jest.Mock).mockResolvedValue(mockDeptRoles);

      const result = await departmentService.getAllMunicipalityDepartmentRoles();

      expect(departmentRoleRepository.findMunicipalityDepartmentRoles).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('Role1');
      expect(result[0].department).toBe('Dep1');
    });
  });

  describe('getDepartmentRoleId', () => {
    it('should return ID if found', async () => {
      (departmentRoleRepository.findByDepartmentAndRole as jest.Mock).mockResolvedValue({ id: 123 });
      const result = await departmentService.getDepartmentRoleId('Organization', 'Citizen');
      expect(result).toBe(123);
    });

    it('should return null if not found', async () => {
      (departmentRoleRepository.findByDepartmentAndRole as jest.Mock).mockResolvedValue(null);
      const result = await departmentService.getDepartmentRoleId('Organization', 'Citizen');
      expect(result).toBeNull();
    });
  });

  describe('getDepartmentRoleIdsByRoleName', () => {
    it('should return IDs for a role name', async () => {
      const mockDeptRoles = [
        { id: 1 }, { id: 2 }
      ];
      (departmentRoleRepository.findByRoleName as jest.Mock).mockResolvedValue(mockDeptRoles);

      const result = await departmentService.getDepartmentRoleIdsByRoleName('Manager');

      expect(departmentRoleRepository.findByRoleName).toHaveBeenCalledWith('Manager');
      expect(result).toEqual([1, 2]);
    });
  });
});
