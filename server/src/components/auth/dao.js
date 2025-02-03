import { createRow, getOneRow, getRow, updateRow } from '../utils/dao.js'
import { tableNames } from '../utils/enums/enums.js'

const tableName = tableNames.USERS

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

/**
 * Get user by refresh token.
 *
 * @param {string} refreshToken - The refresh token to search for.
 * @returns {Promise<Object>} The user associated with the token.
 */
export const getUserByToken = async (refreshToken) => {
  const user = await getRow({
    tableName,
    where: { refreshToken },
    include: { roles: true }
  })

  return Promise.resolve(user)
}
