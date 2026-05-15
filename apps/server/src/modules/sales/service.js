import {
  getAllSales as getAllSalesDao,
  createSale as createSaleDao,
  updateSaleById as updateSaleByIdDao,
  deleteSaleById as deleteSaleByIdDao,
  deleteSaleDetailById as deleteSaleDetailByIdDao,
} from './dao.js';
import { getSafePagination } from '../../utils/pagination/pagination.js';

/**
 * Get all sales with optional filters.
 *
 * @param {Object} filters - Optional filters for the query.
 * @param {number} [filters.page] - Page number for pagination.
 * @param {number} [filters.limit] - Number of items per page.
 * @param {number} [filters.clientId] - Filter by client ID.
 * @param {Date} [filters.startDate] - Filter by start date.
 * @param {Date} [filters.endDate] - Filter by end date.
 * @param {number} [filters.minTotal] - Filter by minimum total.
 * @param {number} [filters.maxTotal] - Filter by maximum total.
 * @returns {Promise<Object>} Paginated list of sales with metadata.
 * @throws {Error} When pagination parameters are missing or invalid.
 */
export const getAllSales = async (filters) => {
  const formatedFilters = {
    ...filters,
    clientId: Number(filters.clientId),
  };
  const { take, skip } = getSafePagination({
    page: formatedFilters.page,
    limit: formatedFilters.limit,
  });

  if (!take || take <= 0) {
    throw new Error('Pagination is required');
  }
  return await getAllSalesDao(formatedFilters, take, skip);
};

/**
 * Create a new sale.
 *
 * @param {Object} data - Sale data.
 * @param {number} data.clientId - Client ID.
 * @param {number} data.total - Total amount.
 * @param {Array} data.details - Array of sale details.
 * @param {number} data.createdBy - User ID who created the sale.
 * @returns {Promise<Object>} Created sale.
 */
export const createSale = async (data) => {
  const dataToCreate = {
    clientId: Number(data.clientId),
    total: Number(data.total),
    details: data.details,
    createdBy: Number(data.createdBy),
    createdOn: new Date(),
  };
  return createSaleDao(dataToCreate);
};

/**
 * Update a sale by ID.
 *
 * @param {number} id - Sale ID.
 * @param {Object} data - Updated sale data.
 * @param {number} [data.clientId] - Client ID.
 * @param {number} [data.total] - Total amount.
 * @param {Array} [data.details] - Array of sale details.
 * @param {number} data.updatedBy - User ID who updated the sale.
 * @returns {Promise<Object>} Updated sale.
 */
export const updateSaleById = async (id, data) => {
  const dataToUpdate = {
    clientId: Number(data.clientId),
    total: Number(data.total),
    details: data.details,
    updatedBy: Number(data.updatedBy),
    updatedOn: new Date(),
  };
  return updateSaleByIdDao(Number(id), dataToUpdate);
};

/**
 * Delete a sale by ID.
 *
 * @param {number} id - Sale ID.
 * @returns {Promise<Object>} Deleted sale.
 */
export const deleteSaleById = async (id) => {
  return deleteSaleByIdDao(Number(id));
};

/**
 * Delete a sale detail by ID.
 *
 * @param {number} id - Sale detail ID.
 * @returns {Promise<Object>} Deleted sale detail.
 */
export const deleteSaleDetailById = async (id) => {
  return deleteSaleDetailByIdDao(Number(id));
};
