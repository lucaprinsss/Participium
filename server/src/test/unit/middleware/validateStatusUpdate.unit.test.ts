import { validateStatusUpdate } from '@middleware/validateStatusUpdate';
import { ReportStatus } from '@dto/ReportStatus';
import { SystemRoles } from '@models/dto/UserRole';
import { InsufficientRightsError } from '@errors/InsufficientRightsError';
import { BadRequestError } from '@errors/BadRequestError';
import type { Request, Response } from 'express';

// Mock isTechnicalStaff
jest.mock('@models/dto/UserRole', () => ({
  SystemRoles: {
    CITIZEN: 'Citizen',
    ADMINISTRATOR: 'Administrator',
    PUBLIC_RELATIONS_OFFICER: 'Municipal Public Relations Officer',
    EXTERNAL_MAINTAINER: 'External Maintainer',
    DEPARTMENT_DIRECTOR: 'Department Director',
  },
  isTechnicalStaff: jest.fn((roleName: string) => {
    const nonTechnicalRoles = [
      'Citizen',
      'Administrator',
      'Municipal Public Relations Officer',
      'External Maintainer',
    ];
    return !nonTechnicalRoles.includes(roleName);
  }),
  isCitizen: jest.fn((roleName: string) => {
    return roleName === 'Citizen';
  }),
}));

describe('validateStatusUpdate Middleware Unit Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      body: {},
      user: undefined,
    };
    mockResponse = {};
    mockNext = jest.fn();
  });

  describe('Request validation', () => {
    it('should reject when newStatus is missing', () => {
      // Arrange
      mockRequest.body = {};
      mockRequest.user = {
        departmentRole: { role: { name: 'Road Maintenance Staff' } },
      };

      // Act
      validateStatusUpdate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toContain('newStatus');
    });

    it('should reject when user is undefined', () => {
      // Arrange
      mockRequest.body = { newStatus: ReportStatus.ASSIGNED };
      mockRequest.user = undefined;

      // Act
      validateStatusUpdate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(InsufficientRightsError));
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toContain('Unable to determine user role');
    });
  });

  describe('ASSIGNED status', () => {
    it('should allow Public Relations Officer to set status to ASSIGNED', () => {
      // Arrange
      mockRequest.body = { newStatus: ReportStatus.ASSIGNED };
      mockRequest.user = {
        departmentRole: {
          role: { name: SystemRoles.PUBLIC_RELATIONS_OFFICER },
        },
      };

      // Act
      validateStatusUpdate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny technical staff from setting status to ASSIGNED', () => {
      // Arrange
      mockRequest.body = { newStatus: ReportStatus.ASSIGNED };
      mockRequest.user = {
        departmentRole: { role: { name: 'Road Maintenance Staff' } },
      };

      // Act
      validateStatusUpdate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(InsufficientRightsError));
    });

    it('should deny Citizen from setting status to ASSIGNED', () => {
      // Arrange
      mockRequest.body = { newStatus: ReportStatus.ASSIGNED };
      mockRequest.user = {
        departmentRole: { role: { name: SystemRoles.CITIZEN } },
      };

      // Act
      validateStatusUpdate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(InsufficientRightsError));
    });
  });

  describe('REJECTED status', () => {
    it('should allow Public Relations Officer to set status to REJECTED', () => {
      // Arrange
      mockRequest.body = { newStatus: ReportStatus.REJECTED };
      mockRequest.user = {
        departmentRole: {
          role: { name: SystemRoles.PUBLIC_RELATIONS_OFFICER },
        },
      };

      // Act
      validateStatusUpdate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny technical staff from setting status to REJECTED', () => {
      // Arrange
      mockRequest.body = { newStatus: ReportStatus.REJECTED };
      mockRequest.user = {
        departmentRole: { role: { name: 'Water Network Staff' } },
      };

      // Act
      validateStatusUpdate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(InsufficientRightsError));
    });
  });

  describe('RESOLVED status', () => {
    it('should allow technical staff to set status to RESOLVED', () => {
      // Arrange
      mockRequest.body = { newStatus: ReportStatus.RESOLVED };
      mockRequest.user = {
        departmentRole: { role: { name: 'Sewer System Staff' } },
      };

      // Act
      validateStatusUpdate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should allow External Maintainer to set status to RESOLVED', () => {
      // Arrange
      mockRequest.body = { newStatus: ReportStatus.RESOLVED };
      mockRequest.user = {
        departmentRole: {
          role: { name: SystemRoles.EXTERNAL_MAINTAINER },
        },
      };

      // Act
      validateStatusUpdate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny Citizen from setting status to RESOLVED', () => {
      // Arrange
      mockRequest.body = { newStatus: ReportStatus.RESOLVED };
      mockRequest.user = {
        departmentRole: { role: { name: SystemRoles.CITIZEN } },
      };

      // Act
      validateStatusUpdate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(InsufficientRightsError));
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toContain('technical staff');
    });

    it('should deny Public Relations Officer from setting status to RESOLVED', () => {
      // Arrange
      mockRequest.body = { newStatus: ReportStatus.RESOLVED };
      mockRequest.user = {
        departmentRole: {
          role: { name: SystemRoles.PUBLIC_RELATIONS_OFFICER },
        },
      };

      // Act
      validateStatusUpdate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(InsufficientRightsError));
    });
  });

  describe('IN_PROGRESS status', () => {
    it('should allow technical staff to set status to IN_PROGRESS', () => {
      // Arrange
      mockRequest.body = { newStatus: ReportStatus.IN_PROGRESS };
      mockRequest.user = {
        departmentRole: { role: { name: 'Road Maintenance Staff' } },
      };

      // Act
      validateStatusUpdate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny Citizen from setting status to IN_PROGRESS', () => {
      // Arrange
      mockRequest.body = { newStatus: ReportStatus.IN_PROGRESS };
      mockRequest.user = {
        departmentRole: { role: { name: SystemRoles.CITIZEN } },
      };

      // Act
      validateStatusUpdate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(InsufficientRightsError));
    });

    it('should deny Public Relations Officer from setting status to IN_PROGRESS', () => {
      // Arrange
      mockRequest.body = { newStatus: ReportStatus.IN_PROGRESS };
      mockRequest.user = {
        departmentRole: {
          role: { name: SystemRoles.PUBLIC_RELATIONS_OFFICER },
        },
      };

      // Act
      validateStatusUpdate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(InsufficientRightsError));
    });
  });

  describe('SUSPENDED status', () => {
    it('should allow technical staff to set status to SUSPENDED', () => {
      // Arrange
      mockRequest.body = { newStatus: ReportStatus.SUSPENDED };
      mockRequest.user = {
        departmentRole: { role: { name: 'Water Network Staff' } },
      };

      // Act
      validateStatusUpdate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny Citizen from setting status to SUSPENDED', () => {
      // Arrange
      mockRequest.body = { newStatus: ReportStatus.SUSPENDED };
      mockRequest.user = {
        departmentRole: { role: { name: SystemRoles.CITIZEN } },
      };

      // Act
      validateStatusUpdate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(InsufficientRightsError));
    });
  });

  describe('Invalid status', () => {
    it('should reject invalid status value', () => {
      // Arrange
      mockRequest.body = { newStatus: 'INVALID_STATUS' };
      mockRequest.user = {
        departmentRole: { role: { name: 'Road Maintenance Staff' } },
      };

      // Act
      validateStatusUpdate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toContain('Invalid report status');
    });

    it('should reject null status', () => {
      // Arrange
      mockRequest.body = { newStatus: null };
      mockRequest.user = {
        departmentRole: { role: { name: 'Road Maintenance Staff' } },
      };

      // Act
      validateStatusUpdate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('should reject undefined status', () => {
      // Arrange
      mockRequest.body = { newStatus: undefined };
      mockRequest.user = {
        departmentRole: { role: { name: 'Road Maintenance Staff' } },
      };

      // Act
      validateStatusUpdate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('should reject empty string status', () => {
      // Arrange
      mockRequest.body = { newStatus: '' };
      mockRequest.user = {
        departmentRole: { role: { name: 'Road Maintenance Staff' } },
      };

      // Act
      validateStatusUpdate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });
  });

  describe('Role and status combinations', () => {
    it('should allow multiple different technical staff roles', () => {
      // Arrange
      const technicalRoles = [
        'Road Maintenance Staff',
        'Sewer System Staff',
        'Water Network Staff',
        'Parks and Gardens Staff',
      ];

      for (const role of technicalRoles) {
        mockNext.mockClear();
        mockRequest.body = { newStatus: ReportStatus.IN_PROGRESS };
        mockRequest.user = { departmentRole: { role: { name: role } } };

        // Act
        validateStatusUpdate(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        // Assert
        expect(mockNext).toHaveBeenCalledWith();
      }
    });

    it('should deny all non-technical, non-PRO, non-External Maintainer roles for ASSIGNED', () => {
      // Arrange
      const nonAllowedRoles = [
        SystemRoles.CITIZEN,
        SystemRoles.ADMINISTRATOR,
        SystemRoles.DEPARTMENT_DIRECTOR,
      ];

      for (const role of nonAllowedRoles) {
        mockNext.mockClear();
        mockRequest.body = { newStatus: ReportStatus.ASSIGNED };
        mockRequest.user = { departmentRole: { role: { name: role } } };

        // Act
        validateStatusUpdate(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        // Assert
        expect(mockNext).toHaveBeenCalledWith(expect.any(InsufficientRightsError));
      }
    });

    it('should allow PUBLIC_RELATIONS_OFFICER and EXTERNAL_MAINTAINER to set ASSIGNED', () => {
      // Arrange
      const allowedRoles = [
        SystemRoles.PUBLIC_RELATIONS_OFFICER,
        SystemRoles.EXTERNAL_MAINTAINER,
      ];

      for (const role of allowedRoles) {
        mockNext.mockClear();
        mockRequest.body = { newStatus: ReportStatus.ASSIGNED };
        mockRequest.user = { departmentRole: { role: { name: role } } };

        // Act
        validateStatusUpdate(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        // Assert
        expect(mockNext).toHaveBeenCalledWith();
      }
    });
  });

  describe('User object variations', () => {
    it('should handle user without departmentRole property', () => {
      // Arrange
      mockRequest.body = { newStatus: ReportStatus.ASSIGNED };
      mockRequest.user = {};

      // Act
      validateStatusUpdate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(InsufficientRightsError));
    });

    it('should handle user with null role', () => {
      // Arrange
      mockRequest.body = { newStatus: ReportStatus.ASSIGNED };
      mockRequest.user = { departmentRole: { role: null } };

      // Act
      validateStatusUpdate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(InsufficientRightsError));
    });

    it('should handle user with undefined role name', () => {
      // Arrange
      mockRequest.body = { newStatus: ReportStatus.ASSIGNED };
      mockRequest.user = { departmentRole: { role: { name: undefined } } };

      // Act
      validateStatusUpdate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(InsufficientRightsError));
    });
  });
});
