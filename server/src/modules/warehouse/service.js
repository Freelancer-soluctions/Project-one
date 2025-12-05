import {
  getAllWarehouses as getAllWarehousesDao,
  createWarehouse as createWarehouseDao,
  updateWarehouse as updateWarehouseDao,
  deleteWarehouse as deleteWarehouseDao
} from './dao.js'

/**
 * Get all warehouses with optional filters
 * @param {Object} params - Filter parameters
 * @param {string} params.name - Name to filter by
 * @param {boolean} params.status - Status to filter by
 * @returns {Promise<Array>} List of warehouses
 */
export const getAllWarehouses = async ({ name, status }) => {
  return getAllWarehousesDao(name, status)
}

/**
 * Create a new warehouse
 * @param {Object} data - Warehouse data
 * @param {string} data.name - Warehouse name
 * @param {string} data.description - Warehouse description
 * @param {string} data.address - Warehouse address
 * @param {boolean} data.status - Warehouse status
 * @returns {Promise<Object>} Created warehouse
 */
export const createWarehouse = async (data) => {
  const createData = {
    ...data,
    createdOn: new Date()
  }

  return createWarehouseDao(createData)
}

/**
 * Update a warehouse by ID
 * @param {number} warehouseId - ID of the warehouse to update
 * @param {Object} data - Updated warehouse data
 * @param {string} data.name - Updated warehouse name
 * @param {string} data.description - Updated warehouse description
 * @param {string} data.address - Updated warehouse address
 * @param {boolean} data.status - Updated warehouse status
 * @param {number} userId - ID of the user updating the warehouse
 * @returns {Promise<Object>} Updated warehouse
 */
export const updateWarehouseById = async (warehouseId, data) => {
  const updateData = {
    ...data,
    updatedOn: new Date()
  }

  return updateWarehouseDao(updateData, { id: Number(warehouseId) })
}

/**
 * Delete a warehouse by ID
 * @param {number} warehouseId - ID of the warehouse to delete
 * @returns {Promise<void>}
 */
export const deleteWarehouseById = async warehouseId => {
  return deleteWarehouseDao({ id: Number(warehouseId) })
}
