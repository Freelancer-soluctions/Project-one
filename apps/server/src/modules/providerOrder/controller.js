import {
  getAllProviderOrders as getAllProviderOrdersService,
  createProviderOrder as createProviderOrderService,
  updateProviderOrderById as updateProviderOrderByIdService,
  deleteProviderOrderById as deleteProviderOrderByIdService,
} from './service.js';
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js';
import globalResponse from '../../utils/responses&Errors/globalResponse.js';

/**
 * Get all provider orders with optional filters.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.safeQuery - Safe query parameters with filters
 * @param {number} [req.safeQuery.page] - Page number for pagination
 * @param {number} [req.safeQuery.limit] - Number of items per page
 * @param {number} [req.safeQuery.providerId] - Filter by provider ID
 * @param {string} [req.safeQuery.status] - Filter by order status
 * @param {Date} [req.safeQuery.startDate] - Filter by start date
 * @param {Date} [req.safeQuery.endDate] - Filter by end date
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Returns paginated list of provider orders
 */
export const getAllProviderOrders = handleCatchErrorAsync(async (req, res) => {
  const providerOrders = await getAllProviderOrdersService(req.safeQuery);
  globalResponse(res, 200, providerOrders);
});

/**
 * Create a new provider order.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - Request body containing provider order data
 * @param {number} req.body.providerId - Provider ID
 * @param {number} req.body.total - Total order amount
 * @param {Array} req.body.details - Array of order details
 * @param {string} req.body.status - Order status (PENDING, PROCESSING, COMPLETED, CANCELLED)
 * @param {string} req.userId - Authenticated user ID from token verification
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Creates new provider order and returns order object
 */
export const createProviderOrder = handleCatchErrorAsync(async (req, res) => {
  const providerOrder = await createProviderOrderService({
    ...req.body,
    createdBy: req.userId,
  });
  globalResponse(res, 201, providerOrder);
});

/**
 * Update a provider order by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Provider order ID from URL
 * @param {Object} req.body - Request body containing provider order data to update
 * @param {number} [req.body.total] - Total order amount
 * @param {string} [req.body.status] - Order status (PENDING, PROCESSING, COMPLETED, CANCELLED)
 * @param {string} req.userId - Authenticated user ID from token verification
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Updates provider order and returns updated order object
 */
export const updateProviderOrderById = handleCatchErrorAsync(
  async (req, res) => {
    const providerOrder = await updateProviderOrderByIdService(req.params.id, {
      ...req.body,
      updatedBy: req.userId,
    });
    globalResponse(res, 200, providerOrder);
  }
);

/**
 * Delete a provider order by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Provider order ID from URL
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Deletes provider order and returns confirmation message
 */
export const deleteProviderOrderById = handleCatchErrorAsync(
  async (req, res) => {
    await deleteProviderOrderByIdService(req.params.id);
    globalResponse(res, 200, { message: 'ProviderOrder deleted successfully' });
  }
);
