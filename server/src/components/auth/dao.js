import { createRow, getOneRow, getRow, updateRow } from '../utils/dao.js'

const tableName = 'users'

/**  sign up
 * @param {object} user
 */
export const signUp = async (user) => {
  const userRes = await createRow(tableName, user)
  return Promise.resolve(userRes)
}

/**  get user by email
 * @param {email} email
 */
export const signIn = async (email) => {
  const user = await getOneRow({
    tableName,
    where: { email },
    include: { roles: true }
  })

  return Promise.resolve(user)
}

/**  get session by id
 * @param {id} id
 */
export const session = async (id) => {
  const user = await getOneRow({
    tableName,
    where: { id },
    include: { roles: true }
  })

  return Promise.resolve(user)
}

/**  get user by id
 * @param {id} id
 */
export const getUserById = async (id) => {
  const user = await getOneRow({
    tableName,
    where: { id },
    include: { roles: true }
  })

  return Promise.resolve(user)
}

/** Save refresh token
 * @param {id} id
 * @param {token} token
 */

export const saveRefreshToken = async (refreshToken, id) => {
  const user = await updateRow({
    tableName,
    data: { refreshToken },
    where: { id }
  })

  return Promise.resolve(user)
}

/**
 * Get user by token
 * @param {token} refreshToken
 * @returns a uisers
 */
export const getUserByToken = async (refreshToken) => {
  const user = await getRow({
    tableName,
    where: { refreshToken },
    include: { roles: true }
  })

  return Promise.resolve(user)
}
