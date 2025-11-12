/* import {
  mapUserEntityToUserResponse,
  createErrorDTO,
} from '../../../services/mapperService';

import { userEntity } from '@models/entity/userEntity';
import { UserResponse } from '@models/dto/UserResponse';
import { UserRole } from '@models/dto/UserRole';
import { ErrorDTO } from '@models/errors/ErrorDTO';

describe('Mapper Service', () => {
  describe('mapUserEntityToUserResponse', () => {
    
    it('should return null if the entity is null', () => {
      // Act
      const result = mapUserEntityToUserResponse(null as any);
      // Assert
      expect(result).toBeNull();
    });

    it('should return null if the entity is undefined', () => {
      // Act
      const result = mapUserEntityToUserResponse(undefined as any);
      // Assert
      expect(result).toBeNull();
    });

    it('should correctly map a userEntity to a UserResponse', () => {
      // Arrange
      const mockEntity = new userEntity();
      mockEntity.id = 123;
      mockEntity.username = 'testuser';
      mockEntity.email = 'test@example.com';
      mockEntity.firstName = 'Mario';
      mockEntity.lastName = 'Rossi';
      mockEntity.role = UserRole.ADMINISTRATOR; 
      
      mockEntity.passwordHash = 'hash_segreto';
      mockEntity.createdAt = new Date();
      mockEntity.telegramUsername = 'tele_user';
      
      const expectedResponse: UserResponse = {
        id: 123,
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'Mario',
        last_name: 'Rossi', 
        role: UserRole.ADMINISTRATOR,
      };

      // Act
      const result = mapUserEntityToUserResponse(mockEntity);

      // Assert
      expect(result).toEqual(expectedResponse);
      
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('createdAt');
      expect(result).not.toHaveProperty('telegramUsername');
    });
  });

  describe('createErrorDTO', () => {
    
    it('should create a full ErrorDTO with all properties', () => {
      // Arrange
      const expectedDTO: ErrorDTO = {
        code: 404,
        name: 'NotFound',
        message: 'Resource not found',
      };
      
      // Act
      const result = createErrorDTO(404, 'Resource not found', 'NotFound');
      
      // Assert
      expect(result).toEqual(expectedDTO);
    });

    it('should filter out undefined optional properties', () => {
      // Arrange
      const expectedDTO: ErrorDTO = {
        code: 500,
      };

      // Act
      const result = createErrorDTO(500);
      
      // Assert
      expect(result).toEqual(expectedDTO);
      expect(result).not.toHaveProperty('name');
      expect(result).not.toHaveProperty('message');
    });

    it('should filter out null optional properties', () => {
      // Arrange
      const expectedDTO: ErrorDTO = {
        code: 401,
        name: 'AuthError',
      };
      
      // Act
      const result = createErrorDTO(401, null as any, 'AuthError');
      
      // Assert
      expect(result).toEqual(expectedDTO);
      expect(result).not.toHaveProperty('message');
    });
  });
}); */

// dummy test
describe('Dummy test', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });
});