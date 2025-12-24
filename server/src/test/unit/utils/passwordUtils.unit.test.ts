import * as passwordUtils from '@utils/passwordUtils';
import crypto from 'crypto';

describe('PasswordUtils Unit Tests', () => {
  describe('generatePasswordData', () => {
    it('should generate password data with salt and hash', async () => {
      const password = 'TestPassword123!';
      const passwordData = await passwordUtils.generatePasswordData(password);
      
      expect(passwordData).toBeDefined();
      expect(passwordData.salt).toBeDefined();
      expect(passwordData.hash).toBeDefined();
      expect(typeof passwordData.salt).toBe('string');
      expect(typeof passwordData.hash).toBe('string');
      expect(passwordData.hash).not.toBe(password);
      expect(passwordData.salt.length).toBeGreaterThan(0);
      expect(passwordData.hash.length).toBeGreaterThan(0);
    });

    it('should generate different salts and hashes for same password', async () => {
      const password = 'SamePassword123!';
      const passwordData1 = await passwordUtils.generatePasswordData(password);
      const passwordData2 = await passwordUtils.generatePasswordData(password);
      
      expect(passwordData1.salt).not.toBe(passwordData2.salt);
      expect(passwordData1.hash).not.toBe(passwordData2.hash);
    });

    it('should handle empty password', async () => {
      const passwordData = await passwordUtils.generatePasswordData('');
      expect(passwordData).toBeDefined();
      expect(passwordData.salt).toBeDefined();
      expect(passwordData.hash).toBeDefined();
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const password = 'CorrectPassword123!';
      const passwordData = await passwordUtils.generatePasswordData(password);
      
      const isMatch = await passwordUtils.verifyPassword(password, passwordData.salt, passwordData.hash);
      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'CorrectPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const passwordData = await passwordUtils.generatePasswordData(password);
      
      const isMatch = await passwordUtils.verifyPassword(wrongPassword, passwordData.salt, passwordData.hash);
      expect(isMatch).toBe(false);
    });

    it('should return false for empty password against hash', async () => {
      const password = 'Password123!';
      const passwordData = await passwordUtils.generatePasswordData(password);
      
      const isMatch = await passwordUtils.verifyPassword('', passwordData.salt, passwordData.hash);
      expect(isMatch).toBe(false);
    });

    it('should handle case sensitivity', async () => {
      const password = 'Password123!';
      const passwordData = await passwordUtils.generatePasswordData(password);
      
      const isMatch = await passwordUtils.verifyPassword('password123!', passwordData.salt, passwordData.hash);
      expect(isMatch).toBe(false);
    });

    it('should work with special characters', async () => {
      const password = 'P@ssw0rd!#$%^&*()';
      const passwordData = await passwordUtils.generatePasswordData(password);
      
      const isMatch = await passwordUtils.verifyPassword(password, passwordData.salt, passwordData.hash);
      expect(isMatch).toBe(true);
    });

    it('should work with unicode characters', async () => {
      const password = 'P@ssw0rd日本語';
      const passwordData = await passwordUtils.generatePasswordData(password);
      
      const isMatch = await passwordUtils.verifyPassword(password, passwordData.salt, passwordData.hash);
      expect(isMatch).toBe(true);
    });

    it('should handle very long passwords', async () => {
      const password = 'a'.repeat(100) + '!1Aa';
      const passwordData = await passwordUtils.generatePasswordData(password);
      
      const isMatch = await passwordUtils.verifyPassword(password, passwordData.salt, passwordData.hash);
      expect(isMatch).toBe(true);
    });
  });

  describe('PasswordUtils Error Handling', () => {
    const originalScrypt = crypto.scrypt;

    afterEach(() => {
      // Restore original scrypt after each test
      (crypto.scrypt as any) = originalScrypt;
    });

    it('generatePasswordData should reject on scrypt error', async () => {
      (crypto.scrypt as any) = jest.fn((password, salt, keylen, cb) => {
        cb(new Error('scrypt error'));
      });
      await expect(
        (await import('@utils/passwordUtils')).generatePasswordData('fail')
      ).rejects.toThrow('scrypt error');
    });

    it('verifyPassword should reject on scrypt error', async () => {
      (crypto.scrypt as any) = jest.fn((password, salt, keylen, cb) => {
        cb(new Error('scrypt error'));
      });
      await expect(
        (await import('@utils/passwordUtils')).verifyPassword('fail', 'salt', 'hash')
      ).rejects.toThrow('scrypt error');
    });
  });
});
