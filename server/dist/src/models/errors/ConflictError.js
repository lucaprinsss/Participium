"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictError = void 0;
const AppError_1 = require("@errors/AppError");
class ConflictError extends AppError_1.AppError {
    constructor(message) {
        super(message, 409);
        this.name = "ConflictError";
    }
}
exports.ConflictError = ConflictError;
