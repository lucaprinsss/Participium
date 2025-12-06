import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { AppDataSource } from '@database/connection';
import { companyRepository } from '@repositories/companyRepository';

describe('CompanyRepository Integration Tests', () => {
  const createdCompanyIds: number[] = [];

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });

  afterAll(async () => {
    // Cleanup created companies
    if (createdCompanyIds.length > 0) {
      await AppDataSource.query('DELETE FROM companies WHERE id = ANY($1)', [createdCompanyIds]);
    }

    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  describe('create', () => {
    it('should create a new company', async () => {
      const timestamp = Date.now();
      const name = `Test Company ${timestamp}`;
      const category = 'Public Lighting';

      const company = await companyRepository.create(name, category);
      createdCompanyIds.push(company.id);

      expect(company).toBeDefined();
      expect(company.id).toBeDefined();
      expect(company.name).toBe(name);
      expect(company.category).toBe(category);
      expect(company.createdAt).toBeInstanceOf(Date);
    });

    it('should create companies with all valid categories', async () => {
      const timestamp = Date.now();
      const categories = [
        'Public Lighting',
        'Roads and Urban Furnishings',
        'Public Green Areas and Playgrounds',
        'Waste'
      ];

      for (const category of categories) {
        const company = await companyRepository.create(
          `Test ${category} Company ${timestamp}`,
          category
        );
        createdCompanyIds.push(company.id);

        expect(company.category).toBe(category);
      }
    });

    it('should throw error for invalid category', async () => {
      const timestamp = Date.now();
      const name = `Invalid Category Company ${timestamp}`;
      const invalidCategory = 'Invalid Category';

      await expect(
        companyRepository.create(name, invalidCategory)
      ).rejects.toThrow();
    });

    it('should handle special characters in company name', async () => {
      const timestamp = Date.now();
      const name = `Company & Sons™ ${timestamp}`;
      const category = 'Waste';

      const company = await companyRepository.create(name, category);
      createdCompanyIds.push(company.id);

      expect(company.name).toBe(name);
    });
  });

  describe('findAll', () => {
    it('should return all companies', async () => {
      const timestamp = Date.now();
      
      const company1 = await companyRepository.create(
        `Company A ${timestamp}`,
        'Public Lighting'
      );
      createdCompanyIds.push(company1.id);

      const company2 = await companyRepository.create(
        `Company B ${timestamp}`,
        'Waste'
      );
      createdCompanyIds.push(company2.id);

      const companies = await companyRepository.findAll();

      expect(companies).toBeDefined();
      expect(Array.isArray(companies)).toBe(true);
      expect(companies.length).toBeGreaterThanOrEqual(2);

      const ids = companies.map(c => c.id);
      expect(ids).toContain(company1.id);
      expect(ids).toContain(company2.id);
    });

    it('should return companies ordered by name', async () => {
      const timestamp = Date.now();

      const companyZ = await companyRepository.create(
        `ZZZ Company ${timestamp}`,
        'Public Lighting'
      );
      createdCompanyIds.push(companyZ.id);

      const companyA = await companyRepository.create(
        `AAA Company ${timestamp}`,
        'Waste'
      );
      createdCompanyIds.push(companyA.id);

      const companies = await companyRepository.findAll();
      
      // In the full list, AAA should come before ZZZ alphabetically
      const indexA = companies.findIndex(c => c.id === companyA.id);
      const indexZ = companies.findIndex(c => c.id === companyZ.id);
      expect(indexA).toBeGreaterThanOrEqual(0);
      expect(indexZ).toBeGreaterThanOrEqual(0);
      expect(indexA).toBeLessThan(indexZ);
    });

    it('should include all required fields', async () => {
      const companies = await companyRepository.findAll();

      expect(companies.length).toBeGreaterThan(0);
      
      companies.forEach(company => {
        expect(company).toHaveProperty('id');
        expect(company).toHaveProperty('name');
        expect(company).toHaveProperty('category');
        expect(company).toHaveProperty('createdAt');
        expect(typeof company.id).toBe('number');
        expect(typeof company.name).toBe('string');
        expect(typeof company.category).toBe('string');
        expect(company.createdAt).toBeInstanceOf(Date);
      });
    });
  });

  describe('findById', () => {
    it('should find company by ID', async () => {
      const timestamp = Date.now();
      const name = `FindById Company ${timestamp}`;
      const category = 'Roads and Urban Furnishings';

      const created = await companyRepository.create(name, category);
      createdCompanyIds.push(created.id);

      const found = await companyRepository.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe(name);
      expect(found?.category).toBe(category);
    });

    it('should return null for non-existent ID', async () => {
      const nonExistentId = 999999;

      const result = await companyRepository.findById(nonExistentId);

      expect(result).toBeNull();
    });

    it('should return null for invalid ID type', async () => {
      const result = await companyRepository.findById(NaN);

      expect(result).toBeNull();
    });
  });

  describe('existsByName', () => {
    it('should return true when company name exists', async () => {
      const timestamp = Date.now();
      const name = `Exists Test Company ${timestamp}`;

      const company = await companyRepository.create(name, 'Public Lighting');
      createdCompanyIds.push(company.id);

      const exists = await companyRepository.existsByName(name);

      expect(exists).toBe(true);
    });

    it('should return false when company name does not exist', async () => {
      const nonExistentName = `Non-existent Company ${Date.now()}`;

      const exists = await companyRepository.existsByName(nonExistentName);

      expect(exists).toBe(false);
    });

    it('should be case-sensitive', async () => {
      const timestamp = Date.now();
      const name = `CaseSensitive Company ${timestamp}`;

      const company = await companyRepository.create(name, 'Waste');
      createdCompanyIds.push(company.id);

      const existsExact = await companyRepository.existsByName(name);
      const existsLower = await companyRepository.existsByName(name.toLowerCase());

      expect(existsExact).toBe(true);
      expect(existsLower).toBe(false);
    });
  });

  describe('isValidCategory', () => {
    it('should return true for valid categories', async () => {
      const validCategories = [
        'Public Lighting',
        'Roads and Urban Furnishings',
        'Public Green Areas and Playgrounds',
        'Waste'
      ];

      for (const category of validCategories) {
        const isValid = await companyRepository.isValidCategory(category);
        expect(isValid).toBe(true);
      }
    });

    it('should return false for invalid category', async () => {
      const invalidCategories = [
        'Invalid Category',
        'NonExistent',
        '',
        'Public lighting', // wrong case
        'WASTE' // wrong case
      ];

      for (const category of invalidCategories) {
        const isValid = await companyRepository.isValidCategory(category);
        expect(isValid).toBe(false);
      }
    });

    it('should return false for undefined', async () => {
      const isValid = await companyRepository.isValidCategory(undefined as any);
      expect(isValid).toBe(false);
    });

    it('should return false for null', async () => {
      const isValid = await companyRepository.isValidCategory(null as any);
      expect(isValid).toBe(false);
    });
  });
});
