import {
  getAllClientOrders as getAllClientOrdersDao,
  createClientOrder as createClientOrderDao,
  updateClientOrderById as updateClientOrderByIdDao,
  deleteClientOrderById as deleteClientOrderByIdDao,
} from './dao.js';
import { getSafePagination } from '../../utils/pagination/pagination.js';

/**
 * Get all client orders with optional filters.
 *
 * @param {Object} filters - Optional filters for the query.
 * @param {number} [filters.clientId] - Filter by client ID.
 * @param {string} [filters.status] - Filter by order status (PENDING, PROCESSING, COMPLETED, CANCELLED).
 * @param {Date} [filters.startDate] - Filter by start date.
 * @param {Date} [filters.endDate] - Filter by end date.
 * @param {number} filters.limit - Number of items per page.
 * @param {number} filters.page - Page number for pagination.
 * @returns {Promise<Object>} Paginated list of client orders with metadata.
 * @throws {Error} When pagination parameters are missing or invalid.
 */
export const getAllClientOrders = async (filters) => {
  const { take, skip } = getSafePagination({
    page: filters.page,
    limit: filters.limit,
  });

  if (!take || take <= 0) {
    throw new Error('Pagination is required');
  }
  return getAllClientOrdersDao(filters, take, skip);
};

/**
 * Create a new client order.
 *
 * @param {Object} data - Client order data.
 * @param {number} data.clientId - Client ID.
 * @param {number} data.total - Total amount.
 * @param {Array} data.details - Array of order details.
 * @param {string} data.status - Order status (PENDING, PROCESSING, COMPLETED, CANCELLED).
 * @param {number} data.createdBy - User ID who created the order.
 * @returns {Promise<Object>} Created client order.
 */
export const createClientOrder = async (data) => {
  const dataClientOrder = {
    ...data,
    createdOn: new Date(),
  };
  return createClientOrderDao(dataClientOrder);
};

/**
 * Update a client order by ID.
 *
 * @param {number} id - Client order ID.
 * @param {Object} data - Updated client order data.
 * @param {number} [data.total] - Total amount.
 * @param {string} [data.status] - Order status (PENDING, PROCESSING, COMPLETED, CANCELLED).
 * @param {number} data.updatedBy - User ID who updated the order.
 * @returns {Promise<Object>} Updated client order.
 */
export const updateClientOrderById = async (id, data) => {
  const dataClientOrder = {
    ...data,
    updatedOn: new Date(),
  };
  return updateClientOrderByIdDao(Number(id), dataClientOrder);
};

/**
 * Delete a client order by ID.
 *
 * @param {number} id - Client order ID.
 * @returns {Promise<Object>} Deleted client order.
 */
export const deleteClientOrderById = async (id) => {
  return deleteClientOrderByIdDao(Number(id));
};
