"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadRequestError = void 0;
const AppError_1 = require("@errors/AppError");
class BadRequestError extends AppError_1.AppError {
    constructor(message) {
        super(message, 400);
        this.name = "BadRequestError";
    }
}
exports.BadRequestError = BadRequestError;
