import { isLoggedIn, requireRole, requireTechnicalStaffOrRole } from '@middleware/authMiddleware';
import { UnauthorizedError } from '@errors/UnauthorizedError';
import { InsufficientRightsError } from '@errors/InsufficientRightsError';
import type { Request, Response } from 'express';

describe('authMiddleware Unit Tests', () => {
  let mockRequest: any;
  let mockResponse: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      isAuthenticated: jest.fn().mockReturnValue(false),
      user: undefined,
    };
    mockResponse = {};
    mockNext = jest.fn();
  });

  describe('isLoggedIn', () => {
    it('should call next() when user is authenticated', () => {
      // Arrange
      mockRequest.isAuthenticated.mockReturnValue(true);

      // Act
      isLoggedIn(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should pass UnauthorizedError to next when user is not authenticated', () => {
      // Arrange
      const isAuthMock = mockRequest.isAuthenticated as jest.Mock;
      isAuthMock.mockReturnValue(false);

      // Act
      isLoggedIn(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('requireRole', () => {
    it('should allow access when user is authenticated and has required role (string)', () => {
      // Arrange
      const requiredRole = 'Administrator';
      const middleware = requireRole(requiredRole);
      mockRequest.isAuthenticated.mockReturnValue(true);
      mockRequest.user = {
        departmentRole: {
          role: { name: 'Administrator' },
        },
      };

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should allow access when user is authenticated and has required role (array)', () => {
      // Arrange
      const requiredRoles = ['Administrator', 'Citizen'];
      const middleware = requireRole(requiredRoles);
      mockRequest.isAuthenticated.mockReturnValue(true);
      mockRequest.user = {
        departmentRole: {
          role: { name: 'Citizen' },
        },
      };

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny access when user has insufficient rights', () => {
      // Arrange
      const requiredRole = 'Administrator';
      const middleware = requireRole(requiredRole);
      mockRequest.isAuthenticated.mockReturnValue(true);
      mockRequest.user = {
        departmentRole: {
          role: { name: 'Citizen' },
        },
      };

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(InsufficientRightsError));
    });

    it('should deny access when user is not authenticated', () => {
      // Arrange
      const requiredRole = 'Administrator';
      const middleware = requireRole(requiredRole);
      mockRequest.isAuthenticated.mockReturnValue(false);

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should deny access when user has no role assigned', () => {
      // Arrange
      const requiredRole = 'Administrator';
      const middleware = requireRole(requiredRole);
      mockRequest.isAuthenticated.mockReturnValue(true);
      mockRequest.user = { departmentRole: null };

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(InsufficientRightsError));
    });

    it('should deny access when none of the required roles match', () => {
      // Arrange
      const requiredRoles = ['Administrator', 'Supervisor'];
      const middleware = requireRole(requiredRoles);
      mockRequest.isAuthenticated.mockReturnValue(true);
      mockRequest.user = {
        departmentRole: {
          role: { name: 'Citizen' },
        },
      };

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(InsufficientRightsError));
    });

    it('should deny access when user object is undefined', () => {
      // Arrange
      const requiredRole = 'Administrator';
      const middleware = requireRole(requiredRole);
      mockRequest.isAuthenticated.mockReturnValue(true);
      mockRequest.user = undefined;

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(InsufficientRightsError));
    });
  });

  describe('requireTechnicalStaffOrRole', () => {
    it('should allow technical staff user to access', () => {
      // Arrange
      const middleware = requireTechnicalStaffOrRole();
      mockRequest.isAuthenticated.mockReturnValue(true);
      mockRequest.user = {
        departmentRole: {
          role: { name: 'Road Maintenance Staff' },
        },
      };

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should allow user with additional allowed role', () => {
      // Arrange
      const additionalRoles = ['Public Relations Officer'];
      const middleware = requireTechnicalStaffOrRole(additionalRoles);
      mockRequest.isAuthenticated.mockReturnValue(true);
      mockRequest.user = {
        departmentRole: {
          role: { name: 'Public Relations Officer' },
        },
      };

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny access when user is not technical staff and not in additional roles', () => {
      // Arrange
      const additionalRoles = ['Public Relations Officer'];
      const middleware = requireTechnicalStaffOrRole(additionalRoles);
      mockRequest.isAuthenticated.mockReturnValue(true);
      mockRequest.user = {
        departmentRole: {
          role: { name: 'Citizen' },
        },
      };

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(InsufficientRightsError));
    });

    it('should deny access when user is not authenticated', () => {
      // Arrange
      const middleware = requireTechnicalStaffOrRole();
      mockRequest.isAuthenticated.mockReturnValue(false);

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should deny access when user has no role assigned', () => {
      // Arrange
      const middleware = requireTechnicalStaffOrRole();
      mockRequest.isAuthenticated.mockReturnValue(true);
      mockRequest.user = { departmentRole: null };

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(InsufficientRightsError));
    });

    it('should allow SystemRoles.PUBLIC_RELATIONS_OFFICER via additional roles', () => {
      // Arrange
      const additionalRoles = ['Public Relations Officer'];
      const middleware = requireTechnicalStaffOrRole(additionalRoles);
      mockRequest.isAuthenticated.mockReturnValue(true);
      mockRequest.user = {
        departmentRole: {
          role: { name: 'Public Relations Officer' },
        },
      };

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should allow with empty additional roles if user is technical staff', () => {
      // Arrange
      const middleware = requireTechnicalStaffOrRole([]);
      mockRequest.isAuthenticated.mockReturnValue(true);
      mockRequest.user = {
        departmentRole: {
          role: { name: 'Sewer System Staff' },
        },
      };

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should work with multiple additional roles', () => {
      // Arrange
      const additionalRoles = ['Public Relations Officer', 'Administrator'];
      const middleware = requireTechnicalStaffOrRole(additionalRoles);
      mockRequest.isAuthenticated.mockReturnValue(true);
      mockRequest.user = {
        departmentRole: {
          role: { name: 'Administrator' },
        },
      };

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
});
