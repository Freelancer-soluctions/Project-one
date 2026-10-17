import crypto from 'crypto';

/**
 * Generates a cryptographically secure CSRF token
 * @returns {Promise<string>} Promise that resolves to a 64-character hexadecimal CSRF token
 * @throws {Error} If token generation fails due to insufficient entropy
 * @description Uses crypto.randomBytes() to generate a secure 32-byte (256-bit) random token
 */
export const createCsrfToken = () => {
  return new Promise((resolve, reject) => {
    try {
      resolve(crypto.randomBytes(32).toString('hex'));
    } catch (error) {
      reject(error.message);
    }
  });
};
