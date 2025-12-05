import { AppDataSource } from '../database/connection';
import { CategoryRoleEntity } from '../models/entity/CategoryRoleEntity';
import { ReportCategory } from '../models/dto/ReportCategory';

class CategoryRoleRepository {
  private readonly repository = AppDataSource.getRepository(CategoryRoleEntity);

  /**
   * Find the technical role ID responsible for a given report category
   * @param category - Report category
   * @returns Role ID or null if not found
   */
  async findRoleIdByCategory(category: ReportCategory): Promise<number | null> {
    const mapping = await this.repository.findOne({
      where: { category },
      select: ['roleId']
    });

    return mapping?.roleId ?? null;
  }

  /**
   * Get all category-role mappings with role details
   * @returns Array of all mappings
   */
  async findAllMappings(): Promise<CategoryRoleEntity[]> {
    return await this.repository.find({
      relations: ['role'],
      order: { category: 'ASC' }
    });
  }

  /**
   * Get mapping for a specific category with role details
   * @param category - Report category
   * @returns Mapping entity or null
   */
  async findMappingByCategory(
    category: ReportCategory
  ): Promise<CategoryRoleEntity | null> {
    return await this.repository.findOne({
      where: { category },
      relations: ['role']
    });
  }
}

export const categoryRoleRepository = new CategoryRoleRepository();