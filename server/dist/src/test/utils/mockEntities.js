"use strict";
/**
 * Mock entities for testing purposes
 * Provides complete mock entities with all required fields and relations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockRole = createMockRole;
exports.createMockDepartment = createMockDepartment;
exports.createMockDepartmentRole = createMockDepartmentRole;
exports.createMockUser = createMockUser;
exports.createMockCitizen = createMockCitizen;
exports.createMockMunicipalityUser = createMockMunicipalityUser;
const userEntity_1 = require("@models/entity/userEntity");
const departmentRoleEntity_1 = require("@models/entity/departmentRoleEntity");
const roleEntity_1 = require("@models/entity/roleEntity");
const departmentEntity_1 = require("@models/entity/departmentEntity");
/**
 * Creates a mock RoleEntity
 */
function createMockRole(name) {
    const role = new roleEntity_1.RoleEntity();
    role.id = 1;
    role.name = name;
    role.description = `${name} role`;
    role.departmentRoles = [];
    return role;
}
/**
 * Creates a mock DepartmentEntity
 */
function createMockDepartment(name) {
    const department = new departmentEntity_1.DepartmentEntity();
    department.id = 1;
    department.name = name;
    department.departmentRoles = [];
    return department;
}
/**
 * Creates a mock DepartmentRoleEntity
 * For Citizen role, department is optional (null)
 */
function createMockDepartmentRole(roleName, departmentName) {
    const departmentRole = new departmentRoleEntity_1.DepartmentRoleEntity();
    departmentRole.id = 1;
    departmentRole.roleId = 1;
    departmentRole.role = createMockRole(roleName);
    if (departmentName) {
        departmentRole.departmentId = 1;
        departmentRole.department = createMockDepartment(departmentName);
    }
    else {
        // For Citizen role, department is not required
        departmentRole.departmentId = 1;
        departmentRole.department = {}; // Simplified mock for testing
    }
    departmentRole.users = [];
    return departmentRole;
}
/**
 * Creates a mock userEntity with required departmentRole relation
 * @param roleName - The role name (e.g., 'Citizen', 'Municipal Administrator')
 * @param departmentName - Optional department name (not needed for Citizens)
 * @param overrides - Optional field overrides
 */
function createMockUser(roleName, departmentName, overrides) {
    const user = new userEntity_1.userEntity();
    user.id = 1;
    user.username = 'testuser';
    user.email = 'test@example.com';
    user.firstName = 'Test';
    user.lastName = 'User';
    user.passwordHash = 'salt:hash';
    user.departmentRoleId = 1;
    user.departmentRole = createMockDepartmentRole(roleName, departmentName);
    user.emailNotificationsEnabled = true;
    user.createdAt = new Date();
    user.personalPhotoUrl = undefined;
    user.telegramUsername = undefined;
    // Apply any overrides
    return { ...user, ...overrides };
}
/**
 * Creates a mock citizen user entity
 */
function createMockCitizen(overrides) {
    return createMockUser('Citizen', undefined, overrides);
}
/**
 * Creates a mock municipality user entity
 */
function createMockMunicipalityUser(roleName, departmentName, overrides) {
    return createMockUser(roleName, departmentName, overrides);
}
