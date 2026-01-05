import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { AppDataSource } from '@database/connection';
import { roleRepository } from '@repositories/roleRepository';
import { RoleEntity } from '@models/entity/roleEntity';

describe('RoleRepository Integration Tests', () => {
    const createdRoleIds: number[] = [];

    beforeAll(async () => {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }
    });

    afterAll(async () => {
        // Cleanup created roles
        if (createdRoleIds.length > 0) {
            await AppDataSource.getRepository(RoleEntity).delete(createdRoleIds);
        }

        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    });

    // --- Tests for findById() ---
    describe('findById', () => {
        it('should find an existing role by ID', async () => {
            const roles = await roleRepository.findAll();
            expect(roles.length).toBeGreaterThan(0);

            const existingRole = roles[0];
            const found = await roleRepository.findById(existingRole.id);

            expect(found).toBeDefined();
            expect(found).not.toBeNull();
            expect(found?.id).toBe(existingRole.id);
            expect(found?.name).toBe(existingRole.name);
        });

        it('should return null for non-existent ID', async () => {
            const nonExistentId = 999999;

            const result = await roleRepository.findById(nonExistentId);

            expect(result).toBeNull();
        });

        it('should return entity with id and name fields', async () => {
            const roles = await roleRepository.findAll();
            const existingRole = roles[0];

            const found = await roleRepository.findById(existingRole.id);

            expect(found).toHaveProperty('id');
            expect(found).toHaveProperty('name');
            expect(typeof found?.id).toBe('number');
            expect(typeof found?.name).toBe('string');
        });
    });

    // --- Tests for findByName() ---
    describe('findByName', () => {
        it('should find Citizen role', async () => {
            const found = await roleRepository.findByName('Citizen');

            expect(found).toBeDefined();
            expect(found).not.toBeNull();
            expect(found?.name).toBe('Citizen');
        });

        it('should find Administrator role', async () => {
            const found = await roleRepository.findByName('Administrator');

            expect(found).toBeDefined();
            expect(found).not.toBeNull();
            expect(found?.name).toBe('Administrator');
        });

        it('should return null for non-existent role name', async () => {
            const nonExistentName = 'Super Non-Existent Role XYZ';

            const result = await roleRepository.findByName(nonExistentName);

            expect(result).toBeNull();
        });

        it('should be case-sensitive', async () => {
            const resultLower = await roleRepository.findByName('citizen');
            const resultUpper = await roleRepository.findByName('CITIZEN');

            expect(resultLower).toBeNull();
            expect(resultUpper).toBeNull();
        });

        it('should find Department Director role', async () => {
            const found = await roleRepository.findByName('Department Director');

            expect(found).toBeDefined();
            expect(found?.name).toBe('Department Director');
        });
    });

    // --- Tests for findAll() ---
    describe('findAll', () => {
        it('should return all roles', async () => {
            const roles = await roleRepository.findAll();

            expect(roles).toBeDefined();
            expect(Array.isArray(roles)).toBe(true);
            expect(roles.length).toBeGreaterThan(0);
        });

        it('should return roles ordered by name ASC', async () => {
            const roles = await roleRepository.findAll();

            expect(roles.length).toBeGreaterThan(1);

            // Verify ordering
            for (let i = 0; i < roles.length - 1; i++) {
                expect(roles[i].name.localeCompare(roles[i + 1].name)).toBeLessThanOrEqual(0);
            }
        });

        it('should include Citizen and Administrator roles', async () => {
            const roles = await roleRepository.findAll();
            const roleNames = roles.map(r => r.name);

            expect(roleNames).toContain('Citizen');
            expect(roleNames).toContain('Administrator');
        });

        it('should return entities with required fields', async () => {
            const roles = await roleRepository.findAll();

            for (const role of roles) {
                expect(role).toHaveProperty('id');
                expect(role).toHaveProperty('name');
                expect(typeof role.id).toBe('number');
                expect(typeof role.name).toBe('string');
                expect(role.name.length).toBeGreaterThan(0);
            }
        });
    });

    // --- Tests for findMunicipalityRoles() ---
    describe('findMunicipalityRoles', () => {
        it('should return roles excluding Citizen and Administrator', async () => {
            const municipalityRoles = await roleRepository.findMunicipalityRoles();

            expect(municipalityRoles).toBeDefined();
            expect(Array.isArray(municipalityRoles)).toBe(true);

            const roleNames = municipalityRoles.map(r => r.name);
            expect(roleNames).not.toContain('Citizen');
            expect(roleNames).not.toContain('Administrator');
        });

        it('should return fewer roles than findAll', async () => {
            const allRoles = await roleRepository.findAll();
            const municipalityRoles = await roleRepository.findMunicipalityRoles();

            // At least Citizen and Administrator should be excluded
            expect(municipalityRoles.length).toBeLessThan(allRoles.length);
            expect(allRoles.length - municipalityRoles.length).toBeGreaterThanOrEqual(2);
        });

        it('should include municipality staff roles', async () => {
            const municipalityRoles = await roleRepository.findMunicipalityRoles();
            const roleNames = municipalityRoles.map(r => r.name);

            // These should be included (municipality staff roles from seed data)
            expect(roleNames).toContain('Department Director');
        });

        it('should return roles ordered by name ASC', async () => {
            const roles = await roleRepository.findMunicipalityRoles();

            if (roles.length > 1) {
                for (let i = 0; i < roles.length - 1; i++) {
                    expect(roles[i].name.localeCompare(roles[i + 1].name)).toBeLessThanOrEqual(0);
                }
            }
        });

        it('should return entities with required fields', async () => {
            const roles = await roleRepository.findMunicipalityRoles();

            for (const role of roles) {
                expect(role).toHaveProperty('id');
                expect(role).toHaveProperty('name');
                expect(typeof role.id).toBe('number');
                expect(typeof role.name).toBe('string');
            }
        });
    });

    // --- Tests for save() ---
    describe('save', () => {
        it('should save a new role', async () => {
            const timestamp = Date.now();
            const newRole = new RoleEntity();
            newRole.name = `Test Role ${timestamp}`;

            const saved = await roleRepository.save(newRole);
            createdRoleIds.push(saved.id);

            expect(saved).toBeDefined();
            expect(saved.id).toBeDefined();
            expect(saved.id).toBeGreaterThan(0);
            expect(saved.name).toBe(newRole.name);
        });

        it('should update an existing role', async () => {
            const timestamp = Date.now();
            const newRole = new RoleEntity();
            newRole.name = `Role to Update ${timestamp}`;

            const saved = await roleRepository.save(newRole);
            createdRoleIds.push(saved.id);

            // Update the name
            saved.name = `Updated Role ${timestamp}`;
            const updated = await roleRepository.save(saved);

            expect(updated.id).toBe(saved.id);
            expect(updated.name).toBe(`Updated Role ${timestamp}`);
        });

        it('should persist role after save', async () => {
            const timestamp = Date.now();
            const newRole = new RoleEntity();
            newRole.name = `Persist Test Role ${timestamp}`;

            const saved = await roleRepository.save(newRole);
            createdRoleIds.push(saved.id);

            // Find it by ID
            const foundById = await roleRepository.findById(saved.id);
            expect(foundById).toBeDefined();
            expect(foundById?.id).toBe(saved.id);

            // Find it by name
            const foundByName = await roleRepository.findByName(saved.name);
            expect(foundByName).toBeDefined();
            expect(foundByName?.name).toBe(saved.name);
        });
    });
});
