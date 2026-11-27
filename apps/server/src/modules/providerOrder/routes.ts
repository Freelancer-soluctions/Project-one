import express from 'express';
import {
  getAllProviderOrders,
  createProviderOrder,
  patchProviderOrderById,
  deleteProviderOrderById,
  convertProviderOrderToPurchase,
} from './controller.js';
import {
  verifyToken,
  validateQueryParams,
  validateSchema,
  checkRoleAuthOrPermisssion,
  validatePathParam,
} from '../../middleware/index.js';
import {
  providerOrderFiltersSchema,
  providerOrderCreateSchema,
  providerOrderUpdateSchema,
} from './schemas/providerOrder.joi.js';
import { ROLESCODES, PERMISSIONCODES } from '../../utils/constants/enums.js';

const router = express.Router();

// Every endpoint is fail-closed: token first, then role/permission.
router.use(verifyToken);

/**
 * @openapi
 * /v1/providerOrder:
 *   get:
 *     tags:
 *       - ProviderOrders
 *     summary: List provider orders with optional filters
 *     description: Returns a paginated list of provider orders filtered by provider and status.
 *     operationId: getProviderOrders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: supplierId
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Filter by provider ID
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/clientOrderStatus'
 *         description: Filter by order status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 1-based page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page size (clamped by the server)
 *     responses:
 *       200:
 *         description: Paginated provider orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     dataList:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ResponseGetProviderOrder'
 *                     total:
 *                       type: integer
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         $ref: '#/components/schemas/Unauthorized'
 *       403:
 *         description: Role or permission denied
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.get(
  '/',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER],
    permissions: [PERMISSIONCODES.canViewProviderOrder],
  }),
  validateQueryParams(providerOrderFiltersSchema),
  getAllProviderOrders
);

/**
 * @openapi
 * /v1/providerOrder:
 *   post:
 *     tags:
 *       - ProviderOrders
 *     summary: Create a provider order with detail lines
 *     description: Creates a provider order with at least one detail line and persists the computed total.
 *     operationId: createProviderOrder
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/providerOrderCreateSchema'
 *     responses:
 *       201:
 *         description: Provider order created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 201
 *                 data:
 *                   $ref: '#/components/schemas/ResponseGetProviderOrder'
 *       400:
 *         description: Validation failed (empty details, >2 decimals, unknown purchaseId, ...)
 *       401:
 *         $ref: '#/components/schemas/Unauthorized'
 *       403:
 *         description: Permission denied or non-ADMIN setting deliveredOn
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.post(
  '/',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER],
    permissions: [PERMISSIONCODES.canCreateProviderOrder],
  }),
  validateSchema(providerOrderCreateSchema),
  createProviderOrder
);

/**
 * @openapi
 * /v1/providerOrder/{id}:
 *   patch:
 *     tags:
 *       - ProviderOrders
 *     summary: Partially update a provider order
 *     description: Updates header fields and/or replaces detail lines, enforcing the status lifecycle and recomputing the total when details change.
 *     operationId: patchProviderOrder
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Provider order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/providerOrderUpdateSchema'
 *     responses:
 *       200:
 *         description: Provider order updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   $ref: '#/components/schemas/ResponseGetProviderOrder'
 *       400:
 *         description: Validation failed or invalid status transition (RN-ORD-011)
 *       401:
 *         $ref: '#/components/schemas/Unauthorized'
 *       403:
 *         description: Permission denied or non-ADMIN setting deliveredOn
 *       404:
 *         description: Provider order not found
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.patch(
  '/:id',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER],
    permissions: [PERMISSIONCODES.canEditProviderOrder],
  }),
  validatePathParam,
  validateSchema(providerOrderUpdateSchema),
  patchProviderOrderById
);

/**
 * @openapi
 * /v1/providerOrder/{id}:
 *   delete:
 *     tags:
 *       - ProviderOrders
 *     summary: Delete a provider order
 *     description: Deletes a provider order and its detail lines; blocked when a purchase is linked.
 *     operationId: deleteProviderOrder
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Provider order ID
 *     responses:
 *       200:
 *         description: Provider order deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Provider order deleted successfully
 *       401:
 *         $ref: '#/components/schemas/Unauthorized'
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Provider order not found
 *       409:
 *         description: Provider order is linked to a purchase (RN-ORD-007)
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.delete(
  '/:id',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER],
    permissions: [PERMISSIONCODES.canDeleteProviderOrder],
  }),
  validatePathParam,
  deleteProviderOrderById
);

/**
 * @openapi
 * /v1/providerOrder/{id}/convert:
 *   post:
 *     tags:
 *       - ProviderOrders
 *     summary: Convert a provider order into a purchase
 *     description: Creates the linked purchase and persists purchaseId in one transaction (RN-ORD-006).
 *     operationId: convertProviderOrderToPurchase
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Provider order ID
 *     responses:
 *       200:
 *         description: Provider order converted; the response carries the new purchaseId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   $ref: '#/components/schemas/ResponseGetProviderOrder'
 *       400:
 *         description: The order is cancelled and cannot be converted
 *       401:
 *         $ref: '#/components/schemas/Unauthorized'
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Provider order not found
 *       409:
 *         description: Provider order was already converted to a purchase
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.post(
  '/:id/convert',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER],
    permissions: [PERMISSIONCODES.canEditProviderOrder],
  }),
  validatePathParam,
  convertProviderOrderToPurchase
);

export default router;
