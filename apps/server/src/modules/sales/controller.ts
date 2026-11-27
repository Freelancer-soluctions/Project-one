import {
  getAllSales as getAllSalesService,
  createSale as createSaleService,
  deleteSaleById as deleteSaleByIdService,
  deleteSaleDetailById as deleteSaleDetailByIdService,
  patchSaleById as patchSaleByIdService,
  transitionSaleStatus as transitionSaleStatusService,
} from './service.js';
import globalResponse from '../../utils/responses&Errors/globalResponse.js';
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js';
import type {
  SaleInput,
  SaleStatusTransitionInput,
  SalesQuery,
} from './types.js';

/**
 * Get all sales with optional filters.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.safeQuery - Safe query parameters with filters
 * @param {number} [req.safeQuery.page] - Page number for pagination
 * @param {number} [req.safeQuery.limit] - Number of items per page
 * @param {number} [req.safeQuery.clientId] - Filter by client ID
 * @param {string} [req.safeQuery.status] - Filter by lifecycle status
 * @param {Date} [req.safeQuery.startDate] - Filter by start date
 * @param {Date} [req.safeQuery.endDate] - Filter by end date
 * @param {number} [req.safeQuery.minTotal] - Filter by minimum total
 * @param {number} [req.safeQuery.maxTotal] - Filter by maximum total
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Returns paginated list of sales
 */
export const getAllSales = handleCatchErrorAsync(async (req, res) => {
  const sales = await getAllSalesService(req.safeQuery as SalesQuery);
  globalResponse(res, 200, sales);
});

/**
 * Create a new sale.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - Request body containing sale data
 * @param {number} req.body.clientId - Client ID
 * @param {number} req.body.total - Total amount
 * @param {Array} req.body.details - Array of sale details
 * @param {string} req.userId - Authenticated user ID from token verification
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Creates new sale and returns sale object
 */
export const createSale = handleCatchErrorAsync(async (req, res) => {
  const sale = await createSaleService({
    ...(req.body as SaleInput),
    createdBy: req.userId as number,
  });
  globalResponse(res, 201, sale);
});

/**
 * Partially update a sale by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Sale ID from URL
 * @param {Object} req.body - Request body containing sale data to update
 * @param {number} [req.body.clientId] - Client ID
 * @param {number} [req.body.total] - Total amount
 * @param {Array} [req.body.details] - Array of sale details
 * @param {string} req.userId - Authenticated user ID from token verification
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Partially updates sale and returns updated sale object
 */
export const patchSaleById = handleCatchErrorAsync(async (req, res) => {
  const sale = await patchSaleByIdService(Number(req.params['id']), {
    ...(req.body as SaleInput),
    updatedBy: req.userId as number,
  });
  globalResponse(res, 200, sale);
});

/**
 * Move a sale through its lifecycle.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Sale ID from URL
 * @param {Object} req.body - Request body with the target status and optional payment data
 * @param {string} req.body.status - Target status (PENDING, PAID, CANCELLED, REFUNDED)
 * @param {string} [req.body.paymentMethod] - CASH, CARD, TRANSFER or OTHER
 * @param {string} [req.body.invoiceNumber] - Invoice number (unique)
 * @param {string} req.userId - Authenticated user ID from token verification
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Updates the sale status and returns the sale
 */
export const transitionSaleStatus = handleCatchErrorAsync(async (req, res) => {
  const sale = await transitionSaleStatusService(Number(req.params['id']), {
    ...(req.body as SaleStatusTransitionInput),
    updatedBy: req.userId as number,
  });
  globalResponse(res, 200, sale);
});

/**
 * Delete a sale by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Sale ID from URL
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Deletes sale and returns confirmation message
 */
export const deleteSaleById = handleCatchErrorAsync(async (req, res) => {
  await deleteSaleByIdService(Number(req.params['id']));
  globalResponse(res, 200, { message: 'Sale deleted successfully' });
});

/**
 * Delete a sale detail by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Sale detail ID from URL
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Deletes sale detail and returns confirmation message
 */
export const deleteSaleDetailById = handleCatchErrorAsync(async (req, res) => {
  await deleteSaleDetailByIdService(Number(req.params['id']));
  globalResponse(res, 200, { message: 'Sale deleted successfully' });
});
