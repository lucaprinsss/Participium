import { AppDataSource } from "@database/connection";
import { DepartmentRoleEntity } from "@models/entity/departmentRoleEntity";
import { Repository } from "typeorm";

/**
 * Repository for DepartmentRole data access.
 * Handles all database operations for the DepartmentRole entity.
 */
class DepartmentRoleRepository {
  private readonly repository: Repository<DepartmentRoleEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(DepartmentRoleEntity);
  }

  /**
   * Finds a department role by its ID.
   * @param id The ID of the department role.
   * @returns The department role entity or null if not found.
   */
  public async findById(id: number): Promise<DepartmentRoleEntity | null> {
    return this.repository.findOne({
      where: { id },
      relations: ["department", "role"]
    });
  }

  /**
   * Finds a department role by department and role names.
   * @param departmentName The name of the department.
   * @param roleName The name of the role.
   * @returns The department role entity or null if not found.
   */
  public async findByDepartmentAndRole(
    departmentName: string,
    roleName: string
  ): Promise<DepartmentRoleEntity | null> {
    return this.repository
      .createQueryBuilder("dr")
      .innerJoinAndSelect("dr.department", "department")
      .innerJoinAndSelect("dr.role", "role")
      .where("department.name = :departmentName", { departmentName })
      .andWhere("role.name = :roleName", { roleName })
      .getOne();
  }

  /**
   * Finds all department roles for a specific department.
   * @param departmentId The ID of the department.
   * @returns Array of department role entities.
   */
  public async findByDepartment(departmentId: number): Promise<DepartmentRoleEntity[]> {
    return this.repository.find({
      where: { departmentId },
      relations: ["department", "role"],
      order: { roleId: "ASC" }
    });
  }

  /**
   * Finds all department roles for a specific role.
   * @param roleId The ID of the role.
   * @returns Array of department role entities.
   */
  public async findByRole(roleId: number): Promise<DepartmentRoleEntity[]> {
    return this.repository.find({
      where: { roleId },
      relations: ["department", "role"],
      order: { departmentId: "ASC" }
    });
  }

  /**
   * Finds all department roles.
   * @returns Array of department role entities with their relations.
   */
  public async findAll(): Promise<DepartmentRoleEntity[]> {
    return this.repository.find({
      relations: ["department", "role"],
      order: { departmentId: "ASC", roleId: "ASC" }
    });
  }

  /**
   * Finds all department roles excluding Citizen and Administrator.
   * @returns Array of department role entities.
   */
  public async findMunicipalityDepartmentRoles(): Promise<DepartmentRoleEntity[]> {
    return this.repository
      .createQueryBuilder("dr")
      .innerJoinAndSelect("dr.department", "department")
      .innerJoinAndSelect("dr.role", "role")
      .where("role.name NOT IN (:...excludedRoles)", {
        excludedRoles: ["Citizen", "Administrator"]
      })
      .orderBy("department.name", "ASC")
      .addOrderBy("role.name", "ASC")
      .getMany();
  }

  /**
   * Finds all department roles by role name.
   * @param roleName The name of the role (e.g., "Citizen", "Administrator", "Staff Member").
   * @returns Array of department role entities with that role name.
   */
  public async findByRoleName(roleName: string): Promise<DepartmentRoleEntity[]> {
    return this.repository
      .createQueryBuilder("dr")
      .innerJoinAndSelect("dr.department", "department")
      .innerJoinAndSelect("dr.role", "role")
      .where("role.name = :roleName", { roleName })
      .orderBy("department.name", "ASC")
      .getMany();
  }

  /**
   * Saves a department role entity.
   * @param departmentRole The department role entity to save.
   * @returns The saved department role entity.
   */
  public async save(departmentRole: DepartmentRoleEntity): Promise<DepartmentRoleEntity> {
    return this.repository.save(departmentRole);
  }
}

// Export a singleton instance of the repository
export const departmentRoleRepository = new DepartmentRoleRepository();
