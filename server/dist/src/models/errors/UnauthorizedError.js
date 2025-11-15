"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnauthorizedError = void 0;
const AppError_1 = require("@errors/AppError");
class UnauthorizedError extends AppError_1.AppError {
    constructor(message) {
        super(message, 401);
        this.name = "UnauthorizedError";
    }
}
exports.UnauthorizedError = UnauthorizedError;
