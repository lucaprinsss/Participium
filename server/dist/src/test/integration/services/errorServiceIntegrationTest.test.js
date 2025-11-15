"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const errorService_1 = require("../../../services/errorService");
const AppError_1 = require("../../../models/errors/AppError");
const loggingService = __importStar(require("../../../services/loggingService"));
describe('createAppError Integration Test', () => {
    let logErrorSpy;
    beforeEach(() => {
        logErrorSpy = jest
            .spyOn(loggingService, 'logError')
            .mockImplementation(() => undefined);
    });
    afterEach(() => {
        logErrorSpy.mockRestore();
    });
    it('should correctly map an AppError to a specific ErrorDTO', () => {
        // Arrange
        const appError = new AppError_1.AppError('User Not Found', 404);
        appError.name = 'NotFound';
        const expectedDto = {
            code: 404,
            message: 'User Not Found',
            name: 'NotFound',
        };
        // Act
        const result = (0, errorService_1.createAppError)(appError);
        // Assert
        expect(result).toEqual(expectedDto);
        expect(logErrorSpy).toHaveBeenCalledTimes(2);
        expect(logErrorSpy).toHaveBeenCalledWith(appError);
        expect(logErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error: User Not Found'));
        expect(logErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Stacktrace:'));
    });
    it('should correctly map an HTTP-like error (duck-typed) to a specific DTO', () => {
        // Arrange
        const httpError = {
            status: 401,
            message: 'Unauthorized',
            name: 'AuthError',
        };
        const expectedDto = {
            code: 401,
            message: 'Unauthorized',
            name: 'AuthError',
        };
        // Act
        const result = (0, errorService_1.createAppError)(httpError);
        // Assert
        expect(result).toEqual(expectedDto);
        expect(logErrorSpy).toHaveBeenCalledTimes(2);
        expect(logErrorSpy).toHaveBeenCalledWith(httpError);
    });
    it('should map a generic Error to a 500 DTO', () => {
        // Arrange
        const genericError = new Error('Database connection failed');
        const expectedDto = {
            code: 500,
            message: 'Database connection failed',
            name: 'InternalServerError',
        };
        // Act
        const result = (0, errorService_1.createAppError)(genericError);
        // Assert
        expect(result).toEqual(expectedDto);
        expect(logErrorSpy).toHaveBeenCalledTimes(2);
        expect(logErrorSpy).toHaveBeenCalledWith(genericError);
        expect(logErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Database connection failed'));
    });
    it('should handle null or undefined input and return a default 500 DTO', () => {
        // Arrange
        const error = null;
        const expectedDto = {
            code: 500,
            message: 'Internal Server Error',
            name: 'InternalServerError',
        };
        // Act
        const result = (0, errorService_1.createAppError)(error);
        // Assert
        expect(result).toEqual(expectedDto);
        expect(logErrorSpy).toHaveBeenCalledTimes(2);
        expect(logErrorSpy).toHaveBeenCalledWith(null);
        expect(logErrorSpy).toHaveBeenCalledWith('Error: undefined\nStacktrace:\nNo stacktrace available');
    });
    it('should handle a thrown string and return a 500 DTO', () => {
        // Arrange
        const error = 'Something bad happened';
        const expectedDto = {
            code: 500,
            message: 'Internal Server Error',
            name: 'InternalServerError',
        };
        // Act
        const result = (0, errorService_1.createAppError)(error);
        // Assert
        expect(result).toEqual(expectedDto);
        expect(logErrorSpy).toHaveBeenCalledTimes(2);
        expect(logErrorSpy).toHaveBeenCalledWith('Something bad happened');
        expect(logErrorSpy).toHaveBeenCalledWith('Error: undefined\nStacktrace:\nNo stacktrace available');
    });
});
