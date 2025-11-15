"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.municipalityUserService = void 0;
const userRepository_1 = require("@repositories/userRepository");
const departmentRoleRepository_1 = require("@repositories/departmentRoleRepository");
const NotFoundError_1 = require("@models/errors/NotFoundError");
const BadRequestError_1 = require("@models/errors/BadRequestError");
const loggingService_1 = require("@services/loggingService");
const mapperService_1 = require("@services/mapperService");
const ConflictError_1 = require("@models/errors/ConflictError");
const AppError_1 = require("@models/errors/AppError");
/**
 * Service for municipality user management
 */
class MunicipalityUserService {
    /**
     * Create a new municipality user
     * @param registerData User registration data
     * @returns The created user response
     * @throws BadRequestError if trying to create Citizen or Administrator
     * @throws ConflictError if username or email already exists
     */
    async createMunicipalityUser(registerData) {
        const { role_name, password, first_name, last_name, username, email, department_name } = registerData;
        if (role_name === 'Citizen') {
            throw new BadRequestError_1.BadRequestError('Cannot create a municipality user with Citizen role');
        }
        if (role_name === 'Administrator') {
            throw new BadRequestError_1.BadRequestError('Cannot create an Administrator through this endpoint');
        }
        // Check for duplicate username
        const existingUserByUsername = await userRepository_1.userRepository.existsUserByUsername(username);
        if (existingUserByUsername) {
            throw new ConflictError_1.ConflictError('Username already exists');
        }
        // Check for duplicate email
        const existingUserByEmail = await userRepository_1.userRepository.existsUserByEmail(email);
        if (existingUserByEmail) {
            throw new ConflictError_1.ConflictError('Email already exists');
        }
        // Find department role by department and role name
        let matchingDepartmentRole;
        if (department_name) {
            matchingDepartmentRole = await departmentRoleRepository_1.departmentRoleRepository.findByDepartmentAndRole(department_name, role_name);
        }
        else {
            // Find all department roles that match the requested role
            const allDepartmentRoles = await departmentRoleRepository_1.departmentRoleRepository.findAll();
            matchingDepartmentRole = allDepartmentRoles.find(dr => dr.role?.name === role_name);
        }
        if (!matchingDepartmentRole) {
            throw new BadRequestError_1.BadRequestError(`Role ${role_name} not found in any department`);
        }
        // Create user with repository (it will hash the password)
        const newUser = await userRepository_1.userRepository.createUserWithPassword({
            username,
            email,
            firstName: first_name,
            lastName: last_name,
            departmentRoleId: matchingDepartmentRole.id,
            password
        });
        (0, loggingService_1.logInfo)(`Municipality user created: ${username} with role ${role_name}`);
        const userResponse = (0, mapperService_1.mapUserEntityToUserResponse)(newUser);
        if (!userResponse) {
            throw new AppError_1.AppError('Failed to map user response after creation', 500);
        }
        return userResponse;
    }
    /**
     * Get all municipality users
     * @returns Array of user responses (excludes Citizen and Administrator)
     */
    async getAllMunicipalityUsers() {
        const users = await userRepository_1.userRepository.findUsersExcludingRoles(['Citizen', 'Administrator']);
        (0, loggingService_1.logInfo)(`Retrieved ${users.length} municipality users`);
        return users
            .map(user => (0, mapperService_1.mapUserEntityToUserResponse)(user))
            .filter(user => user !== null);
    }
    /**
     * Get municipality user by ID
     * @param id User ID
     * @returns User response
     * @throws NotFoundError if user not found or is not a municipality user
     */
    async getMunicipalityUserById(id) {
        const user = await userRepository_1.userRepository.findUserById(id);
        if (!user) {
            throw new NotFoundError_1.NotFoundError('User not found');
        }
        const roleName = user.departmentRole?.role?.name;
        if (roleName === 'Citizen' || roleName === 'Administrator') {
            throw new NotFoundError_1.NotFoundError('Municipality user not found');
        }
        const userResponse = (0, mapperService_1.mapUserEntityToUserResponse)(user);
        if (!userResponse) {
            throw new AppError_1.AppError('Failed to map user response for getById', 500);
        }
        return userResponse;
    }
    /**
     * Update municipality user
     * @param id User ID
     * @param updateData Data to update (Nota: si aspetta camelCase)
     * @returns Updated user response
     * @throws NotFoundError if user not found
     * @throws BadRequestError if trying to update non-municipality user
     */
    async updateMunicipalityUser(id, updateData) {
        const existingUser = await userRepository_1.userRepository.findUserById(id);
        if (!existingUser) {
            throw new NotFoundError_1.NotFoundError('User not found');
        }
        const existingRoleName = existingUser.departmentRole?.role?.name;
        if (existingRoleName === 'Citizen' || existingRoleName === 'Administrator') {
            throw new BadRequestError_1.BadRequestError('Cannot modify Citizen or Administrator through this endpoint');
        }
        if (updateData.email && updateData.email !== existingUser.email) {
            const emailExists = await userRepository_1.userRepository.existsUserByEmail(updateData.email);
            if (emailExists) {
                throw new ConflictError_1.ConflictError('Email already exists');
            }
        }
        // Handle role update
        let departmentRoleId;
        if (updateData.role_name) {
            if (updateData.role_name === 'Citizen' || updateData.role_name === 'Administrator') {
                throw new BadRequestError_1.BadRequestError('Cannot change role to Citizen or Administrator');
            }
            // Find the department role for the new role
            let matchingDepartmentRole;
            if (updateData.department_name) {
                matchingDepartmentRole = await departmentRoleRepository_1.departmentRoleRepository.findByDepartmentAndRole(updateData.department_name, updateData.role_name);
            }
            else {
                const allDepartmentRoles = await departmentRoleRepository_1.departmentRoleRepository.findAll();
                matchingDepartmentRole = allDepartmentRoles.find(dr => dr.role?.name === updateData.role_name);
            }
            if (!matchingDepartmentRole) {
                throw new BadRequestError_1.BadRequestError(`Role ${updateData.role_name} not found in any department`);
            }
            departmentRoleId = matchingDepartmentRole.id;
        }
        const updatedUser = await userRepository_1.userRepository.updateUser(id, {
            firstName: updateData.firstName,
            lastName: updateData.lastName,
            email: updateData.email,
            ...(departmentRoleId && { departmentRoleId })
        });
        (0, loggingService_1.logInfo)(`Municipality user updated: ${updatedUser.username} (ID: ${id})`);
        const userResponse = (0, mapperService_1.mapUserEntityToUserResponse)(updatedUser);
        if (!userResponse) {
            throw new AppError_1.AppError('Failed to map user response after update', 500);
        }
        return userResponse;
    }
    /**
     * Delete municipality user
     * @param id User ID
     * @returns void
     * @throws NotFoundError if user not found
     * @throws BadRequestError if trying to delete non-municipality user
     */
    async deleteMunicipalityUser(id) {
        const existingUser = await userRepository_1.userRepository.findUserById(id);
        if (!existingUser) {
            throw new NotFoundError_1.NotFoundError('User not found');
        }
        const roleName = existingUser.departmentRole?.role?.name;
        if (roleName === 'Citizen' || roleName === 'Administrator') {
            throw new BadRequestError_1.BadRequestError('Cannot delete Citizen or Administrator through this endpoint');
        }
        await userRepository_1.userRepository.deleteUser(id);
        (0, loggingService_1.logInfo)(`Municipality user deleted: ${existingUser.username} (ID: ${id})`);
    }
    /**
     * Assign role to municipality user
     * @param userId User ID
     * @param roleName Role name to assign
     * @param departmentName Optional department name
     * @returns Updated user response
     * @throws NotFoundError if user not found
     * @throws BadRequestError if trying to assign invalid roles
     */
    async assignRole(userId, roleName, departmentName) {
        if (roleName === 'Citizen') {
            throw new BadRequestError_1.BadRequestError('Cannot assign Citizen role to municipality user');
        }
        if (roleName === 'Administrator') {
            throw new BadRequestError_1.BadRequestError('Cannot assign Administrator role through this endpoint');
        }
        const user = await userRepository_1.userRepository.findUserById(userId);
        if (!user) {
            throw new NotFoundError_1.NotFoundError('User not found');
        }
        const existingRoleName = user.departmentRole?.role?.name;
        if (existingRoleName === 'Citizen' || existingRoleName === 'Administrator') {
            throw new BadRequestError_1.BadRequestError('Cannot assign role to Citizen or Administrator through this endpoint');
        }
        // Find the department role for the new role
        let matchingDepartmentRole;
        if (departmentName) {
            matchingDepartmentRole = await departmentRoleRepository_1.departmentRoleRepository.findByDepartmentAndRole(departmentName, roleName);
        }
        else {
            const allDepartmentRoles = await departmentRoleRepository_1.departmentRoleRepository.findAll();
            matchingDepartmentRole = allDepartmentRoles.find(dr => dr.role?.name === roleName);
        }
        if (!matchingDepartmentRole) {
            throw new BadRequestError_1.BadRequestError(`Role ${roleName} not found in any department`);
        }
        const updatedUser = await userRepository_1.userRepository.updateUser(userId, {
            departmentRoleId: matchingDepartmentRole.id
        });
        (0, loggingService_1.logInfo)(`Role assigned to user ${user.username}: ${roleName} (ID: ${userId})`);
        const userResponse = (0, mapperService_1.mapUserEntityToUserResponse)(updatedUser);
        if (!userResponse) {
            throw new AppError_1.AppError('Failed to map user response after role assignment', 500);
        }
        return userResponse;
    }
}
exports.municipalityUserService = new MunicipalityUserService();
