import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { AppDataSource } from '@database/connection';
import { departmentRoleRepository } from '@repositories/departmentRoleRepository';
import { departmentRepository } from '@repositories/departmentRepository';
import { roleRepository } from '@repositories/roleRepository';
import { DepartmentRoleEntity } from '@models/entity/departmentRoleEntity';
import { DepartmentEntity } from '@models/entity/departmentEntity';
import { RoleEntity } from '@models/entity/roleEntity';

describe('DepartmentRoleRepository Integration Tests', () => {
    const createdDepartmentRoleIds: number[] = [];
    const createdDepartmentIds: number[] = [];
    const createdRoleIds: number[] = [];

    beforeAll(async () => {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }
    });

    afterAll(async () => {
        // Cleanup in correct order (FK constraints)
        if (createdDepartmentRoleIds.length > 0) {
            await AppDataSource.getRepository(DepartmentRoleEntity).delete(createdDepartmentRoleIds);
        }
        if (createdDepartmentIds.length > 0) {
            await AppDataSource.getRepository(DepartmentEntity).delete(createdDepartmentIds);
        }
        if (createdRoleIds.length > 0) {
            await AppDataSource.getRepository(RoleEntity).delete(createdRoleIds);
        }

        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    });

    // --- Tests for findById() ---
    describe('findById', () => {
        it('should find an existing department role by ID', async () => {
            const departmentRoles = await departmentRoleRepository.findAll();
            expect(departmentRoles.length).toBeGreaterThan(0);

            const existingDR = departmentRoles[0];
            const found = await departmentRoleRepository.findById(existingDR.id);

            expect(found).toBeDefined();
            expect(found).not.toBeNull();
            expect(found?.id).toBe(existingDR.id);
        });

        it('should return null for non-existent ID', async () => {
            const nonExistentId = 999999;

            const result = await departmentRoleRepository.findById(nonExistentId);

            expect(result).toBeNull();
        });

        it('should include department and role relations', async () => {
            const departmentRoles = await departmentRoleRepository.findAll();
            const existingDR = departmentRoles[0];

            const found = await departmentRoleRepository.findById(existingDR.id);

            expect(found).toHaveProperty('department');
            expect(found).toHaveProperty('role');
            expect(found?.department).toBeDefined();
            expect(found?.role).toBeDefined();
            expect(found?.department?.name).toBeDefined();
            expect(found?.role?.name).toBeDefined();
        });
    });

    // --- Tests for findByDepartmentAndRole() ---
    describe('findByDepartmentAndRole', () => {
        it('should find Organization Administrator', async () => {
            const found = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Administrator');

            expect(found).toBeDefined();
            expect(found).not.toBeNull();
            expect(found?.department?.name).toBe('Organization');
            expect(found?.role?.name).toBe('Administrator');
        });

        it('should find Organization Citizen', async () => {
            const found = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Citizen');

            expect(found).toBeDefined();
            expect(found).not.toBeNull();
            expect(found?.department?.name).toBe('Organization');
            expect(found?.role?.name).toBe('Citizen');
        });

        it('should return null for non-existent combination', async () => {
            const result = await departmentRoleRepository.findByDepartmentAndRole(
                'Organization',
                'Non-Existent Role XYZ'
            );

            expect(result).toBeNull();
        });

        it('should return null for non-existent department', async () => {
            const result = await departmentRoleRepository.findByDepartmentAndRole(
                'Non-Existent Department',
                'Administrator'
            );

            expect(result).toBeNull();
        });

        it('should be case-sensitive for department name', async () => {
            const result = await departmentRoleRepository.findByDepartmentAndRole('organization', 'Administrator');

            expect(result).toBeNull();
        });

        it('should be case-sensitive for role name', async () => {
            const result = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'administrator');

            expect(result).toBeNull();
        });

        it('should include full relations', async () => {
            const found = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Administrator');

            expect(found?.department).toHaveProperty('id');
            expect(found?.department).toHaveProperty('name');
            expect(found?.role).toHaveProperty('id');
            expect(found?.role).toHaveProperty('name');
        });
    });

    // --- Tests for findByDepartment() ---
    describe('findByDepartment', () => {
        it('should find all roles for Organization department', async () => {
            const orgDept = await departmentRepository.findByName('Organization');
            expect(orgDept).not.toBeNull();

            const departmentRoles = await departmentRoleRepository.findByDepartment(orgDept!.id);

            expect(departmentRoles).toBeDefined();
            expect(Array.isArray(departmentRoles)).toBe(true);
            expect(departmentRoles.length).toBeGreaterThan(0);

            // Should include Citizen and Administrator
            const roleNames = departmentRoles.map(dr => dr.role?.name);
            expect(roleNames).toContain('Citizen');
            expect(roleNames).toContain('Administrator');
        });

        it('should return empty array for non-existent department ID', async () => {
            const result = await departmentRoleRepository.findByDepartment(999999);

            expect(result).toEqual([]);
        });

        it('should include department and role relations', async () => {
            const orgDept = await departmentRepository.findByName('Organization');
            const departmentRoles = await departmentRoleRepository.findByDepartment(orgDept!.id);

            for (const dr of departmentRoles) {
                expect(dr).toHaveProperty('department');
                expect(dr).toHaveProperty('role');
                expect(dr.department).toBeDefined();
                expect(dr.role).toBeDefined();
            }
        });

        it('should return roles ordered by roleId ASC', async () => {
            const orgDept = await departmentRepository.findByName('Organization');
            const departmentRoles = await departmentRoleRepository.findByDepartment(orgDept!.id);

            if (departmentRoles.length > 1) {
                for (let i = 0; i < departmentRoles.length - 1; i++) {
                    expect(departmentRoles[i].roleId).toBeLessThanOrEqual(departmentRoles[i + 1].roleId);
                }
            }
        });
    });

    // --- Tests for findByRole() ---
    describe('findByRole', () => {
        it('should find all department roles for a specific role', async () => {
            const citizenRole = await roleRepository.findByName('Citizen');
            expect(citizenRole).not.toBeNull();

            const departmentRoles = await departmentRoleRepository.findByRole(citizenRole!.id);

            expect(departmentRoles).toBeDefined();
            expect(Array.isArray(departmentRoles)).toBe(true);
            expect(departmentRoles.length).toBeGreaterThan(0);

            // All should have the same role
            for (const dr of departmentRoles) {
                expect(dr.role?.name).toBe('Citizen');
            }
        });

        it('should return empty array for non-existent role ID', async () => {
            const result = await departmentRoleRepository.findByRole(999999);

            expect(result).toEqual([]);
        });

        it('should return results ordered by departmentId ASC', async () => {
            const adminRole = await roleRepository.findByName('Administrator');
            const departmentRoles = await departmentRoleRepository.findByRole(adminRole!.id);

            if (departmentRoles.length > 1) {
                for (let i = 0; i < departmentRoles.length - 1; i++) {
                    expect(departmentRoles[i].departmentId).toBeLessThanOrEqual(departmentRoles[i + 1].departmentId);
                }
            }
        });
    });

    // --- Tests for findAll() ---
    describe('findAll', () => {
        it('should return all department roles', async () => {
            const departmentRoles = await departmentRoleRepository.findAll();

            expect(departmentRoles).toBeDefined();
            expect(Array.isArray(departmentRoles)).toBe(true);
            expect(departmentRoles.length).toBeGreaterThan(0);
        });

        it('should include department and role relations', async () => {
            const departmentRoles = await departmentRoleRepository.findAll();

            for (const dr of departmentRoles) {
                expect(dr).toHaveProperty('department');
                expect(dr).toHaveProperty('role');
                expect(dr.department).toBeDefined();
                expect(dr.role).toBeDefined();
                expect(typeof dr.department?.name).toBe('string');
                expect(typeof dr.role?.name).toBe('string');
            }
        });

        it('should return ordered by departmentId then roleId ASC', async () => {
            const departmentRoles = await departmentRoleRepository.findAll();

            if (departmentRoles.length > 1) {
                for (let i = 0; i < departmentRoles.length - 1; i++) {
                    const current = departmentRoles[i];
                    const next = departmentRoles[i + 1];

                    if (current.departmentId === next.departmentId) {
                        expect(current.roleId).toBeLessThanOrEqual(next.roleId);
                    } else {
                        expect(current.departmentId).toBeLessThan(next.departmentId);
                    }
                }
            }
        });
    });

    // --- Tests for findMunicipalityDepartmentRoles() ---
    describe('findMunicipalityDepartmentRoles', () => {
        it('should return department roles excluding Citizen and Administrator', async () => {
            const municipalityDR = await departmentRoleRepository.findMunicipalityDepartmentRoles();

            expect(municipalityDR).toBeDefined();
            expect(Array.isArray(municipalityDR)).toBe(true);

            const roleNames = municipalityDR.map(dr => dr.role?.name);
            expect(roleNames).not.toContain('Citizen');
            expect(roleNames).not.toContain('Administrator');
        });

        it('should return fewer results than findAll', async () => {
            const all = await departmentRoleRepository.findAll();
            const municipality = await departmentRoleRepository.findMunicipalityDepartmentRoles();

            expect(municipality.length).toBeLessThan(all.length);
        });

        it('should include municipality staff roles', async () => {
            const municipalityDR = await departmentRoleRepository.findMunicipalityDepartmentRoles();
            const roleNames = municipalityDR.map(dr => dr.role?.name);

            // Should include Department Director (from seed)
            expect(roleNames).toContain('Department Director');
        });

        it('should be ordered by department name then role name ASC', async () => {
            const municipalityDR = await departmentRoleRepository.findMunicipalityDepartmentRoles();

            if (municipalityDR.length > 1) {
                for (let i = 0; i < municipalityDR.length - 1; i++) {
                    const current = municipalityDR[i];
                    const next = municipalityDR[i + 1];

                    const deptCompare = (current.department?.name || '').localeCompare(next.department?.name || '');

                    if (deptCompare === 0) {
                        const roleCompare = (current.role?.name || '').localeCompare(next.role?.name || '');
                        expect(roleCompare).toBeLessThanOrEqual(0);
                    } else {
                        expect(deptCompare).toBeLessThanOrEqual(0);
                    }
                }
            }
        });
    });

    // --- Tests for findByRoleName() ---
    describe('findByRoleName', () => {
        it('should find all department roles with Citizen', async () => {
            const citizenDRs = await departmentRoleRepository.findByRoleName('Citizen');

            expect(citizenDRs).toBeDefined();
            expect(Array.isArray(citizenDRs)).toBe(true);
            expect(citizenDRs.length).toBeGreaterThan(0);

            for (const dr of citizenDRs) {
                expect(dr.role?.name).toBe('Citizen');
            }
        });

        it('should find all department roles with Administrator', async () => {
            const adminDRs = await departmentRoleRepository.findByRoleName('Administrator');

            expect(adminDRs).toBeDefined();
            expect(adminDRs.length).toBeGreaterThan(0);

            for (const dr of adminDRs) {
                expect(dr.role?.name).toBe('Administrator');
            }
        });

        it('should return empty array for non-existent role name', async () => {
            const result = await departmentRoleRepository.findByRoleName('Non-Existent Role XYZ');

            expect(result).toEqual([]);
        });

        it('should be case-sensitive', async () => {
            const resultLower = await departmentRoleRepository.findByRoleName('citizen');
            const resultUpper = await departmentRoleRepository.findByRoleName('CITIZEN');

            expect(resultLower).toEqual([]);
            expect(resultUpper).toEqual([]);
        });

        it('should include department and role relations', async () => {
            const citizenDRs = await departmentRoleRepository.findByRoleName('Citizen');

            for (const dr of citizenDRs) {
                expect(dr).toHaveProperty('department');
                expect(dr).toHaveProperty('role');
                expect(dr.department).toBeDefined();
                expect(dr.role).toBeDefined();
            }
        });

        it('should be ordered by department name ASC', async () => {
            const citizenDRs = await departmentRoleRepository.findByRoleName('Citizen');

            if (citizenDRs.length > 1) {
                for (let i = 0; i < citizenDRs.length - 1; i++) {
                    const current = citizenDRs[i].department?.name || '';
                    const next = citizenDRs[i + 1].department?.name || '';
                    expect(current.localeCompare(next)).toBeLessThanOrEqual(0);
                }
            }
        });
    });

    // --- Tests for save() ---
    describe('save', () => {
        it('should save a new department role', async () => {
            // Create test department and role first
            const timestamp = Date.now();

            const newDept = new DepartmentEntity();
            newDept.name = `Test Department DR ${timestamp}`;
            const savedDept = await departmentRepository.save(newDept);
            createdDepartmentIds.push(savedDept.id);

            const newRole = new RoleEntity();
            newRole.name = `Test Role DR ${timestamp}`;
            const savedRole = await roleRepository.save(newRole);
            createdRoleIds.push(savedRole.id);

            // Create department role
            const newDR = new DepartmentRoleEntity();
            newDR.departmentId = savedDept.id;
            newDR.roleId = savedRole.id;
            newDR.department = savedDept;
            newDR.role = savedRole;

            const savedDR = await departmentRoleRepository.save(newDR);
            createdDepartmentRoleIds.push(savedDR.id);

            expect(savedDR).toBeDefined();
            expect(savedDR.id).toBeDefined();
            expect(savedDR.id).toBeGreaterThan(0);
            expect(savedDR.departmentId).toBe(savedDept.id);
            expect(savedDR.roleId).toBe(savedRole.id);
        });

        it('should persist department role after save', async () => {
            const timestamp = Date.now();

            const newDept = new DepartmentEntity();
            newDept.name = `Persist Test Dept ${timestamp}`;
            const savedDept = await departmentRepository.save(newDept);
            createdDepartmentIds.push(savedDept.id);

            const newRole = new RoleEntity();
            newRole.name = `Persist Test Role ${timestamp}`;
            const savedRole = await roleRepository.save(newRole);
            createdRoleIds.push(savedRole.id);

            const newDR = new DepartmentRoleEntity();
            newDR.departmentId = savedDept.id;
            newDR.roleId = savedRole.id;
            newDR.department = savedDept;
            newDR.role = savedRole;

            const savedDR = await departmentRoleRepository.save(newDR);
            createdDepartmentRoleIds.push(savedDR.id);

            // Find it by ID
            const foundById = await departmentRoleRepository.findById(savedDR.id);
            expect(foundById).toBeDefined();
            expect(foundById?.id).toBe(savedDR.id);

            // Find it by department and role
            const foundByNames = await departmentRoleRepository.findByDepartmentAndRole(
                savedDept.name,
                savedRole.name
            );
            expect(foundByNames).toBeDefined();
            expect(foundByNames?.id).toBe(savedDR.id);
        });
    });
});
