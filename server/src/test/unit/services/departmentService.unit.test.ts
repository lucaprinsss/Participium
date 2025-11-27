import { departmentService } from '@services/departmentService';
import { departmentRepository } from '@repositories/departmentRepository';
import { departmentRoleRepository } from '@repositories/departmentRoleRepository';
import { NotFoundError } from '@errors/NotFoundError';
import { DepartmentEntity } from '@models/entity/departmentEntity';
import { DepartmentRoleEntity } from '@models/entity/departmentRoleEntity';
import { RoleEntity } from '@models/entity/roleEntity';

// Mock dei repository
jest.mock('@repositories/departmentRepository');
jest.mock('@repositories/departmentRoleRepository');

describe('DepartmentService Unit Tests', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- Test per getMunicipalityDepartments() ---
  describe('getMunicipalityDepartments', () => {
    
    it('should return all departments', async () => {
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
      expect(result).toHaveLength(4);
      expect(result.map(d => d.name)).toEqual(['Organization', 'Public Works', 'Environment', 'Urban Planning']);
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

  // --- Test per getRolesByDepartment() ---
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
          users: [],
        },
        {
          id: 2,
          departmentId: departmentId,
          roleId: 10,
          department: mockDepartment,
          role: mockRoles[1],
          users: [],
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
});
