import {
  getAllPurchases as getAllPurchasesService,
  createPurchase as createPurchaseService,
  updatePurchaseById as updatePurchaseByIdService,
  deletePurchaseById as deletePurchaseByIdService,
  deletePurchaseDetailById as deletePurchaseDetailByIdService,
} from './service.js';
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js';
import globalResponse from '../../utils/responses&Errors/globalResponse.js';

/**
 * Get all purchases with optional filters.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.safeQuery - Safe query parameters with filters
 * @param {number} [req.safeQuery.page] - Page number for pagination
 * @param {number} [req.safeQuery.limit] - Number of items per page
 * @param {number} [req.safeQuery.providerId] - Filter by provider ID
 * @param {Date} [req.safeQuery.startDate] - Filter by start date
 * @param {Date} [req.safeQuery.endDate] - Filter by end date
 * @param {number} [req.safeQuery.minTotal] - Filter by minimum total
 * @param {number} [req.safeQuery.maxTotal] - Filter by maximum total
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Returns paginated list of purchases
 */
export const getAllPurchases = handleCatchErrorAsync(async (req, res) => {
  const purchases = await getAllPurchasesService(req.safeQuery);
  globalResponse(res, 200, purchases);
});

/**
 * Create a new purchase.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - Request body containing purchase data
 * @param {number} req.body.providerId - Provider ID
 * @param {number} req.body.total - Total amount
 * @param {Array} req.body.details - Array of purchase details
 * @param {Object} req.user - Authenticated user object
 * @param {string} req.user.id - User ID from token verification
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Creates new purchase and returns purchase object
 */
export const createPurchase = handleCatchErrorAsync(async (req, res) => {
  const purchase = await createPurchaseService({
    ...req.body,
    createdBy: req.user.id,
  });
  globalResponse(res, 201, purchase);
});

/**
 * Update a purchase by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Purchase ID from URL
 * @param {Object} req.body - Request body containing purchase data to update
 * @param {number} [req.body.providerId] - Provider ID
 * @param {number} [req.body.total] - Total amount
 * @param {Array} [req.body.details] - Array of purchase details
 * @param {Object} req.user - Authenticated user object
 * @param {string} req.user.id - User ID from token verification
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Updates purchase and returns updated purchase object
 */
export const updatePurchaseById = handleCatchErrorAsync(async (req, res) => {
  const purchase = await updatePurchaseByIdService(req.params.id, {
    ...req.body,
    updatedBy: req.user.id,
  });
  globalResponse(res, 200, purchase);
});

/**
 * Delete a purchase by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Purchase ID from URL
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Deletes purchase and returns confirmation message
 */
export const deletePurchaseById = handleCatchErrorAsync(async (req, res) => {
  await deletePurchaseByIdService(req.params.id);
  globalResponse(res, 200, { message: 'Purchase deleted successfully' });
});

/**
 * Delete a purchase detail by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Purchase detail ID from URL
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Deletes purchase detail and returns confirmation message
 */
export const deletePurchaseDetailById = handleCatchErrorAsync(
  async (req, res) => {
    await deletePurchaseDetailByIdService(req.params.id);
    globalResponse(res, 200, {
      message: 'Purchase detail deleted successfully',
    });
  }
);
