import { prisma, Prisma } from '../../config/db.js';
import ClientError from '../../utils/responses&Errors/errors.js';
import { computeDetailsTotal } from '../orders/orderLifecycle.js';
import type {
  ClientOrderCreateData,
  ClientOrderListFilters,
  ClientOrderListItem,
  ClientOrderPatchData,
  ClientOrdersPage,
} from './types.js';

/** Relations returned by every client order read. */
const clientOrderInclude = {
  clients: true,
  details: {
    include: {
      clientOrderDetail: { select: { id: true, name: true, sku: true } },
    },
  },
  sale: true,
  userClientOrderCreated: { select: { name: true } },
  userClientOrderUpdated: { select: { name: true } },
} satisfies Prisma.clientOrderInclude;

const buildWhere = (
  filters: ClientOrderListFilters
): Prisma.clientOrderWhereInput => ({
  ...(filters.clientId ? { clientId: filters.clientId } : {}),
  ...(filters.status ? { status: filters.status } : {}),
});

/**
 * Retrieves a paginated client order list.
 *
 * @param {ClientOrderListFilters} filters - Optional `clientId` / `status` filters.
 * @param {number} take - Page size (already clamped by the service).
 * @param {number} skip - Offset for the requested page.
 * @returns {Promise<ClientOrdersPage>} Page of orders with client, details, sale and audit users.
 */
export const getAllClientOrders = async (
  filters: ClientOrderListFilters,
  take: number,
  skip: number
): Promise<ClientOrdersPage> => {
  const where = buildWhere(filters);

  const dataList: ClientOrderListItem[] = await prisma.clientOrder.findMany({
    where,
    include: clientOrderInclude,
    orderBy: { createdOn: 'desc' },
    take,
    skip,
  });

  const total = await prisma.clientOrder.count({ where });
  return { dataList, total };
};

/**
 * Reads a single client order with its relations.
 *
 * @param {number} id - Client order id.
 * @returns {Promise<ClientOrderListItem | null>} The order or `null` when it does not exist.
 */
export const findClientOrderById = async (
  id: number
): Promise<ClientOrderListItem | null> =>
  prisma.clientOrder.findUnique({
    where: { id },
    include: clientOrderInclude,
  });

/**
 * Creates a client order and its detail lines in a single write.
 *
 * The total is computed from the Decimal line values before persisting, so it
 * always matches the stored `unitPrice * quantity` (RN-ORD-002).
 *
 * @param {ClientOrderCreateData} data - Order header plus detail lines and audit fields.
 * @returns {Promise<ClientOrderListItem>} Created order with its relations.
 */
export const createClientOrder = async (
  data: ClientOrderCreateData
): Promise<ClientOrderListItem> => {
  const total = computeDetailsTotal(
    data.details.map((detail) => ({
      quantity: detail.quantity,
      price: detail.unitPrice,
    }))
  );

  return prisma.clientOrder.create({
    data: {
      clients: { connect: { id: data.clientId } },
      userClientOrderCreated: { connect: { id: data.createdBy } },
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
          unitPrice: new Prisma.Decimal(detail.unitPrice),
        })),
      },
    },
    include: clientOrderInclude,
  });
};

/**
 * Patches a client order.
 *
 * Detail lines and the recomputed total are written in the same `update`
 * (atomic), so `total` never diverges from `details` (RN-ORD-003).
 *
 * @param {number} id - Client order id.
 * @param {ClientOrderPatchData} data - Partial header fields and optional replacement details.
 * @returns {Promise<ClientOrderListItem>} Updated order with its relations.
 */
export const patchClientOrderById = async (
  id: number,
  data: ClientOrderPatchData
): Promise<ClientOrderListItem> => {
  const updateData: Prisma.clientOrderUpdateInput = {
    updatedOn: new Date(),
    userClientOrderUpdated: { connect: { id: data.updatedBy } },
  };

  if (data.clientId !== undefined) {
    updateData.clients = { connect: { id: data.clientId } };
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
        price: detail.unitPrice,
      }))
    );
    updateData.details = {
      deleteMany: {},
      create: data.details.map((detail) => ({
        productId: detail.productId,
        quantity: detail.quantity,
        unitPrice: new Prisma.Decimal(detail.unitPrice),
      })),
    };
  }

  return prisma.clientOrder.update({
    where: { id },
    data: updateData,
    include: clientOrderInclude,
  });
};

/**
 * Deletes a client order and its detail lines.
 *
 * @param {number} id - Client order id.
 * @returns {Promise<void>}
 * @throws {ClientError} 404 when the order does not exist, 409 when a sale is linked (RN-ORD-007).
 */
export const deleteClientOrderById = async (id: number): Promise<void> => {
  await prisma.$transaction(async (tx) => {
    const order = await tx.clientOrder.findUnique({
      where: { id },
      select: { id: true, saleId: true },
    });

    if (!order) {
      throw new ClientError('Client order not found', 404);
    }
    if (order.saleId !== null) {
      throw new ClientError(
        'Cannot delete a client order linked to a sale',
        409
      );
    }

    await tx.clientOrderDetail.deleteMany({ where: { orderId: id } });
    await tx.clientOrder.delete({ where: { id } });
  });
};

/**
 * Converts a client order into a sale and persists the link in the same
 * transaction (RN-ORD-006).
 *
 * Sale detail prices are snapshotted from the order's Decimal `unitPrice`.
 *
 * @param {number} id - Client order id.
 * @param {number} userId - Authenticated user recorded as sale creator and order updater.
 * @returns {Promise<ClientOrderListItem>} Updated order with `saleId` and the linked sale.
 * @throws {ClientError} 404 when missing, 409 when already converted, 400 when cancelled.
 */
export const convertClientOrderToSale = async (
  id: number,
  userId: number
): Promise<ClientOrderListItem> =>
  prisma.$transaction(async (tx) => {
    const order = await tx.clientOrder.findUnique({
      where: { id },
      include: { details: true },
    });

    if (!order) {
      throw new ClientError('Client order not found', 404);
    }
    if (order.saleId !== null) {
      throw new ClientError('Client order already converted to a sale', 409);
    }
    if (order.status === 'CANCELLED') {
      throw new ClientError('A cancelled order cannot be converted', 400);
    }

    const sale = await tx.sale.create({
      data: {
        client: { connect: { id: order.clientId } },
        userSaleCreated: { connect: { id: userId } },
        total: order.total,
        createdOn: new Date(),
        saleDetail: {
          create: order.details.map((detail) => ({
            productId: detail.productId,
            quantity: detail.quantity,
            price: detail.unitPrice,
          })),
        },
      },
    });

    return tx.clientOrder.update({
      where: { id },
      data: { saleId: sale.id, updatedBy: userId, updatedOn: new Date() },
      include: clientOrderInclude,
    });
  });
