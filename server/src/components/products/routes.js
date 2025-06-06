import { Router } from 'express'
import {
  Products,
  ProductsUpdate,
  ProductsFilters,
  ProductAttributes
} from '../../utils/joiSchemas/joi.js'
import * as productsController from './controller.js'
import { verifyToken, validateQueryParams, validateSchema, checkRoleAuth } from '../../middleware/index.js'

const router = Router()
// uso global de middleware
router.use(verifyToken)
router.use(checkRoleAuth(['C02']))

router.get(
  '/',
  validateQueryParams(ProductsFilters),
  productsController.getAllProducts
)

router.get('/status', productsController.getAllProductStatus)

router.get('/category', productsController.getAllProductCategories)

router.get('/providers', productsController.getAllProductProviders)

router.post(
  '/',
  validateSchema(Products),
  productsController.createOne
)

router.put(
  '/:id',
  validateSchema(ProductsUpdate),
  productsController.updateById
)

router.delete('/:id', productsController.deleteById)

router.get('/attributes/:id', productsController.getAllProductAttributesByProductId)

router.post(
  '/attributes/',
  validateSchema(ProductAttributes),
  productsController.saveProductAttributes
)

router.delete('/attributes/:id', productsController.deleteProductsAttributeById)

export default router
