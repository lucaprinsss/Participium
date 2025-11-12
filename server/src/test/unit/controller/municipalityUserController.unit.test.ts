import { Request, Response, NextFunction } from 'express';
import municipalityUserController from '@controllers/municipalityUserController';
import { municipalityUserService } from '@services/municipalityUserService';
import { UserRole } from '@models/dto/UserRole';
import { BadRequestError } from '@models/errors/BadRequestError';
import { NotFoundError } from '@models/errors/NotFoundError';

// Mock del service
jest.mock('@services/municipalityUserService');

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
        role: UserRole.MUNICIPAL_ADMINISTRATOR,
      };

      const expectedResponse = {
        id: 1,
        username: 'municipality_user',
        email: 'municipality@test.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.MUNICIPAL_ADMINISTRATOR,
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

    it('should return 400 when required fields are missing', async () => {
      // Arrange
      mockRequest.body = {
        username: 'test',
        // email mancante
        password: 'Password123!',
      };

      // Act
      await municipalityUserController.createMunicipalityUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'All fields are required: username, email, password, first_name, last_name, role',
        })
      );
      expect(municipalityUserService.createMunicipalityUser).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      // Arrange
      const requestData = {
        username: 'municipality_user',
        email: 'municipality@test.com',
        password: 'Password123!',
        first_name: 'John',
        last_name: 'Doe',
        role: UserRole.CITIZEN, // Ruolo non valido
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
          role: UserRole.MUNICIPAL_ADMINISTRATOR,
        },
        {
          id: 2,
          username: 'user2',
          email: 'user2@test.com',
          firstName: 'Jane',
          lastName: 'Smith',
          role: UserRole.TECHNICAL_OFFICE_STAFF_MEMBER,
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
        role: UserRole.MUNICIPAL_ADMINISTRATOR,
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

    it('should return 400 for invalid ID', async () => {
      // Arrange
      mockRequest.params = { id: 'invalid' };

      // Act
      await municipalityUserController.getMunicipalityUserById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid user ID',
        })
      );
      expect(municipalityUserService.getMunicipalityUserById).not.toHaveBeenCalled();
    });

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
        role: UserRole.INFRASTRUCTURE_MANAGER,
      };

      const expectedResponse = {
        id: 1,
        username: 'municipality_user',
        email: 'updated@test.com',
        firstName: 'UpdatedName',
        lastName: 'UpdatedLastName',
        role: UserRole.INFRASTRUCTURE_MANAGER,
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
        firstName: 'UpdatedName',
        lastName: 'UpdatedLastName',
        email: 'updated@test.com',
        role: UserRole.INFRASTRUCTURE_MANAGER,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 when no fields provided for update', async () => {
      // Arrange
      mockRequest.params = { id: '1' };
      mockRequest.body = {}; // Nessun campo da aggiornare

      // Act
      await municipalityUserController.updateMunicipalityUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'At least one field must be provided for update',
        })
      );
      expect(municipalityUserService.updateMunicipalityUser).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid ID', async () => {
      // Arrange
      mockRequest.params = { id: 'invalid' };
      mockRequest.body = { first_name: 'Test' };

      // Act
      await municipalityUserController.updateMunicipalityUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid user ID',
        })
      );
      expect(municipalityUserService.updateMunicipalityUser).not.toHaveBeenCalled();
    });

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
        role: UserRole.MUNICIPAL_ADMINISTRATOR,
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

    it('should return 400 for invalid ID', async () => {
      // Arrange
      mockRequest.params = { id: 'invalid' };

      // Act
      await municipalityUserController.deleteMunicipalityUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid user ID',
        })
      );
      expect(municipalityUserService.deleteMunicipalityUser).not.toHaveBeenCalled();
    });

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
      const newRole = UserRole.URBAN_PLANNING_MANAGER;
      const expectedResponse = {
        id: 1,
        username: 'municipality_user',
        email: 'municipality@test.com',
        firstName: 'John',
        lastName: 'Doe',
        role: newRole,
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = { role: newRole };
      (municipalityUserService.assignRole as jest.Mock).mockResolvedValue(expectedResponse);

      // Act
      await municipalityUserController.assignRole(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(municipalityUserService.assignRole).toHaveBeenCalledWith(1, newRole);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 when role is missing', async () => {
      // Arrange
      mockRequest.params = { id: '1' };
      mockRequest.body = {}; // Role mancante

      // Act
      await municipalityUserController.assignRole(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Role is required',
        })
      );
      expect(municipalityUserService.assignRole).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid ID', async () => {
      // Arrange
      mockRequest.params = { id: 'invalid' };
      mockRequest.body = { role: UserRole.MUNICIPAL_ADMINISTRATOR };

      // Act
      await municipalityUserController.assignRole(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid user ID',
        })
      );
      expect(municipalityUserService.assignRole).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid role value', async () => {
      // Arrange
      mockRequest.params = { id: '1' };
      mockRequest.body = { role: 'InvalidRole' };

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
      expect(municipalityUserService.assignRole).not.toHaveBeenCalled();
    });
  });

  describe('getAllRoles', () => {
    it('should return all municipality roles', async () => {
      // Arrange
      const expectedRoles = [
        UserRole.MUNICIPAL_PUBLIC_RELATIONS_OFFICER,
        UserRole.MUNICIPAL_ADMINISTRATOR,
        UserRole.TECHNICAL_OFFICE_STAFF_MEMBER,
        UserRole.URBAN_PLANNING_MANAGER,
        UserRole.PRIVATE_BUILDING_MANAGER,
        UserRole.INFRASTRUCTURE_MANAGER,
        UserRole.MAINTENANCE_STAFF_MEMBER,
        UserRole.PUBLIC_GREEN_SPACES_MANAGER,
      ];

      // Act
      await municipalityUserController.getAllRoles(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.arrayContaining(expectedRoles));
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should not include Citizen or Administrator roles', async () => {
      // Act
      await municipalityUserController.getAllRoles(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      const calledRoles = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(calledRoles).not.toContain(UserRole.CITIZEN);
      expect(calledRoles).not.toContain(UserRole.ADMINISTRATOR);
    });

    it('should handle errors', async () => {
      // Arrange
      // Forziamo un errore mockando RoleUtils
      const error = new Error('Internal error');
      jest.spyOn(mockResponse as any, 'json').mockImplementationOnce(() => {
        throw error;
      });

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
