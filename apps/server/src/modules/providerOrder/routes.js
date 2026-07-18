import { Router } from 'express';
import * as providerOrderController from './controller.js';

import {
  verifyToken,
  validateQueryParams,
  validateSchema,
  checkRoleAuthOrPermisssion,
  validatePathParam,
} from '../../middleware/index.js';
import { ROLESCODES, PERMISSIONCODES } from '../../utils/constants/enums.js';
import { providerOrderUpdateSchema } from './schemas/providerOrder.joi.js';

const router = Router();
// uso global de middleware
router.use(verifyToken);

// falta los esquemas
router.get(
  '/',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER, ROLESCODES.USER],
    permissions: [PERMISSIONCODES.canViewProviderOrder],
  }),
  validateQueryParams(),
  providerOrderController.getAllProviderOrders
);
router.post(
  '/',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER],
    permissions: [PERMISSIONCODES.canCreateProviderOrder],
  }),
  validateSchema(),
  providerOrderController.createProviderOrder
);
router.patch(
  '/:id',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER, ROLESCODES.USER],
    permissions: [PERMISSIONCODES.canEditProviderOrder],
  }),
  validatePathParam,
  validateSchema(providerOrderUpdateSchema),
  providerOrderController.updateProviderOrderById
);
router.delete(
  '/:id',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER, ROLESCODES.USER],
    permissions: [PERMISSIONCODES.canDeleteProviderOrder],
  }),
  validatePathParam,
  providerOrderController.deleteProviderOrderById
);

export default router;
