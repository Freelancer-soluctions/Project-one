import {
  getAllPurchases as getAllPurchasesDao,
  createPurchase as createPurchaseDao,
  updatePurchaseById as updatePurchaseByIdDao,
  deletePurchaseById as deletePurchaseByIdDao,
  deletePurchaseDetailById as deletePurchaseDetailByIdDao,
} from './dao.js';
import { getSafePagination } from '../../utils/pagination/pagination.js';

/**
 * Get all purchases with optional filters.
 *
 * @param {Object} filters - Optional filters for the query.
 * @param {number} [filters.page] - Page number for pagination.
 * @param {number} [filters.limit] - Number of items per page.
 * @param {number} [filters.providerId] - Filter by provider ID.
 * @param {Date} [filters.startDate] - Filter by start date.
 * @param {Date} [filters.endDate] - Filter by end date.
 * @param {number} [filters.minTotal] - Filter by minimum total.
 * @param {number} [filters.maxTotal] - Filter by maximum total.
 * @returns {Promise<Object>} Paginated list of purchases with metadata.
 * @throws {Error} When pagination parameters are missing or invalid.
 */
export const getAllPurchases = async (filters) => {
  const { take, skip } = getSafePagination({
    page: filters.page,
    limit: filters.limit,
  });

  if (!take || take <= 0) {
    throw new Error('Pagination is required');
  }
  return await getAllPurchasesDao(filters, take, skip);
};

/**
 * Create a new purchase.
 *
 * @param {Object} data - Purchase data.
 * @param {number} data.providerId - Provider ID.
 * @param {number} data.total - Total amount.
 * @param {Array} data.details - Array of purchase details.
 * @param {number} data.createdBy - User ID who created the purchase.
 * @returns {Promise<Object>} Created purchase.
 */
export const createPurchase = async (data) => {
  return createPurchaseDao(data);
};

/**
 * Update a purchase by ID.
 *
 * @param {number} id - Purchase ID.
 * @param {Object} data - Updated purchase data.
 * @param {number} [data.providerId] - Provider ID.
 * @param {number} [data.total] - Total amount.
 * @param {Array} [data.details] - Array of purchase details.
 * @param {number} data.updatedBy - User ID who updated the purchase.
 * @returns {Promise<Object>} Updated purchase.
 */
export const updatePurchaseById = async (id, data) => {
  return updatePurchaseByIdDao(id, data);
};

/**
 * Delete a purchase by ID.
 *
 * @param {number} id - Purchase ID.
 * @returns {Promise<Object>} Deleted purchase.
 */
export const deletePurchaseById = async (id) => {
  return deletePurchaseByIdDao(id);
};

/**
 * Delete a purchase detail by ID.
 *
 * @param {number} id - Purchase detail ID.
 * @returns {Promise<Object>} Deleted purchase detail.
 */
export const deletePurchaseDetailById = async (id) => {
  return deletePurchaseDetailByIdDao(id);
};
