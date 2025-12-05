import crypto from 'node:crypto';

/**
 * Interface representing the password data structure.
 */
interface PasswordData {
  salt: string;
  hash: string;
}

/**
 * Generates password data (salt and hashed password) using the scrypt algorithm.
 * @param password The password to hash.
 * @returns A promise that resolves to an object containing the salt and hashed password.
 */
export function generatePasswordData(password: string): Promise<PasswordData> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, hashedPassword) => {
      if (err) reject(err);
      else resolve({ salt, hash: hashedPassword.toString('hex') });
    });
  });
}

/**
 * Verifies a password against a stored hash and salt.
 * @param password The password to verify.
 * @param salt The salt used to hash the original password.
 * @param hash The stored hash to compare against.
 * @returns A promise that resolves to true if the password is correct, false otherwise.
 */
export function verifyPassword(
  password: string,
  salt: string,
  hash: string
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, hashedPassword) => {
      if (err) reject(err);
      else resolve(hash === hashedPassword.toString('hex'));
    });
  });
  
}
