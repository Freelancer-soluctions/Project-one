import {
  getAllProviderOrders as getAllProviderOrdersDao,
  findProviderOrderById as findProviderOrderByIdDao,
  createProviderOrder as createProviderOrderDao,
  patchProviderOrderById as patchProviderOrderByIdDao,
  deleteProviderOrderById as deleteProviderOrderByIdDao,
  convertProviderOrderToPurchase as convertProviderOrderToPurchaseDao,
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
  ProviderOrderCreateData,
  ProviderOrderListItem,
  ProviderOrderPatchData,
  ProviderOrdersPage,
  ProviderOrdersQuery,
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
 * Retrieves a paginated provider order list with validated filters.
 *
 * @param {ProviderOrdersQuery} filters - Filters plus optional `page` / `limit`.
 * @returns {Promise<ProviderOrdersPage>} `{ dataList, total }` for the requested page.
 */
export const getAllProviderOrders = async (
  filters: ProviderOrdersQuery
): Promise<ProviderOrdersPage> => {
  const { take, skip } = getSafePagination({
    page: filters.page,
    limit: filters.limit,
  });

  return getAllProviderOrdersDao(filters, take, skip);
};

/**
 * Creates a provider order with its details and computed total.
 *
 * @param {ProviderOrderCreateData} data - Order payload; date strings are parsed to `Date`.
 * @returns {Promise<ProviderOrderListItem>} Created order.
 * @throws {ClientError} 403 when a non-ADMIN sets `deliveredOn` (RN-ORD-005b).
 */
export const createProviderOrder = async (
  data: ProviderOrderCreateData
): Promise<ProviderOrderListItem> => {
  assertCanSetDeliveredOn(data.deliveredOn, data.userRole);

  return createProviderOrderDao({
    ...data,
    expectedDeliveryDate: parseDate(data.expectedDeliveryDate),
    deliveredOn: parseDate(data.deliveredOn),
  });
};

/**
 * Patches a provider order.
 *
 * Enforces the status lifecycle (RN-ORD-010/011), stamps `deliveredOn` when
 * reaching RECEIVED/COMPLETED (RN-ORD-005) and delegates the transactional
 * total recompute to the DAO (RN-ORD-003).
 *
 * @param {number} id - Provider order id.
 * @param {ProviderOrderPatchData} data - Partial header fields and optional replacement details.
 * @returns {Promise<ProviderOrderListItem>} Updated order.
 * @throws {ClientError} 404 when missing, 400 on an invalid transition, 403 on a non-ADMIN `deliveredOn`.
 */
export const patchProviderOrderById = async (
  id: number,
  data: ProviderOrderPatchData
): Promise<ProviderOrderListItem> => {
  const current = await findProviderOrderByIdDao(id);
  if (!current) {
    throw new ClientError('Provider order not found', 404);
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

  return patchProviderOrderByIdDao(id, {
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
 * Deletes a provider order and its details.
 *
 * @param {number} id - Provider order id.
 * @returns {Promise<void>}
 * @throws {ClientError} 404 when missing, 409 when a purchase is linked (RN-ORD-007).
 */
export const deleteProviderOrderById = async (id: number): Promise<void> =>
  deleteProviderOrderByIdDao(id);

/**
 * Converts a provider order into a purchase and persists `purchaseId`.
 *
 * @param {number} id - Provider order id.
 * @param {number} userId - Authenticated user performing the conversion.
 * @returns {Promise<ProviderOrderListItem>} Updated order with the linked purchase.
 * @throws {ClientError} 404 when missing, 409 when already converted, 400 when cancelled.
 */
export const convertProviderOrderToPurchase = async (
  id: number,
  userId: number
): Promise<ProviderOrderListItem> =>
  convertProviderOrderToPurchaseDao(id, userId);
