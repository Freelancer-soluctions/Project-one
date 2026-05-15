import {
  getAllProviderOrders as getAllProviderOrdersDao,
  createProviderOrder as createProviderOrderDao,
  updateProviderOrderById as updateProviderOrderByIdDao,
  deleteProviderOrderById as deleteProviderOrderByIdDao,
} from './dao.js';
import { getSafePagination } from '../../utils/pagination/pagination.js';

/**
 * Retrieves all provider orders based on optional filters.
 *
 * @param {Object} filters - The parameters for filtering the provider orders.
 * @param {number} [filters.providerId] - Filter by provider ID.
 * @param {string} [filters.status] - Filter by order status (PENDING, PROCESSING, COMPLETED, CANCELLED).
 * @param {Date} [filters.startDate] - Filter by start date.
 * @param {Date} [filters.endDate] - Filter by end date.
 * @param {number} filters.limit - Filter by limit.
 * @param {number} filters.page - Filter by page.
 * @returns {Promise<Object>} A paginated list of provider orders matching the filters.
 * @throws {Error} When pagination parameters are missing or invalid.
 */
export const getAllProviderOrders = async (filters) => {
  const { take, skip } = getSafePagination({
    page: filters.page,
    limit: filters,
  });

  if (!take || take <= 0) {
    throw new Error('Pagination is required');
  }
  return await getAllProviderOrdersDao(filters, take, skip);
};

/**
 * Creates a new provider order in the database.
 *
 * @param {Object} data - The data for the new provider order.
 * @param {number} data.providerId - The ID of the provider.
 * @param {number} data.total - The total amount of the order.
 * @param {Array} data.details - Array of order details.
 * @param {string} data.status - The status of the order (PENDING, PROCESSING, COMPLETED, CANCELLED).
 * @param {Date} data.createdOn - The creation timestamp.
 * @param {number} data.createdBy - The ID of the user who created the order.
 * @returns {Promise<Object>} The created provider order.
 */
export const createProviderOrder = async (data) => {
  const dataProviderOrder = {
    ...data,
    createdOn: new Date(),
  };
  return createProviderOrderDao(dataProviderOrder);
};

/**
 * Updates an existing provider order in the database by its ID.
 *
 * @param {number} id - The ID of the provider order to update.
 * @param {Object} data - The updated data for the provider order.
 * @param {number} [data.total] - The total amount of the order.
 * @param {string} [data.status] - The status of the order (PENDING, PROCESSING, COMPLETED, CANCELLED).
 * @param {Date} data.updatedOn - The timestamp of the last update.
 * @param {number} data.updatedBy - The ID of the user updating the order.
 * @returns {Promise<Object>} The updated provider order.
 */
export const updateProviderOrderById = async (id, data) => {
  const dataProviderOrder = {
    ...data,
    updatedOn: new Date(),
  };
  return updateProviderOrderByIdDao(Number(id), dataProviderOrder);
};

/**
 * Deletes a provider order from the database by its ID.
 *
 * @param {number} id - The ID of the provider order to delete.
 * @returns {Promise<Object>} The result of the deletion.
 */
export const deleteProviderOrderById = async (id) => {
  return deleteProviderOrderByIdDao(Number(id));
};
