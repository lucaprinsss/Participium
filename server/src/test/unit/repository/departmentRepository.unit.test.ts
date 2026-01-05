import { departmentRepository } from '@repositories/departmentRepository';
import { AppDataSource } from '@database/connection';
import { DepartmentEntity } from '@models/entity/departmentEntity';
import { createMockDepartment } from '../../utils/mockEntities';

jest.mock('@database/connection', () => ({
    AppDataSource: {
        getRepository: jest.fn()
    }
}));

describe('DepartmentRepository', () => {
    let mockRepository: any;

    beforeEach(() => {
        jest.clearAllMocks();

        mockRepository = {
            findOneBy: jest.fn(),
            find: jest.fn(),
            save: jest.fn()
        };

        (departmentRepository as any).repository = mockRepository;
    });

    describe('findById', () => {
        it('should return department if found', async () => {
            const mockDepartment = createMockDepartment('Dep1', 1);
            mockRepository.findOneBy.mockResolvedValue(mockDepartment);

            const result = await departmentRepository.findById(1);

            expect(result).toEqual(mockDepartment);
            expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
        });

        it('should return null if not found', async () => {
            mockRepository.findOneBy.mockResolvedValue(null);
            const result = await departmentRepository.findById(999);
            expect(result).toBeNull();
        });
    });

    describe('findByName', () => {
        it('should return department if found', async () => {
            const mockDepartment = createMockDepartment('Dep1', 1);
            mockRepository.findOneBy.mockResolvedValue(mockDepartment);

            const result = await departmentRepository.findByName('Dep1');

            expect(result).toEqual(mockDepartment);
            expect(mockRepository.findOneBy).toHaveBeenCalledWith({ name: 'Dep1' });
        });

        it('should return null if not found', async () => {
            mockRepository.findOneBy.mockResolvedValue(null);
            const result = await departmentRepository.findByName('Unknown');
            expect(result).toBeNull();
        });
    });

    describe('findAll', () => {
        it('should return all departments', async () => {
            const mockDepartments = [createMockDepartment('Dep1', 1), createMockDepartment('Dep2', 2)];
            mockRepository.find.mockResolvedValue(mockDepartments);

            const result = await departmentRepository.findAll();

            expect(result).toEqual(mockDepartments);
            expect(mockRepository.find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
        });
    });

    describe('save', () => {
        it('should save department', async () => {
            const mockDepartment = createMockDepartment('Dep1', 1);
            mockRepository.save.mockResolvedValue(mockDepartment);

            const result = await departmentRepository.save(mockDepartment);

            expect(result).toEqual(mockDepartment);
            expect(mockRepository.save).toHaveBeenCalledWith(mockDepartment);
        });
    });
});
