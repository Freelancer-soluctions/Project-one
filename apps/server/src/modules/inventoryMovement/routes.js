import { Router } from 'express';
import {
  verifyToken,
  validateQueryParams,
  validateSchema,
  checkRoleAuthOrPermisssion,
  validatePathParam,
} from '../../middleware/index.js';
import {
  getAllInventoryMovements,
  createInventoryMovement,
  updateInventoryMovementById,
  deleteInventoryMovementById,
} from './controller.js';
import {
  inventoryMovementFiltersSchema,
  inventoryMovementCreateUpdateSchema,
} from '../../utils/joiSchemas/joi.js';
import { ROLESCODES, PERMISSIONCODES } from '../../utils/constants/enums.js';

const router = Router();
// uso global de middleware
router.use(verifyToken);

/**
 * @openapi
 * /api/v1/inventory-movements:
 *   get:
 *     tags:
 *       - Inventory Movements
 *     summary: Get all inventory movements
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filters
 *         schema:
 *           $ref: "#/components/schemas/InventoryMovementFilters"
 *         required: false
 *         description: "Filtros opcionales para buscar movimientos de inventario."
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
 *                     $ref: "#/components/schemas/ResponseGetInventoryMovement"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Unauthorized'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER, ROLESCODES.USER],
    permissions: [PERMISSIONCODES.canViewInventory],
  }),
  validateQueryParams(inventoryMovementFiltersSchema),
  getAllInventoryMovements
);

/**
 * @openapi
 * /api/v1/inventory-movements:
 *   post:
 *     tags:
 *       - Inventory Movements
 *     summary: Create a new inventory movement
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BodyInventoryMovementCreate'
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
 *                   $ref: "#/components/schemas/ResponseInventoryMovementCreate"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Unauthorized'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER],
    permissions: [PERMISSIONCODES.canCreateInventory],
  }),
  validateSchema(inventoryMovementCreateUpdateSchema),
  createInventoryMovement
);

/**
 * @openapi
 * /api/v1/inventory-movements/{id}:
 *   put:
 *     tags:
 *       - Inventory Movements
 *     summary: Update an inventory movement
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Inventory Movement ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BodyInventoryMovementUpdate'
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
 *                   $ref: "#/components/schemas/ResponseInventoryMovementUpdate"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Unauthorized'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/:id',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER],
    permissions: [PERMISSIONCODES.canEditInventory],
  }),
  validatePathParam,
  validateSchema(inventoryMovementCreateUpdateSchema),
  updateInventoryMovementById
);

/**
 * @openapi
 * /api/v1/inventory-movements/{id}:
 *   delete:
 *     tags:
 *       - Inventory Movements
 *     summary: Delete an inventory movement
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Inventory Movement ID
 *     responses:
 *       200:
 *         description: Inventory Movement deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Delete'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Unauthorized'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  '/:id',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER],
    permissions: [PERMISSIONCODES.canDeleteInventory],
  }),
  validatePathParam,
  deleteInventoryMovementById
);

export default router;
