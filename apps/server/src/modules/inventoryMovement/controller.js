import {
  getAllInventoryMovements as getAllInventoryMovementsService,
  createInventoryMovement as createInventoryMovementService,
  updateInventoryMovementById as updateInventoryMovementByIdService,
  deleteInventoryMovementById as deleteInventoryMovementByIdService,
} from './service.js';
import globalResponse from '../../utils/responses&Errors/globalResponse.js';
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js';

/**
 * Get all inventory movements with optional filters.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.safeQuery - Safe query parameters with filters
 * @param {number} [req.safeQuery.productId] - Filter by product ID
 * @param {number} [req.safeQuery.warehouseId] - Filter by warehouse ID
 * @param {string} [req.safeQuery.type] - Filter by movement type (IN/OUT)
 * @param {number} [req.safeQuery.limit] - Number of items per page
 * @param {number} [req.safeQuery.page] - Page number for pagination
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Returns paginated list of inventory movements
 */
export const getAllInventoryMovements = handleCatchErrorAsync(
  async (req, res) => {
    const { productId, warehouseId, type, limit, page } = req.safeQuery;
    const inventoryMovements = await getAllInventoryMovementsService({
      productId,
      warehouseId,
      type,
      limit,
      page,
    });
    globalResponse(res, 200, inventoryMovements);
  }
);

/**
 * Create a new inventory movement.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - Request body containing inventory movement data
 * @param {number} req.body.productId - Product ID
 * @param {number} req.body.warehouseId - Warehouse ID
 * @param {string} req.body.type - Movement type (IN/OUT)
 * @param {number} req.body.quantity - Movement quantity
 * @param {string} req.body.reason - Reason for the movement
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Creates new inventory movement and returns confirmation
 */
export const createInventoryMovement = handleCatchErrorAsync(
  async (req, res) => {
    await createInventoryMovementService(req.body);
    globalResponse(res, 201, {
      message: 'Inventory movement created successfully',
    });
  }
);

/**
 * Update an inventory movement by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Inventory movement ID from URL
 * @param {Object} req.body - Request body containing inventory movement data to update
 * @param {string} [req.body.type] - Movement type (IN/OUT)
 * @param {number} [req.body.quantity] - Movement quantity
 * @param {string} [req.body.reason] - Reason for the movement
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Updates inventory movement and returns confirmation
 */
export const updateInventoryMovementById = handleCatchErrorAsync(
  async (req, res) => {
    const { id } = req.params;
    await updateInventoryMovementByIdService(id, req.body);
    globalResponse(res, 200, {
      message: 'Inventory movement updated successfully',
    });
  }
);

/**
 * Delete an inventory movement by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Inventory movement ID from URL
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Deletes inventory movement and returns confirmation
 */
export const deleteInventoryMovementById = handleCatchErrorAsync(
  async (req, res) => {
    const { id } = req.params;
    await deleteInventoryMovementByIdService(id);
    globalResponse(res, 200, {
      message: 'Inventory movement deleted successfully',
    });
  }
);
