import { roleRepository } from '@repositories/roleRepository';
import { AppDataSource } from '@database/connection';
import { RoleEntity } from '@models/entity/roleEntity';
import { createMockRole } from '../../utils/mockEntities';

jest.mock('@database/connection', () => ({
    AppDataSource: {
        getRepository: jest.fn()
    }
}));

describe('RoleRepository', () => {
    let mockRepository: any;
    let mockQueryBuilder: any;

    beforeEach(() => {
        jest.clearAllMocks();

        mockQueryBuilder = {
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getMany: jest.fn()
        };

        mockRepository = {
            findOneBy: jest.fn(),
            find: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
            save: jest.fn()
        };

        (roleRepository as any).repository = mockRepository;
    });

    describe('findById', () => {
        it('should return role if found', async () => {
            const mockRole = createMockRole('Citizen', 1);
            mockRepository.findOneBy.mockResolvedValue(mockRole);

            const result = await roleRepository.findById(1);

            expect(result).toEqual(mockRole);
            expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
        });

        it('should return null if not found', async () => {
            mockRepository.findOneBy.mockResolvedValue(null);
            const result = await roleRepository.findById(999);
            expect(result).toBeNull();
        });
    });

    describe('findByName', () => {
        it('should return role if found', async () => {
            const mockRole = createMockRole('Citizen', 1);
            mockRepository.findOneBy.mockResolvedValue(mockRole);

            const result = await roleRepository.findByName('Citizen');

            expect(result).toEqual(mockRole);
            expect(mockRepository.findOneBy).toHaveBeenCalledWith({ name: 'Citizen' });
        });
    });

    describe('findAll', () => {
        it('should return all roles', async () => {
            const mockRoles = [createMockRole('Citizen', 1), createMockRole('Admin', 2)];
            mockRepository.find.mockResolvedValue(mockRoles);

            const result = await roleRepository.findAll();

            expect(result).toEqual(mockRoles);
            expect(mockRepository.find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
        });
    });

    describe('findMunicipalityRoles', () => {
        it('should return municipality roles', async () => {
            const mockRoles = [createMockRole('Staff', 1)];
            mockQueryBuilder.getMany.mockResolvedValue(mockRoles);

            const result = await roleRepository.findMunicipalityRoles();

            expect(result).toEqual(mockRoles);
            expect(mockQueryBuilder.where).toHaveBeenCalledWith('role.name NOT IN (:...excludedRoles)', {
                excludedRoles: ['Citizen', 'Administrator']
            });
        });
    });

    describe('save', () => {
        it('should save role', async () => {
            const mockRole = createMockRole('NewRole', 1);
            mockRepository.save.mockResolvedValue(mockRole);

            const result = await roleRepository.save(mockRole);

            expect(result).toEqual(mockRole);
            expect(mockRepository.save).toHaveBeenCalledWith(mockRole);
        });
    });
});
