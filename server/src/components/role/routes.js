import { Router } from 'express'
import { Role, RoleArray, RoleUpdate } from '../../utils/joiSchemas/joi.js'
import validateSchema from '../../middleware/validateSchema.js'
import * as roleController from './controller.js'
import verifyToken from '../../middleware/verifyToken.js'
const router = Router()

router.get('/', verifyToken, roleController.getAll)

router.get('/:id', verifyToken, roleController.getOneById)

router.get('/role-code/:code', verifyToken, roleController.getOneByCode)

router.post('/', verifyToken, validateSchema(Role), roleController.createOne)

router.post('/bulk', validateSchema(RoleArray), roleController.createMany)

router.put('/:id', validateSchema(RoleUpdate), roleController.updateById)

router.put('/code/:code', validateSchema(RoleUpdate), roleController.updateByCode)

router.delete('/:id', roleController.deleteById)

router.delete('/code/:code', roleController.deleteByCode)

export default router
