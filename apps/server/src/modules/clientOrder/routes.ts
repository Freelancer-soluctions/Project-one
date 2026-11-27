import express from 'express';
import {
  getAllClientOrders,
  createClientOrder,
  patchClientOrderById,
  deleteClientOrderById,
  convertClientOrderToSale,
} from './controller.js';
import {
  verifyToken,
  validateQueryParams,
  validateSchema,
  checkRoleAuthOrPermisssion,
  validatePathParam,
} from '../../middleware/index.js';
import {
  clientOrderFiltersSchema,
  clientOrderCreateSchema,
  clientOrderUpdateSchema,
} from './schemas/clientOrder.joi.js';
import { ROLESCODES, PERMISSIONCODES } from '../../utils/constants/enums.js';

const router = express.Router();

// Every endpoint is fail-closed: token first, then role/permission.
router.use(verifyToken);

/**
 * @openapi
 * /v1/clientOrder:
 *   get:
 *     tags:
 *       - ClientOrders
 *     summary: List client orders with optional filters
 *     description: Returns a paginated list of client orders filtered by client and status.
 *     operationId: getClientOrders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Filter by client ID
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
 *         description: Paginated client orders
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
 *                         $ref: '#/components/schemas/ResponseGetClientOrder'
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
    permissions: [PERMISSIONCODES.canViewClientOrder],
  }),
  validateQueryParams(clientOrderFiltersSchema),
  getAllClientOrders
);

/**
 * @openapi
 * /v1/clientOrder:
 *   post:
 *     tags:
 *       - ClientOrders
 *     summary: Create a client order with detail lines
 *     description: Creates a client order with at least one detail line and persists the computed total.
 *     operationId: createClientOrder
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/clientOrderCreateSchema'
 *     responses:
 *       201:
 *         description: Client order created
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
 *                   $ref: '#/components/schemas/ResponseGetClientOrder'
 *       400:
 *         description: Validation failed (empty details, >2 decimals, unknown saleId, ...)
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
    permissions: [PERMISSIONCODES.canCreateClientOrder],
  }),
  validateSchema(clientOrderCreateSchema),
  createClientOrder
);

/**
 * @openapi
 * /v1/clientOrder/{id}:
 *   patch:
 *     tags:
 *       - ClientOrders
 *     summary: Partially update a client order
 *     description: Updates header fields and/or replaces detail lines, enforcing the status lifecycle and recomputing the total when details change.
 *     operationId: patchClientOrder
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Client order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/clientOrderUpdateSchema'
 *     responses:
 *       200:
 *         description: Client order updated
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
 *                   $ref: '#/components/schemas/ResponseGetClientOrder'
 *       400:
 *         description: Validation failed or invalid status transition (RN-ORD-011)
 *       401:
 *         $ref: '#/components/schemas/Unauthorized'
 *       403:
 *         description: Permission denied or non-ADMIN setting deliveredOn
 *       404:
 *         description: Client order not found
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.patch(
  '/:id',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER],
    permissions: [PERMISSIONCODES.canEditClientOrder],
  }),
  validatePathParam,
  validateSchema(clientOrderUpdateSchema),
  patchClientOrderById
);

/**
 * @openapi
 * /v1/clientOrder/{id}:
 *   delete:
 *     tags:
 *       - ClientOrders
 *     summary: Delete a client order
 *     description: Deletes a client order and its detail lines; blocked when a sale is linked.
 *     operationId: deleteClientOrder
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Client order ID
 *     responses:
 *       200:
 *         description: Client order deleted
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
 *                       example: Client order deleted successfully
 *       401:
 *         $ref: '#/components/schemas/Unauthorized'
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Client order not found
 *       409:
 *         description: Client order is linked to a sale (RN-ORD-007)
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.delete(
  '/:id',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER],
    permissions: [PERMISSIONCODES.canDeleteClientOrder],
  }),
  validatePathParam,
  deleteClientOrderById
);

/**
 * @openapi
 * /v1/clientOrder/{id}/convert:
 *   post:
 *     tags:
 *       - ClientOrders
 *     summary: Convert a client order into a sale
 *     description: Creates the linked sale and persists saleId in one transaction (RN-ORD-006).
 *     operationId: convertClientOrderToSale
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Client order ID
 *     responses:
 *       200:
 *         description: Client order converted; the response carries the new saleId
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
 *                   $ref: '#/components/schemas/ResponseGetClientOrder'
 *       400:
 *         description: The order is cancelled and cannot be converted
 *       401:
 *         $ref: '#/components/schemas/Unauthorized'
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Client order not found
 *       409:
 *         description: Client order was already converted to a sale
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
router.post(
  '/:id/convert',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER],
    permissions: [PERMISSIONCODES.canEditClientOrder],
  }),
  validatePathParam,
  convertClientOrderToSale
);

export default router;
