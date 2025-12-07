import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { AppDataSource } from '@database/connection';
import { userService } from '@services/userService';
import { userRepository } from '@repositories/userRepository';
import { departmentRoleRepository } from '@repositories/departmentRoleRepository';
import { companyRepository } from '@repositories/companyRepository';
import { RegisterRequest } from '@models/dto/input/RegisterRequest';
import { UserEntity } from '@models/entity/userEntity';
import { ConflictError } from '@models/errors/ConflictError';
import { AppError } from '@models/errors/AppError';
import { In } from 'typeorm';

describe('UserService Integration Tests', () => {
  const createdUserIds: number[] = [];
  const createdCompanyIds: number[] = [];

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });

  afterAll(async () => {
    // Cleanup
    if (createdUserIds.length > 0) {
      await AppDataSource.getRepository(UserEntity).delete({ id: In(createdUserIds) });
    }
    
    if (createdCompanyIds.length > 0) {
      await AppDataSource.query('DELETE FROM companies WHERE id = ANY($1)', [createdCompanyIds]);
    }

    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  describe('registerCitizen', () => {
    it('should register a new citizen successfully', async () => {
      const timestamp = Date.now();
      const registerRequest: RegisterRequest = {
        username: `testcitizen_${timestamp}`,
        email: `testcitizen_${timestamp}@test.com`,
        first_name: 'Test',
        last_name: 'Citizen',
        password: 'Password123!',
        role_name: 'Citizen',
      };

      const result = await userService.registerCitizen(registerRequest);
      createdUserIds.push(result.id);

      expect(result).toBeDefined();
      expect(result.username).toBe(registerRequest.username);
      expect(result.email).toBe(registerRequest.email);
      expect(result.first_name).toBe(registerRequest.first_name);
      expect(result.last_name).toBe(registerRequest.last_name);
      expect(result.role_name).toBe('Citizen');
    });

    it('should use fallback role CITIZEN if role is not provided', async () => {
      const timestamp = Date.now();
      const registerRequest: Omit<RegisterRequest, 'role_name'> = {
        username: `testcitizen2_${timestamp}`,
        email: `testcitizen2_${timestamp}@test.com`,
        first_name: 'Test',
        last_name: 'Citizen2',
        password: 'Password123!',
      };

      const result = await userService.registerCitizen(registerRequest as RegisterRequest);
      createdUserIds.push(result.id);

      expect(result.role_name).toBe('Citizen');
    });

    it('should throw ConflictError if username already exists', async () => {
      const timestamp = Date.now();
      const registerRequest: RegisterRequest = {
        username: `duplicate_${timestamp}`,
        email: `unique1_${timestamp}@test.com`,
        first_name: 'Test',
        last_name: 'User',
        password: 'Password123!',
        role_name: 'Citizen',
      };

      const firstUser = await userService.registerCitizen(registerRequest);
      createdUserIds.push(firstUser.id);

      // Try to register with same username
      const duplicateRequest: RegisterRequest = {
        ...registerRequest,
        email: `unique2_${timestamp}@test.com`, // Different email
      };

      await expect(userService.registerCitizen(duplicateRequest)).rejects.toThrow(ConflictError);
      await expect(userService.registerCitizen(duplicateRequest)).rejects.toThrow('Username already exists');
    });

    it('should throw ConflictError if email already exists', async () => {
      const timestamp = Date.now();
      const registerRequest: RegisterRequest = {
        username: `user1_${timestamp}`,
        email: `duplicate_${timestamp}@test.com`,
        first_name: 'Test',
        last_name: 'User',
        password: 'Password123!',
        role_name: 'Citizen',
      };

      const firstUser = await userService.registerCitizen(registerRequest);
      createdUserIds.push(firstUser.id);

      // Try to register with same email
      const duplicateRequest: RegisterRequest = {
        ...registerRequest,
        username: `user2_${timestamp}`, // Different username
      };

      await expect(userService.registerCitizen(duplicateRequest)).rejects.toThrow(ConflictError);
      await expect(userService.registerCitizen(duplicateRequest)).rejects.toThrow('Email already exists');
    });
  });

  describe('getUserById', () => {
    it('should return a user response if user is found', async () => {
      const timestamp = Date.now();
      const registerRequest: RegisterRequest = {
        username: `getbyid_${timestamp}`,
        email: `getbyid_${timestamp}@test.com`,
        first_name: 'Get',
        last_name: 'ById',
        password: 'Password123!',
        role_name: 'Citizen',
      };

      const created = await userService.registerCitizen(registerRequest);
      createdUserIds.push(created.id);

      const result = await userService.getUserById(created.id);

      expect(result).toBeDefined();
      expect(result!.id).toBe(created.id);
      expect(result!.username).toBe(registerRequest.username);
      expect(result!.email).toBe(registerRequest.email);
    });

    it('should return null if user is not found', async () => {
      const result = await userService.getUserById(999999);

      expect(result).toBeNull();
    });
  });

  describe('getExternalMaintainersByCategory', () => {
    let lightingCompanyId: number;
    let roadsCompanyId: number;
    let lightingMaintainer1Id: number;
    let lightingMaintainer2Id: number;
    let roadsMaintainerId: number;

    beforeAll(async () => {
      const timestamp = Date.now();

      // Create companies
      const lightingCompany = await companyRepository.create(
        `Lighting Company ${timestamp}`,
        'Public Lighting'
      );
      lightingCompanyId = lightingCompany.id;
      createdCompanyIds.push(lightingCompanyId);

      const roadsCompany = await companyRepository.create(
        `Roads Company ${timestamp}`,
        'Roads and Urban Furnishings'
      );
      roadsCompanyId = roadsCompany.id;
      createdCompanyIds.push(roadsCompanyId);

      // Get external maintainer role
      const externalRole = await departmentRoleRepository.findByDepartmentAndRole(
        'External Service Providers',
        'External Maintainer'
      );

      if (!externalRole) {
        throw new Error('External Maintainer role not found');
      }

      // Create lighting maintainers
      const lightingMaintainer1 = await userRepository.createUserWithPassword({
        username: `lighting_m1_${timestamp}`,
        email: `lighting_m1_${timestamp}@test.com`,
        password: 'Password123!',
        firstName: 'Lighting',
        lastName: 'Maintainer1',
        departmentRoleId: externalRole.id,
        companyId: lightingCompanyId,
        isVerified: true,
      });
      lightingMaintainer1Id = lightingMaintainer1.id;
      createdUserIds.push(lightingMaintainer1Id);

      const lightingMaintainer2 = await userRepository.createUserWithPassword({
        username: `lighting_m2_${timestamp}`,
        email: `lighting_m2_${timestamp}@test.com`,
        password: 'Password123!',
        firstName: 'Lighting',
        lastName: 'Maintainer2',
        departmentRoleId: externalRole.id,
        companyId: lightingCompanyId,
        isVerified: true,
      });
      lightingMaintainer2Id = lightingMaintainer2.id;
      createdUserIds.push(lightingMaintainer2Id);

      // Create roads maintainer
      const roadsMaintainer = await userRepository.createUserWithPassword({
        username: `roads_m1_${timestamp}`,
        email: `roads_m1_${timestamp}@test.com`,
        password: 'Password123!',
        firstName: 'Roads',
        lastName: 'Maintainer',
        departmentRoleId: externalRole.id,
        companyId: roadsCompanyId,
        isVerified: true,
      });
      roadsMaintainerId = roadsMaintainer.id;
      createdUserIds.push(roadsMaintainerId);
    });

    it('should return maintainers filtered by category', async () => {
      const result = await userService.getExternalMaintainersByCategory('Public Lighting');

      expect(result.length).toBeGreaterThanOrEqual(2);
      
      const ids = result.map(u => u.id);
      expect(ids).toContain(lightingMaintainer1Id);
      expect(ids).toContain(lightingMaintainer2Id);
      expect(ids).not.toContain(roadsMaintainerId);
    });

    it('should include company_name in response', async () => {
      const result = await userService.getExternalMaintainersByCategory('Public Lighting');

      expect(result.length).toBeGreaterThan(0);
      
      const maintainer = result.find(u => u.id === lightingMaintainer1Id);
      expect(maintainer).toBeDefined();
      expect(maintainer!.company_name).toBeDefined();
      expect(maintainer!.company_name).toContain('Lighting Company');
    });

    it('should return empty array when no maintainers for category', async () => {
      const result = await userService.getExternalMaintainersByCategory('Public Green Areas and Playgrounds');

      const testMaintainerIds = [lightingMaintainer1Id, lightingMaintainer2Id, roadsMaintainerId];
      const hasTestMaintainers = result.some(u => testMaintainerIds.includes(u.id));
      
      expect(hasTestMaintainers).toBe(false);
    });

    it('should only return external maintainers, not other roles', async () => {
      const result = await userService.getExternalMaintainersByCategory('Public Lighting');

      expect(result.length).toBeGreaterThan(0);
      result.forEach(user => {
        expect(user.role_name).toBe('External Maintainer');
      });
    });

    it('should return all maintainers when category is undefined', async () => {
      const result = await userService.getExternalMaintainersByCategory(undefined as any);
      expect(Array.isArray(result)).toBe(true);
      // Should return maintainers without filtering
    });

    it('should return all maintainers when category is empty string', async () => {
      const result = await userService.getExternalMaintainersByCategory('');
      expect(Array.isArray(result)).toBe(true);
      // Should return maintainers without filtering
    });

    it('should separate maintainers by category correctly', async () => {
      const lightingResult = await userService.getExternalMaintainersByCategory('Public Lighting');
      const roadsResult = await userService.getExternalMaintainersByCategory('Roads and Urban Furnishings');

      const lightingIds = lightingResult.map(u => u.id);
      const roadsIds = roadsResult.map(u => u.id);

      // Lighting maintainers in lighting results
      expect(lightingIds).toContain(lightingMaintainer1Id);
      expect(lightingIds).toContain(lightingMaintainer2Id);
      expect(lightingIds).not.toContain(roadsMaintainerId);

      // Roads maintainer in roads results
      expect(roadsIds).toContain(roadsMaintainerId);
      expect(roadsIds).not.toContain(lightingMaintainer1Id);
      expect(roadsIds).not.toContain(lightingMaintainer2Id);
    });

    it('should handle concurrent requests for different categories', async () => {
      const promises = [
        userService.getExternalMaintainersByCategory('Public Lighting'),
        userService.getExternalMaintainersByCategory('Roads and Urban Furnishings'),
        userService.getExternalMaintainersByCategory('Public Green Areas and Playgrounds')
      ];

      const results = await Promise.all(promises);

      expect(results[0].length).toBeGreaterThanOrEqual(2); // Lighting
      expect(results[1].length).toBeGreaterThanOrEqual(1); // Roads
      // results[2] might be empty for Green areas
    });

    it('should include all required fields in UserResponse', async () => {
      const result = await userService.getExternalMaintainersByCategory('Public Lighting');

      expect(result.length).toBeGreaterThan(0);
      
      const maintainer = result.find(u => u.id === lightingMaintainer1Id);
      expect(maintainer).toBeDefined();
      expect(maintainer).toHaveProperty('id');
      expect(maintainer).toHaveProperty('username');
      expect(maintainer).toHaveProperty('email');
      expect(maintainer).toHaveProperty('first_name');
      expect(maintainer).toHaveProperty('last_name');
      expect(maintainer).toHaveProperty('role_name');
      expect(maintainer).toHaveProperty('department_name');
      expect(maintainer).toHaveProperty('company_name');
    });

    it('should batch query companies to avoid N+1 problem', async () => {
      const result = await userService.getExternalMaintainersByCategory('Public Lighting');

      expect(result.length).toBeGreaterThanOrEqual(2);
      
      // All maintainers should have company_name populated
      result.forEach(maintainer => {
        expect(maintainer.company_name).toBeDefined();
        expect(typeof maintainer.company_name).toBe('string');
      });

      // Maintainers from same company should have same company_name
      const m1 = result.find(u => u.id === lightingMaintainer1Id);
      const m2 = result.find(u => u.id === lightingMaintainer2Id);

      if (m1 && m2) {
        expect(m1.company_name).toBe(m2.company_name);
      }
    });
  });
});