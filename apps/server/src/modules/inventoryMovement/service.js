import {
  getAllInventoryMovements as getAllInventoryMovementsDao,
  createInventoryMovement as createInventoryMovementDao,
  updateInventoryMovementById as updateInventoryMovementByIdDao,
  deleteInventoryMovementById as deleteInventoryMovementByIdDao,
} from './dao.js';
import { getSafePagination } from '../../utils/pagination/pagination.js';

/**
 * Get all inventory movements with optional filters.
 *
 * @param {Object} params - Filter parameters.
 * @param {number} [params.productId] - Product ID to filter by.
 * @param {number} [params.warehouseId] - Warehouse ID to filter by.
 * @param {string} [params.type] - Movement type to filter by (IN/OUT).
 * @param {number} params.limit - Number of items per page.
 * @param {number} params.page - Page number for pagination.
 * @returns {Promise<Object>} Paginated list of inventory movements with metadata.
 * @throws {Error} When pagination parameters are missing or invalid.
 */
export const getAllInventoryMovements = async ({
  productId,
  warehouseId,
  type,
  limit,
  page,
}) => {
  const { take, skip } = getSafePagination({ page, limit });

  if (!take || take <= 0) {
    throw new Error('Pagination is required');
  }
  return await getAllInventoryMovementsDao({
    productId,
    warehouseId,
    type,
    take,
    skip,
  });
};

/**
 * Create a new inventory movement.
 *
 * @param {Object} data - Inventory movement data.
 * @param {number} data.productId - Product ID.
 * @param {number} data.warehouseId - Warehouse ID.
 * @param {string} data.type - Movement type (IN/OUT).
 * @param {number} data.quantity - Movement quantity.
 * @param {string} data.reason - Reason for the movement.
 * @returns {Promise<Object>} Created inventory movement.
 */
export const createInventoryMovement = async (data) => {
  const inventoryMovement = await createInventoryMovementDao(data);
  return inventoryMovement;
};

/**
 * Update an inventory movement by ID.
 *
 * @param {number} id - Inventory movement ID.
 * @param {Object} data - Updated inventory movement data.
 * @param {string} [data.type] - Movement type (IN/OUT).
 * @param {number} [data.quantity] - Movement quantity.
 * @param {string} [data.reason] - Reason for the movement.
 * @returns {Promise<Object>} Updated inventory movement.
 */
export const updateInventoryMovementById = async (id, data) => {
  const inventoryMovement = await updateInventoryMovementByIdDao(id, data);
  return inventoryMovement;
};

/**
 * Delete an inventory movement by ID.
 *
 * @param {number} id - Inventory movement ID.
 * @returns {Promise<Object>} Deleted inventory movement.
 */
export const deleteInventoryMovementById = async (id) => {
  const inventoryMovement = await deleteInventoryMovementByIdDao(id);
  return inventoryMovement;
};
