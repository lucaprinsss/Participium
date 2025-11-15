"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const loggingService_1 = require("../../../services/loggingService");
const loggingService_2 = require("../../../services/loggingService");
describe('Logging Service Integration Tests', () => {
    let infoSpy;
    let warnSpy;
    let errorSpy;
    let debugSpy;
    beforeEach(() => {
        infoSpy = jest.spyOn(loggingService_2.logger, 'info').mockImplementation(() => undefined);
        warnSpy = jest.spyOn(loggingService_2.logger, 'warn').mockImplementation(() => undefined);
        errorSpy = jest.spyOn(loggingService_2.logger, 'error').mockImplementation(() => undefined);
        debugSpy = jest.spyOn(loggingService_2.logger, 'debug').mockImplementation(() => undefined);
    });
    afterEach(() => {
        infoSpy.mockRestore();
        warnSpy.mockRestore();
        errorSpy.mockRestore();
        debugSpy.mockRestore();
    });
    it('should call logger.info when logInfo is called', () => {
        // Arrange
        const message = 'Test info message';
        // Act
        (0, loggingService_1.logInfo)(message);
        // Assert
        expect(infoSpy).toHaveBeenCalledTimes(1);
        expect(infoSpy).toHaveBeenCalledWith(message);
    });
    it('should call logger.warn when logWarn is called', () => {
        // Arrange
        const message = 'Test warning message';
        // Act
        (0, loggingService_1.logWarn)(message);
        // Assert
        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(warnSpy).toHaveBeenCalledWith(message);
    });
    it('should call logger.error with only the message when no error object is provided', () => {
        // Arrange
        const message = 'Test error message';
        const expectedLog = 'Test error message ';
        // Act
        (0, loggingService_1.logError)(message);
        // Assert
        expect(errorSpy).toHaveBeenCalledTimes(1);
        expect(errorSpy).toHaveBeenCalledWith(expectedLog);
    });
    it('should call logger.error with the message and stack when an error object is provided', () => {
        // Arrange
        const message = 'Test error with stack';
        const error = new Error('Something failed');
        error.stack = 'mocked_stack_trace';
        const expectedLog = 'Test error with stack \nStack: mocked_stack_trace';
        // Act
        (0, loggingService_1.logError)(message, error);
        // Assert
        expect(errorSpy).toHaveBeenCalledTimes(1);
        expect(errorSpy).toHaveBeenCalledWith(expectedLog);
    });
    it('should call logger.debug when logDebug is called', () => {
        // Arrange
        const message = 'Test debug message';
        // Act
        (0, loggingService_1.logDebug)(message);
        // Assert
        expect(debugSpy).toHaveBeenCalledTimes(1);
        expect(debugSpy).toHaveBeenCalledWith(message);
    });
});
