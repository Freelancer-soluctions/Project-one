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
export const signIn = handleCatchErrorAsync(async (res, req) => {
  console.log('llegue inicio', req.body)
  const body = req.body
  const user = await authService.signIn(body)
  globalResponse(res, 200, user)
})

/**  session
 * @param {*} res
 * @param {*} req
 */
export const session = handleCatchErrorAsync(async (res, req) => {
  const userId = req.id
  const userSession = await authService.session(userId)
  globalResponse(res, 200, userSession)
})
