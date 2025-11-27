import {
  getAllProviderOrders as getAllProviderOrdersDao,
  createProviderOrder as createProviderOrderDao,
  updateProviderOrderById as updateProviderOrderByIdDao,
  deleteProviderOrderById as deleteProviderOrderByIdDao
} from './dao.js'

/**
 * Get all providerOrders with optional filters
 * @param {Object} filters - Optional filters for the query
 * @returns {Promise<Array>} List of providerOrders
 */
export const getAllProviderOrders = async (filters) => {
  return getAllProviderOrdersDao(filters)
}

/**
 * Create a new providerOrder
 * @param {Object} data - providerOrder data
 * @returns {Promise<Object>} Created providerOrder
 */
export const createProviderOrder = async (data) => {
  const dataProviderOrder = {
    ...data,
    createdOn: new Date()
  }
  return createProviderOrderDao(dataProviderOrder)
}

/**
 * Update a providerOrder by ID
 * @param {number} id - providerOrder ID
 * @param {Object} data - Updated providerOrder data
 * @returns {Promise<Object>} Updated providerOrder
 */
export const updateProviderOrderById = async (id, data) => {
  const dataProviderOrder = {
    ...data,
    updatedOn: new Date()
  }
  return updateProviderOrderByIdDao(Number(id), dataProviderOrder)
}

/**
 * Delete a providerOrder by ID
 * @param {number} id - providerOrder ID
 * @returns {Promise<Object>} Deleted providerOrder
 */
export const deleteProviderOrderById = async (id) => {
  return deleteProviderOrderByIdDao(Number(id))
}