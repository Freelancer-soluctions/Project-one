import {
  getAllSales as getAllSalesDao,
  createSale as createSaleDao,
  updateSaleById as updateSaleByIdDao,
  deleteSaleById as deleteSaleByIdDao
} from './dao.js'

/**
 * Get all sales with optional filters
 * @param {Object} filters - Optional filters for the query
 * @returns {Promise<Array>} List of sales
 */
export const getAllSales = async (filters) => {
  return getAllSalesDao(filters)
}

/**
 * Create a new sale
 * @param {Object} data - Sale data
 * @returns {Promise<Object>} Created sale
 */
export const createSale = async (data) => {
  return createSaleDao(data)
}

/**
 * Update a sale by ID
 * @param {number} id - Sale ID
 * @param {Object} data - Updated sale data
 * @returns {Promise<Object>} Updated sale
 */
export const updateSaleById = async (id, data) => {
  return updateSaleByIdDao(id, data)
}

/**
 * Delete a sale by ID
 * @param {number} id - Sale ID
 * @returns {Promise<Object>} Deleted sale
 */
export const deleteSaleById = async (id) => {
  return deleteSaleByIdDao(id)
}
