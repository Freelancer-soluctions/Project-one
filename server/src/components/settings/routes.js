import { Router } from 'express'
import {
  SettingsLanguage,
  SettingsDisplay,
  SettingsProductCategoryFilters,
  SettingsProductCategoryCreate,
  SettingsProductCategoryUpdate
} from '../../utils/joiSchemas/joi.js'
import * as settingsController from './controller.js'
import { verifyToken, validateQueryParams, validateSchema } from '../../middleware'

const router = Router()
// uso global de middleware
router.use(verifyToken)

/**
 * @openapi
 * /api/v1/settings/{id}:
 *   get:
 *     tags:
 *       - Settings
 *     security:
 *       - bearerAuth: []
 *     summary: "Obtener configuración por ID"
 *     description: "Este endpoint requiere autenticación. Obtiene la configuración específica según el ID proporcionado."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "ID de la configuración a obtener."
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
 *                   $ref: "#/components/schemas/SettingsResponse"
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
router.get('/:id', settingsController.getSettingsById)
/**
 * @openapi
 * /api/v1/settings/language:
 *   post:
 *     tags:
 *       - Settings
 *     security:
 *       - bearerAuth: []
 *     summary: "Crear o actualizar configuración de idioma"
 *     description: "Este endpoint requiere autenticación. Crea o actualiza la configuración de idioma para el usuario."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/SettingsLanguage"
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
 *                   example: "Language settings updated successfully"
 *                 data:
 *                   $ref: "#/components/schemas/SettingsResponse"
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
  '/language/',
  validateSchema(SettingsLanguage),
  settingsController.createOrUpdateSettingsLanguage
)
/**
 * @openapi
 * /api/v1/settings/display:
 *   post:
 *     tags:
 *       - Settings
 *     security:
 *       - bearerAuth: []
 *     summary: "Crear o actualizar configuración de visualización"
 *     description: "Este endpoint requiere autenticación. Crea o actualiza la configuración de visualización para el usuario."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/SettingsDisplay"
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
 *                   example: "Display settings updated successfully"
 *                 data:
 *                   $ref: "#/components/schemas/SettingsResponse"
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
  '/display/',
  validateSchema(SettingsDisplay),
  settingsController.createOrUpdateSettingsDisplay
)

/**
 * @openapi
 * /api/v1/settings/product/categories:
 *   get:
 *     tags:
 *       - Settings Product Categories
 *     security:
 *       - bearerAuth: []
 *     summary: "Obtener categorías de productos"
 *     description: "Obtiene la lista de categorías de productos.Se puede filtrar usando 'ProductCategoryFilters'."
 *     parameters:
 *       - in: query
 *         name: filters
 *         schema:
 *           $ref: "#/components/schemas/ProductCategoryFilters"
 *         required: false
 *         description: "Filtros opcionales para buscar categorías de productos."
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
 *                     $ref: "#/components/schemas/ResponseGetProductCategories"
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
  '/product/categories',
  validateQueryParams(SettingsProductCategoryFilters),
  settingsController.getAllProductCategories
)

/**
 * @openapi
 * /api/v1/settings/product/categories:
 *   post:
 *     tags:
 *       - Settings Product Categories
 *     security:
 *       - bearerAuth: []
 *     summary: "Crea una categoría de producto"
 *     description: "Este endpoint requiere autenticación. El userId se extrae automáticamente del token JWT."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/BodyProductCategoryCreate"
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
 *                   $ref: "#/components/schemas/ResponseGetProductCategories"
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
  '/product/categories',
  validateSchema(SettingsProductCategoryCreate),
  settingsController.createProductCategory
)

/**
 * @openapi
 * /api/v1/settings/product/categories/{id}:
 *   put:
 *     tags:
 *       - Settings Product Categories
 *     security:
 *       - bearerAuth: []
 *     summary: "Actualiza una categoría de producto"
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
 *             $ref: "#/components/schemas/BodyProductCategoryUpdate"
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
 *                   $ref: "#/components/schemas/ResponseProductCategoryCreateUpdate"
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
  '/product/categories/:id',
  validateSchema(SettingsProductCategoryUpdate),
  settingsController.updateProductCategoryById
)

/**
 * @openapi
 * /api/v1/settings/product/categories/{id}:
 *   delete:
 *     tags:
 *       - Settings Product Categories
 *     security:
 *       - bearerAuth: []
 *     summary: "Elimina una categoría de producto"
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
router.delete(
  '/product/categories/:id',
  settingsController.deleteProductCategoryById
)

export default router
