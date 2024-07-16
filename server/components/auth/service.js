import * as authDao from './dao.js'
import { createToken, createRefreshToken } from '../../utils/jwt/createToken.js'
import ClientError from '../../utils/responses&Errors/errors.js'
import { rolesCodes } from '../../utils/constants/enums.js'
import { getUserRegisteredByEmail } from '../users/dao.js'
import * as roleService from '../role/service.js'
import { encryptPassword, comparePassword } from '../../utils/bcrypt/encrypt.js'
import jwt from 'jsonwebtoken'
import dontenv from '../../config/dotenv.js'

/**  sign up
 * @param {object} user
*/
export const signUp = async (user) => {
  // get the user role id
  const role = await roleService.getOneByCode(rolesCodes.user)
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
  const token = await createToken(userSaved.id)
  return { accessToken: token, user: { id: userSaved.id, firstName: userSaved.firstName, picture: userSaved.picture, role: userSaved.roleId } }
}

/**  sign in
 * @param {object} user
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
  const token = await createToken(userExists.id)
  const refreshToken = await createRefreshToken(userExists.id)
  // save the user with refresh token
  await authDao.saveRefreshToken(refreshToken, userExists.id)
  return { accessToken: token, refreshToken, user: { id: userExists.id, firstName: userExists.firstName, picture: userExists.picture, roleName: userExists.roles.description, roleId: userExists.roleId } }
}

/**  get session by id
 * @param {id} id
*/
export const session = async (id) => {
  const session = await authDao.session(id)
  if (!session) {
    throw new ClientError('No se ha encontrado al usuario', 400)
  }

  return { user: { name: session.name, picture: session.picture, role: session.role } }
}

/**  generate a new access token
 * @param {string} token
*/
export const refreshToken = async (cookies) => {
  if (!cookies.jwt) {
    throw new ClientError('Refresh token no encontrado', 400)
  }
  const refreshToken = cookies.jwt
  const user = await authDao.getUserByToken(refreshToken)

  if (!user) { throw new ClientError('Forbidden', 403) }

  const decoded = await jwt.verify(refreshToken, dontenv('REFRESHSECRETKEY'))
  const { id } = decoded
  if (user.id !== id) { throw new ClientError('Forbidden', 403) }

  const accessToken = await createToken(user.id)
  return { accessToken, user: { id: user.id, firstName: user.firstName, picture: user.picture, roleName: user.roles.description, roleId: user.roleId } }
}
