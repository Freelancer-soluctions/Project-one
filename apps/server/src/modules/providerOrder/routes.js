import { Router } from 'express'
import * as providerOrderController from './controller.js'
import {
  validateCreateProviderOrder,
  validateUpdateProviderOrder,
  checkRoleAuthOrPermisssion
} from './schemas.js'
import {
  verifyToken,
  validateQueryParams,
  validateSchema, checkRoleAuthOrPermisssion
} from '../../middleware/index.js'
import { ROLESCODES, PERMISSIONCODES } from '../../utils/constants/enums.js'

const router = Router()
// uso global de middleware
router.use(verifyToken)


// falta los esquemas
router.get(
  '/',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER, ROLESCODES.USER],
    permissions: [PERMISSIONCODES.canViewProviderOrder]
  }),
  providerOrderController.getAllProviderOrders
)
router.post(
  '/',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER],
    permissions: [PERMISSIONCODES.canCreateProviderOrder]
  }),
  validateCreateProviderOrder,
  providerOrderController.createProviderOrder
)
router.put(
  '/:id',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER, ROLESCODES.USER],
    permissions: [PERMISSIONCODES.canEditProviderOrder]
  }),
  validateUpdateProviderOrder,
  providerOrderController.updateProviderOrderById
)
router.delete(
  '/:id',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER, ROLESCODES.USER],
    permissions: [PERMISSIONCODES.canDeleteProviderOrder]
  }),
  providerOrderController.deleteProviderOrderById
)

export default router
