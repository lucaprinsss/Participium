"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.departmentRepository = void 0;
const connection_1 = require("@database/connection");
const departmentEntity_1 = require("@models/entity/departmentEntity");
/**
 * Repository for Department data access.
 * Handles all database operations for the Department entity.
 */
class DepartmentRepository {
    repository;
    constructor() {
        this.repository = connection_1.AppDataSource.getRepository(departmentEntity_1.DepartmentEntity);
    }
    /**
     * Finds a department by its ID.
     * @param id The ID of the department.
     * @returns The department entity or null if not found.
     */
    async findById(id) {
        return this.repository.findOneBy({ id });
    }
    /**
     * Finds a department by its name.
     * @param name The name of the department.
     * @returns The department entity or null if not found.
     */
    async findByName(name) {
        return this.repository.findOneBy({ name });
    }
    /**
     * Finds all departments.
     * @returns Array of department entities.
     */
    async findAll() {
        return this.repository.find({
            order: { name: "ASC" }
        });
    }
    /**
     * Saves a department entity.
     * @param department The department entity to save.
     * @returns The saved department entity.
     */
    async save(department) {
        return this.repository.save(department);
    }
}
// Export a singleton instance of the repository
exports.departmentRepository = new DepartmentRepository();
