import { createRow, getOneRow, updateRow } from '../../utils/prisma/dao.js'
import { TABLESNAMES } from '../../utils/constants/enums.js'

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const tableName = TABLESNAMES.USERS

/**
 * Sign up a new user.
 *
 * @param {Object} user - The user data to create.
 * @returns {Promise<Object>} The created user.
 */
export const signUp = async (user) => {
  const userRes = await createRow(tableName, user)
  return Promise.resolve(userRes)
}

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
    include: { roles: true }
  })

  return Promise.resolve(user)
}

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
    include: { roles: true }
  })

  return Promise.resolve(user)
}

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
    include: { roles: true }
  })

  return Promise.resolve(user)
}
// ya no necesario el token se guarda en una tabla independiente
/**
 * Save a refresh token for a user.
 *
 * @param {string} refreshToken - The refresh token to save.
 * @param {number} id - The ID of the user to associate with the token.
 * @returns {Promise<Object>} The updated user data.
 */
export const saveRefreshToken = async (refreshToken, id) => {
  const data = { refreshToken }
  const where = { id }
  const user = await updateRow(tableName, data, where)

  return Promise.resolve(user)
}

export const storeRefreshToken = async ({ token, userId, issuedAt }) => {
  return prisma.refreshToken.create({
    data: { token, userId, issuedAt: new Date(issuedAt) }
  })
}

export const findByToken = async (refreshToken) => {
  return prisma.refreshToken.findUnique({ where: { token: refreshToken } })
}

export const revokeRefreshToken = async (id) => {
  return prisma.refreshToken.update({
    where: { id },
    data: { revoked: true, revokedAt: new Date() }
  })
}
export const revokeAllRefreshTojeForUser = async (userId) => {
  return prisma.refreshToken.updateMany({
    where: { userId },
    data: { revoked: true, revokedAt: new Date() }
  })
}
