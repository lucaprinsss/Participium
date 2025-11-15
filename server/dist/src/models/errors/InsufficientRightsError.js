"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsufficientRightsError = void 0;
const AppError_1 = require("@errors/AppError");
class InsufficientRightsError extends AppError_1.AppError {
    constructor(message) {
        super(message, 403);
        this.name = "InsufficientRightsError";
    }
}
exports.InsufficientRightsError = InsufficientRightsError;
