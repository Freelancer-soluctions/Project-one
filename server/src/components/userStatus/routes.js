import { Router } from 'express'
import { UserStatus, UserStatusArray, UserStatusUpdate } from '../../utils/joiSchemas/joi.js'
import validateSchema from '../../middleware/validateSchema.js'
import * as userStatusController from './controller.js'

const router = Router()

router.get('/', userStatusController.getAll)

router.get('/:id', userStatusController.getOneById)

router.get('/code/:code', userStatusController.getOneByCode)

router.post('/', validateSchema(UserStatus), userStatusController.createOne)

router.post('/bulk', validateSchema(UserStatusArray), userStatusController.createMany)

router.put('/:id', validateSchema(UserStatusUpdate), userStatusController.updateById)

router.put('/code/:code', validateSchema(UserStatusUpdate), userStatusController.updateByCode)

router.delete('/:id', userStatusController.deleteById)

router.delete('/code/:code', userStatusController.deleteByCode)

export default router
