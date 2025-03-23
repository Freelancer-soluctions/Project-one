import {
  getAllClients as getAllClientsDao,
  createClient as createClientDao,
  updateClientById as updateClientByIdDao,
  deleteClientById as deleteClientByIdDao
} from './dao.js'

/**
 * Get all clients with optional filters
 * @param {Object} filters - Optional filters for the query
 * @returns {Promise<Array>} List of clients
 */
export const getAllClients = async (filters) => {
  return getAllClientsDao(filters)
}

/**
 * Create a new client
 * @param {Object} data - Client data
 * @returns {Promise<Object>} Created client
 */
export const createClient = async (data) => {
  return createClientDao(data)
}

/**
 * Update a client by ID
 * @param {number} id - Client ID
 * @param {Object} data - Updated client data
 * @returns {Promise<Object>} Updated client
 */
export const updateClientById = async (id, data) => {
  return updateClientByIdDao(id, data)
}

/**
 * Delete a client by ID
 * @param {number} id - Client ID
 * @returns {Promise<Object>} Deleted client
 */
export const deleteClientById = async (id) => {
  return deleteClientByIdDao(id)
}
