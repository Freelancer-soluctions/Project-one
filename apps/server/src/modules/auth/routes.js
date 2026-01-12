import { Router } from 'express'
import * as authController from './controller.js'
import { verifyToken, validateSchema, loginLimiter, refreshTokenLimiter } from '../../middleware/index.js'
import { SignUpSchema, SignInSchema } from '../../utils/joiSchemas/joi.js'
import { verifyCsrf } from '../../middleware/verifyCsrf.js'

const router = Router()

router.post('/signup', validateSchema(SignUpSchema), authController.signUp)

router.post('/signin', loginLimiter, validateSchema(SignInSchema), authController.signIn)

router.get('/session', verifyToken, authController.session)

router.post('/refresh-token', refreshTokenLimiter, verifyCsrf, authController.refreshToken)

// router.post('/change-password',
//   verifyToken,
//   changePasswordLimiter,
//   validateSchema(ChangePasswordSchema),
//   authController.changePassword
// )

// router.post('/forgot-password',
//   forgotPasswordLimiter,
//   validateSchema(ForgotPasswordSchema),
//   authController.forgotPassword
// )

export default router

// validar esquemas
// hacer todas las capas
