import {
  getAllPurchases as getAllPurchasesDao,
  createPurchase as createPurchaseDao,
  deletePurchaseById as deletePurchaseByIdDao,
  deletePurchaseDetailById as deletePurchaseDetailByIdDao,
  findPurchaseById as findPurchaseByIdDao,
  patchPurchaseById as patchPurchaseByIdDao,
  transitionPurchaseStatus as transitionPurchaseStatusDao,
  cancelPurchaseWithReversal as cancelPurchaseWithReversalDao,
} from './dao.js';
import { getSafePagination } from '../../utils/pagination/pagination.js';
import ClientError from '../../utils/responses&Errors/errors.js';
import { assertValidPurchaseTransition } from '../../utils/lifecycle/salePurchase.js';
import type {
  PurchaseCreateData,
  PurchasesPage,
  PurchasesQuery,
  PurchaseListItem,
  PurchasePatchData,
  PurchaseRecord,
  PurchaseStatusTransitionInput,
} from './types.js';

/**
 * Get all purchases with optional filters.
 *
 * @param {Object} filters - Optional filters for the query.
 * @param {number} [filters.page] - Page number for pagination.
 * @param {number} [filters.limit] - Number of items per page.
 * @param {number} [filters.providerId] - Filter by provider ID.
 * @param {Date} [filters.startDate] - Filter by start date.
 * @param {Date} [filters.endDate] - Filter by end date.
 * @param {number} [filters.minTotal] - Filter by minimum total.
 * @param {number} [filters.maxTotal] - Filter by maximum total.
 * @returns {Promise<Object>} Paginated list of purchases with metadata.
 * @throws {Error} When pagination parameters are missing or invalid.
 */
export const getAllPurchases = async (
  filters: PurchasesQuery
): Promise<PurchasesPage> => {
  const { take, skip } = getSafePagination({
    page: filters.page,
    limit: filters.limit,
  });

  if (!take || take <= 0) {
    throw new Error('Pagination is required');
  }
  return await getAllPurchasesDao(filters, take, skip);
};

/**
 * Create a new purchase.
 *
 * @param {Object} data - Purchase data.
 * @param {number} data.providerId - Provider ID.
 * @param {number} data.total - Total amount.
 * @param {Array} data.details - Array of purchase details.
 * @param {number} data.createdBy - User ID who created the purchase.
 * @returns {Promise<Object>} Created purchase.
 */
export const createPurchase = async (data: PurchaseCreateData) => {
  return createPurchaseDao({
    ...data,
    createdOn: data.createdOn ?? new Date(),
  });
};

/**
 * Delete a purchase by ID.
 *
 * @param {number} id - Purchase ID.
 * @returns {Promise<Object>} Deleted purchase.
 */
export const deletePurchaseById = async (id: number) => {
  return deletePurchaseByIdDao(id);
};

/**
 * Delete a purchase detail by ID.
 *
 * @param {number} id - Purchase detail ID.
 * @returns {Promise<Object>} Deleted purchase detail.
 */
export const deletePurchaseDetailById = async (id: number) => {
  return deletePurchaseDetailByIdDao(id);
};

/**
 * Partially update a purchase by ID.
 *
 * @param {number} id - Purchase ID.
 * @param {Object} data - Updated purchase data.
 * @param {number} [data.providerId] - Provider ID.
 * @param {number} [data.total] - Total amount.
 * @param {Array} [data.details] - Array of purchase details.
 * @param {number} data.updatedBy - User ID who updated the purchase.
 * @returns {Promise<Object>} Updated purchase.
 */
export const patchPurchaseById = async (
  id: number,
  data: PurchasePatchData
): Promise<PurchaseListItem | null> => {
  return patchPurchaseByIdDao(id, data);
};

/**
 * Move a purchase through its lifecycle (RN-SP-003..RN-SP-005).
 *
 * `paidAt` is stamped automatically on PAID and cancellation writes the
 * compensating inventory movements instead of deleting the row.
 *
 * @param {number|string} id - Purchase ID.
 * @param {Object} data - Target status plus optional payment/invoice fields.
 * @returns {Promise<Object>} Updated purchase.
 * @throws {ClientError} 404 when missing, 400 on an invalid transition, 409 when already cancelled.
 */
export const transitionPurchaseStatus = async (
  id: number | string,
  data: PurchaseStatusTransitionInput
): Promise<PurchaseRecord> => {
  const purchaseId = Number(id);
  const current = await findPurchaseByIdDao(purchaseId);

  if (!current) {
    throw new ClientError('Purchase not found', 404);
  }

  assertValidPurchaseTransition(current.status, data.status);

  const hasPaymentUpdate =
    data.paymentMethod !== undefined || data.invoiceNumber !== undefined;

  // Idempotent no-op: a repeated cancel never writes a second compensation,
  // but payment data sent along with it is still persisted.
  if (current.status === data.status) {
    if (!hasPaymentUpdate) return current;

    return transitionPurchaseStatusDao(purchaseId, current.status, {
      status: current.status,
      ...(data.paymentMethod !== undefined && {
        paymentMethod: data.paymentMethod,
      }),
      ...(data.invoiceNumber !== undefined && {
        invoiceNumber: data.invoiceNumber,
      }),
      ...(data.updatedBy !== undefined && { updatedBy: data.updatedBy }),
    });
  }

  if (data.status === 'CANCELLED') {
    return cancelPurchaseWithReversalDao(purchaseId, current.status, {
      paymentMethod: data.paymentMethod,
      invoiceNumber: data.invoiceNumber,
      updatedBy: data.updatedBy,
    });
  }

  return transitionPurchaseStatusDao(purchaseId, current.status, {
    status: data.status,
    ...(data.status === 'PAID' && { paidAt: new Date() }),
    ...(data.paymentMethod !== undefined && {
      paymentMethod: data.paymentMethod,
    }),
    ...(data.invoiceNumber !== undefined && {
      invoiceNumber: data.invoiceNumber,
    }),
    ...(data.updatedBy !== undefined && { updatedBy: data.updatedBy }),
  });
};
