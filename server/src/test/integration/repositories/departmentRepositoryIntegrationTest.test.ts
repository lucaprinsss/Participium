import { departmentRepository } from '@repositories/departmentRepository';
import {
  setupTestDatabase,
  teardownTestDatabase,
  cleanDatabase,
  ensureTestDatabase
} from '@test/utils/dbTestUtils';

describe('DepartmentRepository Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
    await ensureTestDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await teardownTestDatabase();
  });

  describe('findById', () => {
    it('should find a department by ID', async () => {
      const org = await departmentRepository.findByName('Organization');
      expect(org).toBeDefined();
      
      if (org) {
        const found = await departmentRepository.findById(org.id);
        expect(found).toBeDefined();
        expect(found?.id).toBe(org.id);
        expect(found?.name).toBe('Organization');
      }
    });

    it('should return null for non-existent ID', async () => {
      const result = await departmentRepository.findById(99999);
      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should find Organization department', async () => {
      const dept = await departmentRepository.findByName('Organization');
      expect(dept).toBeDefined();
      expect(dept?.name).toBe('Organization');
    });

    it('should return null for non-existent department name', async () => {
      const dept = await departmentRepository.findByName('NonExistentDepartment');
      expect(dept).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should find all departments ordered by name', async () => {
      const departments = await departmentRepository.findAll();
      expect(departments).toBeDefined();
      expect(Array.isArray(departments)).toBe(true);
      expect(departments.length).toBeGreaterThan(0);
      
      // Verify ordering
      for (let i = 1; i < departments.length; i++) {
        expect(departments[i].name >= departments[i-1].name).toBe(true);
      }
    });

    it('should include Organization department', async () => {
      const departments = await departmentRepository.findAll();
      const deptNames = departments.map(d => d.name);
      expect(deptNames).toContain('Organization');
    });
  });

  describe('save', () => {
    it('should save a new department', async () => {
      const newDept = await departmentRepository.save({
        name: `TestDepartment_${Date.now()}`,
      } as any);
      
      expect(newDept).toBeDefined();
      expect(newDept.id).toBeDefined();
      expect(newDept.name).toContain('TestDepartment_');
      
      // Verify it was saved
      const found = await departmentRepository.findById(newDept.id);
      expect(found).toBeDefined();
    });

    it('should update an existing department', async () => {
      const dept = await departmentRepository.findByName('Organization');
      expect(dept).toBeDefined();

      if (dept) {
        const updated = await departmentRepository.save(dept);
        expect(updated.id).toBe(dept.id);
        expect(updated.name).toBe(dept.name);
      }
    });
  });
});
