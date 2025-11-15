"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const authService_1 = require("@services/authService");
const UnauthorizedError_1 = require("@models/errors/UnauthorizedError");
/**
 * Controller for Authentication-related HTTP requests
 */
class AuthController {
    /**
     * Login handler
     * Authenticates user with Passport LocalStrategy
     */
    login(req, res, next) {
        passport_1.default.authenticate('local', (err, user, info) => {
            if (err) {
                return next(err);
            }
            if (!user) {
                return next(new UnauthorizedError_1.UnauthorizedError(info?.message || 'Invalid credentials'));
            }
            req.logIn(user, (err) => {
                if (err) {
                    return next(err);
                }
                const userResponse = authService_1.authService.createUserResponse(user);
                return res.status(200).json(userResponse);
            });
        })(req, res, next);
    }
    /**
     * Get current authenticated user
     * Returns user data from session
     */
    getCurrentUser(req, res, next) {
        try {
            if (!req.user) {
                throw new UnauthorizedError_1.UnauthorizedError('Not authenticated');
            }
            const userResponse = authService_1.authService.createUserResponse(req.user);
            res.status(200).json(userResponse);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Logout handler
     * Destroys session and logs user out
     */
    logout(req, res, next) {
        req.logout((err) => {
            if (err) {
                return next(err);
            }
            req.session.destroy((err) => {
                if (err) {
                    return next(err);
                }
                res.clearCookie('connect.sid');
                res.status(200).json({ message: 'Logged out successfully' });
            });
        });
    }
}
exports.default = new AuthController();
