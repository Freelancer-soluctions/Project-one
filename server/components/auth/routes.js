import { Router } from 'express'
import * as authController from './controller.js'
import { verifyToken } from '../../middleware/verifyToken.js'

const router = Router()

router.post('/signup', validateSchema(signUpSchema), authController.signUp)

router.post('/signin', validateSchema(signInSchema), authController.signIn)

router.get('/session', verifyToken, authController.session)

export default router

// validar esquemas
// hacer todas las capas
