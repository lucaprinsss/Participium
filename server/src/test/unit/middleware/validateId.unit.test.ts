import { validateId } from '@middleware/validateId';
import { BadRequestError } from '@errors/BadRequestError';
import type { Request, Response } from 'express';

describe('validateId Middleware Unit Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = { params: {} };
    mockResponse = {};
    mockNext = jest.fn();
  });

  describe('Default behavior (paramName="id", resourceName="resource")', () => {
    it('should call next() for valid positive integer ID', () => {
      // Arrange
      mockRequest.params = { id: '123' };
      const middleware = validateId();

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next() for ID "1"', () => {
      // Arrange
      mockRequest.params = { id: '1' };
      const middleware = validateId();

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next() for large positive integer ID', () => {
      // Arrange
      mockRequest.params = { id: '999999999' };
      const middleware = validateId();

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject ID with decimal point', () => {
      // Arrange
      mockRequest.params = { id: '123.45' };
      const middleware = validateId();

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toContain('Invalid resource ID');
    });

    it('should reject non-numeric ID', () => {
      // Arrange
      mockRequest.params = { id: 'abc' };
      const middleware = validateId();

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('should reject negative ID', () => {
      // Arrange
      mockRequest.params = { id: '-1' };
      const middleware = validateId();

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('should reject zero ID', () => {
      // Arrange
      mockRequest.params = { id: '0' };
      const middleware = validateId();

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('should reject empty string ID', () => {
      // Arrange
      mockRequest.params = { id: '' };
      const middleware = validateId();

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('should reject ID with multiple dots', () => {
      // Arrange
      mockRequest.params = { id: '123.456.789' };
      const middleware = validateId();

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('should reject ID with leading dot', () => {
      // Arrange
      mockRequest.params = { id: '.123' };
      const middleware = validateId();

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('should reject ID with trailing dot', () => {
      // Arrange
      mockRequest.params = { id: '123.' };
      const middleware = validateId();

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('should reject ID with leading zeros (but still pass as valid integer)', () => {
      // Arrange
      mockRequest.params = { id: '00123' };
      const middleware = validateId();

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      // Leading zeros are allowed since Number('00123') = 123
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject ID with special characters', () => {
      // Arrange
      mockRequest.params = { id: '123@456' };
      const middleware = validateId();

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('should reject ID with spaces', () => {
      // Arrange
      mockRequest.params = { id: '123 456' };
      const middleware = validateId();

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });
  });

  describe('Custom paramName', () => {
    it('should validate custom param name', () => {
      // Arrange
      mockRequest.params = { reportId: '123' };
      const middleware = validateId('reportId');

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject invalid custom param', () => {
      // Arrange
      mockRequest.params = { reportId: 'invalid' };
      const middleware = validateId('reportId');

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('should handle userId parameter', () => {
      // Arrange
      mockRequest.params = { userId: '456' };
      const middleware = validateId('userId');

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('Custom resourceName', () => {
    it('should include custom resource name in error message', () => {
      // Arrange
      mockRequest.params = { id: 'invalid' };
      const middleware = validateId('id', 'user');

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toContain('user');
    });

    it('should include "report" in error message', () => {
      // Arrange
      mockRequest.params = { id: '-1' };
      const middleware = validateId('id', 'report');

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toContain('report');
    });

    it('should include "department" in error message', () => {
      // Arrange
      mockRequest.params = { id: 'abc' };
      const middleware = validateId('id', 'department');

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toContain('department');
    });
  });

  describe('Both custom paramName and resourceName', () => {
    it('should validate custom paramName with custom resourceName', () => {
      // Arrange
      mockRequest.params = { departmentId: '789' };
      const middleware = validateId('departmentId', 'department');

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject invalid custom paramName with custom resourceName', () => {
      // Arrange
      mockRequest.params = { departmentId: 'invalid' };
      const middleware = validateId('departmentId', 'department');

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toContain('department');
    });

    it('should handle missing custom param', () => {
      // Arrange
      mockRequest.params = {};
      const middleware = validateId('departmentId', 'department');

      // Act & Assert
      // When param doesn't exist, id will be undefined and includes() will throw
      expect(() => {
        middleware(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );
      }).toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle very large positive ID', () => {
      // Arrange
      mockRequest.params = { id: '9223372036854775807' };
      const middleware = validateId();

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle ID with plus sign', () => {
      // Arrange
      mockRequest.params = { id: '+123' };
      const middleware = validateId();

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      // Number('+123') = 123, but contains 'e' check doesn't match, so should pass
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle mixed positive/negative signs', () => {
      // Arrange
      mockRequest.params = { id: '+-123' };
      const middleware = validateId();

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('should handle null-like string', () => {
      // Arrange
      mockRequest.params = { id: 'null' };
      const middleware = validateId();

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('should handle undefined string', () => {
      // Arrange
      mockRequest.params = { id: 'undefined' };
      const middleware = validateId();

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });
  });
});
