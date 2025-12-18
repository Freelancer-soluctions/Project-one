import * as authService from './service.js'
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js'
import globalResponse from '../../utils/responses&Errors/globalResponse.js'
import dotenv from '../../config/dotenv.js'

const isProduction = dotenv('NODE_ENV') === 'production'

/**
 * Handle user sign-up.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} A user object.
 */
export const signUp = handleCatchErrorAsync(async (req, res) => {
  const { body } = req
  const user = await authService.signUp(body)
  globalResponse(res, 201, user)
})

/**
 * Handle user sign-in.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} A user object.
 */
export const signIn = handleCatchErrorAsync(async (req, res) => {
  const body = req.body
  const user = await authService.signIn(body, req)
  // Creates Secure Cookie with refresh token
  res.cookie('jwt', user.refreshToken, {
    httpOnly: true,
    secure: true, // <-- en LOCAL debe ser false, en produccion debe de ser true
    sameSite: 'none',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000 /** 24 horas */
  })
  // token csrtoken
  res.cookie('csrfToken', user.csrfToken, {
    httpOnly: false, // accesible por frontend
    secure: true, //  <-- en LOCAL debe ser false, en produccion debe de ser true
    sameSite: 'none',
    path: '/'
  })
  // eliminacion del objeto user antes de enviar una respuesta
  delete user.refreshToken
  delete user.csrfToken

  globalResponse(res, 200, user)
})

/**
 * Retrieve the user session.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} A user object.
 */
export const session = handleCatchErrorAsync(async (req, res) => {
  const userId = req.userId
  const userSession = await authService.session(userId)
  globalResponse(res, 200, userSession)
})

/**
 * Refresh the user token.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} A new user token.
 */
export const refreshToken = handleCatchErrorAsync(async (req, res) => {
  const cookies = req.cookies
  const data = await authService.refreshToken(cookies, req)
  // Creates Secure Cookie with refresh token
  res.cookie('jwt', data.refreshToken, {
    httpOnly: true, // para que no sea accesible por frontend
    secure: true, // <-- en LOCAL debe ser false, en produccion debe de ser true
    sameSite: 'none',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000 /** 24 horas */
  })
  // token csrtoken
  res.cookie('csrfToken', data.csrfToken, {
    httpOnly: false, // accesible por frontend
    secure: true, // <-- en LOCAL debe ser false, en produccion debe de ser true
    sameSite: 'none',
    path: '/'
  })
  // eliminacion del objeto user antes de enviar una respuesta
  delete data.refreshToken
  delete data.csrfToken
  globalResponse(res, 200, { accessToken: data.accessToken })
})

/**
 * Log out the user.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {void} Close the user session.
 */

export const logOut = handleCatchErrorAsync(async (req, res) => {
  // Clear the refresh token cookie
  const cookies = req.cookies
  // reviocar refresh token
  await authService.logout(cookies)
  res.cookie('jwt', '', {
    httpOnly: true,
    secure: isProduction, // <-- en LOCAL debe ser false, en produccion debe de ser true
    sameSite: 'none',
    path: '/',
    expires: new Date(0)
  })
  globalResponse(res, 200, { message: 'Logged out successfully' })
})

/**
 * Cambio de contraseña
 *
 *
 */
export const changePassword = () => {}
