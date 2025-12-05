import {
  logInfo,
  logWarn,
  logError,
  logDebug,
  logger
} from '../../../services/loggingService';

describe('Logging Service Integration Tests', () => {
  let infoSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let debugSpy: jest.SpyInstance;

  beforeEach(() => {
    infoSpy = jest.spyOn(logger, 'info').mockImplementation(() => (undefined as any));
    warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => (undefined as any));
    errorSpy = jest.spyOn(logger, 'error').mockImplementation(() => (undefined as any));
    debugSpy = jest.spyOn(logger, 'debug').mockImplementation(() => (undefined as any));
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
    logInfo(message);
    // Assert
    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenCalledWith(message);
  });

  it('should call logger.warn when logWarn is called', () => {
    // Arrange
    const message = 'Test warning message';
    // Act
    logWarn(message);
    // Assert
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(message);
  });

  it('should call logger.error with only the message when no error object is provided', () => {
    // Arrange
    const message = 'Test error message';
    const expectedLog = 'Test error message ';

    // Act
    logError(message); 

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
    logError(message, error);

    // Assert
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(expectedLog);
  });

  it('should call logger.debug when logDebug is called', () => {
    // Arrange
    const message = 'Test debug message';

    // Act
    logDebug(message);

    // Assert
    expect(debugSpy).toHaveBeenCalledTimes(1);
    expect(debugSpy).toHaveBeenCalledWith(message);
  });
});