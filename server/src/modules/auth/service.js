import * as authDao from './dao.js'
import { getUserRegisteredByEmail, getUserRoleByCode } from '../users/dao.js'
import { createToken, createRefreshTokenOpaque } from '../../utils/jwt/createToken.js'
import { createCsrfToken } from '../../utils/csrftoken/csrfToken.js'
import ClientError from '../../utils/responses&Errors/errors.js'
import { ROLESCODES } from '../../utils/constants/enums.js'
import { encryptPassword, comparePassword } from '../../utils/bcrypt/encrypt.js'
// import jwt from 'jsonwebtoken'
// import dontenv from '../../config/dotenv.js'

/**
 * Sign up a new user.
 *
 * @param {Object} user - The user object containing user details.
 * @returns {Promise<Object>} An object containing the access token and user details.
 */
export const signUp = async (user) => {
  // get the user role id
  const role = await getUserRoleByCode(ROLESCODES.USER)
  user.roleId = role?.id
  // encryt password
  user.password = encryptPassword(user.password)
  // verify if the email is already registered
  const emailExists = await getUserRegisteredByEmail(user.email)
  if (Object.keys(emailExists).length) {
    throw new ClientError('Este correo ya esta registrado.', 400)
  }
  const userSaved = await authDao.signUp(user)
  // create the token
  const token = await createToken({ id: userSaved.id, rol: { ...role } })
  return { accessToken: token, user: { id: userSaved.id, firstName: userSaved.firstName, picture: userSaved.picture, role: userSaved.roleId } }
}

/**
 * Sign in an existing user.
 *
 * @param {Object} user - The user object containing email and password.
 * @returns {Promise<Object>} An object containing the access token, refresh token, and user details.
 */
export const signIn = async (user) => {
  const { email, password } = user

  // verify if the user is already registered
  const userExists = await authDao.signIn(email)
  if (!userExists) {
    throw new ClientError('Este correo no esta registrado.', 400)
  }

  // comparar el pasword
  const validPassword = await comparePassword(
    password,
    userExists.password
  )

  if (!validPassword) {
    throw new ClientError('Contraseña invalida.', 400)
  }
  // create the token
  const token = await createToken({ id: userExists.id, rol: { ...userExists.roles } })
  const refreshToken = await createRefreshTokenOpaque()
  // save the user refresh token
  await authDao.storeRefreshToken({ token: refreshToken, userId: userExists.id, issuedAt: Date.now() })

  // create csrf token
  const csrfToken = await createCsrfToken()

  return { accessToken: token, refreshToken, csrfToken, user: { id: userExists.id, firstName: userExists.firstName, picture: userExists.picture, roleName: userExists.roles.description, roleId: userExists.roleId } }
}

/**
 * Retrieve the user session by ID.
 *
 * @param {number} id - The user's ID.
 * @returns {Promise<Object>} An object containing the user's session details.
 */

export const session = async (id) => {
  const session = await authDao.session(id)
  if (!session) {
    throw new ClientError('No se ha encontrado al usuario', 400)
  }

  return { user: { name: session.name, picture: session.picture, role: session.role } }
}

/**
 * Generate a new access token using the refresh token.
 *
 * @param {Object} cookies - The HTTP cookies object containing the refresh token.
 * @returns {Promise<Object>} An object containing the new access token and user details.
 */

export const refreshToken = async (cookies) => {
  const refreshCookie = cookies?.jwt
  if (!refreshCookie) {
    throw new ClientError('Refresh token no encontrado', 400)
  }

  const stored = await authDao.findByToken(refreshCookie)
  if (!stored || stored.revoked) {
    // posible reuse: revocar todo y forzar login
    if (stored?.userId) await authDao.revokeAllRefreshTojeForUser(stored.userId)
    throw new ClientError('Forbidden', 403)
  }

  // rotar
  await authDao.revokeRefreshToken(stored.id) // invalidar el antiguo
  const newRefresh = await createRefreshTokenOpaque()
  await authDao.storeRefreshToken({ token: newRefresh, userId: stored.userId, issuedAt: Date.now() })

  const accessToken = await createToken({ id: stored.userId })
  // renovar csrf token también
  const csrfToken = await createCsrfToken()

  return { accessToken, csrfToken, refreshToken: newRefresh }
}

// se cambia a una rotacion de refresh token
// export const refreshToken = async (cookies) => {
//   if (!cookies.jwt) {
//     throw new ClientError('Refresh token no encontrado', 400)
//   }

//   const refreshToken = cookies.jwt
//   const user = await getUserByToken(refreshToken)
//   // console.log('user refresh', user)
//   if (!user) { throw new ClientError('Forbidden', 403) }

//   const decoded = await jwt.verify(refreshToken, dontenv('REFRESHSECRETKEY'))
//   const { id } = decoded
//   if (user.id !== id) { throw new ClientError('Forbidden', 403) }

//   const accessToken = await createToken({ id: user.id, rol: user.roles.description })

//   return { accessToken, user: { id: user.id, firstName: user.firstName, picture: user.picture, roleName: user.roles.description, roleId: user.roleId } }
// }
