import {
  getAllInventoryMovements as getAllInventoryMovementsDao,
  createInventoryMovement as createInventoryMovementDao,
  updateInventoryMovementById as updateInventoryMovementByIdDao,
  deleteInventoryMovementById as deleteInventoryMovementByIdDao,
} from './dao.js';
import { getSafePagination } from '../../utils/pagination/pagination.js';

/**
 * Get all inventory movements with optional filters
 * @param {string} productId - Product ID to filter by
 * @param {string} warehouseId - Warehouse ID to filter by
 * @param {string} type - Movement type to filter by
 * @param {number} page - The page filter.
 * @param {number} limit - The limit code filter.
 * @returns {Promise<Array>} List of inventory movements
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
 * Create a new inventory movement
 * @param {Object} data - Inventory movement data
 * @returns {Promise<Object>} Created inventory movement
 */
export const createInventoryMovement = async (data) => {
  const inventoryMovement = await createInventoryMovementDao(data);
  return inventoryMovement;
};

/**
 * Update an inventory movement by ID
 * @param {string} id - Inventory movement ID
 * @param {Object} data - Updated inventory movement data
 * @returns {Promise<Object>} Updated inventory movement
 */
export const updateInventoryMovementById = async (id, data) => {
  const inventoryMovement = await updateInventoryMovementByIdDao(id, data);
  return inventoryMovement;
};

/**
 * Delete an inventory movement by ID
 * @param {string} id - Inventory movement ID
 * @returns {Promise<Object>} Deleted inventory movement
 */
export const deleteInventoryMovementById = async (id) => {
  const inventoryMovement = await deleteInventoryMovementByIdDao(id);
  return inventoryMovement;
};
