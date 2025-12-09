import { AppDataSource } from "@database/connection";
import { RoleEntity } from "@models/entity/roleEntity";
import { Repository } from "typeorm";

/**
 * Repository for Role data access.
 * Handles all database operations for the Role entity.
 */
class RoleRepository {
  private readonly repository: Repository<RoleEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(RoleEntity);
  }

  /**
   * Finds a role by its ID.
   * @param id The ID of the role.
   * @returns The role entity or null if not found.
   */
  public async findById(id: number): Promise<RoleEntity | null> {
    return this.repository.findOneBy({ id });
  }

  /**
   * Finds a role by its name.
   * @param name The name of the role.
   * @returns The role entity or null if not found.
   */
  public async findByName(name: string): Promise<RoleEntity | null> {
    return this.repository.findOneBy({ name });
  }

  /**
   * Finds all roles.
   * @returns Array of role entities.
   */
  public async findAll(): Promise<RoleEntity[]> {
    return this.repository.find({
      order: { name: "ASC" }
    });
  }

  /**
   * Finds all municipality roles (excludes Citizen and Administrator).
   * @returns Array of role entities.
   */
  public async findMunicipalityRoles(): Promise<RoleEntity[]> {
    return this.repository
      .createQueryBuilder("role")
      .where("role.name NOT IN (:...excludedRoles)", {
        excludedRoles: ["Citizen", "Administrator"]
      })
      .orderBy("role.name", "ASC")
      .getMany();
  }

  /**
   * Saves a role entity.
   * @param role The role entity to save.
   * @returns The saved role entity.
   */
  public async save(role: RoleEntity): Promise<RoleEntity> {
    return this.repository.save(role);
  }
}

// Export a singleton instance of the repository
export const roleRepository = new RoleRepository();
