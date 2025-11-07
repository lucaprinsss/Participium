import { AppDataSource } from "@database/connection";
import { userEntity } from "@models/entity/userEntity";
import { Repository } from "typeorm";
import { verifyPassword, generatePasswordData } from "@utils/password";

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
    userData: Omit<userEntity, 'id' | 'createdAt' | 'passwordHash'> & { password: string }
  ): Promise<userEntity> {
    const { password, ...userFields } = userData;
    const { salt, hash } = await generatePasswordData(password);
    
    const user = this.repository.create({
      ...userFields,
      passwordHash: `${salt}:${hash}`
    });

    return this.repository.save(user);
  }

  /**
   * Finds a user by their ID.
   * @param id The ID of the user.
   * @returns The user entity or null if not found.
   */
  public async findUserById(id: number): Promise<userEntity | null> {
    return this.repository.findOneBy({ id });
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
    return this.repository.findOneBy({ email });
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
}

// Export a singleton instance of the repository
export const userRepository = new UserRepository();
