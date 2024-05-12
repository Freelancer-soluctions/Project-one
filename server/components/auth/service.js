import * as authDao from './dao.js'
import createToken from '../../utils/jwt/createToken.js'
import ClientError from '../../utils/responses&Errors/errors.js'
import { rolesCodes } from '../../utils/constants/enums.js'
import { getUserRegisteredByEmail, getRoleByCode } from '../users/dao.js'
import { encryptPassword, comparePassword } from '../../utils/bcrypt/encrypt.js'

/**  sign up
 * @param {object} user
*/
export const signUp = async (user) => {
  // get the user role id
  const role = await getRoleByCode(rolesCodes.user)
  user.roleId = role.id
  // encryt password
  user.password = encryptPassword(user.password)
  // verify if the email is already registered
  const emailExists = await getUserRegisteredByEmail(user.email)
  if (emailExists) {
    throw new ClientError('Este correo ya esta registrado.', 400)
  }
  const userSaved = await authDao.signUp(user)
  // create the token
  const token = await createToken(userSaved.id)
  return { token, user: { name: userSaved.name, picture: userSaved.picture, role: userSaved.role } }
}

/**  sign in
 * @param {object} user
*/
export const signIn = async (user) => {
  const { email, password } = user

  // verify if the user is already registered
  const userExists = await signIn(email)
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

  const token = await createToken(userExists.id)
  return { token, user: { id: userExists.id, name: userExists.name, picture: userExists.picture, role: userExists.role } }
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
