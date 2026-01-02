import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { AppDataSource } from '@database/connection';
import { companyService } from '@services/companyService';
import { userRepository } from '@repositories/userRepository';
import { departmentRoleRepository } from '@repositories/departmentRoleRepository';
import { ConflictError } from '@models/errors/ConflictError';
import { BadRequestError } from '@models/errors/BadRequestError';
import { In } from 'typeorm';
import { UserEntity } from '@models/entity/userEntity';

describe('CompanyService Integration Tests', () => {
  let adminUserId: number;
  const createdUserIds: number[] = [];
  const createdCompanyIds: number[] = [];

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Create admin user
    const adminRole = await departmentRoleRepository.findByDepartmentAndRole(
      'Organization',
      'Administrator'
    );

    if (!adminRole) {
      throw new Error('Admin role not found');
    }

    const admin = await userRepository.createUserWithPassword({
      username: `admin_company_service_${Date.now()}`,
      email: `admin_company_service_${Date.now()}@test.com`,
      password: 'Password123!',
      firstName: 'Admin',
      lastName: 'Test',
      isVerified: true,
      telegramLinkConfirmed: false,
    });

    await AppDataSource.query(
      `INSERT INTO user_roles (user_id, department_role_id) VALUES ($1, $2)`,
      [admin.id, adminRole.id]
    );

    adminUserId = admin.id;
    createdUserIds.push(adminUserId);
  });

  afterAll(async () => {
    // Cleanup users first, then companies (users may have FK to companies)
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

  describe('createCompany', () => {
    it('should successfully create a company with valid data', async () => {
      const companyData = {
        name: `Test Company ${Date.now()}`,
        category: 'Public Lighting'
      };

      const result = await companyService.createCompany(companyData);
      createdCompanyIds.push(result.id);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe(companyData.name);
      expect(result.category).toBe(companyData.category);
      expect(result).toHaveProperty('created_at');
    });

    it('should create companies for all valid categories', async () => {
      const categories = ['Public Lighting', 'Roads and Urban Furnishings', 'Public Green Areas and Playgrounds', 'Waste'];
      const timestamp = Date.now();

      for (const category of categories) {
        const result = await companyService.createCompany({
          name: `Company ${category} ${timestamp}`,
          category
        });
        createdCompanyIds.push(result.id);

        expect(result.category).toBe(category);
      }
    });

    it('should throw ConflictError when company name already exists', async () => {
      const companyData = {
        name: `Duplicate Company ${Date.now()}`,
        category: 'Public Lighting'
      };

      const firstCompany = await companyService.createCompany(companyData);
      createdCompanyIds.push(firstCompany.id);

      await expect(
        companyService.createCompany(companyData)
      ).rejects.toThrow(ConflictError);

      await expect(
        companyService.createCompany(companyData)
      ).rejects.toThrow(`Company "${companyData.name}" already exists`);
    });

    it('should throw BadRequestError for invalid category', async () => {
      const companyData = {
        name: `Test Company ${Date.now()}`,
        category: 'InvalidCategory'
      };

      await expect(
        companyService.createCompany(companyData)
      ).rejects.toThrow(BadRequestError);

      await expect(
        companyService.createCompany(companyData)
      ).rejects.toThrow('Invalid category "InvalidCategory"');
    });
  });

  describe('getAllCompanies', () => {
    it('should retrieve all companies', async () => {
      const timestamp = Date.now();

      const companies = [
        { name: `Company A ${timestamp}`, category: 'Public Lighting' },
        { name: `Company B ${timestamp}`, category: 'Roads and Urban Furnishings' },
        { name: `Company C ${timestamp}`, category: 'Public Green Areas and Playgrounds' }
      ];

      for (const company of companies) {
        const created = await companyService.createCompany(company);
        createdCompanyIds.push(created.id);
      }

      const result = await companyService.getAllCompanies();

      expect(result.length).toBeGreaterThanOrEqual(3);
      const createdNames = companies.map(c => c.name);
      const resultNames = result.map(c => c.name);

      for (const name of createdNames) {
        expect(resultNames).toContain(name);
      }
    });

    it('should return companies ordered by name', async () => {
      const timestamp = Date.now();

      // Create companies with specific names to test ordering
      const testCompanies = [
        { name: `ZZZ Test Company ${timestamp}`, category: 'Waste' },
        { name: `AAA Test Company ${timestamp}`, category: 'Public Lighting' },
        { name: `MMM Test Company ${timestamp}`, category: 'Roads and Urban Furnishings' }
      ];

      const createdIds: number[] = [];
      for (const company of testCompanies) {
        const created = await companyService.createCompany(company);
        createdIds.push(created.id);
        createdCompanyIds.push(created.id);
      }

      const result = await companyService.getAllCompanies();

      // Filter only our test companies
      const ourCompanies = result.filter(c => createdIds.includes(c.id));
      expect(ourCompanies.length).toBe(3);

      // Check ordering of our companies
      expect(ourCompanies[0].name).toContain('AAA Test Company');
      expect(ourCompanies[1].name).toContain('MMM Test Company');
      expect(ourCompanies[2].name).toContain('ZZZ Test Company');
    });

    it('should include all required fields in response', async () => {
      const companyData = {
        name: `Full Fields Company ${Date.now()}`,
        category: 'Waste'
      };

      const created = await companyService.createCompany(companyData);
      createdCompanyIds.push(created.id);

      const result = await companyService.getAllCompanies();
      const found = result.find(c => c.id === created.id);

      expect(found).toBeDefined();
      expect(found).toHaveProperty('id');
      expect(found).toHaveProperty('name');
      expect(found).toHaveProperty('category');
      expect(found).toHaveProperty('created_at');
    });
  });

  describe('Edge cases', () => {
    it('should handle companies with special characters in name', async () => {
      const companyData = {
        name: `Company & Co. ${Date.now()} (Test)`,
        category: 'Public Lighting'
      };

      const result = await companyService.createCompany(companyData);
      createdCompanyIds.push(result.id);

      expect(result.name).toBe(companyData.name);
    });

    it('should handle concurrent company creation', async () => {
      const timestamp = Date.now();
      const promises = [];

      for (let i = 0; i < 5; i++) {
        promises.push(
          companyService.createCompany({
            name: `Concurrent Company ${timestamp}_${i}`,
            category: 'Public Lighting'
          })
        );
      }

      const results = await Promise.all(promises);
      for (const r of results) {
        createdCompanyIds.push(r.id);
      }

      expect(results.length).toBe(5);
      const names = results.map(r => r.name);
      expect(new Set(names).size).toBe(5); // All unique
    });
  });
});
