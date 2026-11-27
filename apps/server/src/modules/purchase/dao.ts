import { prisma } from '../../config/db.js';
import ClientError from '../../utils/responses&Errors/errors.js';
import type { PurchaseStatusValue } from '../../utils/lifecycle/salePurchase.js';
import { reverseLinkedMovements } from '../../utils/inventory/reversal.js';
import type {
  PurchaseCreateData,
  PurchaseListItem,
  PurchaseListFilters,
  PurchasesPage,
  PurchasePatchData,
  PurchaseRecord,
  PurchaseStatusUpdateData,
} from './types.js';

/**
 * Get all purchases with optional filters.
 *
 * @param {Object} filters - Optional filters for the query.
 * @param {number} [filters.providerId] - Filter by provider ID.
 * @param {string} [filters.status] - Filter by lifecycle status.
 * @param {Date} [filters.startDate] - Filter by start date.
 * @param {Date} [filters.endDate] - Filter by end date.
 * @param {number} [filters.minTotal] - Filter by minimum total.
 * @param {number} [filters.maxTotal] - Filter by maximum total.
 * @param {number} take - Number of records to retrieve.
 * @param {number} skip - Number of records to skip.
 * @returns {Promise<Object>} Object containing dataList and total count.
 */
export const getAllPurchases = async (
  filters: PurchaseListFilters = {},
  take: number,
  skip: number
): Promise<PurchasesPage> => {
  const where = {
    ...(filters.providerId && { providerId: filters.providerId }),
    ...(filters.status && { status: filters.status }),
    ...(filters.startDate && { createdOn: { gte: filters.startDate } }),
    ...(filters.endDate && { createdOn: { lte: filters.endDate } }),
    ...(filters.minTotal && { total: { gte: filters.minTotal } }),
    ...(filters.maxTotal && { total: { lte: filters.maxTotal } }),
  };

  const purchases: PurchaseListItem[] = await prisma.purchase.findMany({
    where,
    include: {
      provider: true,
      // La relación con `purchaseDetail` se llama `purchaseDetail` (no `details`).
      purchaseDetail: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      createdOn: 'desc',
    },
    take,
    skip,
  });

  const total = await prisma.purchase.count({
    where,
  });
  return { dataList: purchases, total };
};

/**
 * Create a new purchase with its details.
 *
 * @param {Object} data - Purchase data including details.
 * @param {number} data.providerId - Provider ID.
 * @param {number} data.total - Total amount.
 * @param {Array} data.details - Array of purchase details.
 * @param {number} data.details[].productId - Product ID.
 * @param {number} data.details[].quantity - Quantity.
 * @param {number} data.details[].price - Price per unit.
 * @param {number} data.createdBy - User ID who created the purchase.
 * @returns {Promise<Object>} Created purchase with its details and related data.
 */
export const createPurchase = async (data: PurchaseCreateData) => {
  const { details, ...purchaseData } = data;

  return prisma.purchase.create({
    data: {
      ...purchaseData,
      purchaseDetail: {
        create: details,
      },
    },
    include: {
      provider: true,
      purchaseDetail: {
        include: {
          product: true,
        },
      },
    },
  });
};

/**
 * Partially update a purchase and its details by ID.
 *
 * @param {number} id - Purchase ID.
 * @param {Object} data - Partial purchase data to update.
 * @param {number} [data.providerId] - Provider ID.
 * @param {number} [data.total] - Total amount.
 * @param {Array} [data.details] - Array of purchase details.
 * @param {number} data.updatedBy - User ID who updated the purchase.
 * @returns {Promise<Object>} Updated purchase with its details and related data.
 */
export const patchPurchaseById = async (
  id: number,
  data: PurchasePatchData
): Promise<PurchaseListItem | null> => {
  const { details, ...purchaseData } = data;
  const updateData = {
    updatedOn: new Date(),
    ...(purchaseData.providerId !== undefined && {
      providerId: purchaseData.providerId,
    }),
    ...(purchaseData.total !== undefined && { total: purchaseData.total }),
    // `status` is intentionally absent: only the lifecycle endpoint moves it.
    ...(purchaseData.paymentMethod !== undefined && {
      paymentMethod: purchaseData.paymentMethod,
    }),
    ...(purchaseData.invoiceNumber !== undefined && {
      invoiceNumber: purchaseData.invoiceNumber,
    }),
    ...(purchaseData.updatedBy !== undefined && {
      updatedBy: purchaseData.updatedBy,
    }),
  };

  // Only update purchase fields if they exist
  if (Object.keys(updateData).length > 0) {
    await prisma.purchase.update({
      where: { id },
      data: updateData,
    });
  }

  // Handle details conditionally - only if provided
  if (details !== undefined) {
    // First, delete existing details
    await prisma.purchaseDetail.deleteMany({
      where: { purchaseId: id },
    });

    // Then create new details if provided
    if (details && details.length > 0) {
      await prisma.purchase.update({
        where: { id },
        data: {
          purchaseDetail: {
            create: details,
          },
        },
      });
    }
  }

  // Return updated purchase with relations
  return prisma.purchase.findUnique({
    where: { id },
    include: {
      provider: true,
      purchaseDetail: {
        include: {
          product: true,
        },
      },
    },
  });
};

/**
 * Find a purchase by ID, without relations.
 *
 * @param {number} id - Purchase ID.
 * @returns {Promise<Object|null>} The purchase or `null` when missing.
 */
export const findPurchaseById = async (
  id: number
): Promise<PurchaseRecord | null> =>
  prisma.purchase.findUnique({ where: { id } });

/**
 * Persist a validated purchase status transition.
 *
 * The update is guarded by the status the service validated, so a concurrent
 * request cannot apply two transitions from the same starting point.
 *
 * @param {number} id - Purchase ID.
 * @param {string} currentStatus - Status the transition was validated against.
 * @param {Object} data - Target status plus optional payment/invoice fields.
 * @returns {Promise<Object>} Updated purchase.
 * @throws {ClientError} 404 when missing, 409 when the status changed meanwhile.
 */
export const transitionPurchaseStatus = async (
  id: number,
  currentStatus: PurchaseStatusValue,
  data: PurchaseStatusUpdateData
): Promise<PurchaseRecord> =>
  prisma.$transaction(async (tx) => {
    const { count } = await tx.purchase.updateMany({
      where: { id, status: currentStatus },
      data: {
        status: data.status,
        ...(data.paidAt !== undefined && { paidAt: data.paidAt }),
        ...(data.paymentMethod !== undefined && {
          paymentMethod: data.paymentMethod,
        }),
        ...(data.invoiceNumber !== undefined && {
          invoiceNumber: data.invoiceNumber,
        }),
        ...(data.updatedBy !== undefined && { updatedBy: data.updatedBy }),
        updatedOn: new Date(),
      },
    });

    if (count === 0) {
      throw new ClientError('Purchase status changed, reload and retry', 409);
    }

    const purchase = await tx.purchase.findUnique({ where: { id } });
    if (!purchase) {
      throw new ClientError('Purchase not found', 404);
    }
    return purchase;
  });

/**
 * Cancel a purchase, reversing the inventory movements linked to it
 * (RN-SP-004/RN-SP-007, design D2).
 *
 * The guard on the starting status happens inside the transaction, so a
 * concurrent second cancel cannot apply the transition (and write a second
 * set of compensating movements) twice.
 *
 * @param {number} id - Purchase ID.
 * @param {string} currentStatus - Status the transition was validated against.
 * @param {Object} data - Audit/payment fields applied with the cancellation.
 * @param {number} [data.updatedBy] - User cancelling the purchase.
 * @returns {Promise<Object>} Cancelled purchase.
 * @throws {ClientError} 404 when missing, 409 when the status changed meanwhile.
 */
export const cancelPurchaseWithReversal = async (
  id: number,
  currentStatus: PurchaseStatusValue,
  data: Pick<
    PurchaseStatusUpdateData,
    'paymentMethod' | 'invoiceNumber' | 'updatedBy'
  >
): Promise<PurchaseRecord> =>
  prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findUnique({
      where: { id },
      include: { inventoryMovement: true },
    });

    if (!purchase) {
      throw new ClientError('Purchase not found', 404);
    }

    const { count } = await tx.purchase.updateMany({
      where: { id, status: currentStatus },
      data: {
        status: 'CANCELLED',
        ...(data.paymentMethod !== undefined && {
          paymentMethod: data.paymentMethod,
        }),
        ...(data.invoiceNumber !== undefined && {
          invoiceNumber: data.invoiceNumber,
        }),
        ...(data.updatedBy !== undefined && { updatedBy: data.updatedBy }),
        updatedOn: new Date(),
      },
    });

    if (count === 0) {
      throw new ClientError('Purchase status changed, reload and retry', 409);
    }

    await reverseLinkedMovements(tx, purchase.inventoryMovement, {
      document: `purchase #${id}`,
      purchaseId: id,
      userId: data.updatedBy ?? purchase.createdBy,
    });

    const updated = await tx.purchase.findUnique({ where: { id } });
    if (!updated) {
      throw new ClientError('Purchase not found', 404);
    }
    return updated;
  });

/**
 * Delete a purchase and its details by ID.
 *
 * @param {number} id - Purchase ID.
 * @returns {Promise<Object>} Deleted purchase.
 */
export const deletePurchaseById = async (id: number) => {
  // First, delete all related details
  await prisma.purchaseDetail.deleteMany({
    where: { purchaseId: id },
  });

  // Then delete the purchase
  return prisma.purchase.delete({
    where: { id },
  });
};

/**
 * Delete a purchase detail by ID.
 *
 * @param {number} id - Purchase detail ID.
 * @returns {Promise<Object>} Deleted purchase detail.
 */
export const deletePurchaseDetailById = async (id: number) => {
  await prisma.purchaseDetail.delete({
    where: { id },
  });
};
