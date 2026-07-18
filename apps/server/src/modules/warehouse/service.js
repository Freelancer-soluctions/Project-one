import {
  getAllWarehouses as getAllWarehousesDao,
  getAllWarehousesFilters as getAllWarehousesFiltersDao,
  createWarehouse as createWarehouseDao,
  deleteWarehouse as deleteWarehouseDao,
  patchWarehouseById as patchWarehouseByIdDao,
} from './dao.js';
import { getSafePagination } from '../../utils/pagination/pagination.js';

/**
 * Get all warehouses with optional filters.
 *
 * @param {Object} params - Filter parameters
 * @param {string} [params.name] - Warehouse name to filter by
 * @param {boolean} [params.status] - Warehouse status to filter by
 * @param {number} [params.limit] - Number of items per page
 * @param {number} [params.page] - Page number for pagination
 * @returns {Promise<Object>} Paginated list of warehouses with metadata
 * @throws {Error} When pagination parameters are missing or invalid
 */
export const getAllWarehouses = async ({ name, status, limit, page }) => {
  const { take, skip } = getSafePagination({ page, limit });

  if (!take || take <= 0) {
    throw new Error('Pagination is required');
  }
  return await getAllWarehousesDao(name, status, take, skip);
};

/**
 * Get all warehouses.
 * @returns {Promise<Array>} List of warehouses
 */
export const getAllWarehousesFilters = async () => {
  return await getAllWarehousesFiltersDao();
};

/**
 * Create a new warehouse
 * @param {Object} data - Warehouse data
 * @param {string} data.name - Warehouse name
 * @param {string} data.description - Warehouse description
 * @param {string} data.address - Warehouse address
 * @param {boolean} data.status - Warehouse status
 * @returns {Promise<Object>} Created warehouse
 */
export const createWarehouse = async (data) => {
  const createData = {
    ...data,
    createdOn: new Date(),
  };

  return createWarehouseDao(createData);
};

/**
 * Delete a warehouse by ID
 * @param {number} warehouseId - ID of the warehouse to delete
 * @returns {Promise<void>}
 */
export const deleteWarehouseById = async (warehouseId) => {
  return deleteWarehouseDao({ id: Number(warehouseId) });
};

/**
 * Partially update a warehouse by ID.
 *
 * @param {number} warehouseId - ID of the warehouse to update
 * @param {Object} data - Partial warehouse data to update
 * @param {string} [data.name] - Warehouse name
 * @param {string} [data.description] - Warehouse description
 * @param {string} [data.address] - Warehouse address
 * @param {boolean} [data.status] - Warehouse status
 * @returns {Promise<Object>} Updated warehouse
 */
export const patchWarehouseById = async (warehouseId, data) => {
  const updateData = {
    ...data,
    updatedOn: new Date(),
  };

  return await patchWarehouseByIdDao(Number(warehouseId), updateData);
};
