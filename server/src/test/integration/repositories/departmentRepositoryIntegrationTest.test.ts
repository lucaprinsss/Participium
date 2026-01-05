import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { AppDataSource } from '@database/connection';
import { departmentRepository } from '@repositories/departmentRepository';
import { DepartmentEntity } from '@models/entity/departmentEntity';

describe('DepartmentRepository Integration Tests', () => {
    const createdDepartmentIds: number[] = [];

    beforeAll(async () => {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }
    });

    afterAll(async () => {
        // Cleanup created departments
        if (createdDepartmentIds.length > 0) {
            await AppDataSource.getRepository(DepartmentEntity).delete(createdDepartmentIds);
        }

        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    });

    // --- Tests for findById() ---
    describe('findById', () => {
        it('should find an existing department by ID', async () => {
            // Use an existing department from seed data
            const departments = await departmentRepository.findAll();
            expect(departments.length).toBeGreaterThan(0);

            const existingDept = departments[0];
            const found = await departmentRepository.findById(existingDept.id);

            expect(found).toBeDefined();
            expect(found).not.toBeNull();
            expect(found?.id).toBe(existingDept.id);
            expect(found?.name).toBe(existingDept.name);
        });

        it('should return null for non-existent ID', async () => {
            const nonExistentId = 999999;

            const result = await departmentRepository.findById(nonExistentId);

            expect(result).toBeNull();
        });

        it('should return entity with id and name fields', async () => {
            const departments = await departmentRepository.findAll();
            const existingDept = departments[0];

            const found = await departmentRepository.findById(existingDept.id);

            expect(found).toHaveProperty('id');
            expect(found).toHaveProperty('name');
            expect(typeof found?.id).toBe('number');
            expect(typeof found?.name).toBe('string');
        });
    });

    // --- Tests for findByName() ---
    describe('findByName', () => {
        it('should find an existing department by name', async () => {
            // Organization should always exist in seed data
            const found = await departmentRepository.findByName('Organization');

            expect(found).toBeDefined();
            expect(found).not.toBeNull();
            expect(found?.name).toBe('Organization');
        });

        it('should return null for non-existent name', async () => {
            const nonExistentName = 'Non-Existent Department XYZ';

            const result = await departmentRepository.findByName(nonExistentName);

            expect(result).toBeNull();
        });

        it('should be case-sensitive', async () => {
            // Try to find with different case
            const resultLower = await departmentRepository.findByName('organization');
            const resultUpper = await departmentRepository.findByName('ORGANIZATION');

            expect(resultLower).toBeNull();
            expect(resultUpper).toBeNull();
        });

        it('should find Water and Sewer Services Department', async () => {
            const found = await departmentRepository.findByName('Water and Sewer Services Department');

            expect(found).toBeDefined();
            expect(found?.name).toBe('Water and Sewer Services Department');
        });

        it('should find Public Lighting Department', async () => {
            const found = await departmentRepository.findByName('Public Lighting Department');

            expect(found).toBeDefined();
            expect(found?.name).toBe('Public Lighting Department');
        });
    });

    // --- Tests for findAll() ---
    describe('findAll', () => {
        it('should return all departments', async () => {
            const departments = await departmentRepository.findAll();

            expect(departments).toBeDefined();
            expect(Array.isArray(departments)).toBe(true);
            expect(departments.length).toBeGreaterThan(0);
        });

        it('should return departments ordered by name ASC', async () => {
            const departments = await departmentRepository.findAll();

            expect(departments.length).toBeGreaterThan(1);

            // Verify ordering
            for (let i = 0; i < departments.length - 1; i++) {
                expect(departments[i].name.localeCompare(departments[i + 1].name)).toBeLessThanOrEqual(0);
            }
        });

        it('should include required seed departments', async () => {
            const departments = await departmentRepository.findAll();
            const departmentNames = departments.map(d => d.name);

            // These should exist from seed data
            expect(departmentNames).toContain('Organization');
            expect(departmentNames).toContain('Water and Sewer Services Department');
            expect(departmentNames).toContain('Public Lighting Department');
        });

        it('should return entities with required fields', async () => {
            const departments = await departmentRepository.findAll();

            for (const dept of departments) {
                expect(dept).toHaveProperty('id');
                expect(dept).toHaveProperty('name');
                expect(typeof dept.id).toBe('number');
                expect(typeof dept.name).toBe('string');
                expect(dept.name.length).toBeGreaterThan(0);
            }
        });
    });

    // --- Tests for save() ---
    describe('save', () => {
        it('should save a new department', async () => {
            const timestamp = Date.now();
            const newDept = new DepartmentEntity();
            newDept.name = `Test Department ${timestamp}`;

            const saved = await departmentRepository.save(newDept);
            createdDepartmentIds.push(saved.id);

            expect(saved).toBeDefined();
            expect(saved.id).toBeDefined();
            expect(saved.id).toBeGreaterThan(0);
            expect(saved.name).toBe(newDept.name);
        });

        it('should update an existing department', async () => {
            const timestamp = Date.now();
            const newDept = new DepartmentEntity();
            newDept.name = `Department to Update ${timestamp}`;

            const saved = await departmentRepository.save(newDept);
            createdDepartmentIds.push(saved.id);

            // Update the name
            saved.name = `Updated Department ${timestamp}`;
            const updated = await departmentRepository.save(saved);

            expect(updated.id).toBe(saved.id);
            expect(updated.name).toBe(`Updated Department ${timestamp}`);
        });

        it('should handle special characters in department name', async () => {
            const timestamp = Date.now();
            const newDept = new DepartmentEntity();
            newDept.name = `Department & Services • Test ${timestamp}`;

            const saved = await departmentRepository.save(newDept);
            createdDepartmentIds.push(saved.id);

            expect(saved.name).toBe(newDept.name);

            // Verify it can be found
            const found = await departmentRepository.findById(saved.id);
            expect(found?.name).toBe(newDept.name);
        });

        it('should persist department after save', async () => {
            const timestamp = Date.now();
            const newDept = new DepartmentEntity();
            newDept.name = `Persist Test Department ${timestamp}`;

            const saved = await departmentRepository.save(newDept);
            createdDepartmentIds.push(saved.id);

            // Find it by ID
            const foundById = await departmentRepository.findById(saved.id);
            expect(foundById).toBeDefined();
            expect(foundById?.id).toBe(saved.id);

            // Find it by name
            const foundByName = await departmentRepository.findByName(saved.name);
            expect(foundByName).toBeDefined();
            expect(foundByName?.name).toBe(saved.name);
        });
    });
});
