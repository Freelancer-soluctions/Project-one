import { Router } from 'express'
import {
  Providers,
  ProductsUpdate,
  ProvidersFilters,
  ProductAttributes
} from '../../utils/joiSchemas/joi.js'
import * as providersController from './controller.js'
import validateQueryParams from '../../middleware/validateQueryParams.js'
import validateSchema from '../../middleware/validateSchema.js'
import verifyToken from '../../middleware/verifyToken.js'

const router = Router()

router.get(
  '/',
  verifyToken,
  validateQueryParams(ProvidersFilters),
  providersController.getAllProviders
)

router.post(
  '/',
  verifyToken,
  validateSchema(Providers),
  providersController.createProvider
)

router.put(
  '/:id',
  verifyToken,
  validateSchema(ProductsUpdate),
  providersController.updateById
)

router.delete('/:id', verifyToken, providersController.deleteById)

router.get('/attributes/:id', providersController.getAllProductAttributesByProductId)

router.post(
  '/attributes/',
  verifyToken,
  validateSchema(ProductAttributes),
  providersController.saveProductAttributes
)

router.delete('/attributes/:id', verifyToken, providersController.deleteProductsAttributeById)

export default router
