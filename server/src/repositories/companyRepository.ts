import { AppDataSource } from "@database/connection";
import { Repository } from "typeorm";

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
 * Repository for Company data access.
 */
class CompanyRepository {
  private connection = AppDataSource;

  /**
   * Finds a company by name.
   * @param name The name of the company.
   * @returns The company data or null if not found.
   */
  public async findByName(name: string): Promise<Company | null> {
    const result = await this.connection.query(
      'SELECT id, name, category, created_at as "createdAt" FROM companies WHERE name = $1',
      [name]
    );
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Finds a company by ID.
   * @param id The ID of the company.
   * @returns The company data or null if not found.
   */
  public async findById(id: number): Promise<Company | null> {
    const result = await this.connection.query(
      'SELECT id, name, category, created_at as "createdAt" FROM companies WHERE id = $1',
      [id]
    );
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Finds all companies.
   * @returns Array of all companies.
   */
  public async findAll(): Promise<Company[]> {
    const result = await this.connection.query(
      'SELECT id, name, category, created_at as "createdAt" FROM companies ORDER BY name'
    );
    return result;
  }

  /**
   * Creates a new company.
   * @param name The name of the company.
   * @param category The report category the company handles.
   * @returns The created company data.
   */
  public async create(name: string, category: string): Promise<Company> {
    const result = await this.connection.query(
      'INSERT INTO companies (name, category) VALUES ($1, $2) RETURNING id, name, category, created_at as "createdAt"',
      [name, category]
    );
    return result[0];
  }

  /**
   * Checks if a company exists with the given name.
   * @param name The name to check.
   * @returns True if the company exists, false otherwise.
   */
  public async existsByName(name: string): Promise<boolean> {
    const result = await this.connection.query(
      'SELECT EXISTS(SELECT 1 FROM companies WHERE name = $1) as exists',
      [name]
    );
    return result[0].exists;
  }

  /**
   * Checks if a category exists in report_categories table.
   * @param category The category to check.
   * @returns True if the category exists, false otherwise.
   */
  public async isValidCategory(category: string): Promise<boolean> {
    const result = await this.connection.query(
      'SELECT EXISTS(SELECT 1 FROM report_categories WHERE category = $1) as exists',
      [category]
    );
    return result[0].exists;
  }
}

// Export a singleton instance of the repository
export const companyRepository = new CompanyRepository();
