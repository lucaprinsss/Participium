import { departmentRoleRepository } from '@repositories/departmentRoleRepository';
import { AppDataSource } from '@database/connection';
import { DepartmentRoleEntity } from '@models/entity/departmentRoleEntity';
import { createMockDepartmentRole } from '../../utils/mockEntities';

// Mock dependencies
jest.mock('@database/connection', () => ({
    AppDataSource: {
        getRepository: jest.fn()
    }
}));

describe('DepartmentRoleRepository', () => {
    let mockRepository: any;
    let mockQueryBuilder: any;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Setup Mock QueryBuilder
        mockQueryBuilder = {
            innerJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            addOrderBy: jest.fn().mockReturnThis(),
            getOne: jest.fn(),
            getMany: jest.fn()
        };

        // Setup Mock Repository
        mockRepository = {
            findOne: jest.fn(),
            find: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
            save: jest.fn()
        };

        // Inject mock repository into the singleton instance
        (departmentRoleRepository as any).repository = mockRepository;
    });

    describe('findById', () => {
        it('should return department role if found', async () => {
            const mockRole = createMockDepartmentRole('Citizen', 'Organization', 1);
            mockRepository.findOne.mockResolvedValue(mockRole);

            const result = await departmentRoleRepository.findById(1);

            expect(result).toEqual(mockRole);
            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { id: 1 },
                relations: ['department', 'role']
            });
        });

        it('should return null if not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            const result = await departmentRoleRepository.findById(999);

            expect(result).toBeNull();
        });
    });

    describe('findByDepartmentAndRole', () => {
        it('should find by department and role names', async () => {
            const mockRole = createMockDepartmentRole('Citizen', 'Organization', 1);
            mockQueryBuilder.getOne.mockResolvedValue(mockRole);

            const result = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Citizen');

            expect(result).toEqual(mockRole);
            expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('dr');
            expect(mockQueryBuilder.innerJoinAndSelect).toHaveBeenCalledWith('dr.department', 'department');
            expect(mockQueryBuilder.innerJoinAndSelect).toHaveBeenCalledWith('dr.role', 'role');
            expect(mockQueryBuilder.where).toHaveBeenCalledWith('department.name = :departmentName', { departmentName: 'Organization' });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('role.name = :roleName', { roleName: 'Citizen' });
            expect(mockQueryBuilder.getOne).toHaveBeenCalled();
        });

        it('should return null if not found', async () => {
            mockQueryBuilder.getOne.mockResolvedValue(null);

            const result = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Unknown');

            expect(result).toBeNull();
        });
    });

    describe('findByDepartment', () => {
        it('should return all roles for a department', async () => {
            const mockRoles = [
                createMockDepartmentRole('Director', 'Dep1', 1),
                createMockDepartmentRole('Staff', 'Dep1', 2)
            ];
            mockRepository.find.mockResolvedValue(mockRoles);

            const result = await departmentRoleRepository.findByDepartment(1);

            expect(result).toEqual(mockRoles);
            expect(mockRepository.find).toHaveBeenCalledWith({
                where: { departmentId: 1 },
                relations: ['department', 'role'],
                order: { roleId: 'ASC' }
            });
        });
    });

    describe('findByRole', () => {
        it('should return all department roles for a given role id', async () => {
            const mockRoles = [
                createMockDepartmentRole('Staff', 'Dep1', 1),
                createMockDepartmentRole('Staff', 'Dep2', 2)
            ];
            mockRepository.find.mockResolvedValue(mockRoles);

            const result = await departmentRoleRepository.findByRole(5);

            expect(result).toEqual(mockRoles);
            expect(mockRepository.find).toHaveBeenCalledWith({
                where: { roleId: 5 },
                relations: ['department', 'role'],
                order: { departmentId: 'ASC' }
            });
        });
    });

    describe('findAll', () => {
        it('should return all department roles', async () => {
            const mockRoles = [
                createMockDepartmentRole('Role1', 'Dep1', 1),
                createMockDepartmentRole('Role2', 'Dep2', 2)
            ];
            mockRepository.find.mockResolvedValue(mockRoles);

            const result = await departmentRoleRepository.findAll();

            expect(result).toEqual(mockRoles);
            expect(mockRepository.find).toHaveBeenCalledWith({
                relations: ['department', 'role'],
                order: { departmentId: 'ASC', roleId: 'ASC' }
            });
        });
    });

    describe('findMunicipalityDepartmentRoles', () => {
        it('should return municipality roles (excluding Citizen and Admin)', async () => {
            const mockRoles = [
                createMockDepartmentRole('Director', 'Dep1', 1),
                createMockDepartmentRole('Staff', 'Dep2', 2)
            ];
            mockQueryBuilder.getMany.mockResolvedValue(mockRoles);

            const result = await departmentRoleRepository.findMunicipalityDepartmentRoles();

            expect(result).toEqual(mockRoles);
            expect(mockQueryBuilder.where).toHaveBeenCalledWith('role.name NOT IN (:...excludedRoles)', {
                excludedRoles: ['Citizen', 'Administrator']
            });
        });
    });

    describe('findByRoleName', () => {
        it('should return department roles by role name', async () => {
            const mockRoles = [createMockDepartmentRole('Staff', 'Dep1', 1)];
            mockQueryBuilder.getMany.mockResolvedValue(mockRoles);

            const result = await departmentRoleRepository.findByRoleName('Staff');

            expect(result).toEqual(mockRoles);
            expect(mockQueryBuilder.where).toHaveBeenCalledWith('role.name = :roleName', { roleName: 'Staff' });
        });
    });

    describe('save', () => {
        it('should save a department role', async () => {
            const mockRole = createMockDepartmentRole('Citizen', 'Organization', 1);
            mockRepository.save.mockResolvedValue(mockRole);

            const result = await departmentRoleRepository.save(mockRole);

            expect(result).toEqual(mockRole);
            expect(mockRepository.save).toHaveBeenCalledWith(mockRole);
        });
    });
});
