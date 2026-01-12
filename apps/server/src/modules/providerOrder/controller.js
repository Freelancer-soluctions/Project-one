import {
  getAllProviderOrders as getAllProviderOrdersService,
  createProviderOrder as createProviderOrderService,
  updateProviderOrderById as updateProviderOrderByIdService,
  deleteProviderOrderById as deleteProviderOrderByIdService,
} from './service.js';
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js';
import globalResponse from '../../utils/responses&Errors/globalResponse.js';

/**
 * Get all providerOrders with optional filters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllProviderOrders = handleCatchErrorAsync(async (req, res) => {
  console.log(req.query);
  const providerOrders = await getAllProviderOrdersService(req.query);
  globalResponse(res, 200, providerOrders);
});

/**
 * Create a new providerOrder
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createProviderOrder = handleCatchErrorAsync(async (req, res) => {
  console.log(req.body);
  const providerOrder = await createProviderOrderService({
    ...req.body,
    createdBy: req.userId,
  });
  globalResponse(res, 201, providerOrder);
});

/**
 * Update a providerOrder by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
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
 * Delete a providerOrder by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteProviderOrderById = handleCatchErrorAsync(
  async (req, res) => {
    await deleteProviderOrderByIdService(req.params.id);
    globalResponse(res, 200, { message: 'ProviderOrder deleted successfully' });
  }
);
