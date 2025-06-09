import { Router } from 'express'
import * as providerOrderController from './controller.js'
import { validateCreateProviderOrder, validateUpdateProviderOrder, checkRoleAuth } from './schemas.js'
import { verifyToken, validateQueryParams, validateSchema } from '../../middleware/index.js'
import { rolesCodes } from '../../utils/constants/enums.js'

const router = Router()
// uso global de middleware
router.use(verifyToken)
router.use(checkRoleAuth([rolesCodes.ADMIN, rolesCodes.MANAGER]))

router.get('/', providerOrderController.getAllProviderOrders)
router.post('/', validateCreateProviderOrder, providerOrderController.createProviderOrder)
router.put('/:id', validateUpdateProviderOrder, providerOrderController.updateProviderOrderById)
router.delete('/:id', providerOrderController.deleteProviderOrderById)

export default router
