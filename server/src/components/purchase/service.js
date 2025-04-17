import {
  getAllPurchases as getAllPurchasesDao,
  createPurchase as createPurchaseDao,
  updatePurchaseById as updatePurchaseByIdDao,
  deletePurchaseById as deletePurchaseByIdDao
} from './dao.js'

/**
 * Get all purchases with optional filters
 * @param {Object} filters - Optional filters for the query
 * @returns {Promise<Array>} List of purchases
 */
export const getAllPurchases = async (filters) => {
  return getAllPurchasesDao(filters)
}

/**
 * Create a new purchase
 * @param {Object} data - Purchase data
 * @returns {Promise<Object>} Created purchase
 */
export const createPurchase = async (data) => {
  return createPurchaseDao(data)
}

/**
 * Update a purchase by ID
 * @param {number} id - Purchase ID
 * @param {Object} data - Updated purchase data
 * @returns {Promise<Object>} Updated purchase
 */
export const updatePurchaseById = async (id, data) => {
  return updatePurchaseByIdDao(id, data)
}

/**
 * Delete a purchase by ID
 * @param {number} id - Purchase ID
 * @returns {Promise<Object>} Deleted purchase
 */
export const deletePurchaseById = async (id) => {
  return deletePurchaseByIdDao(id)
}
