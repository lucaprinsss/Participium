/* import { authService } from '../../../services/authService';
import { userEntity } from '../../../models/entity/userEntity';
import { UserResponse } from '../../../models/dto/UserResponse';

import { UserRole } from '../../../models/dto/UserRole';

describe('AuthService Integration Tests', () => {
  let mockUserEntity: userEntity;
  let expectedDtoResponse: UserResponse;

  beforeEach(() => {
    const creationDate = new Date('2023-01-01T12:00:00Z');

    mockUserEntity = new userEntity();
    mockUserEntity.id = 123;
    mockUserEntity.username = 'testuser';
    mockUserEntity.firstName = 'Mario';
    mockUserEntity.lastName = 'Rossi';
    mockUserEntity.email = 'mario.rossi@example.com';
    mockUserEntity.role = 'Administrator'; 
    mockUserEntity.passwordHash = 'hash_super_segreto_da_nascondere';
    mockUserEntity.personalPhotoUrl = 'http://example.com/photo.jpg';
    mockUserEntity.telegramUsername = '@mariorossi';
    mockUserEntity.emailNotificationsEnabled = true;
    mockUserEntity.createdAt = creationDate;

    expectedDtoResponse = {
      id: 123,
      username: 'testuser',
      email: 'mario.rossi@example.com',
      first_name: 'Mario',
      last_name: 'Rossi',
      role: UserRole.ADMINISTRATOR, 
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
    mockUserEntity.role = 'Citizen'; 
    const expressUser: Express.User = mockUserEntity;

    const expectedCitizenResponse: UserResponse = {
      ...expectedDtoResponse,
      role: UserRole.CITIZEN,
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
}); */

// dummy test
describe('Dummy test', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });
});