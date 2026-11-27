import {
  getAllProviderOrders as getAllProviderOrdersService,
  createProviderOrder as createProviderOrderService,
  patchProviderOrderById as patchProviderOrderByIdService,
  deleteProviderOrderById as deleteProviderOrderByIdService,
  convertProviderOrderToPurchase as convertProviderOrderToPurchaseService,
} from './service.js';
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js';
import globalResponse from '../../utils/responses&Errors/globalResponse.js';
import type {
  ProviderOrderCreateData,
  ProviderOrderInput,
  ProviderOrderPatchData,
  ProviderOrdersQuery,
} from './types.js';

/**
 * GET /providerOrder — paginated list with filters.
 *
 * @param {Request} req - HTTP request with `req.safeQuery` already validated by Joi.
 * @param {Response} res - HTTP response.
 * @returns {Promise<void>} 200 with the paginated `{ dataList, total }` payload.
 */
export const getAllProviderOrders = handleCatchErrorAsync(async (req, res) => {
  const orders = await getAllProviderOrdersService(
    req.safeQuery as ProviderOrdersQuery
  );
  globalResponse(res, 200, orders);
});

/**
 * POST /providerOrder — create with details.
 *
 * @param {Request} req - HTTP request; `req.body` was validated by `providerOrderCreateSchema`.
 * @param {Response} res - HTTP response.
 * @returns {Promise<void>} 201 with the created order.
 */
export const createProviderOrder = handleCatchErrorAsync(async (req, res) => {
  const order = await createProviderOrderService({
    ...(req.body as ProviderOrderInput),
    createdBy: req.userId as number,
    userRole: req.userRole,
  } as ProviderOrderCreateData);
  globalResponse(res, 201, order);
});

/**
 * PATCH /providerOrder/:id — partial update.
 *
 * @param {Request} req - HTTP request; `req.params.id` is numeric and the body was validated.
 * @param {Response} res - HTTP response.
 * @returns {Promise<void>} 200 with the updated order.
 */
export const patchProviderOrderById = handleCatchErrorAsync(
  async (req, res) => {
    const order = await patchProviderOrderByIdService(
      Number(req.params['id']),
      {
        ...(req.body as ProviderOrderInput),
        updatedBy: req.userId as number,
        userRole: req.userRole,
      } as ProviderOrderPatchData
    );
    globalResponse(res, 200, order);
  }
);

/**
 * DELETE /providerOrder/:id — 409 when linked to a purchase.
 *
 * @param {Request} req - HTTP request with a validated numeric `req.params.id`.
 * @param {Response} res - HTTP response.
 * @returns {Promise<void>} 200 with a confirmation message.
 */
export const deleteProviderOrderById = handleCatchErrorAsync(
  async (req, res) => {
    await deleteProviderOrderByIdService(Number(req.params['id']));
    globalResponse(res, 200, {
      message: 'Provider order deleted successfully',
    });
  }
);

/**
 * POST /providerOrder/:id/convert — creates the linked purchase.
 *
 * @param {Request} req - HTTP request with a validated numeric `req.params.id`.
 * @param {Response} res - HTTP response.
 * @returns {Promise<void>} 200 with the order carrying the new `purchaseId`.
 */
export const convertProviderOrderToPurchase = handleCatchErrorAsync(
  async (req, res) => {
    const order = await convertProviderOrderToPurchaseService(
      Number(req.params['id']),
      req.userId as number
    );
    globalResponse(res, 200, order);
  }
);
