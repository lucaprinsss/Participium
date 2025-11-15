"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const municipalityUserService_1 = require("@services/municipalityUserService");
const BadRequestError_1 = require("@models/errors/BadRequestError");
const roleUtils_1 = require("@utils/roleUtils");
/**
 * Controller for Municipality User management
 */
class MunicipalityUserController {
    /**
     * POST /api/municipality/users
     * Create new municipality user (Admin only)
     */
    async createMunicipalityUser(req, res, next) {
        try {
            const { username, email, password, first_name, last_name, role_name, department_name } = req.body;
            if (!username || !email || !password || !first_name || !last_name || !role_name) {
                throw new BadRequestError_1.BadRequestError('All fields are required: username, email, password, first_name, last_name, role_name');
            }
            const registerData = {
                username,
                email,
                password,
                first_name,
                last_name,
                role_name,
                department_name
            };
            const userResponse = await municipalityUserService_1.municipalityUserService.createMunicipalityUser(registerData);
            res.status(201).json(userResponse);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/municipality/users
     * List all municipality users (Admin only)
     */
    async getAllMunicipalityUsers(req, res, next) {
        try {
            const users = await municipalityUserService_1.municipalityUserService.getAllMunicipalityUsers();
            res.status(200).json(users);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/municipality/users/:id
     * Get municipality user by ID (Admin only)
     */
    async getMunicipalityUserById(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                throw new BadRequestError_1.BadRequestError('Invalid user ID');
            }
            const user = await municipalityUserService_1.municipalityUserService.getMunicipalityUserById(id);
            res.status(200).json(user);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PUT /api/municipality/users/:id
     * Update municipality user (Admin only)
     */
    async updateMunicipalityUser(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                throw new BadRequestError_1.BadRequestError('Invalid user ID');
            }
            const { first_name, last_name, email, role_name, department_name } = req.body;
            const updateData = {};
            if (first_name)
                updateData.firstName = first_name;
            if (last_name)
                updateData.lastName = last_name;
            if (email)
                updateData.email = email;
            if (role_name)
                updateData.role_name = role_name;
            if (department_name)
                updateData.department_name = department_name;
            if (Object.keys(updateData).length === 0) {
                throw new BadRequestError_1.BadRequestError('At least one field must be provided for update');
            }
            const updatedUser = await municipalityUserService_1.municipalityUserService.updateMunicipalityUser(id, updateData);
            res.status(200).json(updatedUser);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * DELETE /api/municipality/users/:id
     * Delete municipality user (Admin only)
     */
    async deleteMunicipalityUser(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                throw new BadRequestError_1.BadRequestError('Invalid user ID');
            }
            await municipalityUserService_1.municipalityUserService.deleteMunicipalityUser(id);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PUT /api/municipality/users/:id/role
     * Assign role to municipality user (Admin only)
     */
    async assignRole(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            const { role_name, department_name } = req.body;
            if (isNaN(id)) {
                throw new BadRequestError_1.BadRequestError('Invalid user ID');
            }
            if (!role_name) {
                throw new BadRequestError_1.BadRequestError('Role name is required');
            }
            const updatedUser = await municipalityUserService_1.municipalityUserService.assignRole(id, role_name, department_name);
            res.status(200).json(updatedUser);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get all municipality roles
     * GET /api/roles
     * Story: List all available municipality roles (excluding Citizen and Administrator)
     */
    async getAllRoles(req, res, next) {
        try {
            const municipalityRoles = await roleUtils_1.RoleUtils.getAllMunicipalityRoles();
            res.status(200).json(municipalityRoles);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.default = new MunicipalityUserController();
