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
 * Get all stock entries with optional filters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
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
 * Get stock by product ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const getStockByProductId = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params;
  const stock = await getStockByProductIdService(id);
  globalResponse(res, 200, stock);
});

/**
 * Get all stock alerts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const getStockAlerts = handleCatchErrorAsync(async (req, res) => {
  const stockAlerts = await getStockAlertsService();
  globalResponse(res, 200, stockAlerts);
});

/**
 * Create a new stock entry
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const createStock = handleCatchErrorAsync(async (req, res) => {
  const userId = req.userId;
  await createStockService(userId, req.body);
  globalResponse(res, 201, { message: 'Stock entry created successfully' });
});

/**
 * Update a stock entry by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const updateStockById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  await updateStockByIdService(id, req.body, userId);
  globalResponse(res, 200, { message: 'Stock entry updated successfully' });
});

/**
 * Delete a stock entry by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const deleteStockById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params;
  await deleteStockByIdService(id);
  globalResponse(res, 200, { message: 'Stock entry deleted successfully' });
});
