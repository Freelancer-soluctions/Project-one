import { Router } from 'express';
import {
  Products,
  ProductsUpdate,
  ProductsFilters,
  ProductAttributes,
} from '../../utils/joiSchemas/joi.js';
import * as productsController from './controller.js';
import {
  verifyToken,
  validateQueryParams,
  validateSchema,
  checkRoleAuthOrPermisssion,
  validatePathParam,
} from '../../middleware/index.js';
import { ROLESCODES, PERMISSIONCODES } from '../../utils/constants/enums.js';

const router = Router();
// uso global de middleware
router.use(verifyToken);

router.get(
  '/',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER, ROLESCODES.USER],
    permissions: [PERMISSIONCODES.canViewProduct],
  }),
  validateQueryParams(ProductsFilters),
  productsController.getAllProducts
);

router.get(
  '/',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER, ROLESCODES.USER],
    permissions: [PERMISSIONCODES.canViewProduct],
  }),
  productsController.getAllProductsFilters
);

router.get(
  '/status',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER, ROLESCODES.USER],
    permissions: [PERMISSIONCODES.canViewProduct],
  }),
  productsController.getAllProductStatus
);

router.get(
  '/category',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER, ROLESCODES.USER],
    permissions: [PERMISSIONCODES.canViewProduct],
  }),
  productsController.getAllProductCategories
);

router.post(
  '/',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER],
    permissions: [PERMISSIONCODES.canCreateProduct],
  }),
  validateSchema(Products),
  productsController.createOne
);

router.put(
  '/:id',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER],
    permissions: [PERMISSIONCODES.canEditProduct],
  }),
  validatePathParam,
  validateSchema(ProductsUpdate),
  productsController.updateById
);

router.delete(
  '/:id',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER],
    permissions: [PERMISSIONCODES.canDeleteProduct],
  }),
  validatePathParam,
  productsController.deleteById
);

router.get(
  '/attributes/:id',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER, ROLESCODES.USER],
    permissions: [PERMISSIONCODES.canViewProduct],
  }),
  validatePathParam,
  productsController.getAllProductAttributesByProductId
);

router.post(
  '/attributes/',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER],
    permissions: [PERMISSIONCODES.canCreateProduct],
  }),
  validateSchema(ProductAttributes),
  productsController.saveProductAttributes
);

router.delete(
  '/attributes/:id',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER],
    permissions: [PERMISSIONCODES.canDeleteProduct],
  }),
  validatePathParam,
  productsController.deleteProductsAttributeById
);

export default router;
