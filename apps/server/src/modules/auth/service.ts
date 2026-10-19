import * as authDao from './dao.js';
import { getUserRegisteredByEmail, getUserRoleByCode } from '../users/dao.js';
import {
  createToken,
  createRefreshTokenOpaque,
} from '../../utils/jwt/createToken.js';
import { createCsrfToken } from '../../utils/csrftoken/csrfToken.js';
import ClientError from '../../utils/responses&Errors/errors.js';
import { ROLESCODES } from '../../utils/constants/enums.js';
import {
  encryptPassword,
  comparePassword,
  validatePasswordStrength,
} from '../../utils/bcrypt/encrypt.js';
import logger from '../../logger/index.js';
import type { Request } from 'express';
import type {
  AuthCookies,
  AuthTokenPayload,
  RefreshTokenResult,
  SessionResult,
  SignInInput,
  SignInResult,
  SignUpInput,
  SignUpResult,
} from './types.js';
// import jwt from 'jsonwebtoken'
// import dontenv from '../../config/dotenv.js'

/**
 * Sign up a new user.
 *
 * @param {Object} user - The user object containing user details.
 * @param {string} user.email - User email address
 * @param {string} user.password - User password
 * @param {string} user.firstName - User first name
 * @param {string} user.picture - User profile picture URL
 * @returns {Promise<Object>} An object containing the access token and user details.
 * @throws {ClientError} When password is too weak (400)
 * @throws {ClientError} When email is already registered (400)
 */
export const signUp = async (user: SignUpInput): Promise<SignUpResult> => {
  // get the user role id
  const role = await getUserRoleByCode(ROLESCODES.USER);
  user.roleId = role?.id;

  // validacion de fuerza en contrase�a
  if (!validatePasswordStrength(user.password)) {
    throw new ClientError(
      'La contrase�a es demasiado d�bil. Intenta con una m�s segura.',
      400
    );
  }
  // encryt password
  // Cast controlado: `encryptPassword` es async y el valor que sigue viajando al
  // dao es la promesa (comportamiento actual de la ruta; convertirlo en `await`
  // sería un bugfix fuera del alcance de este change type-only).
  user.password = encryptPassword(user.password) as unknown as string;
  // verify if the email is already registered
  const emailExists = await getUserRegisteredByEmail(user.email);
  if (Object.keys(emailExists).length) {
    throw new ClientError('Este correo ya esta registrado.', 400);
  }
  const userSaved = await authDao.signUp(user);
  // create the token
  const payload: AuthTokenPayload = { id: userSaved.id, rol: { ...role } };
  const token = await createToken(payload);
  return {
    accessToken: token,
    user: {
      id: userSaved.id,
      firstName: userSaved.firstName,
      picture: userSaved.picture,
      role: userSaved.roleId,
    },
  };
};

/**
 * Sign in an existing user.
 *
 * @param {Object} user - The user object containing email and password.
 * @param {string} user.email - User email address
 * @param {string} user.password - User password
 * @param {Object} req - The HTTP request object.
 * @param {string} req.ip - Client IP address
 * @param {string} req.headers ['user-agent'] - Client user agent
 * @returns {Promise<Object>} An object containing the access token, refresh token, and user details.
 * @throws {ClientError} When email is not registered (400)
 * @throws {ClientError} When password is invalid (400)
 */
export const signIn = async (
  user: SignInInput,
  req: Request
): Promise<SignInResult> => {
  const { email, password } = user;

  // verify if the user is already registered
  const userExists = await authDao.signIn(email);
  if (!userExists) {
    throw new ClientError('Este correo no esta registrado.', 400);
  }

  // comparar el pasword
  const validPassword = await comparePassword(password, userExists.password);

  if (!validPassword) {
    throw new ClientError('Contrase�a invalida.', 400);
  }
  // create the token
  const payload: AuthTokenPayload = {
    id: userExists.id,
    rol: { ...userExists.roles },
  };
  const token = await createToken(payload);
  // `createRefreshTokenOpaque` aún resuelve `unknown` (util de F3): cast controlado
  const refreshToken = (await createRefreshTokenOpaque()) as string;
  // save the user refresh token
  await authDao.storeRefreshToken({
    token: refreshToken,
    userId: userExists.id,
    issuedAt: Date.now(),
  });

  // create csrf token
  // `createCsrfToken` aún resuelve `unknown` (util de F3): cast controlado
  const csrfToken = (await createCsrfToken()) as string;
  // Log de login exitoso
  logger.info('? LOGIN EXITOSO', {
    userId: userExists.id,
    email: userExists.email,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
  return {
    accessToken: token,
    refreshToken,
    csrfToken,
    user: {
      id: userExists.id,
      firstName: userExists.firstName,
      picture: userExists.picture,
      roleName: userExists.roles.description,
      roleId: userExists.roleId,
    },
  };
};

/**
 * Retrieve the user session by ID.
 *
 * @param {number} id - The user's ID.
 * @returns {Promise<Object>} An object containing the user's session details.
 * @throws {ClientError} When user is not found (400)
 */

export const session = async (id: number): Promise<SessionResult> => {
  const session = await authDao.session(id);
  if (!session) {
    throw new ClientError('No se ha encontrado al usuario', 400);
  }

  return {
    user: { name: session.name, picture: session.picture, role: session.role },
  };
};

/**
 * Generate a new access token using the refresh token.
 *
 * @param {Object} cookies - The HTTP cookies object containing the refresh token.
 * @param {string} cookies.jwt - HTTP-only refresh token cookie
 * @param {Object} req - The HTTP request object.
 * @param {string} req.ip - Client IP address
 * @param {string} req.headers['user-agent'] - Client user agent
 * @returns {Promise<Object>} An object containing the new access token and user details.
 * @throws {ClientError} When refresh token is not found (400)
 * @throws {ClientError} When refresh token reuse is detected (403)
 */

export const refreshToken = async (
  cookies: AuthCookies | undefined,
  req: Request
): Promise<RefreshTokenResult> => {
  const refreshCookie = cookies?.jwt;
  if (!refreshCookie) {
    // ?? LOGGING: Intento sin refresh token
    logger.warn('?? INTENTO DE REFRESH SIN TOKEN', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString(),
    });
    throw new ClientError('Refresh token no encontrado', 400);
  }

  const stored = await authDao.findByToken(refreshCookie);
  if (!stored || stored.revoked) {
    // ?? LOGGING CR�TICO: Token reuse detectado
    logger.error('?? INTENTO DE REUSO DE REFRESH TOKEN DETECTADO', {
      ip: req.ip,
      userId: stored?.userId || 'unknown',
      token: refreshCookie.substring(0, 10) + '...', // Solo primeros 10 chars
      revoked: stored?.revoked || false,
      revokedAt: stored?.revokedAt || null,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString(),
    });
    // posible reuse: revocar todo y forzar login
    console.log('stored user', stored.userId);
    if (stored?.userId)
      await authDao.revokeAllRefreshTojeForUser(stored.userId);
    throw new ClientError('Forbidden', 403);
  }

  // rotar
  await authDao.revokeRefreshToken(stored.id); // invalidar el antiguo
  // `createRefreshTokenOpaque` aún resuelve `unknown` (util de F3): cast controlado
  const newRefresh = (await createRefreshTokenOpaque()) as string;
  await authDao.storeRefreshToken({
    token: newRefresh,
    userId: stored.userId,
    issuedAt: Date.now(),
  });

  const refreshPayload: AuthTokenPayload = { id: stored.userId };
  const accessToken = await createToken(refreshPayload);
  // renovar csrf token tambi�n
  // `createCsrfToken` aún resuelve `unknown` (util de F3): cast controlado
  const csrfToken = (await createCsrfToken()) as string;

  return { accessToken, csrfToken, refreshToken: newRefresh };
};

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

/**
 * Revocar refresh token
 *
 * @param {Object} cookies - The HTTP cookies object containing the refresh token.
 * @param {string} [cookies.jwt] - HTTP-only refresh token cookie to revoke
 * @returns {Promise<boolean>} True when logout is successful
 */

export const logout = async (
  cookies: AuthCookies | undefined
): Promise<boolean> => {
  // ? Revocar token en BD si existe
  const refreshCookie = cookies?.jwt;

  if (refreshCookie) {
    const stored = await authDao.findByToken(refreshCookie);
    if (stored && !stored.revoked) {
      await authDao.revokeRefreshToken(stored.id);
    }
  }

  return true;
};
