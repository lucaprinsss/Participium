import { Request, Response, NextFunction } from 'express';
import municipalityUserController from '@controllers/municipalityUserController';
import { municipalityUserService } from '@services/municipalityUserService';
import { BadRequestError } from '@models/errors/BadRequestError';
import { NotFoundError } from '@models/errors/NotFoundError';
import { RoleUtils } from '@utils/roleUtils';

// Mock del service
jest.mock('@services/municipalityUserService');
jest.mock('@utils/roleUtils');

describe('MunicipalityUserController Unit Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Reset dei mock prima di ogni test
    jest.clearAllMocks();

    // Setup mock request
    mockRequest = {
      body: {},
      params: {},
    };

    // Setup mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    // Setup mock next
    mockNext = jest.fn();
  });

  describe('createMunicipalityUser', () => {
    it('should create municipality user successfully', async () => {
      // Arrange
      const requestData = {
        username: 'municipality_user',
        email: 'municipality@test.com',
        password: 'Password123!',
        first_name: 'John',
        last_name: 'Doe',
        role_name: 'Municipal Administrator',
      };

      const expectedResponse = {
        id: 1,
        username: 'municipality_user',
        email: 'municipality@test.com',
        firstName: 'John',
        lastName: 'Doe',
        role_name: 'Municipal Administrator',
      };

      mockRequest.body = requestData;
      (municipalityUserService.createMunicipalityUser as jest.Mock).mockResolvedValue(expectedResponse);

      // Act
      await municipalityUserController.createMunicipalityUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(municipalityUserService.createMunicipalityUser).toHaveBeenCalledWith(requestData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      // Arrange
      const requestData = {
        username: 'municipality_user',
        email: 'municipality@test.com',
        password: 'Password123!',
        first_name: 'John',
        last_name: 'Doe',
        role_name: 'Citizen', // Ruolo non valido
      };

      mockRequest.body = requestData;
      const error = new BadRequestError('Cannot create a municipality user with Citizen role');
      (municipalityUserService.createMunicipalityUser as jest.Mock).mockRejectedValue(error);

      // Act
      await municipalityUserController.createMunicipalityUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getAllMunicipalityUsers', () => {
    it('should return all municipality users', async () => {
      // Arrange
      const expectedUsers = [
        {
          id: 1,
          username: 'user1',
          email: 'user1@test.com',
          firstName: 'John',
          lastName: 'Doe',
          role_name: 'Municipal Administrator',
        },
        {
          id: 2,
          username: 'user2',
          email: 'user2@test.com',
          firstName: 'Jane',
          lastName: 'Smith',
          role_name: 'Technical Office Staff Member',
        },
      ];

      (municipalityUserService.getAllMunicipalityUsers as jest.Mock).mockResolvedValue(expectedUsers);

      // Act
      await municipalityUserController.getAllMunicipalityUsers(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(municipalityUserService.getAllMunicipalityUsers).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedUsers);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      // Arrange
      const error = new Error('Database error');
      (municipalityUserService.getAllMunicipalityUsers as jest.Mock).mockRejectedValue(error);

      // Act
      await municipalityUserController.getAllMunicipalityUsers(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getMunicipalityUserById', () => {
    it('should return municipality user by valid ID', async () => {
      // Arrange
      const expectedUser = {
        id: 1,
        username: 'municipality_user',
        email: 'municipality@test.com',
        firstName: 'John',
        lastName: 'Doe',
        role_name: 'Municipal Administrator',
      };

      mockRequest.params = { id: '1' };
      (municipalityUserService.getMunicipalityUserById as jest.Mock).mockResolvedValue(expectedUser);

      // Act
      await municipalityUserController.getMunicipalityUserById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(municipalityUserService.getMunicipalityUserById).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedUser);
      expect(mockNext).not.toHaveBeenCalled();
    });

    // ID validation test removed - validation is now handled by validateId middleware

    it('should handle not found error', async () => {
      // Arrange
      mockRequest.params = { id: '999' };
      const error = new NotFoundError('User not found');
      (municipalityUserService.getMunicipalityUserById as jest.Mock).mockRejectedValue(error);

      // Act
      await municipalityUserController.getMunicipalityUserById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateMunicipalityUser', () => {
    it('should update municipality user successfully', async () => {
      // Arrange
      const updateData = {
        first_name: 'UpdatedName',
        last_name: 'UpdatedLastName',
        email: 'updated@test.com',
        role_name: 'Infrastructure Manager',
      };

      const expectedResponse = {
        id: 1,
        username: 'municipality_user',
        email: 'updated@test.com',
        firstName: 'UpdatedName',
        lastName: 'UpdatedLastName',
        role_name: 'Infrastructure Manager',
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      (municipalityUserService.updateMunicipalityUser as jest.Mock).mockResolvedValue(expectedResponse);

      // Act
      await municipalityUserController.updateMunicipalityUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(municipalityUserService.updateMunicipalityUser).toHaveBeenCalledWith(1, {
        first_name: 'UpdatedName',
        last_name: 'UpdatedLastName',
        email: 'updated@test.com',
        role_name: 'Infrastructure Manager',
        department_name: undefined,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      expect(mockNext).not.toHaveBeenCalled();
    });

    // ID validation test removed - validation is now handled by validateId middleware

    it('should update only provided fields', async () => {
      // Arrange
      const updateData = {
        email: 'newemail@test.com',
      };

      const expectedResponse = {
        id: 1,
        username: 'municipality_user',
        email: 'newemail@test.com',
        firstName: 'John',
        lastName: 'Doe',
        role_name: 'Municipal Administrator',
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      (municipalityUserService.updateMunicipalityUser as jest.Mock).mockResolvedValue(expectedResponse);

      // Act
      await municipalityUserController.updateMunicipalityUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(municipalityUserService.updateMunicipalityUser).toHaveBeenCalledWith(1, {
        email: 'newemail@test.com',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
    });

    it('should handle not found error when updating', async () => {
      // Arrange
      const updateData = {
        email: 'newemail@test.com',
      };

      mockRequest.params = { id: '999' }; // Non-existent user ID
      mockRequest.body = updateData;
      const error = new NotFoundError('User not found');
      (municipalityUserService.updateMunicipalityUser as jest.Mock).mockRejectedValue(error);

      // Act
      await municipalityUserController.updateMunicipalityUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(municipalityUserService.updateMunicipalityUser).toHaveBeenCalledWith(999, updateData);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteMunicipalityUser', () => {
    it('should delete municipality user successfully', async () => {
      // Arrange
      mockRequest.params = { id: '1' };
      (municipalityUserService.deleteMunicipalityUser as jest.Mock).mockResolvedValue(undefined);

      // Act
      await municipalityUserController.deleteMunicipalityUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(municipalityUserService.deleteMunicipalityUser).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    // ID validation test removed - validation is now handled by validateId middleware

    it('should handle not found error', async () => {
      // Arrange
      mockRequest.params = { id: '999' };
      const error = new NotFoundError('User not found');
      (municipalityUserService.deleteMunicipalityUser as jest.Mock).mockRejectedValue(error);

      // Act
      await municipalityUserController.deleteMunicipalityUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('assignRole', () => {
    it('should assign role successfully', async () => {
      // Arrange
      const newRole = 'Urban Planning Manager';
      const expectedResponse = {
        id: 1,
        username: 'municipality_user',
        email: 'municipality@test.com',
        firstName: 'John',
        lastName: 'Doe',
        role_name: newRole,
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = { role_name: newRole };
      (municipalityUserService.assignRole as jest.Mock).mockResolvedValue(expectedResponse);

      // Act
      await municipalityUserController.assignRole(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(municipalityUserService.assignRole).toHaveBeenCalledWith(1, newRole, undefined);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      expect(mockNext).not.toHaveBeenCalled();
    });

    // ID validation test removed - validation is now handled by validateId middleware

    it('should return 400 for invalid role value', async () => {
      // Arrange
      mockRequest.params = { id: '1' };
      mockRequest.body = { role_name: 'InvalidRole' };
      
      // Mock service per simulare errore
      (municipalityUserService.assignRole as jest.Mock).mockRejectedValueOnce(
        new BadRequestError('Invalid role specified')
      );

      // Act
      await municipalityUserController.assignRole(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid role specified',
        })
      );
      expect(municipalityUserService.assignRole).toHaveBeenCalled();
    });
  });

  describe('getAllRoles', () => {
    it('should return all municipality roles', async () => {
      // Arrange
      const expectedRoles = [
        'Civil Engineer',
        'Department Director',
        'Water Network staff member',
        'Parks Maintenance staff member',
      ];
      
      (RoleUtils.getAllMunicipalityRoles as jest.Mock).mockResolvedValueOnce(expectedRoles);

      // Act
      await municipalityUserController.getAllRoles(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedRoles);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should not include Citizen or Administrator roles', async () => {
      // Arrange
      const municipalityRoles = [
        'Civil Engineer',
        'Department Director',
        'Water Network staff member',
      ];
      
      (RoleUtils.getAllMunicipalityRoles as jest.Mock).mockResolvedValueOnce(municipalityRoles);
      
      // Act
      await municipalityUserController.getAllRoles(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      const calledRoles = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(calledRoles).not.toContain('Citizen');
      expect(calledRoles).not.toContain('Administrator');
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Internal error');
      (RoleUtils.getAllMunicipalityRoles as jest.Mock).mockRejectedValueOnce(error);

      // Act
      await municipalityUserController.getAllRoles(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
