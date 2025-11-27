import { AppDataSource } from "@database/connection";
import { userEntity } from "@models/entity/userEntity";
import { Repository } from "typeorm";
import { verifyPassword, generatePasswordData } from "@utils/passwordUtils";
import { ReportStatus } from "@models/dto/ReportStatus";

/**
 * Repository for User data access.
 * Handles all database operations for the User entity.
 */
class UserRepository {
  private repository: Repository<userEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(userEntity);
  }

  /**
   * Saves a new or existing user to the database.
   * The user entity, including hashed password and salt, should be provided.
   * @param user The user entity to save.
   * @returns The saved user entity.
   */
  public async save(user: userEntity): Promise<userEntity> {
    return this.repository.save(user);
  }

  /**
   * Creates a new user with a hashed password.
   * @param userData Partial user data including plain text password.
   * @returns The created user entity.
   */
  public async createUserWithPassword(
    userData: Omit<userEntity, 'id' | 'createdAt' | 'passwordHash' | 'emailNotificationsEnabled' | 'departmentRole'> & { password: string; emailNotificationsEnabled?: boolean }
  ): Promise<userEntity> {
    const { password, ...userFields } = userData;
    const { salt, hash } = await generatePasswordData(password);

    const user = this.repository.create({
      ...userFields,
      passwordHash: `${salt}:${hash}`
    });

    const savedUser = await this.repository.save(user);

    // Reload the user with relations and passwordHash
    const userWithRelations = await this.repository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.departmentRole", "departmentRole")
      .leftJoinAndSelect("departmentRole.department", "department")
      .leftJoinAndSelect("departmentRole.role", "role")
      .where("user.id = :id", { id: savedUser.id })
      .addSelect("user.passwordHash")
      .getOne();

    if (!userWithRelations) {
      throw new Error('Failed to load user with relations after creation');
    }

    return userWithRelations;
  }

  /**
   * Finds a user by their ID with department role relations.
   * @param id The ID of the user.
   * @returns The user entity or null if not found.
   */
  public async findUserById(id: number): Promise<userEntity | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['departmentRole', 'departmentRole.department', 'departmentRole.role']
    });
  }

  /**
   * Finds a user by their username, optionally including password hash.
   * This is typically used for authentication.
   * @param username The username of the user.
   * @returns The user entity or null if not found.
   */
  public async findUserByUsername(username: string): Promise<userEntity | null> {
    // 'addSelect' is used to explicitly include fields that might be excluded by default
    return this.repository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.departmentRole", "departmentRole")
      .leftJoinAndSelect("departmentRole.department", "department")
      .leftJoinAndSelect("departmentRole.role", "role")
      .where("user.username = :username", { username })
      .addSelect("user.passwordHash")
      .getOne();
  }

  /**
   * Finds a user by their email address.
   * @param email The email of the user.
   * @returns The user entity or null if not found.
   */
  public async findUserByEmail(email: string): Promise<userEntity | null> {
    return this.repository.findOne({
      where: { email },
      relations: ['departmentRole', 'departmentRole.department', 'departmentRole.role']
    });
  }

  /**
   * Checks if a user exists with the given username.
   * @param username The username to check.
   * @returns True if the user exists, false otherwise.
   */
  public async existsUserByUsername(username: string): Promise<boolean> {
    return this.repository.exists({ where: { username } });
  }

  /**
   * Checks if a user exists with the given email.
   * @param email The email to check.
   * @returns True if the user exists, false otherwise.
   */
  public async existsUserByEmail(email: string): Promise<boolean> {
    return this.repository.exists({ where: { email } });
  }

  /**
   * Verifies user credentials by username and password.
   * The passwordHash is expected to be in the format "salt:hash".
   * @param username The username of the user.
   * @param password The plain text password to verify.
   * @returns The user entity if credentials are valid, null otherwise.
   */
  public async verifyCredentials(username: string, password: string): Promise<userEntity | null> {
    const user = await this.findUserByUsername(username);
    if (!user || !user.passwordHash) {
      return null;
    }

    // Extract salt and hash from the stored passwordHash (format: "salt:hash")
    const [salt, hash] = user.passwordHash.split(':');
    if (!salt || !hash) {
      return null;
    }

    const isValid = await verifyPassword(password, salt, hash);
    if (!isValid) {
      return null;
    }

    return user;
  }

  /**
   * Updates user information.
   * @param id The ID of the user to update.
   * @param updateData Partial user data to update.
   * @returns The updated user entity.
   * @throws Error if user is not found.
   */
  public async updateUser(
    id: number,
    updateData: Partial<Omit<userEntity, 'id' | 'createdAt' | 'passwordHash' | 'departmentRole'>>
  ): Promise<userEntity> {
    await this.repository.update(id, updateData);

    const updatedUser = await this.findUserById(id);
    if (!updatedUser) {
      throw new Error('User not found after update');
    }

    return updatedUser;
  }

  /**
   * Deletes a user by ID.
   * @param id The ID of the user to delete.
   * @returns void
   * @throws Error if user is not found.
   */
  public async deleteUser(id: number): Promise<void> {
    const result = await this.repository.delete(id);

    if (result.affected === 0) {
      throw new Error('User not found');
    }
  }

  /**
   * Finds all users with optional filters.
   * @param options Optional query options (where, order, etc.)
   * @returns Array of user entities.
   */
  public async findAllUsers(options?: {
    where?: any;
    order?: any;
  }): Promise<userEntity[]> {
    return this.repository.find({
      ...options,
      relations: ['departmentRole', 'departmentRole.department', 'departmentRole.role']
    });
  }

  /**
   * Finds all users by department role IDs (for filtering by role).
   * @param departmentRoleIds Array of department role IDs to filter by.
   * @returns Array of user entities.
   */
  public async findUsersByDepartmentRoleIds(departmentRoleIds: number[]): Promise<userEntity[]> {
    return this.repository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.departmentRole", "departmentRole")
      .leftJoinAndSelect("departmentRole.department", "department")
      .leftJoinAndSelect("departmentRole.role", "role")
      .where("user.departmentRoleId IN (:...ids)", { ids: departmentRoleIds })
      .orderBy("user.createdAt", "DESC")
      .getMany();
  }

  /**
   * Finds users by role name (using department_role relation).
   * @param roleName The name of the role to filter by.
   * @returns Array of user entities.
   */
  public async findUsersByRoleName(roleName: string): Promise<userEntity[]> {
    return this.repository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.departmentRole", "departmentRole")
      .leftJoinAndSelect("departmentRole.department", "department")
      .leftJoinAndSelect("departmentRole.role", "role")
      .where("role.name = :roleName", { roleName })
      .orderBy("user.createdAt", "DESC")
      .getMany();
  }

  /**
   * Finds users excluding specific role names.
   * @param excludedRoleNames Array of role names to exclude.
   * @returns Array of user entities.
   */
  public async findUsersExcludingRoles(excludedRoleNames: string[]): Promise<userEntity[]> {
    return this.repository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.departmentRole", "departmentRole")
      .leftJoinAndSelect("departmentRole.department", "department")
      .leftJoinAndSelect("departmentRole.role", "role")
      .where("role.name NOT IN (:...excludedRoleNames)", { excludedRoleNames })
      .orderBy("user.createdAt", "DESC")
      .getMany();
  }

  /**
   * Find an available technical staff member with a specific role
   * Uses load balancing: assigns to the staff member with the fewest active reports
   * @param roleId - Role ID from category_role_mapping
   * @returns Available staff member or null
   */
  async findAvailableStaffByRoleId(roleId: number): Promise<userEntity | null> {
    return this.repository
      .createQueryBuilder("user")
      .innerJoinAndSelect("user.departmentRole", "dr")
      .innerJoinAndSelect("dr.role", "role")
      .leftJoin("reports", "r", "r.assignee_id = user.id AND r.status IN (:...statuses)", { 
        statuses: [ReportStatus.ASSIGNED, ReportStatus.IN_PROGRESS, ReportStatus.SUSPENDED] 
      })
      .where("dr.role_id = :roleId", { roleId })
      .groupBy("user.id")
      .addGroupBy("dr.id")
      .addGroupBy("role.id")
      .addSelect("COUNT(r.id)", "report_count")
      .orderBy("report_count", "ASC")
      .addOrderBy("user.id", "ASC")
      .getOne();
  }

}

// Export a singleton instance of the repository
export const userRepository = new UserRepository();
