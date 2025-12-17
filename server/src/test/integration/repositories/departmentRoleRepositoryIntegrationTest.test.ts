import { departmentRoleRepository } from '@repositories/departmentRoleRepository';
import {
  setupTestDatabase,
  teardownTestDatabase,
  cleanDatabase,
  ensureTestDatabase
} from '@test/utils/dbTestUtils';

describe('DepartmentRoleRepository Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
    await ensureTestDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await teardownTestDatabase();
  });

  describe('findById', () => {
    it('should find a department role by ID with relations', async () => {
      const citizenRole = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Citizen');
      expect(citizenRole).toBeDefined();

      if (citizenRole) {
        const found = await departmentRoleRepository.findById(citizenRole.id);
        expect(found).toBeDefined();
        expect(found?.id).toBe(citizenRole.id);
        expect(found?.department).toBeDefined();
        expect(found?.role).toBeDefined();
      }
    });

    it('should return null for non-existent ID', async () => {
      const result = await departmentRoleRepository.findById(99999);
      expect(result).toBeNull();
    });
  });

  describe('findByDepartmentAndRole', () => {
    it('should find department role by department and role names', async () => {
      const result = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Citizen');
      expect(result).toBeDefined();
      expect(result?.department?.name).toBe('Organization');
      expect(result?.role?.name).toBe('Citizen');
    });

    it('should return null for non-existent combination', async () => {
      const result = await departmentRoleRepository.findByDepartmentAndRole('NonExistent', 'InvalidRole');
      expect(result).toBeNull();
    });
  });

  describe('findByDepartment', () => {
    it('should find all department roles for a specific department', async () => {
      const citizenRole = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Citizen');
      expect(citizenRole).toBeDefined();

      if (citizenRole && citizenRole.departmentId) {
        const results = await departmentRoleRepository.findByDepartment(citizenRole.departmentId);
        expect(results).toBeDefined();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeGreaterThan(0);
        expect(results.every(r => r.departmentId === citizenRole.departmentId)).toBe(true);
      }
    });

    it('should return empty array for non-existent department', async () => {
      const results = await departmentRoleRepository.findByDepartment(99999);
      expect(results).toEqual([]);
    });
  });

  describe('findByRole', () => {
    it('should find all department roles for a specific role', async () => {
      const citizenRole = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Citizen');
      expect(citizenRole).toBeDefined();

      if (citizenRole && citizenRole.roleId) {
        const results = await departmentRoleRepository.findByRole(citizenRole.roleId);
        expect(results).toBeDefined();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeGreaterThan(0);
        expect(results.every(r => r.roleId === citizenRole.roleId)).toBe(true);
      }
    });

    it('should return empty array for non-existent role', async () => {
      const results = await departmentRoleRepository.findByRole(99999);
      expect(results).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('should find all department roles with relations', async () => {
      const results = await departmentRoleRepository.findAll();
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      // Verify all have relations loaded
      results.forEach(dr => {
        expect(dr.department).toBeDefined();
        expect(dr.role).toBeDefined();
      });
    });

    it('should return results ordered by department and role', async () => {
      const results = await departmentRoleRepository.findAll();
      
      for (let i = 1; i < results.length; i++) {
        const prevDeptId = results[i-1].departmentId || 0;
        const currDeptId = results[i].departmentId || 0;
        const prevRoleId = results[i-1].roleId || 0;
        const currRoleId = results[i].roleId || 0;
        
        expect(
          currDeptId > prevDeptId || 
          (currDeptId === prevDeptId && currRoleId >= prevRoleId)
        ).toBe(true);
      }
    });
  });

  describe('findMunicipalityDepartmentRoles', () => {
    it('should exclude Citizen and Administrator roles', async () => {
      const results = await departmentRoleRepository.findMunicipalityDepartmentRoles();
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      
      const roleNames = results.map(dr => dr.role?.name);
      expect(roleNames).not.toContain('Citizen');
      expect(roleNames).not.toContain('Administrator');
    });

    it('should return results with department and role relations', async () => {
      const results = await departmentRoleRepository.findMunicipalityDepartmentRoles();
      
      results.forEach(dr => {
        expect(dr.department).toBeDefined();
        expect(dr.role).toBeDefined();
      });
    });

    it('should return results ordered by department and role name', async () => {
      const results = await departmentRoleRepository.findMunicipalityDepartmentRoles();
      
      for (let i = 1; i < results.length; i++) {
        const prevDeptName = results[i-1].department?.name || '';
        const currDeptName = results[i].department?.name || '';
        const prevRoleName = results[i-1].role?.name || '';
        const currRoleName = results[i].role?.name || '';
        
        expect(
          currDeptName > prevDeptName || 
          (currDeptName === prevDeptName && currRoleName >= prevRoleName)
        ).toBe(true);
      }
    });
  });

  describe('save', () => {
    it('should save a department role entity', async () => {
      const citizenRole = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Citizen');
      expect(citizenRole).toBeDefined();

      if (citizenRole) {
        const saved = await departmentRoleRepository.save(citizenRole);
        expect(saved).toBeDefined();
        expect(saved.id).toBe(citizenRole.id);
      }
    });
  });
});
