import { departmentService } from '@services/departmentService';
import { 
  setupTestDatabase, 
  teardownTestDatabase, 
  cleanDatabase,
  ensureTestDatabase 
} from '@test/utils/dbTestUtils';

/**
 * Integration Tests for DepartmentService
 * Uses real PostgreSQL test database with Docker
 */
describe('DepartmentService Integration Tests', () => {
  
  // Setup database before all tests
  beforeAll(async () => {
    await setupTestDatabase();
    await ensureTestDatabase();
  });

  // Cleanup after all tests
  afterAll(async () => {
    await teardownTestDatabase();
  });

  // Clean dynamic data after each test
  afterEach(async () => {
    await cleanDatabase();
  });

  // --- Test per getMunicipalityDepartments() ---
  describe('getMunicipalityDepartments', () => {
    
    it('should return all municipality departments from database', async () => {
      // Act - Uses test-data.sql which has 8 departments including Organization
      const result = await departmentService.getMunicipalityDepartments();

      // Assert
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      const departmentNames = result.map(d => d.name);
      
      // Verify we have municipality departments
      expect(departmentNames).toContain('Water and Sewer Services Department');
      expect(departmentNames).toContain('Public Lighting Department');
      
      // Verify DTO structure
      for (const dept of result) {
        expect(dept).toHaveProperty('id');
        expect(dept).toHaveProperty('name');
        expect(typeof dept.id).toBe('number');
        expect(typeof dept.name).toBe('string');
      }
    });

    it('should return at least 9 municipality departments', async () => {
      // Act
      const result = await departmentService.getMunicipalityDepartments();

      // Assert - Filter out test departments created during tests
      const nonTestDepartments = result.filter((dept: any) => !dept.name.startsWith('TestDepartment'));
      expect(nonTestDepartments.length).toBeGreaterThanOrEqual(9);
    });
  });

  // --- Test per getRolesByDepartment() ---
  describe('getRolesByDepartment', () => {
    
    it('should return roles for Water and Sewer Services Department', async () => {
      // Arrange - Department ID from test-data.sql
      const waterDeptId = 2; // Water and Sewer Services Department

      // Act
      const result = await departmentService.getRolesByDepartment(waterDeptId);

      // Assert
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      // Verify role names from init.sql
      const roleNames = result.map(r => r.name);
      expect(roleNames).toContain('Department Director');
      expect(roleNames).toContain('Water Network staff member');
      
      // Verify DTO structure
      for (const role of result) {
        expect(role).toHaveProperty('id');
        expect(role).toHaveProperty('name');
        expect(role).toHaveProperty('description');
        expect(typeof role.id).toBe('number');
        expect(typeof role.name).toBe('string');
      }
    });

    it('should return roles for Public Infrastructure Department', async () => {
      // Arrange
      const infraDeptId = 3; // Public Infrastructure and Accessibility Department

      // Act
      const result = await departmentService.getRolesByDepartment(infraDeptId);

      // Assert
      expect(result.length).toBeGreaterThan(0);
      const roleNames = result.map(r => r.name);
      expect(roleNames).toContain('Road Maintenance staff member');
      expect(roleNames).toContain('Department Director');
    });

    it('should throw NotFoundError for non-existent department', async () => {
      // Arrange
      const nonExistentDeptId = 999;

      // Act & Assert
      await expect(departmentService.getRolesByDepartment(nonExistentDeptId))
        .rejects
        .toThrow('Department with ID 999 not found');
    });

    it('should return different roles for different departments', async () => {
      // Arrange
      const waterDeptId = 2; // Water and Sewer
      const infraDeptId = 3; // Public Infrastructure

      // Act
      const waterRoles = await departmentService.getRolesByDepartment(waterDeptId);
      const infraRoles = await departmentService.getRolesByDepartment(infraDeptId);

      // Assert - Departments should have some unique roles
      const waterRoleNames = waterRoles.map(r => r.name);
      const infraRoleNames = infraRoles.map(r => r.name);
      
      expect(waterRoleNames).toContain('Water Network staff member');
      expect(infraRoleNames).not.toContain('Water Network staff member');
      expect(infraRoleNames).toContain('Road Maintenance staff member');
      expect(waterRoleNames).not.toContain('Road Maintenance staff member');
    });

    it('should return roles ordered by role id ascending', async () => {
      // Arrange
      const waterDeptId = 2;

      // Act
      const result = await departmentService.getRolesByDepartment(waterDeptId);

      // Assert - Verify ordering
      const roleIds = result.map(r => r.id);
      const sortedIds = [...roleIds].sort((a, b) => a - b);
      expect(roleIds).toEqual(sortedIds);
    });

    it('should not return Citizen or Administrator roles for municipality departments', async () => {
      // Arrange - Test all municipality departments (IDs 2-8, excluding Organization id=1)
      const deptIds = [2, 3, 4, 5, 6, 7, 8];

      // Act & Assert
      for (const deptId of deptIds) {
        const roles = await departmentService.getRolesByDepartment(deptId);
        const roleNames = roles.map(r => r.name);
        
        expect(roleNames).not.toContain('Citizen');
        expect(roleNames).not.toContain('Administrator');
      }
    });

    it('should return valid role DTOs without entity relations', async () => {
      // Arrange
      const waterDeptId = 2;

      // Act
      const result = await departmentService.getRolesByDepartment(waterDeptId);

      // Assert - Verify DTOs don't have entity relations
      for (const role of result) {
        expect(role).not.toHaveProperty('departmentRoles');
        expect(role).toHaveProperty('id');
        expect(role).toHaveProperty('name');
        expect(role).toHaveProperty('description');
      }
    });
  });

  // --- Test per validazione database constraints ---
  describe('Database Integrity', () => {
    
    it('should have all departments loaded from test-data.sql', async () => {
      // Act
      const allDepts = await departmentService.getMunicipalityDepartments();
      
      // Assert - Verify key departments exist (excluding Organization)
      const deptNames = allDepts.map(d => d.name);
      expect(deptNames).toContain('Water and Sewer Services Department');
      expect(deptNames).toContain('Public Lighting Department');
      expect(deptNames).toContain('Public Infrastructure and Accessibility Department');
      expect(deptNames).toContain('Waste Management Department');
      expect(deptNames).toContain('Mobility and Traffic Management Department');
      expect(deptNames).toContain('Parks, Green Areas and Recreation Department');
      expect(deptNames).toContain('General Services Department');
    });

    it('should handle department with multiple roles correctly', async () => {
      // Arrange - Water dept should have multiple roles
      const waterDeptId = 2;

      // Act
      const roles = await departmentService.getRolesByDepartment(waterDeptId);

      // Assert
      expect(roles.length).toBeGreaterThanOrEqual(2);
      
      // Verify all roles have unique IDs
      const roleIds = roles.map(r => r.id);
      const uniqueIds = new Set(roleIds);
      expect(uniqueIds.size).toBe(roleIds.length);
    });
  });
});
