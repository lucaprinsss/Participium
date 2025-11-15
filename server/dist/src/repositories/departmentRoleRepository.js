"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.departmentRoleRepository = void 0;
const connection_1 = require("@database/connection");
const departmentRoleEntity_1 = require("@models/entity/departmentRoleEntity");
/**
 * Repository for DepartmentRole data access.
 * Handles all database operations for the DepartmentRole entity.
 */
class DepartmentRoleRepository {
    repository;
    constructor() {
        this.repository = connection_1.AppDataSource.getRepository(departmentRoleEntity_1.DepartmentRoleEntity);
    }
    /**
     * Finds a department role by its ID.
     * @param id The ID of the department role.
     * @returns The department role entity or null if not found.
     */
    async findById(id) {
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
    async findByDepartmentAndRole(departmentName, roleName) {
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
    async findByDepartment(departmentId) {
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
    async findByRole(roleId) {
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
    async findAll() {
        return this.repository.find({
            relations: ["department", "role"],
            order: { departmentId: "ASC", roleId: "ASC" }
        });
    }
    /**
     * Finds all department roles excluding Citizen and Administrator.
     * @returns Array of department role entities.
     */
    async findMunicipalityDepartmentRoles() {
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
     * Saves a department role entity.
     * @param departmentRole The department role entity to save.
     * @returns The saved department role entity.
     */
    async save(departmentRole) {
        return this.repository.save(departmentRole);
    }
}
// Export a singleton instance of the repository
exports.departmentRoleRepository = new DepartmentRoleRepository();
