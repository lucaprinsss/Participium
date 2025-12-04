import { validateBodyFields } from '@middleware/validateBodyFields';
import { BadRequestError } from '@errors/BadRequestError';
import type { Request, Response, NextFunction } from 'express';

describe('validateBodyFields Middleware Unit Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = { body: {} };
    mockResponse = {};
    mockNext = jest.fn();
  });

  it('should call next() when all required fields are present', () => {
    // Arrange
    mockRequest.body = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'SecurePass123!',
    };
    const middleware = validateBodyFields(['username', 'email', 'password']);

    // Act
    middleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockNext).toHaveBeenCalledWith();
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('should call next with BadRequestError when a required field is missing', () => {
    // Arrange
    mockRequest.body = {
      username: 'testuser',
      email: 'test@example.com',
      // password is missing
    };
    const middleware = validateBodyFields(['username', 'email', 'password']);

    // Act
    middleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('should call next with BadRequestError for the first missing field', () => {
    // Arrange
    mockRequest.body = {
      email: 'test@example.com',
    };
    const middleware = validateBodyFields(['username', 'email', 'password']);

    // Act
    middleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    const error = mockNext.mock.calls[0][0];
    expect(error.message).toContain('username');
  });

  it('should validate single required field', () => {
    // Arrange
    mockRequest.body = { username: 'testuser' };
    const middleware = validateBodyFields(['username']);

    // Act
    middleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should fail when single required field is missing', () => {
    // Arrange
    mockRequest.body = { email: 'test@example.com' };
    const middleware = validateBodyFields(['username']);

    // Act
    middleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
  });

  it('should handle field with falsy value (null)', () => {
    // Arrange
    mockRequest.body = {
      username: 'testuser',
      email: null,
    };
    const middleware = validateBodyFields(['username', 'email']);

    // Act
    middleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
  });

  it('should handle field with falsy value (undefined)', () => {
    // Arrange
    mockRequest.body = {
      username: 'testuser',
      email: undefined,
    };
    const middleware = validateBodyFields(['username', 'email']);

    // Act
    middleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
  });

  it('should handle field with falsy value (empty string)', () => {
    // Arrange
    mockRequest.body = {
      username: 'testuser',
      email: '',
    };
    const middleware = validateBodyFields(['username', 'email']);

    // Act
    middleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
  });

  it('should handle field with falsy value (zero)', () => {
    // Arrange
    mockRequest.body = {
      username: 'testuser',
      amount: 0,
    };
    const middleware = validateBodyFields(['username', 'amount']);

    // Act
    middleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
  });

  it('should handle field with falsy value (false)', () => {
    // Arrange
    mockRequest.body = {
      username: 'testuser',
      isActive: false,
    };
    const middleware = validateBodyFields(['username', 'isActive']);

    // Act
    middleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
  });

  it('should handle empty required fields array', () => {
    // Arrange
    mockRequest.body = { anything: 'value' };
    const middleware = validateBodyFields([]);

    // Act
    middleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should handle empty body with required fields', () => {
    // Arrange
    mockRequest.body = {};
    const middleware = validateBodyFields(['username', 'email']);

    // Act
    middleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
  });

  it('should validate multiple fields in order', () => {
    // Arrange
    mockRequest.body = { email: 'test@example.com' };
    const middleware = validateBodyFields(['username', 'email', 'password']);

    // Act
    middleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    // Should fail on first missing field (username)
    expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    const error = mockNext.mock.calls[0][0];
    expect(error.message).toContain('username');
  });

  it('should allow fields with whitespace', () => {
    // Arrange
    mockRequest.body = {
      username: '  ',
      email: 'test@example.com',
    };
    const middleware = validateBodyFields(['username', 'email']);

    // Act
    middleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    // Whitespace is truthy, so it should pass
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should include field name in error message', () => {
    // Arrange
    mockRequest.body = { username: 'testuser' };
    const fieldName = 'email';
    const middleware = validateBodyFields(['username', fieldName]);

    // Act
    middleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    const error = mockNext.mock.calls[0][0];
    expect(error.message).toContain(fieldName);
  });
});
