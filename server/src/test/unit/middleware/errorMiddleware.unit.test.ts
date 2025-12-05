import { errorHandler } from '@middleware/errorMiddleware';
import type { Request, Response } from 'express';

// Mock the error service
jest.mock('@services/errorService', () => ({
  createAppError: jest.fn((err: any) => {
    if (err instanceof Error && err.name?.includes('Error')) {
      const statusMap: Record<string, number> = {
        BadRequestError: 400,
        UnauthorizedError: 401,
        InsufficientRightsError: 403,
        ConflictError: 409,
        NotFoundError: 404,
      };
      return {
        code: statusMap[err.name] || 500,
        message: err.message,
        name: err.name,
      };
    }
    return {
      code: 500,
      message: err?.message || 'Internal Server Error',
      name: 'InternalServerError',
    };
  }),
}));

describe('errorMiddleware Unit Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    mockRequest = {};
    jsonMock = jest.fn().mockReturnValue(undefined);
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
    };
    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  it('should handle BadRequestError (400)', () => {
    // Arrange
    const testError = new Error('Invalid input');
    testError.name = 'BadRequestError';

    // Act
    errorHandler(
      testError,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalled();
  });

  it('should handle UnauthorizedError (401)', () => {
    // Arrange
    const testError = new Error('Not authenticated');
    testError.name = 'UnauthorizedError';

    // Act
    errorHandler(
      testError,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalled();
  });

  it('should handle InsufficientRightsError (403)', () => {
    // Arrange
    const testError = new Error('Access denied');
    testError.name = 'InsufficientRightsError';

    // Act
    errorHandler(
      testError,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalled();
  });

  it('should handle NotFoundError (404)', () => {
    // Arrange
    const testError = new Error('Resource not found');
    testError.name = 'NotFoundError';

    // Act
    errorHandler(
      testError,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalled();
  });

  it('should handle ConflictError (409)', () => {
    // Arrange
    const testError = new Error('Resource already exists');
    testError.name = 'ConflictError';

    // Act
    errorHandler(
      testError,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(statusMock).toHaveBeenCalledWith(409);
    expect(jsonMock).toHaveBeenCalled();
  });

  it('should handle unknown errors with 500 status', () => {
    // Arrange
    const testError = new Error('Something went wrong');

    // Act
    errorHandler(
      testError,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalled();
  });

  it('should include error message in response', () => {
    // Arrange
    const errorMessage = 'Missing required field';
    const testError = new Error(errorMessage);
    testError.name = 'BadRequestError';

    // Act
    errorHandler(
      testError,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(jsonMock).toHaveBeenCalled();
    const response = jsonMock.mock.calls[0][0];
    expect(response.message).toBe(errorMessage);
  });

  it('should handle errors without message', () => {
    // Arrange
    const testError = new Error('error without specific message');
    testError.name = 'UnauthorizedError';

    // Act
    errorHandler(
      testError,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalled();
  });

  it('should handle null or undefined errors', () => {
    // Arrange
    const testError = null;

    // Act
    errorHandler(
      testError,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalled();
  });

  it('should call response.status before response.json', () => {
    // Arrange
    const testError = new Error('Bad request');
    testError.name = 'BadRequestError';
    const callOrder: string[] = [];
    
    statusMock.mockImplementation((code) => {
      callOrder.push('status');
      return { json: () => callOrder.push('json') };
    });

    // Act
    errorHandler(
      testError,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(callOrder).toEqual(['status', 'json']);
  });
});
