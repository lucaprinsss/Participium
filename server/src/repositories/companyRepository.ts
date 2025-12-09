import { AppDataSource } from "@database/connection";

/**
 * Simple interface for company data
 */
export interface Company {
  id: number;
  name: string;
  category: string;
  createdAt: Date;
}

/**
 * Repository for Company data access using TypeORM QueryBuilder
 */
class CompanyRepository {
  private readonly connection = AppDataSource;

  /**
   * Finds a company by name.
   * @param name The name of the company.
   * @returns The company data or null if not found.
   */
  public async findByName(name: string): Promise<Company | null> {
    const result = await this.connection
      .createQueryBuilder()
      .select([
        'id',
        'name',
        'category',
        'created_at AS "createdAt"'
      ])
      .from('companies', 'c')
      .where('c.name = :name', { name })
      .getRawOne();
    
    return result || null;
  }

  /**
   * Finds a company by ID.
   * @param id The ID of the company.
   * @returns The company data or null if not found.
   */
  public async findById(id: number): Promise<Company | null> {
    // Return null for invalid IDs
    if (!Number.isFinite(id) || id <= 0) {
      return null;
    }
    
    const result = await this.connection
      .createQueryBuilder()
      .select([
        'id',
        'name',
        'category',
        'created_at AS "createdAt"'
      ])
      .from('companies', 'c')
      .where('c.id = :id', { id })
      .getRawOne();
    
    return result || null;
  }

  /**
   * Finds all companies ordered by name.
   * @returns Array of all companies.
   */
  public async findAll(): Promise<Company[]> {
    const results = await this.connection
      .createQueryBuilder()
      .select([
        'id',
        'name',
        'category',
        'created_at AS "createdAt"'
      ])
      .from('companies', 'c')
      .orderBy('LOWER(c.name)', 'ASC')
      .getRawMany();
    
    return results;
  }

  /**
   * Creates a new company.
   * @param name The name of the company.
   * @param category The report category the company handles.
   * @returns The created company data.
   */
  public async create(name: string, category: string): Promise<Company> {
    const result = await this.connection
      .createQueryBuilder()
      .insert()
      .into('companies')
      .values({ name, category })
      .returning('*')
      .execute();
    
    const raw = result.raw[0];
    return {
      id: raw.id,
      name: raw.name,
      category: raw.category,
      createdAt: raw.created_at
    };
  }

  /**
   * Checks if a company exists with the given name.
   * @param name The name to check.
   * @returns True if the company exists, false otherwise.
   */
  public async existsByName(name: string): Promise<boolean> {
    const result = await this.connection
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('companies', 'c')
      .where('c.name = :name', { name })
      .getRawOne();
    
    return Number.parseInt(result.count) > 0;
  }

  /**
   * Checks if a category is a valid report_category enum value.
   * This uses raw query as it needs to check PostgreSQL enum types.
   * @param category The category to check.
   * @returns True if the category is valid, false otherwise.
   */
  public async isValidCategory(category: string): Promise<boolean> {
    const result = await this.connection.query(
      `SELECT EXISTS(
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'report_category' AND e.enumlabel = $1
      ) as exists`,
      [category]
    );
    return result[0].exists;
  }
}

// Export a singleton instance of the repository
export const companyRepository = new CompanyRepository();
