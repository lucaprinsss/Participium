// Mock the AppDataSource and its getRepository method
let mockRepo: any;

import { categoryRoleRepository } from '@repositories/categoryRoleRepository';
import { CategoryRoleEntity } from '@models/entity/categoryRoleEntity';
import { ReportCategory } from '@models/dto/ReportCategory';

jest.mock('@database/connection', () => {
  mockRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
  };
  return {
    AppDataSource: {
      getRepository: jest.fn(() => mockRepo),
    },
  };
});

describe('CategoryRoleRepository Unit Tests', () => {
  let mockRepository: jest.Mocked<typeof mockRepo>;

  beforeAll(() => {
    mockRepository = mockRepo as jest.Mocked<typeof mockRepo>;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findRoleIdByCategory', () => {
    it('should return roleId when mapping exists', async () => {
      // Arrange
      const category = ReportCategory.ROADS;
      const expectedRoleId = 5;
      const mockMapping = { roleId: expectedRoleId };
      mockRepository.findOne.mockResolvedValue(mockMapping as CategoryRoleEntity);

      // Act
      const result = await categoryRoleRepository.findRoleIdByCategory(category);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { category },
        select: ['roleId']
      });
      expect(result).toBe(expectedRoleId);
    });

    it('should return null when mapping does not exist', async () => {
      // Arrange
      const category = ReportCategory.OTHER;
      mockRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await categoryRoleRepository.findRoleIdByCategory(category);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { category },
        select: ['roleId']
      });
      expect(result).toBeNull();
    });

    it('should return null when mapping exists but roleId is null', async () => {
      // Arrange
      const category = ReportCategory.PUBLIC_LIGHTING;
      const mockMapping = { roleId: null };
      mockRepository.findOne.mockResolvedValue(mockMapping as unknown as CategoryRoleEntity);

      // Act
      const result = await categoryRoleRepository.findRoleIdByCategory(category);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { category },
        select: ['roleId']
      });
      expect(result).toBeNull();
    });
  });

  describe('findAllMappings', () => {
    it('should return all mappings with role relations', async () => {
      // Arrange
      const mockMappings = [
        { category: ReportCategory.ROADS, roleId: 1, role: { name: 'Road Maintenance' } },
        { category: ReportCategory.PUBLIC_LIGHTING, roleId: 2, role: { name: 'Lighting Staff' } },
      ];
      mockRepository.find.mockResolvedValue(mockMappings as CategoryRoleEntity[]);

      // Act
      const result = await categoryRoleRepository.findAllMappings();

      // Assert
      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['role'],
        order: { category: 'ASC' }
      });
      expect(result).toEqual(mockMappings);
    });

    it('should return empty array when no mappings exist', async () => {
      // Arrange
      mockRepository.find.mockResolvedValue([]);

      // Act
      const result = await categoryRoleRepository.findAllMappings();

      // Assert
      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['role'],
        order: { category: 'ASC' }
      });
      expect(result).toEqual([]);
    });
  });
});