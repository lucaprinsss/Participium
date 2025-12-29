import { categoryRoleRepository } from '@repositories/categoryRoleRepository';
import { AppDataSource } from '@database/connection';
import { CategoryRoleEntity } from '@models/entity/categoryRoleEntity';
import { createMockRole } from '../../utils/mockEntities';
import { ReportCategory } from '@models/dto/ReportCategory';

jest.mock('@database/connection', () => ({
    AppDataSource: {
        getRepository: jest.fn()
    }
}));

describe('CategoryRoleRepository Unit Tests', () => {
    let mockRepository: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockRepository = {
            findOne: jest.fn(),
            find: jest.fn()
        };
        (categoryRoleRepository as any).repository = mockRepository;
    });

    describe('findRoleIdByCategory', () => {
        it('should return roleId when mapping exists', async () => {
            const mockMapping = { roleId: 5 };
            mockRepository.findOne.mockResolvedValue(mockMapping);

            const category = ReportCategory.ROADS;
            const result = await categoryRoleRepository.findRoleIdByCategory(category);

            expect(result).toBe(5);
            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { category },
                select: ['roleId']
            });
        });

        it('should return null when mapping does not exist', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            const category = ReportCategory.OTHER;
            const result = await categoryRoleRepository.findRoleIdByCategory(category);
            expect(result).toBeNull();
        });

        it('should return null when mapping exists but roleId is null', async () => {
            const category = ReportCategory.PUBLIC_LIGHTING;
            const mockMapping = { roleId: null };
            mockRepository.findOne.mockResolvedValue(mockMapping);

            const result = await categoryRoleRepository.findRoleIdByCategory(category);

            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { category },
                select: ['roleId']
            });
            expect(result).toBeNull();
        });
    });

    describe('findAllMappings', () => {
        it('should return all mappings with role relations', async () => {
            const mockMappings = [
                { id: 1, category: ReportCategory.ROADS, roleId: 1, role: createMockRole('Road Maintenance', 1) },
                { id: 2, category: ReportCategory.PUBLIC_LIGHTING, roleId: 2, role: createMockRole('Lighting Staff', 2) }
            ];
            mockRepository.find.mockResolvedValue(mockMappings);

            const result = await categoryRoleRepository.findAllMappings();

            expect(result).toEqual(mockMappings);
            expect(mockRepository.find).toHaveBeenCalledWith({
                relations: ['role'],
                order: { category: 'ASC' }
            });
        });

        it('should return empty array when no mappings exist', async () => {
            mockRepository.find.mockResolvedValue([]);

            const result = await categoryRoleRepository.findAllMappings();

            expect(mockRepository.find).toHaveBeenCalledWith({
                relations: ['role'],
                order: { category: 'ASC' }
            });
            expect(result).toEqual([]);
        });
    });

    describe('findMappingByCategory', () => {
        it('should return mapping with role relation when found', async () => {
            const mockMapping = { id: 1, category: ReportCategory.ROADS, role: createMockRole('Staff', 1) };
            mockRepository.findOne.mockResolvedValue(mockMapping);

            const category = ReportCategory.ROADS;
            const result = await categoryRoleRepository.findMappingByCategory(category);

            expect(result).toEqual(mockMapping);
            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { category },
                relations: ['role']
            });
        });

        it('should return null when mapping not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            const category = ReportCategory.OTHER;
            const result = await categoryRoleRepository.findMappingByCategory(category);
            expect(result).toBeNull();
        });
    });
});
