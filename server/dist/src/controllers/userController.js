"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const userService_1 = require("@services/userService");
const BadRequestError_1 = require("@models/errors/BadRequestError");
/**
 * Controller for User-related HTTP requests
 */
class UserController {
    /**
     * Register a new citizen
     * Citizen registration logic
     */
    async register(req, res, next) {
        try {
            const { username, email, password, first_name, last_name } = req.body;
            if (!username || !email || !password || !first_name || !last_name) {
                throw new BadRequestError_1.BadRequestError('All fields are required: username, email, password, first_name, last_name');
            }
            const registerData = {
                username,
                email,
                password,
                first_name,
                last_name,
                role_name: 'Citizen' // Default role for citizens
            };
            const userResponse = await userService_1.userService.registerCitizen(registerData);
            res.status(201).json(userResponse);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.default = new UserController();
