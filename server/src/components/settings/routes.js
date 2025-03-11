import { Router } from 'express'
import {
  SettingsLanguage,
  SettingsDisplay
} from '../../utils/joiSchemas/joi.js'
import * as settingsController from './controller.js'
// import validateQueryParams from '../../middleware/validateQueryParams.js'
import validateSchema from '../../middleware/validateSchema.js'
import verifyToken from '../../middleware/verifyToken.js'

const router = Router()

router.get('/:id', verifyToken, settingsController.getSettingsById)

router.post(
  '/language/',
  verifyToken,
  validateSchema(SettingsLanguage),
  settingsController.createOrUpdateSettingsLanguage
)

router.post(
  '/display/',
  verifyToken,
  validateSchema(SettingsDisplay),
  settingsController.createOrUpdateSettingsDisplay
)

export default router
