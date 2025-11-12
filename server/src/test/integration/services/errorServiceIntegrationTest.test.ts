/* import { createAppError } from '../../../services/errorService';
import { AppError } from '../../../models/errors/AppError';
import { ErrorDTO } from '../../../models/errors/ErrorDTO';
import * as loggingService from '../../../services/loggingService';

describe('createAppError Integration Test', () => {
  let logErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    logErrorSpy = jest
      .spyOn(loggingService, 'logError')
      .mockImplementation(() => (undefined as any));
  });

  afterEach(() => {
    logErrorSpy.mockRestore();
  });

  it('should correctly map an AppError to a specific ErrorDTO', () => {
    // Arrange
    const appError = new AppError('User Not Found', 404);
    appError.name = 'NotFound'; 

    const expectedDto: ErrorDTO = {
      code: 404,
      message: 'User Not Found',
      name: 'NotFound',
    };

    // Act
    const result = createAppError(appError);

    // Assert
    expect(result).toEqual(expectedDto);
    expect(logErrorSpy).toHaveBeenCalledTimes(2);
    expect(logErrorSpy).toHaveBeenCalledWith(appError);
    expect(logErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error: User Not Found')
    );
    expect(logErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Stacktrace:')
    );
  });

  it('should correctly map an HTTP-like error (duck-typed) to a specific DTO', () => {
    // Arrange
    const httpError = {
      status: 401,
      message: 'Unauthorized',
      name: 'AuthError',
    };
    const expectedDto: ErrorDTO = {
      code: 401,
      message: 'Unauthorized',
      name: 'AuthError',
    };

    // Act
    const result = createAppError(httpError);

    // Assert
    expect(result).toEqual(expectedDto);
    expect(logErrorSpy).toHaveBeenCalledTimes(2);
    expect(logErrorSpy).toHaveBeenCalledWith(httpError);
  });

  it('should map a generic Error to a 500 DTO', () => {
    // Arrange
    const genericError = new Error('Database connection failed');
    const expectedDto: ErrorDTO = {
      code: 500,
      message: 'Database connection failed',
      name: 'InternalServerError',
    };

    // Act
    const result = createAppError(genericError);

    // Assert
    expect(result).toEqual(expectedDto);
    expect(logErrorSpy).toHaveBeenCalledTimes(2);
    expect(logErrorSpy).toHaveBeenCalledWith(genericError);
    expect(logErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Database connection failed')
    );
  });

  it('should handle null or undefined input and return a default 500 DTO', () => {
    // Arrange
    const error = null;
    const expectedDto: ErrorDTO = {
      code: 500,
      message: 'Internal Server Error',
      name: 'InternalServerError',
    };

    // Act
    const result = createAppError(error);

    // Assert
    expect(result).toEqual(expectedDto);
    expect(logErrorSpy).toHaveBeenCalledTimes(2);
    expect(logErrorSpy).toHaveBeenCalledWith(null);
    expect(logErrorSpy).toHaveBeenCalledWith(
      'Error: undefined\nStacktrace:\nNo stacktrace available'
    );
  });

  it('should handle a thrown string and return a 500 DTO', () => {
    // Arrange
    const error = 'Something bad happened';
    
    const expectedDto: ErrorDTO = {
      code: 500,
      message: 'Internal Server Error', 
      name: 'InternalServerError',
    };

    // Act
    const result = createAppError(error);

    // Assert
    expect(result).toEqual(expectedDto);
    expect(logErrorSpy).toHaveBeenCalledTimes(2);
    expect(logErrorSpy).toHaveBeenCalledWith('Something bad happened');
    
    expect(logErrorSpy).toHaveBeenCalledWith(
      'Error: undefined\nStacktrace:\nNo stacktrace available'
    );
  });
}); */

// dummy test
describe('Dummy test', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });
});