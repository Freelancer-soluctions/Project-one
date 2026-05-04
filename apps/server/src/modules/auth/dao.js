import { createRow, getOneRow, updateRow } from '../../utils/prisma/dao.js';
import { TABLESNAMES } from '../../utils/constants/enums.js';
import { prisma } from '../../config/db.js';

const tableName = TABLESNAMES.USERS;

/**
 * Sign up a new user.
 *
 * @param {Object} user - The user data to create.
 * @returns {Promise<Object>} The created user.
 */
export const signUp = async (user) => {
  const userRes = await createRow(tableName, user);
  return Promise.resolve(userRes);
};

/**
 * Get user by email.
 *
 * @param {string} email - The email of the user to retrieve.
 * @returns {Promise<Object>} The user with the given email.
 */
export const signIn = async (email) => {
  const user = await getOneRow({
    tableName,
    where: { email },
    include: { roles: true },
  });

  return Promise.resolve(user);
};

/**
 * Get session by ID.
 *
 * @param {number} id - The ID of the session to retrieve.
 * @returns {Promise<Object>} The session data.
 */
export const session = async (id) => {
  const user = await getOneRow({
    tableName,
    where: { id },
    include: { roles: true },
  });

  return Promise.resolve(user);
};

/**
 * Get user by ID.
 *
 * @param {number} id - The ID of the user to retrieve.
 * @returns {Promise<Object>} The user with the given ID.
 */
export const getUserById = async (id) => {
  const user = await getOneRow({
    tableName,
    where: { id },
    include: { roles: true },
  });

  return Promise.resolve(user);
};

// ya no necesario el token se guarda en una tabla independiente
/**
 * Save a refresh token for a user.
 *
 * @param {string} refreshToken - The refresh token to save.
 * @param {number} id - The ID of the user to associate with the token.
 * @returns {Promise<Object>} The updated user data.
 */
export const saveRefreshToken = async (refreshToken, id) => {
  const data = { refreshToken };
  const where = { id };
  const user = await updateRow(tableName, data, where);

  return Promise.resolve(user);
};

/**
 * Store a refresh token in the database.
 *
 * @param {Object} data - The refresh token data.
 * @param {string} data.token - The refresh token string.
 * @param {number} data.userId - The user ID associated with the token.
 * @param {number} data.issuedAt - The timestamp when the token was issued.
 * @returns {Promise<Object>} The created refresh token record.
 */
export const storeRefreshToken = async ({ token, userId, issuedAt }) => {
  return prisma.refreshToken.create({
    data: { token, userId, issuedAt: new Date(issuedAt) },
  });
};

/**
 * Find a refresh token by its value.
 *
 * @param {string} refreshToken - The refresh token string to search for.
 * @returns {Promise<Object|null>} The refresh token record or null if not found.
 */
export const findByToken = async (refreshToken) => {
  return prisma.refreshToken.findUnique({ where: { token: refreshToken } });
};

/**
 * Revoke a refresh token by marking it as revoked.
 *
 * @param {number} id - The ID of the refresh token to revoke.
 * @returns {Promise<Object>} The updated refresh token record.
 */
export const revokeRefreshToken = async (id) => {
  return prisma.refreshToken.update({
    where: { id },
    data: { revoked: true, revokedAt: new Date() },
  });
};

/**
 * Revoke all refresh tokens for a specific user.
 *
 * @param {number} userId - The user ID whose refresh tokens should be revoked.
 * @returns {Promise<Object>} The result of the update operation.
 */
export const revokeAllRefreshTojeForUser = async (userId) => {
  return prisma.refreshToken.updateMany({
    where: { userId },
    data: { revoked: true, revokedAt: new Date() },
  });
};
