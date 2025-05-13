import {
  getAllClientOrders as getAllClientOrdersDao,
  createClientOrder as createClientOrderDao,
  updateClientOrderById as updateClientOrderByIdDao,
  deleteClientOrderById as deleteClientOrderByIdDao
} from './dao.js'

/**
 * @param {Object} filters - Optional filters for the query
 * @returns {Promise<Array>} List of clientOrders
 */
export const getAllClientOrders = async (filters) => {
  return getAllClientOrdersDao(filters)
}

/**
 * @param {Object} data - clientOrder data
 * @returns {Promise<Object>} Created clientOrder
 */
export const createClientOrder = async (data) => {
  const dataClientOrder = {
    ...data,
    createdOn: new Date()
  }
  return createClientOrderDao(dataClientOrder)
}

/**
 * @param {number} id - clientOrder ID
 * @param {Object} data - Updated clientOrder data
 * @returns {Promise<Object>} Updated clientOrder
 */
export const updateClientOrderById = async (id, data) => {
  const dataClientOrder = {
    ...data,
    updatedOn: new Date()
  }
  return updateClientOrderByIdDao(Number(id), dataClientOrder)
}

/**
 * @param {number} id - clientOrder ID
 * @returns {Promise<Object>} Deleted clientOrder
 */
export const deleteClientOrderById = async (id) => {
  return deleteClientOrderByIdDao(Number(id))
}