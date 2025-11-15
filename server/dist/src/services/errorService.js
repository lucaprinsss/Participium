"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAppError = createAppError;
const AppError_1 = require("@errors/AppError");
const loggingService_1 = require("@services/loggingService");
const mapperService_1 = require("@services/mapperService");
function createAppError(err) {
    let modelError = (0, mapperService_1.createErrorDTO)(500, err?.message || "Internal Server Error", "InternalServerError");
    (0, loggingService_1.logError)(err);
    (0, loggingService_1.logError)(`Error: ${err?.message}\nStacktrace:\n${err?.stack || "No stacktrace available"}`);
    if (err &&
        (err instanceof AppError_1.AppError ||
            (err.status && typeof err.status === "number"))) {
        modelError = (0, mapperService_1.createErrorDTO)(err.status, err.message, err.name);
    }
    return modelError;
}
