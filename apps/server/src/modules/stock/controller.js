import {
  getAllStock as getAllStockService,
  createStock as createStockService,
  updateStockById as updateStockByIdService,
  deleteStockById as deleteStockByIdService,
  getStockAlerts as getStockAlertsService,
  getStockByProductId as getStockByProductIdService,
} from './service.js';
import globalResponse from '../../utils/responses&Errors/globalResponse.js';
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js';

/**
 * Get all stock entries with optional filters.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.safeQuery - Safe query parameters with filters
 * @param {number} [req.safeQuery.productId] - Filter by product ID
 * @param {number} [req.safeQuery.warehouseId] - Filter by warehouse ID
 * @param {string} [req.safeQuery.lot] - Filter by lot number
 * @param {string} [req.safeQuery.unitMeasure] - Filter by unit of measure
 * @param {boolean} [req.safeQuery.stocksExpirated] - Filter for expired stock
 * @param {boolean} [req.safeQuery.stocksLow] - Filter for low stock
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Returns paginated list of stock entries
 */
export const getAllStock = handleCatchErrorAsync(async (req, res) => {
  const {
    productId,
    warehouseId,
    lot,
    unitMeasure,
    stocksExpirated,
    stocksLow,
  } = req.safeQuery;
  const stock = await getAllStockService({
    productId,
    warehouseId,
    lot,
    unitMeasure,
    stocksExpirated,
    stocksLow,
  });
  globalResponse(res, 200, stock);
});

/**
 * Get stock by product ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Product ID from URL
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Returns stock information for the specified product
 */
export const getStockByProductId = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params;
  const stock = await getStockByProductIdService(id);
  globalResponse(res, 200, stock);
});

/**
 * Get all stock alerts.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Returns list of stock alerts (expired, low stock, etc.)
 */
export const getStockAlerts = handleCatchErrorAsync(async (req, res) => {
  const stockAlerts = await getStockAlertsService();
  globalResponse(res, 200, stockAlerts);
});

/**
 * Create a new stock entry.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - Request body containing stock data
 * @param {number} req.body.productId - Product ID
 * @param {number} req.body.warehouseId - Warehouse ID
 * @param {number} req.body.quantity - Stock quantity
 * @param {string} req.body.lot - Lot number
 * @param {Date} req.body.expirationDate - Expiration date
 * @param {string} req.userId - Authenticated user ID from token verification
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Creates new stock entry and returns confirmation
 */
export const createStock = handleCatchErrorAsync(async (req, res) => {
  const userId = req.userId;
  await createStockService(userId, req.body);
  globalResponse(res, 201, { message: 'Stock entry created successfully' });
});

/**
 * Update a stock entry by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Stock entry ID from URL
 * @param {Object} req.body - Request body containing stock data to update
 * @param {number} [req.body.quantity] - Stock quantity
 * @param {string} [req.body.lot] - Lot number
 * @param {Date} [req.body.expirationDate] - Expiration date
 * @param {string} req.userId - Authenticated user ID from token verification
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Updates stock entry and returns confirmation
 */
export const updateStockById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  await updateStockByIdService(id, req.body, userId);
  globalResponse(res, 200, { message: 'Stock entry updated successfully' });
});

/**
 * Delete a stock entry by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Stock entry ID from URL
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Deletes stock entry and returns confirmation
 */
export const deleteStockById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params;
  await deleteStockByIdService(id);
  globalResponse(res, 200, { message: 'Stock entry deleted successfully' });
});
