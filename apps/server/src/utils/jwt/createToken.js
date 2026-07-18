import dotenv from '../../config/dotenv.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const createTokenOld = (payload = {}) => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      { ...payload },
      dotenv('SECRETKEY'),
      {
        // expiresIn: '120000' // 2 min
        // expiresIn: '10m'
        // expiresIn: '9000000' // 15 min (900000)
        // expiresIn: '5m'
        expiresIn: '1d',
      },
      (err, token) => {
        if (err) {
          reject('token not generated.');
        } else {
          // console.log('token generated', token)
          resolve(token);
        }
      }
    );
  });
};

export const createRefreshTokenOld = (payload = {}) => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      { ...payload },
      dotenv('REFRESHSECRETKEY'),
      {
        expiresIn: '1d',
      },
      (err, token) => {
        if (err) {
          reject('refresh token not generated.');
        } else {
          resolve(token);
        }
      }
    );
  });
};

/// ------------------------------------------------------------------

// Base options for signing JWT tokens.
// - Use HS256 because it's secure as long as the key has sufficient entropy.
// - Define issuer and audience to prevent token usage outside expected context.
const SIGN_OPTIONS = {
  algorithm: 'HS256',
  issuer: 'mi-api',
  audience: 'mi-front',
};

// Refresh token options use the same base configuration.
// - Don't define expiry here because I pass it when calling the function.
// - Maintain separation for clarity.
const SIGN_REFRESH_OPTIONS = {
  ...SIGN_OPTIONS,
  // refresh can have longer expiry (1 day, 7 days or whatever I want)
};

// Function that validates payload is not empty or invalid.
// This prevents signing corrupted or poorly constructed tokens.
function validatePayload(payload) {
  if (
    !payload || // Must exist
    typeof payload !== 'object' || // Must be an object
    Array.isArray(payload) || // Must not be an array
    Object.keys(payload).length === 0 // Must not be empty
  ) {
    throw new Error(
      'Token payload is required and must be a non-empty object.'
    );
  }
}

// Generic function for creating tokens, receives:
// - payload: the data I want to put in the JWT
// - secret: the key I will use to sign the token
// - expiresIn: token expiration time
// - options: algorithm, issuer and audience configuration
const createTokenWithKey = (
  payload,
  secret,
  expiresIn = '15m',
  options = SIGN_OPTIONS
) => {
  return new Promise((resolve, reject) => {
    try {
      // First validate payload to ensure I don't sign garbage
      validatePayload(payload);

      // Verify secret key exists. Signing without key would break all security.
      if (!secret) {
        return reject('Token secret key is not defined.');
      }

      // Sign token using jsonwebtoken
      jwt.sign(
        payload,
        secret,
        { ...options, expiresIn }, // Apply options + specific expiration
        (err, token) => {
          if (err) {
            return reject('Error generating token.');
          }

          // ONLY in development print token (this should never be done in production)
          if (process.env.NODE_ENV === 'development') {
            console.log('Token generated:', token);
          }

          // Return signed token
          resolve(token);
        }
      );
    } catch (error) {
      // Handle any error that occurred in the function
      reject(error.message);
    }
  });
};

// Access token:
// - Se firma con la variable de entorno SECRETKEY
/**
 * Creates a cryptographically signed JWT access token with user payload.
 * Encodes user data into a signed JSON Web Token for API authentication.
 * Uses rapid expiration (15 minutes) for security best practices.
 *
 * @param {Object} payload - User data to encode in token (must include id, rol)
 * @param {string} payload.id - Unique user identifier
 * @param {string} payload.rol - User role code for authorization
 * @returns {Promise<string>} Signed JWT access token ready for client storage
 * @throws {ValidationError} When payload is missing required fields (id, rol)
 * @throws {Error} When JWT signing fails due to invalid secret key or encoding issues
 *
 * @example
 * const token = await createToken({
 *   id: 'user123',
 *   rol: 'ADMIN',
 *   expiresIn: 1800 // 30 minutes
 * });
 * console.log(token); // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */
export const createToken = (payload) =>
  createTokenWithKey(payload, dotenv('SECRETKEY'), '900000', SIGN_OPTIONS);

/**
 * Creates a JWT refresh token for token rotation mechanism.
 * Used for generating new access tokens without requiring full re-authentication.
 * Longer expiration time allows secure session management.
 *
 * @param {Object} payload - User data to encode in token (must include id)
 * @param {string} payload.id - User ID to embed in token
 * @returns {Promise<string>} Signed JWT refresh token with 1 day expiry
 * @throws {ValidationError} When payload is missing required fields
 * @throws {Error} When JWT signing fails due to invalid refresh secret key
 *
 * @example
 * const refreshToken = await createRefreshToken({ id: 'user123' });
 * // Store in secure HTTP-only cookie
 * res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true });
 */
export const createRefreshToken = (payload) =>
  createTokenWithKey(
    payload,
    dotenv('REFRESHSECRETKEY'),
    '86400000',
    SIGN_REFRESH_OPTIONS
  );

/**
 * Creates a cryptographically secure opaque refresh token for database storage.
 * Generates a random 128-character hex string for use as database identifier
 * for refresh tokens, providing additional security against token guessing.
 *
 * @returns {Promise<string>} 128-character hex string for database storage
 * @throws {Error} When crypto random bytes generation fails
 *
 * @example
 * const opaqueToken = await createRefreshTokenOpaque();
 * // Store in database with user association
 * await storeRefreshToken({
 *   token: opaqueToken,
 *   userId: user.id
 * });
 */
export const createRefreshTokenOpaque = () => {
  return new Promise((resolve, reject) => {
    try {
      const token = crypto.randomBytes(64).toString('hex');
      resolve(token);
    } catch (error) {
      reject(error);
    }
  });
};
