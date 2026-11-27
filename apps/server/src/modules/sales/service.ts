import {
  getAllSales as getAllSalesDao,
  createSale as createSaleDao,
  deleteSaleById as deleteSaleByIdDao,
  deleteSaleDetailById as deleteSaleDetailByIdDao,
  findSaleById as findSaleByIdDao,
  patchSaleById as patchSaleByIdDao,
  transitionSaleStatus as transitionSaleStatusDao,
  transitionSaleWithReversal as transitionSaleWithReversalDao,
} from './dao.js';
import { getSafePagination } from '../../utils/pagination/pagination.js';
import ClientError from '../../utils/responses&Errors/errors.js';
import { assertValidSaleTransition } from '../../utils/lifecycle/salePurchase.js';
import type {
  SaleCreateData,
  SaleInput,
  SalePatchData,
  SaleRecord,
  SaleStatusTransitionInput,
  SalesQuery,
} from './types.js';

/**
 * Get all sales with optional filters.
 *
 * @param {Object} filters - Optional filters for the query.
 * @param {number} [filters.page] - Page number for pagination.
 * @param {number} [filters.limit] - Number of items per page.
 * @param {number} [filters.clientId] - Filter by client ID.
 * @param {Date} [filters.startDate] - Filter by start date.
 * @param {Date} [filters.endDate] - Filter by end date.
 * @param {number} [filters.minTotal] - Filter by minimum total.
 * @param {number} [filters.maxTotal] - Filter by maximum total.
 * @returns {Promise<Object>} Paginated list of sales with metadata.
 * @throws {Error} When pagination parameters are missing or invalid.
 */
export const getAllSales = async (filters: SalesQuery) => {
  const formatedFilters = {
    ...filters,
    clientId: Number(filters.clientId),
  };
  const { take, skip } = getSafePagination({
    page: formatedFilters.page,
    limit: formatedFilters.limit,
  });

  if (!take || take <= 0) {
    throw new Error('Pagination is required');
  }
  return await getAllSalesDao(formatedFilters, take, skip);
};

/**
 * Create a new sale.
 *
 * @param {Object} data - Sale data.
 * @param {number} data.clientId - Client ID.
 * @param {number} data.total - Total amount.
 * @param {Array} data.details - Array of sale details.
 * @param {number} data.createdBy - User ID who created the sale.
 * @returns {Promise<Object>} Created sale.
 */
export const createSale = async (data: SaleInput) => {
  const dataToCreate: SaleCreateData = {
    clientId: Number(data.clientId),
    total: Number(data.total),
    details: data.details ?? [],
    createdBy: Number(data.createdBy),
    createdOn: new Date(),
    ...(data.paymentMethod !== undefined && {
      paymentMethod: data.paymentMethod,
    }),
    ...(data.invoiceNumber !== undefined && {
      invoiceNumber: data.invoiceNumber,
    }),
  };
  return createSaleDao(dataToCreate);
};

/**
 * Partially update a sale by ID.
 *
 * @param {number} id - Sale ID.
 * @param {Object} data - Updated sale data.
 * @param {number} [data.clientId] - Client ID.
 * @param {number} [data.total] - Total amount.
 * @param {Array} [data.details] - Array of sale details.
 * @param {number} data.updatedBy - User ID who updated the sale.
 * @returns {Promise<Object>} Updated sale.
 */
export const patchSaleById = async (id: number | string, data: SaleInput) => {
  const dataToUpdate: SalePatchData & { updatedOn?: Date } = {
    clientId: data.clientId !== undefined ? Number(data.clientId) : undefined,
    total: data.total !== undefined ? Number(data.total) : undefined,
    details: data.details,
    paymentMethod: data.paymentMethod,
    invoiceNumber: data.invoiceNumber,
    updatedBy:
      data.updatedBy !== undefined ? Number(data.updatedBy) : undefined,
    updatedOn: new Date(),
  };
  // Remove undefined values
  (Object.keys(dataToUpdate) as (keyof typeof dataToUpdate)[]).forEach(
    (key) => dataToUpdate[key] === undefined && delete dataToUpdate[key]
  );
  return patchSaleByIdDao(Number(id), dataToUpdate);
};

/**
 * Move a sale through its lifecycle (RN-SP-001..RN-SP-005).
 *
 * `paidAt` is stamped automatically on PAID and cancellation writes the
 * compensating inventory movements instead of deleting the row.
 *
 * @param {number|string} id - Sale ID.
 * @param {Object} data - Target status plus optional payment/invoice fields.
 * @returns {Promise<Object>} Updated sale.
 * @throws {ClientError} 404 when missing, 400 on an invalid transition, 409 when already cancelled.
 */
export const transitionSaleStatus = async (
  id: number | string,
  data: SaleStatusTransitionInput
): Promise<SaleRecord> => {
  const saleId = Number(id);
  const current = await findSaleByIdDao(saleId);

  if (!current) {
    throw new ClientError('Sale not found', 404);
  }

  assertValidSaleTransition(current.status, data.status);

  const hasPaymentUpdate =
    data.paymentMethod !== undefined || data.invoiceNumber !== undefined;

  // Re-sending the current status is an idempotent no-op: it never pays twice
  // and never writes a second set of compensating movements. Payment data sent
  // with it is still persisted instead of being silently dropped.
  if (current.status === data.status) {
    if (!hasPaymentUpdate) return current;

    return transitionSaleStatusDao(saleId, current.status, {
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

  if (data.status === 'CANCELLED' || data.status === 'REFUNDED') {
    return transitionSaleWithReversalDao(saleId, current.status, data.status, {
      paymentMethod: data.paymentMethod,
      invoiceNumber: data.invoiceNumber,
      updatedBy: data.updatedBy,
    });
  }

  return transitionSaleStatusDao(saleId, current.status, {
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

/**
 * Delete a sale by ID.
 *
 * @param {number} id - Sale ID.
 * @returns {Promise<Object>} Deleted sale.
 */
export const deleteSaleById = async (id: number | string) => {
  return deleteSaleByIdDao(Number(id));
};

/**
 * Delete a sale detail by ID.
 *
 * @param {number} id - Sale detail ID.
 * @returns {Promise<Object>} Deleted sale detail.
 */
export const deleteSaleDetailById = async (id: number | string) => {
  return deleteSaleDetailByIdDao(Number(id));
};
