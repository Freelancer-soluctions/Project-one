import express from 'express';
import {
  getAllPurchases,
  createPurchase,
  updatePurchaseById,
  deletePurchaseById,
} from './controller.js';
import {
  verifyToken,
  validateQueryParams,
  validateSchema,
  checkRoleAuthOrPermisssion,
  validatePathParam,
} from '../../middleware/index.js';
import {
  purchaseFiltersSchema,
  purchaseCreateUpdateSchema,
} from '../../utils/joiSchemas/joi.js';
import { ROLESCODES, PERMISSIONCODES } from '../../utils/constants/enums.js';

const router = express.Router();
// uso global de middleware
router.use(verifyToken);

/**
 * @openapi
 * /v1/purchases:
 *   get:
 *     tags:
 *       - Purchases
 *     summary: Get all purchases with optional filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: providerId
 *         schema:
 *           type: integer
 *         description: Filter by provider ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by end date
 *       - in: query
 *         name: minTotal
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Filter by minimum total
 *       - in: query
 *         name: maxTotal
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Filter by maximum total
 *     responses:
 *       200:
 *         description: List of purchases retrieved successfully
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
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ResponseGetPurchase'
 *       401:
 *         $ref: '#/components/schemas/Unauthorized'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get(
  '/',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER],
    permissions: [PERMISSIONCODES.canViewPurchase],
  }),
  validateQueryParams(purchaseFiltersSchema),
  getAllPurchases
);

/**
 * @openapi
 * /v1/purchases:
 *   post:
 *     tags:
 *       - Purchases
 *     summary: Create a new purchase
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BodyPurchaseCreate'
 *     responses:
 *       201:
 *         description: Purchase created successfully
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
 *                 data:
 *                   $ref: '#/components/schemas/ResponsePurchaseCreate'
 *       401:
 *         $ref: '#/components/schemas/Unauthorized'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.post(
  '/',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER],
    permissions: [PERMISSIONCODES.canCreatePurchase],
  }),
  validateSchema(purchaseCreateUpdateSchema),
  createPurchase
);

/**
 * @openapi
 * /v1/purchases/{id}:
 *   put:
 *     tags:
 *       - Purchases
 *     summary: Update a purchase by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Purchase ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BodyPurchaseCreate'
 *     responses:
 *       200:
 *         description: Purchase updated successfully
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
 *                 data:
 *                   $ref: '#/components/schemas/ResponsePurchaseUpdate'
 *       401:
 *         $ref: '#/components/schemas/Unauthorized'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.put(
  '/:id',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER],
    permissions: [PERMISSIONCODES.canEditPurchase],
  }),
  validatePathParam,
  validateSchema(purchaseCreateUpdateSchema),
  updatePurchaseById
);

/**
 * @openapi
 * /v1/purchases/{id}:
 *   delete:
 *     tags:
 *       - Purchases
 *     summary: Delete a purchase by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Purchase ID
 *     responses:
 *       200:
 *         $ref: '#/components/schemas/Delete'
 *       401:
 *         $ref: '#/components/schemas/Unauthorized'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.delete(
  '/:id',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER],
    permissions: [PERMISSIONCODES.canDeletePurchase],
  }),
  validatePathParam,
  deletePurchaseById
);

export default router;
