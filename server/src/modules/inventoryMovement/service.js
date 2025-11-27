import {
  getAllInventoryMovements as getAllInventoryMovementsDao,
  createInventoryMovement as createInventoryMovementDao,
  updateInventoryMovementById as updateInventoryMovementByIdDao,
  deleteInventoryMovementById as deleteInventoryMovementByIdDao
} from './dao.js'

/**
 * Get all inventory movements with optional filters
 * @param {Object} filters - Filter options
 * @param {string} filters.productId - Product ID to filter by
 * @param {string} filters.warehouseId - Warehouse ID to filter by
 * @param {string} filters.type - Movement type to filter by
 * @returns {Promise<Array>} List of inventory movements
 */
export const getAllInventoryMovements = async ({ productId, warehouseId, type }) => {
  const inventoryMovements = await getAllInventoryMovementsDao({ productId, warehouseId, type })
  return inventoryMovements
}

/**
 * Create a new inventory movement
 * @param {Object} data - Inventory movement data
 * @returns {Promise<Object>} Created inventory movement
 */
export const createInventoryMovement = async data => {
  const inventoryMovement = await createInventoryMovementDao(data)
  return inventoryMovement
}

/**
 * Update an inventory movement by ID
 * @param {string} id - Inventory movement ID
 * @param {Object} data - Updated inventory movement data
 * @returns {Promise<Object>} Updated inventory movement
 */
export const updateInventoryMovementById = async (id, data) => {
  const inventoryMovement = await updateInventoryMovementByIdDao(id, data)
  return inventoryMovement
}

/**
 * Delete an inventory movement by ID
 * @param {string} id - Inventory movement ID
 * @returns {Promise<Object>} Deleted inventory movement
 */
export const deleteInventoryMovementById = async id => {
  const inventoryMovement = await deleteInventoryMovementByIdDao(id)
  return inventoryMovement
}
