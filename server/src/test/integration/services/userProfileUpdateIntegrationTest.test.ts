import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { AppDataSource } from '@database/connection';
import { userService } from '@services/userService';
import { userRepository } from '@repositories/userRepository';
import { departmentRoleRepository } from '@repositories/departmentRoleRepository';
import { UserEntity } from '@models/entity/userEntity';
import { BadRequestError } from '@models/errors/BadRequestError';
import { NotFoundError } from '@models/errors/NotFoundError';
import { ConflictError } from '@models/errors/ConflictError';
import { In } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

describe('UserService Integration Tests - updateUserProfile', () => {
  const createdUserIds: number[] = [];
  const uploadedFiles: string[] = [];
  let testUserId: number;
  let otherUserId: number;
  let citizenRoleId: number;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Get citizen role
    const citizenRole = await departmentRoleRepository.findByDepartmentAndRole('Organization', 'Citizen');
    if (!citizenRole) throw new Error('Citizen role not found');
    citizenRoleId = citizenRole.id;

    // Create test user
    const timestamp = Date.now();
    const testUser = await userRepository.createUserWithPassword({
      username: `testuser_profile_${timestamp}`,
      email: `testuser_profile_${timestamp}@test.com`,
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
      isVerified: true,
      emailNotificationsEnabled: true,
      telegramLinkConfirmed: false,
    });
    await AppDataSource.query(
      `INSERT INTO user_roles (user_id, department_role_id) VALUES ($1, $2)`,
      [testUser.id, citizenRoleId]
    );
    testUserId = testUser.id;
    createdUserIds.push(testUserId);

    // Create other user for conflict tests
    const otherUser = await userRepository.createUserWithPassword({
      username: `otheruser_profile_${timestamp}`,
      email: `otheruser_profile_${timestamp}@test. com`,
      password: 'Password123!',
      firstName:  'Other',
      lastName:  'User',
      isVerified: true,
      emailNotificationsEnabled: true,
      telegramUsername: 'existingusername',
      telegramLinkConfirmed: false,
    });
    await AppDataSource.query(
      `INSERT INTO user_roles (user_id, department_role_id) VALUES ($1, $2)`,
      [otherUser.id, citizenRoleId]
    );
    otherUserId = otherUser.id;
    createdUserIds.push(otherUserId);
  });

  afterAll(async () => {
    // Cleanup uploaded files
    for (const filePath of uploadedFiles) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.log(`Failed to delete test file: ${filePath}`);
      }
    }

    // Cleanup users
    if (createdUserIds.length > 0) {
      await AppDataSource.getRepository(UserEntity).delete({ id: In(createdUserIds) });
    }

    if (AppDataSource.isInitialized) {
      await AppDataSource. destroy();
    }
  });

  describe('successful profile updates', () => {
    it('should update firstName and persist to database', async () => {
      // Act
      const result = await userService.updateUserProfile(testUserId, {
        firstName: 'UpdatedFirstName'
      });

      // Assert
      expect(result.first_name).toBe('UpdatedFirstName');

      // Verify in database
      const dbUser = await userRepository.findUserById(testUserId);
      expect(dbUser! .firstName).toBe('UpdatedFirstName');
    });

    it('should update lastName and persist to database', async () => {
      // Act
      const result = await userService.updateUserProfile(testUserId, {
        lastName:  'UpdatedLastName'
      });

      // Assert
      expect(result.last_name).toBe('UpdatedLastName');

      // Verify in database
      const dbUser = await userRepository.findUserById(testUserId);
      expect(dbUser! .lastName).toBe('UpdatedLastName');
    });

    it('should update email with uniqueness check', async () => {
      // Arrange
      const timestamp = Date.now();
      const newEmail = `newemail_${timestamp}@test.com`;

      // Act
      const result = await userService.updateUserProfile(testUserId, {
        email: newEmail
      });

      // Assert
      expect(result. email).toBe(newEmail);

      // Verify in database
      const dbUser = await userRepository.findUserById(testUserId);
      expect(dbUser! .email).toBe(newEmail);

      // Verify email can be used to find user
      const foundUser = await userRepository.findUserByEmail(newEmail);
      expect(foundUser! .id).toBe(testUserId);
    });

    it('should update telegram username with sanitization', async () => {
      // Arrange
      const timestamp = Date.now();
      const telegramUsername = `@TestUser${timestamp}`;

      // Act
      const result = await userService. updateUserProfile(testUserId, {
        telegramUsername
      });

      // Assert
      expect(result.telegram_username).toBe(telegramUsername. replace('@', '').toLowerCase());

      // Verify in database
      const dbUser = await userRepository.findUserById(testUserId);
      expect(dbUser!.telegramUsername).toBe(`testuser${timestamp}`);

      // Verify case-insensitive lookup works
      const foundUser = await userRepository.findUserByTelegramUsername(`TESTUSER${timestamp}`);
      expect(foundUser!.id).toBe(testUserId);
    });

    it('should update emailNotificationsEnabled', async () => {
      // Act
      const result = await userService.updateUserProfile(testUserId, {
        emailNotificationsEnabled: false
      });

      // Assert
      expect(result.email_notifications_enabled).toBe(false);

      // Verify in database
      const dbUser = await userRepository.findUserById(testUserId);
      expect(dbUser! .emailNotificationsEnabled).toBe(false);

      // Reset back to true
      await userService. updateUserProfile(testUserId, {
        emailNotificationsEnabled: true
      });
    });

    it('should handle partial updates (only some fields)', async () => {
      // Arrange
      const timestamp = Date.now();
      const initialUser = await userRepository.findUserById(testUserId);
      const updateData = {
        firstName: 'PartialFirst',
        emailNotificationsEnabled: false
      };

      // Act
      const result = await userService.updateUserProfile(testUserId, updateData);

      // Assert
      expect(result.first_name).toBe('PartialFirst');
      expect(result.last_name).toBe(initialUser!.lastName); // Unchanged
      expect(result.email_notifications_enabled).toBe(false);

      // Verify in database
      const dbUser = await userRepository.findUserById(testUserId);
      expect(dbUser!.firstName).toBe('PartialFirst');
      expect(dbUser! .lastName).toBe(initialUser!.lastName);
      expect(dbUser!.emailNotificationsEnabled).toBe(false);
    });

    it('should update multiple fields at once', async () => {
      // Arrange
      const timestamp = Date.now();
      const updateData = {
        firstName: 'Multi',
        lastName: 'Update',
        email: `multi${timestamp}@test.com`,
        telegramUsername: `multiuser${timestamp}`,
        emailNotificationsEnabled: false
      };

      // Act
      const result = await userService.updateUserProfile(testUserId, updateData);

      // Assert
      expect(result.first_name).toBe('Multi');
      expect(result.last_name).toBe('Update');
      expect(result.email).toBe(updateData.email);
      expect(result.telegram_username).toBe(`multiuser${timestamp}`);
      expect(result.email_notifications_enabled).toBe(false);

      // Verify in database
      const dbUser = await userRepository. findUserById(testUserId);
      expect(dbUser!. firstName).toBe('Multi');
      expect(dbUser!.lastName).toBe('Update');
      expect(dbUser!.email).toBe(updateData.email);
      expect(dbUser! .telegramUsername).toBe(`multiuser${timestamp}`);
      expect(dbUser!.emailNotificationsEnabled).toBe(false);
    });

    it('should remove telegram username when set to null', async () => {
      // Arrange - First set a telegram username
      const timestamp = Date.now();
      await userService.updateUserProfile(testUserId, {
        telegramUsername: `tempuser${timestamp}`
      });

      // Act - Remove it
      const result = await userService.updateUserProfile(testUserId, {
        telegramUsername:  null as any
      });

      // Assert
      expect(result.telegram_username).toBeFalsy();

      // Verify in database
      const dbUser = await userRepository.findUserById(testUserId);
      expect(dbUser!.telegramUsername).toBeNull();
    });

    it('should handle special characters in name fields', async () => {
      // Act
      const result = await userService.updateUserProfile(testUserId, {
        firstName: "Jean-Pierre",
        lastName: "O'Brien-Smith"
      });

      // Assert
      expect(result.first_name).toBe("Jean-Pierre");
      expect(result.last_name).toBe("O'Brien-Smith");

      // Verify in database
      const dbUser = await userRepository.findUserById(testUserId);
      expect(dbUser!.firstName).toBe("Jean-Pierre");
      expect(dbUser!.lastName).toBe("O'Brien-Smith");
    });
  });

  describe('validation errors', () => {
    it('should throw BadRequestError for empty firstName', async () => {
      await expect(
        userService.updateUserProfile(testUserId, { firstName: '   ' })
      ).rejects.toThrow(BadRequestError);

      await expect(
        userService.updateUserProfile(testUserId, { firstName: '   ' })
      ).rejects.toThrow('First name cannot be empty');
    });

    it('should throw BadRequestError for empty lastName', async () => {
      await expect(
        userService.updateUserProfile(testUserId, { lastName: '' })
      ).rejects.toThrow(BadRequestError);

      await expect(
        userService.updateUserProfile(testUserId, { lastName: '' })
      ).rejects.toThrow('Last name cannot be empty');
    });

    it('should throw BadRequestError for invalid email format', async () => {
      await expect(
        userService.updateUserProfile(testUserId, { email: 'invalid-email' })
      ).rejects.toThrow(BadRequestError);

      await expect(
        userService.updateUserProfile(testUserId, { email: 'invalid-email' })
      ).rejects.toThrow('Invalid email format');
    });

    it('should throw BadRequestError for invalid telegram username (too short)', async () => {
      await expect(
        userService.updateUserProfile(testUserId, { telegramUsername: 'ab' })
      ).rejects.toThrow(BadRequestError);

      await expect(
        userService.updateUserProfile(testUserId, { telegramUsername: 'ab' })
      ).rejects.toThrow(/Invalid Telegram username format/);
    });

    it('should throw BadRequestError for invalid telegram username (special characters)', async () => {
      await expect(
        userService. updateUserProfile(testUserId, { telegramUsername: 'user@name!' })
      ).rejects.toThrow(BadRequestError);

      await expect(
        userService.updateUserProfile(testUserId, { telegramUsername: 'user@name!' })
      ).rejects.toThrow(/Invalid Telegram username format/);
    });
  });

  describe('user not found', () => {
    it('should throw NotFoundError when user does not exist', async () => {
      await expect(
        userService.updateUserProfile(999999, { firstName: 'Test' })
      ).rejects.toThrow(NotFoundError);

      await expect(
        userService.updateUserProfile(999999, { firstName: 'Test' })
      ).rejects.toThrow('User not found');
    });
  });

  describe('uniqueness constraints', () => {
   it('should throw ConflictError when email already exists', async () => {
  // Arrange - Create a unique email and assign it to other user
  const timestamp = Date. now();
  const testEmail = `conflict${timestamp}@test.com`;
  
  // Update other user to have this email
  await userService.updateUserProfile(otherUserId, { email:  testEmail });

  // Act & Assert - Try to use the same email for test user
  await expect(
    userService.updateUserProfile(testUserId, { email:  testEmail })
  ).rejects.toThrow(ConflictError);

  await expect(
    userService.updateUserProfile(testUserId, { email: testEmail })
  ).rejects.toThrow('Email already in use');

  // Verify original email is unchanged
  const dbUser = await userRepository.findUserById(testUserId);
  expect(dbUser!.email).not.toBe(testEmail);
  });

    it('should not check email uniqueness when email is unchanged', async () => {
      // Arrange
      const currentUser = await userRepository.findUserById(testUserId);
      const currentEmail = currentUser!.email;

      // Act - Update other fields but keep same email
      const result = await userService.updateUserProfile(testUserId, {
        email: currentEmail,
        firstName: 'SameEmailTest'
      });

      // Assert - Should succeed
      expect(result.email).toBe(currentEmail);
      expect(result.first_name).toBe('SameEmailTest');
    });

    it('should throw BadRequestError when telegram username is taken by another user', async () => {
      // Arrange - Other user has telegram username 'existingusername'
      const timestamp = Date.now();

      // Act & Assert
      await expect(
        userService.updateUserProfile(testUserId, { telegramUsername: 'existingusername' })
      ).rejects.toThrow(BadRequestError);

      await expect(
        userService.updateUserProfile(testUserId, { telegramUsername: 'existingusername' })
      ).rejects.toThrow('Telegram username already in use by another user');

      // Verify telegram username is unchanged
      const dbUser = await userRepository.findUserById(testUserId);
      expect(dbUser!.telegramUsername).not.toBe('existingusername');
    });

    it('should allow user to keep their own telegram username', async () => {
      // Arrange - Set telegram username
      const timestamp = Date.now();
      const myUsername = `myusername${timestamp}`;
      await userService.updateUserProfile(testUserId, { telegramUsername: myUsername });

      // Act - Update other field but keep same telegram username
      const result = await userService.updateUserProfile(testUserId, {
        telegramUsername: myUsername,
        firstName: 'KeepUsername'
      });

      // Assert - Should succeed
      expect(result.telegram_username).toBe(myUsername);
      expect(result.first_name).toBe('KeepUsername');
    });
  });

  describe('telegram username sanitization', () => {
    it('should remove @ symbol and convert to lowercase', async () => {
      // Arrange
      const timestamp = Date.now();

      // Act
      const result = await userService.updateUserProfile(testUserId, {
        telegramUsername: `@TestUser${timestamp}`
      });

      // Assert
      expect(result.telegram_username).toBe(`testuser${timestamp}`);

      // Verify in database
      const dbUser = await userRepository.findUserById(testUserId);
      expect(dbUser!.telegramUsername).toBe(`testuser${timestamp}`);
    });

    it('should handle uppercase telegram username', async () => {
      // Arrange
      const timestamp = Date.now();

      // Act
      const result = await userService.updateUserProfile(testUserId, {
        telegramUsername: `UPPERCASE${timestamp}`
      });

      // Assert
      expect(result. telegram_username).toBe(`uppercase${timestamp}`);

      // Verify case-insensitive lookup
      const foundUser = await userRepository.findUserByTelegramUsername(`UPPERCASE${timestamp}`);
      expect(foundUser!.id).toBe(testUserId);
    });
  });

  describe('transaction and rollback', () => {
    it('should rollback on error and not persist partial changes', async () => {
      // Arrange - Get current state
      const beforeUpdate = await userRepository.findUserById(testUserId);
      const originalFirstName = beforeUpdate!.firstName;

      // Act - Try to update with invalid data (should fail)
      try {
        await userService.updateUserProfile(testUserId, {
          firstName: 'NewName',
          email: 'invalid-email' // This will fail
        });
      } catch (error) {
        // Expected to throw
      }

      // Assert - firstName should not have changed
      const afterUpdate = await userRepository.findUserById(testUserId);
      expect(afterUpdate!.firstName).toBe(originalFirstName);
    });
  });

  describe('concurrent updates', () => {
    it('should handle concurrent updates correctly', async () => {
      // Arrange
      const timestamp = Date.now();

      // Act - Update different fields concurrently
      const promises = [
        userService.updateUserProfile(testUserId, { firstName:  `Concurrent1_${timestamp}` }),
        userService.updateUserProfile(testUserId, { lastName: `Concurrent2_${timestamp}` }),
        userService.updateUserProfile(testUserId, { emailNotificationsEnabled: false })
      ];

      // Assert - All should complete
      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);

      // Verify final state
      const dbUser = await userRepository.findUserById(testUserId);
      expect(dbUser!.firstName).toBeDefined();
      expect(dbUser!.lastName).toBeDefined();
      expect(dbUser!. emailNotificationsEnabled).toBeDefined();
    });
  });

  describe('response format', () => {
    it('should return UserResponse with all required fields', async () => {
      // Act
      const result = await userService.updateUserProfile(testUserId, {
        firstName: 'ResponseTest'
      });

      // Assert - Check all required fields
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('username');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('first_name');
      expect(result).toHaveProperty('last_name');
      expect(result).toHaveProperty('roles');
      expect(result).toHaveProperty('email_notifications_enabled');
      
      // Should not have sensitive fields
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('verificationCode');
    });

    it('should include user roles in response', async () => {
      // Act
      const result = await userService.updateUserProfile(testUserId, {
        firstName: 'RolesTest'
      });

      // Assert
      expect(result. roles).toBeDefined();
      expect(Array.isArray(result.roles)).toBe(true);
      expect(result.roles. length).toBeGreaterThan(0);
      expect(result.roles[0]).toHaveProperty('role_name');
      expect(result.roles[0]).toHaveProperty('department_name');
    });
  });

  describe('edge cases', () => {
    it('should handle update with no fields changed (empty object)', async () => {
      // Arrange
      const beforeUpdate = await userRepository.findUserById(testUserId);

      // Act
      const result = await userService.updateUserProfile(testUserId, {});

      // Assert - Should return current user data
      expect(result. id).toBe(testUserId);
      expect(result.first_name).toBe(beforeUpdate!.firstName);
    });

    it('should handle very long valid names', async () => {
      // Arrange
      const longFirstName = 'A'.repeat(100); // Max length
      const longLastName = 'B'.repeat(100);

      // Act
      const result = await userService.updateUserProfile(testUserId, {
        firstName: longFirstName,
        lastName: longLastName
      });

      // Assert
      expect(result.first_name).toBe(longFirstName);
      expect(result.last_name).toBe(longLastName);

      // Verify in database
      const dbUser = await userRepository.findUserById(testUserId);
      expect(dbUser!.firstName).toBe(longFirstName);
      expect(dbUser!.lastName).toBe(longLastName);
    });

    it('should handle email with + addressing', async () => {
      // Arrange
      const timestamp = Date.now();
      const emailWithPlus = `user+test${timestamp}@example.com`;

      // Act
      const result = await userService. updateUserProfile(testUserId, {
        email: emailWithPlus
      });

      // Assert
      expect(result.email).toBe(emailWithPlus);

      // Verify can be found by email
      const foundUser = await userRepository.findUserByEmail(emailWithPlus);
      expect(foundUser! .id).toBe(testUserId);
    });

    it('should handle telegram username with underscores and numbers', async () => {
      // Arrange
      const timestamp = Date.now();
      const username = `user_123_test${timestamp}`;

      // Act
      const result = await userService.updateUserProfile(testUserId, {
        telegramUsername:  username
      });

      // Assert
      expect(result.telegram_username).toBe(username.toLowerCase());

      // Verify in database
      const dbUser = await userRepository.findUserById(testUserId);
      expect(dbUser!.telegramUsername).toBe(username.toLowerCase());
    });
  });
});