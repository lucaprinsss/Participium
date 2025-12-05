import { authService } from '../../../services/authService';
import { UserEntity } from '../../../models/entity/userEntity';
import { UserResponse } from '../../../models/dto/output/UserResponse';
import { createMockMunicipalityUser, createMockCitizen } from '@test/utils/mockEntities';

describe('AuthService Integration Tests', () => {
  let mockUserEntity: UserEntity;
  let expectedDtoResponse: UserResponse;

  beforeEach(() => {
    const creationDate = new Date('2023-01-01T12:00:00Z');

    mockUserEntity = createMockMunicipalityUser('Administrator', 'Administration', {
      id: 123,
      username: 'testuser',
      firstName: 'Mario',
      lastName: 'Rossi',
      email: 'mario.rossi@example.com',
      personalPhotoUrl: 'http://example.com/photo.jpg',
      telegramUsername: '@mariorossi',
      emailNotificationsEnabled: true,
      createdAt: creationDate,
    });
    mockUserEntity.passwordHash = 'hash_super_segreto_da_nascondere';

    expectedDtoResponse = {
      id: 123,
      username: 'testuser',
      email: 'mario.rossi@example.com',
      first_name: 'Mario',
      last_name: 'Rossi',
      role_name: 'Administrator',
      department_name: 'Administration',
    };
  });

  it('should correctly map a full user entity to a public UserResponse DTO', () => {
    // Arrange
    const expressUser: Express.User = mockUserEntity;

    // Act
    const result = authService.createUserResponse(expressUser);

    // Assert
    expect(result).toEqual(expectedDtoResponse);

    expect(result).not.toHaveProperty('passwordHash');
    expect(result).not.toHaveProperty('createdAt');
    expect(result).not.toHaveProperty('personalPhotoUrl');
    expect(result).not.toHaveProperty('telegramUsername');
    expect(result).not.toHaveProperty('emailNotificationsEnabled');

    expect(result).not.toHaveProperty('firstName');
    expect(result).not.toHaveProperty('lastName');
    expect(result).toHaveProperty('first_name');
    expect(result).toHaveProperty('last_name');
  });

  it('should map a different role (e.g., Citizen) correctly', () => {
    // Arrange
    mockUserEntity = createMockCitizen({
      id: 123,
      username: 'testuser',
      firstName: 'Mario',
      lastName: 'Rossi',
      email: 'mario.rossi@example.com',
    });
    const expressUser: Express.User = mockUserEntity;

    const expectedCitizenResponse: UserResponse = {
      id: 123,
      username: 'testuser',
      email: 'mario.rossi@example.com',
      first_name: 'Mario',
      last_name: 'Rossi',
      role_name: 'Citizen',
    };

    // Act
    const result = authService.createUserResponse(expressUser);

    // Assert
    expect(result).toEqual(expectedCitizenResponse);
  });

  it('should handle null user input gracefully', () => {
    // Arrange
    const expressUser = (null as unknown) as Express.User;

    // Act
    const result = authService.createUserResponse(expressUser);

    // Assert
    expect(result).toBeNull();
  });
});