import {
  getAllWarehouses as getAllWarehousesService,
  getAllWarehousesFilters as getAllWarehousesFiltersService,
  createWarehouse as createWarehouseService,
  updateWarehouseById as updateWarehouseByIdService,
  deleteWarehouseById as deleteWarehouseByIdService,
} from './service.js';
import globalResponse from '../../utils/responses&Errors/globalResponse.js';
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js';

/**
 * Get all warehouses with optional filters.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.safeQuery - Validated query parameters
 * @param {string} [req.safeQuery.name] - Warehouse name filter
 * @param {boolean} [req.safeQuery.status] - Warehouse status filter
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Returns paginated list of warehouses
 */
export const getAllWarehouses = handleCatchErrorAsync(async (req, res) => {
  const { name, status } = req.safeQuery;
  const warehouses = await getAllWarehousesService({ name, status });
  globalResponse(res, 200, warehouses);
});

/**
 * Get all warehouses for UI filters.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Returns list of all warehouses for filter dropdowns
 */
export const getAllWarehousesFilters = handleCatchErrorAsync(
  async (req, res) => {
    const warehouses = await getAllWarehousesFiltersService();
    globalResponse(res, 200, warehouses);
  }
);
/**
 * Create a new warehouse.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - Request body containing warehouse data
 * @param {string} req.body.name - Warehouse name
 * @param {string} req.body.description - Warehouse description
 * @param {string} req.body.address - Warehouse address
 * @param {boolean} req.body.status - Warehouse status
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Creates new warehouse and returns success message
 */
export const createWarehouse = handleCatchErrorAsync(async (req, res) => {
  await createWarehouseService(req.body);
  globalResponse(res, 201, { message: 'Warehouse created successfully' });
});

/**
 * Update a warehouse by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - URL parameters
 * @param {number} req.params.id - Warehouse ID to update
 * @param {Object} req.body - Updated warehouse data
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Updates warehouse and returns success message
 */
export const updateWarehouseById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params;
  await updateWarehouseByIdService(id, req.body);
  globalResponse(res, 200, { message: 'Warehouse updated successfully' });
});

/**
 * Delete a warehouse by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - URL parameters
 * @param {number} req.params.id - Warehouse ID to delete
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Deletes warehouse and returns success message
 */
export const deleteWarehouseById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params;
  await deleteWarehouseByIdService(id);
  globalResponse(res, 200, { message: 'Warehouse deleted successfully' });
});
