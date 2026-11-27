import { prisma, Prisma } from '../../config/db.js';
import ClientError from '../../utils/responses&Errors/errors.js';
import type { SaleStatusValue } from '../../utils/lifecycle/salePurchase.js';
import { reverseLinkedMovements } from '../../utils/inventory/reversal.js';
import type {
  SaleCreateData,
  SaleListFilters,
  SalePatchData,
  SaleRecord,
  SaleStatusUpdateData,
} from './types.js';

/**
 * Get all sales with optional filters.
 *
 * @param {Object} filters - Optional filters for the query.
 * @param {number} [filters.clientId] - Filter by client ID.
 * @param {string} [filters.status] - Filter by lifecycle status.
 * @param {Date} [filters.startDate] - Filter by start date.
 * @param {Date} [filters.endDate] - Filter by end date.
 * @param {number} [filters.minTotal] - Filter by minimum total.
 * @param {number} [filters.maxTotal] - Filter by maximum total.
 * @param {number} take - Number of records to retrieve.
 * @param {number} skip - Number of records to skip.
 * @returns {Promise<Object>} Object containing dataList and total count.
 */
export const getAllSales = async (
  filters: SaleListFilters = {},
  take: number,
  skip: number
) => {
  const where = {
    ...(filters.clientId && { clientId: filters.clientId }),
    ...(filters.status && { status: filters.status }),
    ...((filters.startDate || filters.endDate) && {
      createdOn: {
        ...(filters.startDate && { gte: filters.startDate }),
        ...(filters.endDate && { lte: filters.endDate }),
      },
    }),
    ...(filters.minTotal && { total: { gte: filters.minTotal } }),
    ...(filters.maxTotal && { total: { lte: filters.maxTotal } }),
  };

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: {
        client: true,
        saleDetail: true,
        userSaleCreated: {
          select: {
            name: true,
          },
        },
        userSaleUpdated: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdOn: 'desc',
      },
      take,
      skip,
    }),
    prisma.sale.count({ where }),
  ]);

  return { dataList: sales, total };
};

/**
 * Create a new sale with details.
 *
 * @param {Object} data - Sale data.
 * @param {number} data.clientId - Client ID.
 * @param {number} data.total - Total amount.
 * @param {Array} data.details - Array of sale details.
 * @param {number} data.createdBy - User ID who created the sale.
 * @returns {Promise<Object>} Created sale with related data.
 */
export const createSale = async (data: SaleCreateData) => {
  const { details, ...saleData } = data;
  return prisma.sale.create({
    data: {
      createdOn: saleData.createdOn,
      total: saleData.total,
      saleDetail: {
        create: details.map((detail) => ({
          product: { connect: { id: Number(detail.productId) } }, // Conectar el producto existente
          quantity: Number(detail.quantity),
          price: Number(detail.price),
        })),
      },
      userSaleCreated: { connect: { id: saleData.createdBy } },
      client: { connect: { id: saleData.clientId } },
      ...(saleData.paymentMethod !== undefined && {
        paymentMethod: saleData.paymentMethod,
      }),
      ...(saleData.invoiceNumber !== undefined && {
        invoiceNumber: saleData.invoiceNumber,
      }),
    },
  });
};

/**
 * Partially update a sale and its details by ID.
 *
 * @param {number} id - Sale ID.
 * @param {Object} data - Updated sale data.
 * @param {number} [data.clientId] - Client ID.
 * @param {number} [data.total] - Total amount.
 * @param {Array} [data.details] - Array of sale details.
 * @param {number} data.updatedBy - User ID who updated the sale.
 * @returns {Promise<Object>} Updated sale with related data.
 */
export const patchSaleById = async (id: number, data: SalePatchData) => {
  const { details, ...saleData } = data;

  // Build update object dynamically based on provided fields
  const updateData: Prisma.saleUpdateInput = {
    updatedOn: new Date(),
  };

  // Only update fields that are provided
  if (saleData.clientId !== undefined) {
    // `clientId` es la FK escalar; en `saleUpdateInput` la relación se actualiza por `client`.
    updateData.client = { connect: { id: saleData.clientId } };
  }
  if (saleData.total !== undefined) {
    updateData.total = saleData.total;
  }
  // `status` is intentionally absent: only the lifecycle endpoint moves it.
  if (saleData.paymentMethod !== undefined) {
    updateData.paymentMethod = saleData.paymentMethod;
  }
  if (saleData.invoiceNumber !== undefined) {
    updateData.invoiceNumber = saleData.invoiceNumber;
  }

  // Only update sale details if provided
  if (details !== undefined) {
    // First delete existing details
    await prisma.saleDetail.deleteMany({
      where: { saleId: id },
    });

    // Then create new details
    updateData.saleDetail = {
      create: details.map((detail) => ({
        product: { connect: { id: Number(detail.productId) } },
        quantity: Number(detail.quantity),
        price: Number(detail.price),
      })),
    };
  }

  // Only update user if provided (though updatedBy should always be provided)
  if (data.updatedBy !== undefined) {
    updateData.userSaleUpdated = { connect: { id: data.updatedBy } };
  }

  return prisma.sale.update({
    where: { id },
    data: updateData,
  });
};

/**
 * Find a sale by ID, without relations.
 *
 * @param {number} id - Sale ID.
 * @returns {Promise<Object|null>} The sale or `null` when missing.
 */
export const findSaleById = async (id: number): Promise<SaleRecord | null> =>
  prisma.sale.findUnique({ where: { id } });

/**
 * Persist a validated sale status transition.
 *
 * The update is guarded by the status the service validated, so a concurrent
 * request cannot apply two transitions from the same starting point. A failed
 * guard means the row changed in between (409, retry).
 *
 * @param {number} id - Sale ID.
 * @param {string} currentStatus - Status the transition was validated against.
 * @param {Object} data - Target status plus optional payment/invoice fields.
 * @returns {Promise<Object>} Updated sale.
 * @throws {ClientError} 404 when missing, 409 when the status changed meanwhile.
 */
export const transitionSaleStatus = async (
  id: number,
  currentStatus: SaleStatusValue,
  data: SaleStatusUpdateData
): Promise<SaleRecord> =>
  prisma.$transaction(async (tx) => {
    const { count } = await tx.sale.updateMany({
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
      throw new ClientError('Sale status changed, reload and retry', 409);
    }

    const sale = await tx.sale.findUnique({ where: { id } });
    if (!sale) {
      throw new ClientError('Sale not found', 404);
    }
    return sale;
  });

/**
 * Cancel or refund a sale, reversing the inventory movements linked to it
 * (RN-SP-007, design D2).
 *
 * The guard on the starting status happens inside the transaction, so a
 * concurrent second request cannot apply the transition (and write a second
 * set of compensating movements) twice.
 *
 * @param {number} id - Sale ID.
 * @param {string} currentStatus - Status the transition was validated against.
 * @param {'CANCELLED'|'REFUNDED'} targetStatus - Status being applied.
 * @param {Object} data - Audit/payment fields applied with the transition.
 * @param {number} [data.updatedBy] - User applying the transition.
 * @returns {Promise<Object>} Updated sale.
 * @throws {ClientError} 404 when missing, 409 when the status changed meanwhile.
 */
export const transitionSaleWithReversal = async (
  id: number,
  currentStatus: SaleStatusValue,
  targetStatus: SaleStatusValue,
  data: Pick<
    SaleStatusUpdateData,
    'paymentMethod' | 'invoiceNumber' | 'updatedBy'
  >
): Promise<SaleRecord> =>
  prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({
      where: { id },
      include: { inventoryMovement: true },
    });

    if (!sale) {
      throw new ClientError('Sale not found', 404);
    }

    const { count } = await tx.sale.updateMany({
      where: { id, status: currentStatus },
      data: {
        status: targetStatus,
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
      throw new ClientError('Sale status changed, reload and retry', 409);
    }

    await reverseLinkedMovements(tx, sale.inventoryMovement, {
      document: `sale #${id}`,
      saleId: id,
      userId: data.updatedBy ?? sale.createdBy,
    });

    const updated = await tx.sale.findUnique({ where: { id } });
    if (!updated) {
      throw new ClientError('Sale not found', 404);
    }
    return updated;
  });

/**
 * Delete a sale and its details by ID.
 *
 * @param {number} id - Sale ID.
 * @returns {Promise<Object>} Deleted sale.
 */
export const deleteSaleById = async (id: number) => {
  // First delete all related details
  await prisma.saleDetail.deleteMany({
    where: { saleId: id },
  });

  // Then delete the sale
  return prisma.sale.delete({
    where: { id },
  });
};

/**
 * Delete a sale detail by ID.
 *
 * @param {number} id - Sale detail ID.
 * @returns {Promise<Object>} Deleted sale detail.
 */
export const deleteSaleDetailById = async (id: number) => {
  await prisma.saleDetail.delete({
    where: { id },
  });
};
