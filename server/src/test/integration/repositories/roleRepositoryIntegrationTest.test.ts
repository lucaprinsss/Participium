import { roleRepository } from '@repositories/roleRepository';
import {
  setupTestDatabase,
  teardownTestDatabase,
  cleanDatabase,
  ensureTestDatabase
} from '@test/utils/dbTestUtils';

describe('RoleRepository Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
    await ensureTestDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await teardownTestDatabase();
  });

  describe('findById', () => {
    it('should find a role by ID', async () => {
      const role = await roleRepository.findByName('Citizen');
      expect(role).toBeDefined();
      
      if (role) {
        const foundRole = await roleRepository.findById(role.id);
        expect(foundRole).toBeDefined();
        expect(foundRole?.id).toBe(role.id);
        expect(foundRole?.name).toBe('Citizen');
      }
    });

    it('should return null for non-existent ID', async () => {
      const role = await roleRepository.findById(99999);
      expect(role).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should find Citizen role', async () => {
      const role = await roleRepository.findByName('Citizen');
      expect(role).toBeDefined();
      expect(role?.name).toBe('Citizen');
    });

    it('should find Administrator role', async () => {
      const role = await roleRepository.findByName('Administrator');
      expect(role).toBeDefined();
      expect(role?.name).toBe('Administrator');
    });

    it('should return null for non-existent role name', async () => {
      const role = await roleRepository.findByName('NonExistentRole');
      expect(role).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should find all roles ordered by name', async () => {
      const roles = await roleRepository.findAll();
      expect(roles).toBeDefined();
      expect(Array.isArray(roles)).toBe(true);
      expect(roles.length).toBeGreaterThan(0);
      
      // Verify ordering
      for (let i = 1; i < roles.length; i++) {
        expect(roles[i].name >= roles[i-1].name).toBe(true);
      }
    });

    it('should include Citizen and Administrator roles', async () => {
      const roles = await roleRepository.findAll();
      const roleNames = roles.map(r => r.name);
      expect(roleNames).toContain('Citizen');
      expect(roleNames).toContain('Administrator');
    });
  });

  describe('findMunicipalityRoles', () => {
    it('should find municipality roles excluding Citizen and Administrator', async () => {
      const roles = await roleRepository.findMunicipalityRoles();
      expect(roles).toBeDefined();
      expect(Array.isArray(roles)).toBe(true);
      
      const roleNames = roles.map(r => r.name);
      expect(roleNames).not.toContain('Citizen');
      expect(roleNames).not.toContain('Administrator');
    });

    it('should return roles ordered by name', async () => {
      const roles = await roleRepository.findMunicipalityRoles();
      
      // Verify ordering
      for (let i = 1; i < roles.length; i++) {
        expect(roles[i].name >= roles[i-1].name).toBe(true);
      }
    });
  });

  describe('save', () => {
    it('should save a new role', async () => {
      const newRole = await roleRepository.save({
        name: `TestRole_${Date.now()}`,
      } as any);
      
      expect(newRole).toBeDefined();
      expect(newRole.id).toBeDefined();
      expect(newRole.name).toContain('TestRole_');
      
      // Clean up
      const foundRole = await roleRepository.findById(newRole.id);
      expect(foundRole).toBeDefined();
    });
  });
});
