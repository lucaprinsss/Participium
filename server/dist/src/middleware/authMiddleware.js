"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.isAdmin = exports.isCitizen = exports.isLoggedIn = void 0;
const InsufficientRightsError_1 = require("@models/errors/InsufficientRightsError");
const UnauthorizedError_1 = require("@models/errors/UnauthorizedError");
/**
 * Helper function to get the role name from a user entity
 */
function getUserRoleName(user) {
    if (!user)
        return undefined;
    // If user is a userEntity with departmentRole relation
    const userEntityData = user;
    return userEntityData.departmentRole?.role?.name;
}
/**
 * Middleware to check if the user is logged in
 */
const isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    next(new UnauthorizedError_1.UnauthorizedError("Not authenticated"));
};
exports.isLoggedIn = isLoggedIn;
/**
 * Middleware to check if the user is a citizen
 */
const isCitizen = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return next(new UnauthorizedError_1.UnauthorizedError("Not authenticated"));
    }
    const roleName = getUserRoleName(req.user);
    if (roleName !== 'Citizen') {
        return next(new InsufficientRightsError_1.InsufficientRightsError('Access denied. Citizen role required'));
    }
    next();
};
exports.isCitizen = isCitizen;
/**
 * Middleware to check if the user is an admin
 */
const isAdmin = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return next(new UnauthorizedError_1.UnauthorizedError('Not authenticated'));
    }
    const roleName = getUserRoleName(req.user);
    if (roleName !== 'Administrator') {
        return next(new InsufficientRightsError_1.InsufficientRightsError('Access denied. Admin role required.'));
    }
    next();
};
exports.isAdmin = isAdmin;
/**
 * Role-based authorization middleware factory
 * @param {string} requiredRole The role required to access the route
 * @returns {function} Middleware function
 */
const requireRole = (requiredRole) => {
    return (req, res, next) => {
        if (!req.isAuthenticated()) {
            return next(new UnauthorizedError_1.UnauthorizedError('Not authenticated'));
        }
        const roleName = getUserRoleName(req.user);
        if (!roleName || roleName !== requiredRole) {
            return next(new InsufficientRightsError_1.InsufficientRightsError(`Access denied. ${requiredRole} role required.`));
        }
        next();
    };
};
exports.requireRole = requireRole;
