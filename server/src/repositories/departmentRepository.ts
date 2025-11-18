import { AppDataSource } from "@database/connection";
import { DepartmentEntity } from "@models/entity/departmentEntity";
import { Repository } from "typeorm";

/**
 * Repository for Department data access.
 * Handles all database operations for the Department entity.
 */
class DepartmentRepository {
  private repository: Repository<DepartmentEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(DepartmentEntity);
  }

  /**
   * Finds a department by its ID.
   * @param id The ID of the department.
   * @returns The department entity or null if not found.
   */
  public async findById(id: number): Promise<DepartmentEntity | null> {
    return this.repository.findOneBy({ id });
  }

  /**
   * Finds a department by its name.
   * @param name The name of the department.
   * @returns The department entity or null if not found.
   */
  public async findByName(name: string): Promise<DepartmentEntity | null> {
    return this.repository.findOneBy({ name });
  }

  /**
   * Finds all departments.
   * @returns Array of department entities.
   */
  public async findAll(): Promise<DepartmentEntity[]> {
    return this.repository.find({
      order: { name: "ASC" }
    });
  }

  /**
   * Saves a department entity.
   * @param department The department entity to save.
   * @returns The saved department entity.
   */
  public async save(department: DepartmentEntity): Promise<DepartmentEntity> {
    return this.repository.save(department);
  }
}

// Export a singleton instance of the repository
export const departmentRepository = new DepartmentRepository();
