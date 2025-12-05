import {
  getAllStock as getAllStockDao,
  createStock as createStockDao,
  updateStock as updateStockDao,
  deleteStock as deleteStockDao,
  getStockAlerts as getStockAlertsDao,
  getStockByProductId as getStockByProductIdDao
} from './dao.js'

/**
 * Get all stock entries with optional filters
 * @param {Object} params - Filter parameters
 * @param {number} params.productId - Product ID to filter by
 * @param {number} params.warehouseId - Warehouse ID to filter by
 * @param {string} params.lot - Lot number to filter by
 * @param {string} params.unitMeasure - Unit measure to filter by
 * @returns {Promise<Array>} List of stock entries
 */
export const getAllStock = async ({ productId, warehouseId, lot, unitMeasure, stocksExpirated, stocksLow }) => {
  return getAllStockDao(productId, warehouseId, lot, unitMeasure, stocksExpirated, stocksLow)
}

/**
 * Get stock by product ID
 * @param {number} id - Product ID
 * @returns {Promise<Object>} Stock entry
 */
export const getStockByProductId = async (id) => {
  return getStockByProductIdDao(Number(id))
}

/**
 * Get all stock alerts
 * @returns {Promise<Object>} Stock alerts
 */
export const getStockAlerts = async () => {
  return getStockAlertsDao()
}

/**
 * Create a new stock entry
 * @param {Object} data - Stock entry data
 * @param {number} data.quantity - Stock quantity
 * @param {number} data.minimum - Minimum stock level
 * @param {number} data.maximum - Maximum stock level
 * @param {string} data.lot - Lot number
 * @param {string} data.unitMeasure - Unit of measure
 * @param {Date} data.expirationDate - Expiration date
 * @param {number} data.productId - Product ID
 * @param {number} data.warehouseId - Warehouse ID
 * @param {number} data.createdBy - User ID who created the entry
 * @returns {Promise<Object>} Created stock entry
 */
export const createStock = async (userId, data) => {
  const createData = {
    ...data,
    createdBy: Number(userId),
    createdOn: new Date()
  }

  return createStockDao(createData)
}

/**
 * Update a stock entry by ID
 * @param {number} stockId - ID of the stock entry to update
 * @param {Object} data - Updated stock data
 * @param {number} data.quantity - Updated stock quantity
 * @param {number} data.minimum - Updated minimum stock level
 * @param {number} data.maximum - Updated maximum stock level
 * @param {string} data.lot - Updated lot number
 * @param {string} data.unitMeasure - Updated unit of measure
 * @param {Date} data.expirationDate - Updated expiration date
 * @param {number} data.updatedBy - User ID who updated the entry
 * @returns {Promise<Object>} Updated stock entry
 */
export const updateStockById = async (stockId, data, userId) => {
  const updateData = {
    ...data,
    updatedBy: Number(userId),
    updatedOn: new Date()
  }

  return updateStockDao(updateData, { id: Number(stockId) })
}

/**
 * Delete a stock entry by ID
 * @param {number} stockId - ID of the stock entry to delete
 * @returns {Promise<void>}
 */
export const deleteStockById = async stockId => {
  return deleteStockDao({ id: Number(stockId) })
}
