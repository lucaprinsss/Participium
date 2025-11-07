import { AppDataSource } from "@database/connection";
import { User } from "@models/entity/userEntity";
import { Repository } from "typeorm";

/**
 * Repository for User data access.
 * Handles all database operations for the User entity.
 */
class UserRepository {
  private repository: Repository<User>;

  constructor() {
    this.repository = AppDataSource.getRepository(User);
  }

  /**
   * Saves a new or existing user to the database.
   * The user entity, including hashed password and salt, should be provided.
   * @param user The user entity to save.
   * @returns The saved user entity.
   */
  public async save(user: User): Promise<User> {
    return this.repository.save(user);
  }

  /**
   * Finds a user by their ID.
   * @param id The ID of the user.
   * @returns The user entity or null if not found.
   */
  public async findById(id: number): Promise<User | null> {
    return this.repository.findOneBy({ id });
  }

  /**
   * Finds a user by their username, optionally including password and salt.
   * This is typically used for authentication.
   * @param username The username of the user.
   * @returns The user entity or null if not found.
   */
  public async findByUsername(username: string): Promise<User | null> {
    // 'addSelect' is used to explicitly include fields that might be excluded by default
    return this.repository
      .createQueryBuilder("user")
      .where("user.username = :username", { username })
      .addSelect("user.password")
      .addSelect("user.salt")
      .getOne();
  }

  /**
   * Finds a user by their email address.
   * @param email The email of the user.
   * @returns The user entity or null if not found.
   */
  public async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOneBy({ email });
  }

  /**
   * Checks if a user exists with the given username.
   * @param username The username to check.
   * @returns True if the user exists, false otherwise.
   */
  public async existsByUsername(username: string): Promise<boolean> {
    return this.repository.exist({ where: { username } });
  }

  /**
   * Checks if a user exists with the given email.
   * @param email The email to check.
   * @returns True if the user exists, false otherwise.
   */
  public async existsByEmail(email: string): Promise<boolean> {
    return this.repository.exist({ where: { email } });
  }
}

// Export a singleton instance of the repository
export const userRepository = new UserRepository();
