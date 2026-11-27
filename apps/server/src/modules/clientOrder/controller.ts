import {
  getAllClientOrders as getAllClientOrdersService,
  createClientOrder as createClientOrderService,
  patchClientOrderById as patchClientOrderByIdService,
  deleteClientOrderById as deleteClientOrderByIdService,
  convertClientOrderToSale as convertClientOrderToSaleService,
} from './service.js';
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js';
import globalResponse from '../../utils/responses&Errors/globalResponse.js';
import type {
  ClientOrderCreateData,
  ClientOrderInput,
  ClientOrderPatchData,
  ClientOrdersQuery,
} from './types.js';

/**
 * GET /clientOrder — paginated list with filters.
 *
 * @param {Request} req - HTTP request with `req.safeQuery` already validated by Joi.
 * @param {Response} res - HTTP response.
 * @returns {Promise<void>} 200 with the paginated `{ dataList, total }` payload.
 */
export const getAllClientOrders = handleCatchErrorAsync(async (req, res) => {
  const orders = await getAllClientOrdersService(
    req.safeQuery as ClientOrdersQuery
  );
  globalResponse(res, 200, orders);
});

/**
 * POST /clientOrder — create with details.
 *
 * @param {Request} req - HTTP request; `req.body` was validated by `clientOrderCreateSchema`.
 * @param {Response} res - HTTP response.
 * @returns {Promise<void>} 201 with the created order.
 */
export const createClientOrder = handleCatchErrorAsync(async (req, res) => {
  const order = await createClientOrderService({
    ...(req.body as ClientOrderInput),
    createdBy: req.userId as number,
    userRole: req.userRole,
  } as ClientOrderCreateData);
  globalResponse(res, 201, order);
});

/**
 * PATCH /clientOrder/:id — partial update.
 *
 * @param {Request} req - HTTP request; `req.params.id` is numeric and the body was validated.
 * @param {Response} res - HTTP response.
 * @returns {Promise<void>} 200 with the updated order.
 */
export const patchClientOrderById = handleCatchErrorAsync(async (req, res) => {
  const order = await patchClientOrderByIdService(Number(req.params['id']), {
    ...(req.body as ClientOrderInput),
    updatedBy: req.userId as number,
    userRole: req.userRole,
  } as ClientOrderPatchData);
  globalResponse(res, 200, order);
});

/**
 * DELETE /clientOrder/:id — 409 when linked to a sale.
 *
 * @param {Request} req - HTTP request with a validated numeric `req.params.id`.
 * @param {Response} res - HTTP response.
 * @returns {Promise<void>} 200 with a confirmation message.
 */
export const deleteClientOrderById = handleCatchErrorAsync(async (req, res) => {
  await deleteClientOrderByIdService(Number(req.params['id']));
  globalResponse(res, 200, { message: 'Client order deleted successfully' });
});

/**
 * POST /clientOrder/:id/convert — creates the linked sale.
 *
 * @param {Request} req - HTTP request with a validated numeric `req.params.id`.
 * @param {Response} res - HTTP response.
 * @returns {Promise<void>} 200 with the order carrying the new `saleId`.
 */
export const convertClientOrderToSale = handleCatchErrorAsync(
  async (req, res) => {
    const order = await convertClientOrderToSaleService(
      Number(req.params['id']),
      req.userId as number
    );
    globalResponse(res, 200, order);
  }
);
