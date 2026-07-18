import {
  getAllClientOrders as getAllClientOrdersService,
  createClientOrder as createClientOrderService,
  updateClientOrderById as updateClientOrderByIdService,
  deleteClientOrderById as deleteClientOrderByIdService,
} from './service.js';
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js';
import globalResponse from '../../utils/responses&Errors/globalResponse.js';

/**
 * Get all client orders with optional filters.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.safeQuery - Safe query parameters with filters
 * @param {number} [req.safeQuery.page] - Page number for pagination
 * @param {number} [req.safeQuery.limit] - Number of items per page
 * @param {number} [req.safeQuery.clientId] - Filter by client ID
 * @param {string} [req.safeQuery.status] - Filter by order status
 * @param {Date} [req.safeQuery.startDate] - Filter by start date
 * @param {Date} [req.safeQuery.endDate] - Filter by end date
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Returns paginated list of client orders
 */
export const getAllClientOrders = handleCatchErrorAsync(async (req, res) => {
  const clientOrders = await getAllClientOrdersService(req.safeQuery);
  globalResponse(res, 200, clientOrders);
});

/**
 * Create a new client order.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - Request body containing client order data
 * @param {number} req.body.clientId - Client ID
 * @param {number} req.body.total - Total order amount
 * @param {Array} req.body.details - Array of order details
 * @param {string} req.body.status - Order status (PENDING, PROCESSING, COMPLETED, CANCELLED)
 * @param {string} req.userId - Authenticated user ID from token verification
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Creates new client order and returns order object
 */
export const createClientOrder = handleCatchErrorAsync(async (req, res) => {
  console.log(req.body);
  const clientOrder = await createClientOrderService({
    ...req.body,
    createdBy: req.userId,
  });
  globalResponse(res, 201, clientOrder);
});

/**
 * Update a client order by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Client order ID from URL
 * @param {Object} req.body - Request body containing client order data to update
 * @param {number} [req.body.total] - Total order amount
 * @param {string} [req.body.status] - Order status (PENDING, PROCESSING, COMPLETED, CANCELLED)
 * @param {string} req.userId - Authenticated user ID from token verification
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Updates client order and returns updated order object
 */
export const updateClientOrderById = handleCatchErrorAsync(async (req, res) => {
  const clientOrder = await updateClientOrderByIdService(req.params.id, {
    ...req.body,
    updatedBy: req.userId,
  });
  globalResponse(res, 200, clientOrder);
});

/**
 * Delete a client order by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Client order ID from URL
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Deletes client order and returns confirmation message
 */
export const deleteClientOrderById = handleCatchErrorAsync(async (req, res) => {
  await deleteClientOrderByIdService(req.params.id);
  globalResponse(res, 200, { message: 'ClientOrder deleted successfully' });
});
