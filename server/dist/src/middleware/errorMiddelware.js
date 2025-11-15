"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const ErrorDTO_1 = require("@models/errors/ErrorDTO");
const errorService_1 = require("@services/errorService");
function errorHandler(err, req, res, next) {
    let modelError = (0, errorService_1.createAppError)(err);
    res.status(modelError.code).json((0, ErrorDTO_1.ErrorDTOToJSON)(modelError));
}
