import { Router } from 'express'
import {
  Products,
  ProductsUpdate,
  ProductsFilters,
  ProductAttributes
} from '../../utils/joiSchemas/joi.js'
import * as productsController from './controller.js'
import validateQueryParams from '../../middleware/validateQueryParams.js'
import validateSchema from '../../middleware/validateSchema.js'
import verifyToken from '../../middleware/verifyToken.js'

const router = Router()

router.get(
  '/',
  verifyToken,
  validateQueryParams(ProductsFilters),
  productsController.getAllProducts
)

router.get('/status', productsController.getAllProductStatus)

router.get('/category', productsController.getAllProductCategories)

router.get('/providers', productsController.getAllProductProviders)

router.post(
  '/',
  verifyToken,
  validateSchema(Products),
  productsController.createOne
)

router.put(
  '/:id',
  verifyToken,
  validateSchema(ProductsUpdate),
  productsController.updateById
)

router.delete('/:id', verifyToken, productsController.deleteById)

router.get('/attributes/:id', productsController.getAllProductAttributesByProductId)

router.post(
  '/attributes/',
  verifyToken,
  validateSchema(ProductAttributes),
  productsController.saveProductAttributes
)

router.delete('/attributes/:id', verifyToken, productsController.deleteProductsAttributeById)

export default router
