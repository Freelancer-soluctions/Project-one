import * as authService from './service.js'
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js'
import globalResponse from '../../utils/responses&Errors/globalResponse.js'
import crypto from 'crypto'
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
  const user = await authService.signIn(body)
  // Creates Secure Cookie with refresh token
  res.cookie('jwt', user.refreshToken, { httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: 24 * 60 * 60 * 1000 /** 24 horas */ })
  // token csrtoken
  const csrfToken = crypto.randomBytes(32).toString('hex')
  res.cookie('csrfToken', csrfToken, {
    httpOnly: false, // accesible por frontend
    secure: true,
    sameSite: 'none',
    path: '/'
  })
  delete user.refreshToken
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
  const data = await authService.refreshToken(cookies)
  globalResponse(res, 200, data)
})

/**
 * Log out the user.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {void} Close the user session.
 */

export const logOut = (req, res) => {
  // Clear the refresh token cookie
  res.cookie('jwt', '', { httpOnly: true, secure: true, sameSite: 'none', path: '/', expires: new Date(0) })
  globalResponse(res, 200, { message: 'Logged out successfully' })
}

/**
 * Cambio de contraseña
 *
 *
 */
