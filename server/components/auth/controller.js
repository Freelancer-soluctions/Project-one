import * as authService from './service.js'
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js'
import globalResponse from '../../utils/responses&Errors/globalResponse.js'

/**  sign up
 * @param {*} res
 * @param {*} req
 */
export const signUp = handleCatchErrorAsync(async (req, res) => {
  const { body } = req
  const user = await authService.signUp(body)
  globalResponse(res, 201, user)
})

/**  sign in
 * @param {*} res
 * @param {*} req
 */
export const signIn = handleCatchErrorAsync(async (req, res) => {
  const body = req.body
  const user = await authService.signIn(body)
  // Creates Secure Cookie with refresh token
  res.cookie('jwt', user.refreshToken, { httpOnly: true, secure: true, sameSite: 'None', maxAge: 24 * 60 * 60 * 1000 })
  delete user.refreshToken
  globalResponse(res, 200, user)
})

/**  session
 * @param {*} res
 * @param {*} req
 */
export const session = handleCatchErrorAsync(async (req, res) => {
  const userId = req.userId
  console.log('hola user', userId)
  const userSession = await authService.session(userId)
  globalResponse(res, 200, userSession)
})

/**
 * Refresh token
 * @param {*} res
 * @param {*} req
 */
export const refreshToken = handleCatchErrorAsync(async (req, res) => {
  const cookies = req.cookies
  const data = await authService.refreshToken(cookies)
  globalResponse(res, 200, data)
})
