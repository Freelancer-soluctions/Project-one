import {
  getAllClients as getAllClientsDao,
  createClient as createClientDao,
  getAllClientsFilters as getAllClientsFiltersDao,
  updateClientById as updateClientByIdDao,
  deleteClientById as deleteClientByIdDao,
} from './dao.js';
import { getSafePagination } from '../../utils/pagination/pagination.js';

/**
 * Get all clients with optional filters.
 *
 * @param {Object} filters - Filters for the query.
 * @param {number} [filters.page] - Page number for pagination.
 * @param {number} [filters.limit] - Number of items per page.
 * @param {string} [filters.name] - Filter by client name.
 * @param {string} [filters.email] - Filter by client email.
 * @param {string} [filters.phone] - Filter by client phone.
 * @returns {Promise<Object>} Paginated list of clients with metadata.
 * @throws {Error} When pagination parameters are missing or invalid.
 */
export const getAllClients = async (filters) => {
  const { take, skip } = getSafePagination({
    page: filters.page,
    limit: filters.limit,
  });

  if (!take || take <= 0) {
    throw new Error('Pagination is required');
  }
  return getAllClientsDao(filters, take, skip);
};

/**
 * Get all clients for UI filters.
 *
 * @returns {Promise<Array>} List of all clients.
 */
export const getAllClientsFilters = async () => {
  return getAllClientsFiltersDao();
};

/**
 * Create a new client.
 *
 * @param {Object} data - Client data.
 * @param {string} data.name - Client name.
 * @param {string} data.email - Client email address.
 * @param {string} data.phone - Client phone number.
 * @param {string} data.address - Client address.
 * @param {number} data.createdBy - User ID who created the client.
 * @returns {Promise<Object>} Created client.
 */
export const createClient = async (data) => {
  const dataClient = {
    ...data,
    createdOn: new Date(),
  };
  return createClientDao(dataClient);
};

/**
 * Update a client by ID.
 *
 * @param {number} id - Client ID.
 * @param {Object} data - Updated client data.
 * @param {string} [data.name] - Client name.
 * @param {string} [data.email] - Client email address.
 * @param {string} [data.phone] - Client phone number.
 * @param {string} [data.address] - Client address.
 * @param {number} data.updatedBy - User ID who updated the client.
 * @returns {Promise<Object>} Updated client.
 */
export const updateClientById = async (id, data) => {
  const dataClient = {
    ...data,
    updatedOn: new Date(),
  };
  return updateClientByIdDao(Number(id), dataClient);
};

/**
 * Delete a client by ID.
 *
 * @param {number} id - Client ID.
 * @returns {Promise<Object>} Deleted client.
 */
export const deleteClientById = async (id) => {
  return deleteClientByIdDao(Number(id));
};
