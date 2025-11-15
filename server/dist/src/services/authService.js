"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const mapperService_1 = require("./mapperService");
/**
 * Service for authentication-related business logic
 */
class AuthService {
    /**
     * Creates a UserResponse DTO from a user entity
     * Excludes sensitive data like password hash
     * @param user The user entity
     * @returns UserResponse DTO
     */
    createUserResponse(user) {
        if (!user) {
            return null;
        }
        const userEntityData = user;
        return (0, mapperService_1.mapUserEntityToUserResponse)(userEntityData);
    }
}
exports.authService = new AuthService();
