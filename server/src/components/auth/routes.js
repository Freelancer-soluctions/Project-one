import { Router } from 'express'
import * as authController from './controller.js'
import verifyToken from '../../middleware/verifyToken.js'
import { SignUpSchema, SignInSchema } from '../../utils/joiSchemas/joi.js'
import validateSchema from '../../middleware/validateSchema.js'

const router = Router()

router.post('/signup', validateSchema(SignUpSchema), authController.signUp)

router.post('/signin', validateSchema(SignInSchema), authController.signIn)

router.get('/session', verifyToken, authController.session)

router.get('/refresh-token', authController.refreshToken)

export default router

// validar esquemas
// hacer todas las capas
