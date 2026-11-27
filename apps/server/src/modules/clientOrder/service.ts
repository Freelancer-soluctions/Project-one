import {
  getAllClientOrders as getAllClientOrdersDao,
  findClientOrderById as findClientOrderByIdDao,
  createClientOrder as createClientOrderDao,
  patchClientOrderById as patchClientOrderByIdDao,
  deleteClientOrderById as deleteClientOrderByIdDao,
  convertClientOrderToSale as convertClientOrderToSaleDao,
} from './dao.js';
import { getSafePagination } from '../../utils/pagination/pagination.js';
import { ROLESCODES } from '../../utils/constants/enums.js';
import ClientError from '../../utils/responses&Errors/errors.js';
import {
  assertValidStatusTransition,
  DELIVERED_STATUSES,
  type OrderStatusValue,
} from '../orders/orderLifecycle.js';
import type {
  ClientOrderCreateData,
  ClientOrderPatchData,
  ClientOrderListItem,
  ClientOrdersPage,
  ClientOrdersQuery,
} from './types.js';

/** Joi validates date strings but does not rewrite the body; parse them here. */
const parseDate = (
  value: string | Date | null | undefined
): Date | null | undefined => {
  if (value === undefined || value === null) return value;
  return new Date(value);
};

/** `deliveredOn` is ADMIN-only (RN-ORD-005b). */
const assertCanSetDeliveredOn = (
  deliveredOn: string | Date | null | undefined,
  userRole?: string
): void => {
  if (deliveredOn !== undefined && userRole !== ROLESCODES.ADMIN) {
    throw new ClientError('Only an ADMIN can set deliveredOn manually', 403);
  }
};

/**
 * Retrieves a paginated client order list with validated filters.
 *
 * @param {ClientOrdersQuery} filters - Filters plus optional `page` / `limit`.
 * @returns {Promise<ClientOrdersPage>} `{ dataList, total }` for the requested page.
 */
export const getAllClientOrders = async (
  filters: ClientOrdersQuery
): Promise<ClientOrdersPage> => {
  const { take, skip } = getSafePagination({
    page: filters.page,
    limit: filters.limit,
  });

  return getAllClientOrdersDao(filters, take, skip);
};

/**
 * Creates a client order with its details and computed total.
 *
 * @param {ClientOrderCreateData} data - Order payload; date strings are parsed to `Date`.
 * @returns {Promise<ClientOrderListItem>} Created order.
 * @throws {ClientError} 403 when a non-ADMIN sets `deliveredOn` (RN-ORD-005b).
 */
export const createClientOrder = async (
  data: ClientOrderCreateData
): Promise<ClientOrderListItem> => {
  assertCanSetDeliveredOn(data.deliveredOn, data.userRole);

  return createClientOrderDao({
    ...data,
    expectedDeliveryDate: parseDate(data.expectedDeliveryDate),
    deliveredOn: parseDate(data.deliveredOn),
  });
};

/**
 * Patches a client order.
 *
 * Enforces the status lifecycle (RN-ORD-010/011), stamps `deliveredOn` when
 * reaching RECEIVED/COMPLETED (RN-ORD-005) and delegates the transactional
 * total recompute to the DAO (RN-ORD-003).
 *
 * @param {number} id - Client order id.
 * @param {ClientOrderPatchData} data - Partial header fields and optional replacement details.
 * @returns {Promise<ClientOrderListItem>} Updated order.
 * @throws {ClientError} 404 when missing, 400 on an invalid transition, 403 on a non-ADMIN `deliveredOn`.
 */
export const patchClientOrderById = async (
  id: number,
  data: ClientOrderPatchData
): Promise<ClientOrderListItem> => {
  const current = await findClientOrderByIdDao(id);
  if (!current) {
    throw new ClientError('Client order not found', 404);
  }

  if (data.status !== undefined) {
    assertValidStatusTransition(current.status, data.status);
  }
  assertCanSetDeliveredOn(data.deliveredOn, data.userRole);

  const targetStatus: OrderStatusValue = data.status ?? current.status;
  const shouldStampDeliveredOn =
    data.deliveredOn === undefined &&
    DELIVERED_STATUSES.includes(targetStatus) &&
    current.deliveredOn === null;

  return patchClientOrderByIdDao(id, {
    ...data,
    expectedDeliveryDate: parseDate(data.expectedDeliveryDate),
    deliveredOn:
      data.deliveredOn === undefined
        ? shouldStampDeliveredOn
          ? new Date()
          : undefined
        : parseDate(data.deliveredOn),
  });
};

/**
 * Deletes a client order and its details.
 *
 * @param {number} id - Client order id.
 * @returns {Promise<void>}
 * @throws {ClientError} 404 when missing, 409 when a sale is linked (RN-ORD-007).
 */
export const deleteClientOrderById = async (id: number): Promise<void> =>
  deleteClientOrderByIdDao(id);

/**
 * Converts a client order into a sale and persists `saleId`.
 *
 * @param {number} id - Client order id.
 * @param {number} userId - Authenticated user performing the conversion.
 * @returns {Promise<ClientOrderListItem>} Updated order with the linked sale.
 * @throws {ClientError} 404 when missing, 409 when already converted, 400 when cancelled.
 */
export const convertClientOrderToSale = async (
  id: number,
  userId: number
): Promise<ClientOrderListItem> => convertClientOrderToSaleDao(id, userId);
