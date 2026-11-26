import { prisma, Prisma } from '../../config/db.js';
import ClientError from '../../utils/responses&Errors/errors.js';
import { computeDetailsTotal } from '../orders/orderLifecycle.js';
import type {
  ProviderOrderCreateData,
  ProviderOrderListFilters,
  ProviderOrderListItem,
  ProviderOrderPatchData,
  ProviderOrdersPage,
} from './types.js';

/** Relations returned by every provider order read. */
const providerOrderInclude = {
  productOrders: true,
  details: {
    include: {
      product: { select: { id: true, name: true, sku: true } },
    },
  },
  purchase: true,
  userProviderOrderCreated: { select: { name: true } },
  userProviderOrderUpdated: { select: { name: true } },
} satisfies Prisma.providerOrderInclude;

const buildWhere = (
  filters: ProviderOrderListFilters
): Prisma.providerOrderWhereInput => ({
  ...(filters.supplierId ? { supplierId: filters.supplierId } : {}),
  ...(filters.status ? { status: filters.status } : {}),
});

/**
 * Retrieves a paginated provider order list.
 *
 * @param {ProviderOrderListFilters} filters - Optional `supplierId` / `status` filters.
 * @param {number} take - Page size (already clamped by the service).
 * @param {number} skip - Offset for the requested page.
 * @returns {Promise<ProviderOrdersPage>} Page of orders with supplier, details, purchase and users.
 */
export const getAllProviderOrders = async (
  filters: ProviderOrderListFilters,
  take: number,
  skip: number
): Promise<ProviderOrdersPage> => {
  const where = buildWhere(filters);

  const dataList: ProviderOrderListItem[] = await prisma.providerOrder.findMany(
    {
      where,
      include: providerOrderInclude,
      orderBy: { createdOn: 'desc' },
      take,
      skip,
    }
  );

  const total = await prisma.providerOrder.count({ where });
  return { dataList, total };
};

/**
 * Reads a single provider order with its relations.
 *
 * @param {number} id - Provider order id.
 * @returns {Promise<ProviderOrderListItem | null>} The order or `null` when it does not exist.
 */
export const findProviderOrderById = async (
  id: number
): Promise<ProviderOrderListItem | null> =>
  prisma.providerOrder.findUnique({
    where: { id },
    include: providerOrderInclude,
  });

/**
 * Creates a provider order and its detail lines in a single write.
 *
 * The total is computed from the Decimal estimated prices before persisting,
 * so it always matches the stored `estimatedPrice * quantity` (RN-ORD-002).
 *
 * @param {ProviderOrderCreateData} data - Order header plus detail lines and audit fields.
 * @returns {Promise<ProviderOrderListItem>} Created order with its relations.
 */
export const createProviderOrder = async (
  data: ProviderOrderCreateData
): Promise<ProviderOrderListItem> => {
  const total = computeDetailsTotal(
    data.details.map((detail) => ({
      quantity: detail.quantity,
      price: detail.estimatedPrice,
    }))
  );

  return prisma.providerOrder.create({
    data: {
      productOrders: { connect: { id: data.supplierId } },
      userProviderOrderCreated: { connect: { id: data.createdBy } },
      status: data.status ?? 'PENDING',
      notes: data.notes ?? null,
      expectedDeliveryDate: data.expectedDeliveryDate ?? null,
      deliveredOn: data.deliveredOn ?? null,
      total,
      createdOn: new Date(),
      details: {
        create: data.details.map((detail) => ({
          productId: detail.productId,
          quantity: detail.quantity,
          estimatedPrice: new Prisma.Decimal(detail.estimatedPrice),
        })),
      },
    },
    include: providerOrderInclude,
  });
};

/**
 * Patches a provider order.
 *
 * Detail lines and the recomputed total are written in the same `update`
 * (atomic), so `total` never diverges from `details` (RN-ORD-003).
 *
 * @param {number} id - Provider order id.
 * @param {ProviderOrderPatchData} data - Partial header fields and optional replacement details.
 * @returns {Promise<ProviderOrderListItem>} Updated order with its relations.
 */
export const patchProviderOrderById = async (
  id: number,
  data: ProviderOrderPatchData
): Promise<ProviderOrderListItem> => {
  const updateData: Prisma.providerOrderUpdateInput = {
    updatedOn: new Date(),
    userProviderOrderUpdated: { connect: { id: data.updatedBy } },
  };

  if (data.supplierId !== undefined) {
    updateData.productOrders = { connect: { id: data.supplierId } };
  }
  if (data.status !== undefined) {
    updateData.status = data.status;
  }
  if (data.notes !== undefined) {
    updateData.notes = data.notes;
  }
  if (data.expectedDeliveryDate !== undefined) {
    updateData.expectedDeliveryDate = data.expectedDeliveryDate;
  }
  if (data.deliveredOn !== undefined) {
    updateData.deliveredOn = data.deliveredOn;
  }
  if (data.details !== undefined) {
    updateData.total = computeDetailsTotal(
      data.details.map((detail) => ({
        quantity: detail.quantity,
        price: detail.estimatedPrice,
      }))
    );
    updateData.details = {
      deleteMany: {},
      create: data.details.map((detail) => ({
        productId: detail.productId,
        quantity: detail.quantity,
        estimatedPrice: new Prisma.Decimal(detail.estimatedPrice),
      })),
    };
  }

  return prisma.providerOrder.update({
    where: { id },
    data: updateData,
    include: providerOrderInclude,
  });
};

/**
 * Deletes a provider order and its detail lines.
 *
 * @param {number} id - Provider order id.
 * @returns {Promise<void>}
 * @throws {ClientError} 404 when the order does not exist, 409 when a purchase is linked (RN-ORD-007).
 */
export const deleteProviderOrderById = async (id: number): Promise<void> => {
  await prisma.$transaction(async (tx) => {
    const order = await tx.providerOrder.findUnique({
      where: { id },
      select: { id: true, purchaseId: true },
    });

    if (!order) {
      throw new ClientError('Provider order not found', 404);
    }
    if (order.purchaseId !== null) {
      throw new ClientError(
        'Cannot delete a provider order linked to a purchase',
        409
      );
    }

    await tx.providerOrderDetail.deleteMany({ where: { orderId: id } });
    await tx.providerOrder.delete({ where: { id } });
  });
};

/**
 * Converts a provider order into a purchase and persists the link in the same
 * transaction (RN-ORD-006).
 *
 * Purchase detail prices are snapshotted from the order's Decimal
 * `estimatedPrice`.
 *
 * @param {number} id - Provider order id.
 * @param {number} userId - Authenticated user recorded as purchase creator and order updater.
 * @returns {Promise<ProviderOrderListItem>} Updated order with `purchaseId` and the linked purchase.
 * @throws {ClientError} 404 when missing, 409 when already converted, 400 when cancelled.
 */
export const convertProviderOrderToPurchase = async (
  id: number,
  userId: number
): Promise<ProviderOrderListItem> =>
  prisma.$transaction(async (tx) => {
    const order = await tx.providerOrder.findUnique({
      where: { id },
      include: { details: true },
    });

    if (!order) {
      throw new ClientError('Provider order not found', 404);
    }
    if (order.purchaseId !== null) {
      throw new ClientError(
        'Provider order already converted to a purchase',
        409
      );
    }
    if (order.status === 'CANCELLED') {
      throw new ClientError('A cancelled order cannot be converted', 400);
    }

    const purchase = await tx.purchase.create({
      data: {
        provider: { connect: { id: order.supplierId } },
        userPurchaseCreated: { connect: { id: userId } },
        total: order.total,
        createdOn: new Date(),
        purchaseDetail: {
          create: order.details.map((detail) => ({
            productId: detail.productId,
            quantity: detail.quantity,
            price: detail.estimatedPrice,
          })),
        },
      },
    });

    return tx.providerOrder.update({
      where: { id },
      data: {
        purchaseId: purchase.id,
        updatedBy: userId,
        updatedOn: new Date(),
      },
      include: providerOrderInclude,
    });
  });
