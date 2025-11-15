"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
const userRepository_1 = require("@repositories/userRepository");
const departmentRoleRepository_1 = require("@repositories/departmentRoleRepository");
const ConflictError_1 = require("@models/errors/ConflictError");
const loggingService_1 = require("@services/loggingService");
const mapperService_1 = require("@services/mapperService");
const AppError_1 = require("@models/errors/AppError");
/**
 * Service for user-related business logic
 */
class UserService {
    /**
     * Registers a new citizen
     * Validates uniqueness of username and email
     * @param registerData User registration data
     * @returns UserResponse DTO
     */
    async registerCitizen(registerData) {
        const { username, email, password, first_name, last_name, role_name, department_name } = registerData;
        // Check if username already exists
        const existingUsername = await userRepository_1.userRepository.existsUserByUsername(username);
        if (existingUsername) {
            throw new ConflictError_1.ConflictError('Username already exists');
        }
        // Check if email already exists
        const existingEmail = await userRepository_1.userRepository.existsUserByEmail(email);
        if (existingEmail) {
            throw new ConflictError_1.ConflictError('Email already exists');
        }
        // Get the department_role_id for Citizen role
        const citizenDepartmentRole = await departmentRoleRepository_1.departmentRoleRepository.findByDepartmentAndRole(department_name || 'Organization', role_name || 'Citizen');
        if (!citizenDepartmentRole) {
            throw new AppError_1.AppError('Citizen role configuration not found in database', 500);
        }
        // Create new user with hashed password
        const newUser = await userRepository_1.userRepository.createUserWithPassword({
            username,
            email,
            password,
            firstName: first_name,
            lastName: last_name,
            departmentRoleId: citizenDepartmentRole.id,
            emailNotificationsEnabled: true
        });
        (0, loggingService_1.logInfo)(`New citizen registered: ${username} (ID: ${newUser.id})`);
        const userResponse = (0, mapperService_1.mapUserEntityToUserResponse)(newUser);
        if (!userResponse) {
            throw new AppError_1.AppError('Failed to map user data', 500);
        }
        return userResponse;
    }
    /**
     * Gets user by ID
     * @param userId User ID
     * @returns UserResponse DTO or null
     */
    async getUserById(userId) {
        const user = await userRepository_1.userRepository.findUserById(userId);
        if (!user) {
            return null;
        }
        return (0, mapperService_1.mapUserEntityToUserResponse)(user);
    }
}
exports.userService = new UserService();
