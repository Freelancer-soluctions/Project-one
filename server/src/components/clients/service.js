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
  const dataClient = {
    ...data,
    createdOn: new Date()
  }
  return createClientDao(dataClient)
}

/**
 * Update a client by ID
 * @param {number} id - Client ID
 * @param {Object} data - Updated client data
 * @returns {Promise<Object>} Updated client
 */
export const updateClientById = async (id, data) => {
  const dataClient = {
    ...data,
    updatedOn: new Date()
  }
  return updateClientByIdDao(Number(id), dataClient)
}

/**
 * Delete a client by ID
 * @param {number} id - Client ID
 * @returns {Promise<Object>} Deleted client
 */
export const deleteClientById = async (id) => {
  return deleteClientByIdDao(Number(id))
}
