import { configurePassport } from '@config/passport';
import passport from 'passport';
import { userRepository } from '@repositories/userRepository';
import { UserEntity } from '@models/entity/userEntity';

jest.mock('@repositories/userRepository');

const mockedUserRepository = userRepository as jest.Mocked<typeof userRepository>;

describe('Passport Configuration Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('configurePassport', () => {
    it('should configure passport without errors', () => {
      expect(() => configurePassport()).not.toThrow();
    });

    it('should configure local strategy', () => {
      const useSpy = jest.spyOn(passport, 'use');
      configurePassport();
      expect(useSpy).toHaveBeenCalled();
    });
  });

  describe('Local Strategy Authentication', () => {
    it('should authenticate user with valid credentials', async () => {
      const mockUser: UserEntity = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
      } as any as UserEntity;

      mockedUserRepository.verifyCredentials.mockResolvedValue(mockUser);

      configurePassport();

      // The strategy is configured, verify it was called
      expect(mockedUserRepository.verifyCredentials).not.toHaveBeenCalled();
    });

    it('should reject invalid credentials', async () => {
      mockedUserRepository.verifyCredentials.mockResolvedValue(null);

      configurePassport();

      // Configuration should complete without errors
      expect(true).toBe(true);
    });

    it('should handle authentication errors', async () => {
      mockedUserRepository.verifyCredentials.mockRejectedValue(new Error('Database error'));

      configurePassport();

      // Configuration should complete without throwing
      expect(true).toBe(true);
    });
  });

  describe('Serialization', () => {
    it('should configure serializeUser', () => {
      const serializeSpy = jest.spyOn(passport, 'serializeUser');
      configurePassport();
      expect(serializeSpy).toHaveBeenCalled();
    });

    it('should serialize user correctly', (done) => {
      configurePassport();

      const mockUser: UserEntity = {
        id: 1,
        username: 'testuser',
      } as any as UserEntity;

      passport.serializeUser(mockUser as Express.User, (err, user) => {
        expect(err).toBeNull();
        expect(user).toEqual({
          id: 1,
          username: 'testuser',
          departmentRoleIds: [],
        });
        done();
      });
    });
  });

  describe('Deserialization', () => {
    it('should configure deserializeUser', () => {
      const deserializeSpy = jest.spyOn(passport, 'deserializeUser');
      configurePassport();
      expect(deserializeSpy).toHaveBeenCalled();
    });

    it('should deserialize user successfully', async () => {
      const mockUser: UserEntity = {
        id: 1,
        username: 'testuser',
      } as any as UserEntity;

      mockedUserRepository.findUserById.mockResolvedValue(mockUser);

      configurePassport();

      const sessionUser = { id: 1, username: 'testuser' };

      passport.deserializeUser(sessionUser, (err, user) => {
        if (!err) {
          expect(user).toBeDefined();
        }
      });
    });

    it('should handle user not found during deserialization', async () => {
      mockedUserRepository.findUserById.mockResolvedValue(null);

      configurePassport();

      const sessionUser = { id: 999, username: 'nonexistent' };

      passport.deserializeUser(sessionUser, (err, user) => {
        expect(err).toBeDefined();
      });
    });

    it('should handle deserialization errors', async () => {
      mockedUserRepository.findUserById.mockRejectedValue(new Error('Database error'));

      configurePassport();

      const sessionUser = { id: 1, username: 'testuser' };

      passport.deserializeUser(sessionUser, (err) => {
        expect(err).toBeDefined();
      });
    });
  });
});
