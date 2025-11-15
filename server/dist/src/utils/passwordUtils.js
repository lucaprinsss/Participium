"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePasswordData = generatePasswordData;
exports.verifyPassword = verifyPassword;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generates password data (salt and hashed password) using the scrypt algorithm.
 * @param password The password to hash.
 * @returns A promise that resolves to an object containing the salt and hashed password.
 */
function generatePasswordData(password) {
    return new Promise((resolve, reject) => {
        const salt = crypto_1.default.randomBytes(16).toString('hex');
        crypto_1.default.scrypt(password, salt, 64, (err, hashedPassword) => {
            if (err)
                reject(err);
            else
                resolve({ salt, hash: hashedPassword.toString('hex') });
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
function verifyPassword(password, salt, hash) {
    return new Promise((resolve, reject) => {
        crypto_1.default.scrypt(password, salt, 64, (err, hashedPassword) => {
            if (err)
                reject(err);
            else
                resolve(hash === hashedPassword.toString('hex'));
        });
    });
}
