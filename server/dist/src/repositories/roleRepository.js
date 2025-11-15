"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleRepository = void 0;
const connection_1 = require("@database/connection");
const roleEntity_1 = require("@models/entity/roleEntity");
/**
 * Repository for Role data access.
 * Handles all database operations for the Role entity.
 */
class RoleRepository {
    repository;
    constructor() {
        this.repository = connection_1.AppDataSource.getRepository(roleEntity_1.RoleEntity);
    }
    /**
     * Finds a role by its ID.
     * @param id The ID of the role.
     * @returns The role entity or null if not found.
     */
    async findById(id) {
        return this.repository.findOneBy({ id });
    }
    /**
     * Finds a role by its name.
     * @param name The name of the role.
     * @returns The role entity or null if not found.
     */
    async findByName(name) {
        return this.repository.findOneBy({ name });
    }
    /**
     * Finds all roles.
     * @returns Array of role entities.
     */
    async findAll() {
        return this.repository.find({
            order: { name: "ASC" }
        });
    }
    /**
     * Finds all municipality roles (excludes Citizen and Administrator).
     * @returns Array of role entities.
     */
    async findMunicipalityRoles() {
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
    async save(role) {
        return this.repository.save(role);
    }
}
// Export a singleton instance of the repository
exports.roleRepository = new RoleRepository();
