import { Router } from 'express'
import {
  Providers,
  ProvidersFilters
} from '../../utils/joiSchemas/joi.js'
import * as providersController from './controller.js'
import { verifyToken, validateQueryParams, validateSchema } from '../../middleware'

const router = Router()
// uso global de middleware
router.use(verifyToken)

/**
 * @openapi
 * /api/v1/providers:
 *   get:
 *     tags:
 *       - Providers
 *     security:
 *       - bearerAuth: []
 *     summary: "Obtener providers"
 *     description: "Obtiene la lista de providers.Se puede filtrar usando 'ProvidersFilters'."
 *     parameters:
 *       - in: query
 *         name: filters
 *         schema:
 *           $ref: "#/components/schemas/ProvidersFilters"
 *         required: false
 *         description: "Filtros opcionales para buscar providers."
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Some success message"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/ResponseGetProductProvider"
 *       401:
 *         description: "Unauthorized"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Unauthorized"
 *       5XX:
 *         description: "FAILED"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */

router.get(
  '/',
  validateQueryParams(ProvidersFilters),
  providersController.getAllProviders
)

/**
 * @openapi
 * /api/v1/providers:
 *   post:
 *     tags:
 *       - Providers
 *     security:
 *       - bearerAuth: []
 *     summary: "Crea un proveedor"
 *     description: "Este endpoint requiere autenticación. El userId se extrae automáticamente del token JWT."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/BodyProviderCreateUpdate"
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 statusCode:
 *                   type: integer
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: "Some success message"
 *                 data:
 *                   $ref: "#/components/schemas/ResponseProviderCreateUpdate"
 *       401:
 *         description: "Unauthorized"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Unauthorized"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */

router.post(
  '/',
  validateSchema(Providers),
  providersController.createProvider
)

/**
 * @openapi
 * /api/v1/providers/{id}:
 *   put:
 *     tags:
 *       - Providers
 *     security:
 *       - bearerAuth: []
 *     summary: "Actualiza un proveedor"
 *     description: "Este endpoint requiere autenticación. El userId se extrae automáticamente del token JWT."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "ID del evento a actualizar."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/BodyProviderCreateUpdate"
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 statusCode:
 *                   type: int
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Some success message"
 *                 data:
 *                   $ref: "#/components/schemas/ResponseProviderCreateUpdate"
 *       401:
 *         description: "Unauthorized"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Unauthorized"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *
 */
router.put(
  '/:id',
  validateSchema(Providers),
  providersController.updateProviderById
)

/**
 * @openapi
 * /api/v1/provider/{id}:
 *   delete:
 *     tags:
 *       - Providers
 *     security:
 *       - bearerAuth: []
 *     summary: "Elimina un proveedor"
 *     description: "Este endpoint requiere autenticación. El userId se extrae automáticamente del token JWT."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "ID del evento a eliminar."
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Delete"
 *       401:
 *         description: "Unauthorized"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Unauthorized"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */

router.delete('/:id', providersController.deleteProviderById)

export default router
