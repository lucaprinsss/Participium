"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = void 0;
const connection_1 = require("@database/connection");
const userEntity_1 = require("@models/entity/userEntity");
const passwordUtils_1 = require("@utils/passwordUtils");
/**
 * Repository for User data access.
 * Handles all database operations for the User entity.
 */
class UserRepository {
    repository;
    constructor() {
        this.repository = connection_1.AppDataSource.getRepository(userEntity_1.userEntity);
    }
    /**
     * Saves a new or existing user to the database.
     * The user entity, including hashed password and salt, should be provided.
     * @param user The user entity to save.
     * @returns The saved user entity.
     */
    async save(user) {
        return this.repository.save(user);
    }
    /**
     * Creates a new user with a hashed password.
     * @param userData Partial user data including plain text password.
     * @returns The created user entity.
     */
    async createUserWithPassword(userData) {
        const { password, ...userFields } = userData;
        const { salt, hash } = await (0, passwordUtils_1.generatePasswordData)(password);
        const user = this.repository.create({
            ...userFields,
            passwordHash: `${salt}:${hash}`
        });
        return this.repository.save(user);
    }
    /**
     * Finds a user by their ID with department role relations.
     * @param id The ID of the user.
     * @returns The user entity or null if not found.
     */
    async findUserById(id) {
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
    async findUserByUsername(username) {
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
    async findUserByEmail(email) {
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
    async existsUserByUsername(username) {
        return this.repository.exists({ where: { username } });
    }
    /**
     * Checks if a user exists with the given email.
     * @param email The email to check.
     * @returns True if the user exists, false otherwise.
     */
    async existsUserByEmail(email) {
        return this.repository.exists({ where: { email } });
    }
    /**
     * Verifies user credentials by username and password.
     * The passwordHash is expected to be in the format "salt:hash".
     * @param username The username of the user.
     * @param password The plain text password to verify.
     * @returns The user entity if credentials are valid, null otherwise.
     */
    async verifyCredentials(username, password) {
        const user = await this.findUserByUsername(username);
        if (!user || !user.passwordHash) {
            return null;
        }
        // Extract salt and hash from the stored passwordHash (format: "salt:hash")
        const [salt, hash] = user.passwordHash.split(':');
        if (!salt || !hash) {
            return null;
        }
        const isValid = await (0, passwordUtils_1.verifyPassword)(password, salt, hash);
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
    async updateUser(id, updateData) {
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
    async deleteUser(id) {
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
    async findAllUsers(options) {
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
    async findUsersByDepartmentRoleIds(departmentRoleIds) {
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
    async findUsersByRoleName(roleName) {
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
    async findUsersExcludingRoles(excludedRoleNames) {
        return this.repository
            .createQueryBuilder("user")
            .leftJoinAndSelect("user.departmentRole", "departmentRole")
            .leftJoinAndSelect("departmentRole.department", "department")
            .leftJoinAndSelect("departmentRole.role", "role")
            .where("role.name NOT IN (:...excludedRoleNames)", { excludedRoleNames })
            .orderBy("user.createdAt", "DESC")
            .getMany();
    }
}
// Export a singleton instance of the repository
exports.userRepository = new UserRepository();
