import { prisma } from '../../config/db.js';

/**
 * Get all provider orders with optional filters.
 *
 * @param {Object} filters - Optional filters for the query.
 * @param {number} take - Number of records to retrieve.
 * @param {number} skip - Number of records to skip.
 * @returns {Promise<Object>} Object containing dataList and total count.
 */
export const getAllProviderOrders = async (filters = {}, take, skip) => {
  const providerOrders = await prisma.providerOrder.findMany({
    where: filters,
    include: {
      productOrders: true,
      userProviderOrderCreated: true,
      userProviderOrderUpdated: true,
      details: true,
      purchase: true,
    },
    take,
    skip,
  });

  const total = await prisma.providerOrder.count({
    where: filters,
  });

  return { dataList: providerOrders, total };
};

/**
 * Create a new provider order.
 *
 * @param {Object} data - providerOrder data.
 * @param {number} data.supplierId - Supplier ID.
 * @param {number} data.createdBy - User ID who created the providerOrder.
 * @returns {Promise<Object>} Created provider order with related data.
 */
export const createProviderOrder = async (data) => {
  return prisma.providerOrder.create({
    data: {
      supplierId: data.supplierId,
      createdBy: data.createdBy,
      notes: data.notes,
      createdOn: data.createdOn,
      productOrders: {
        connect: {
          id: data.supplierId,
        },
      },
      userProviderOrderCreated: {
        connect: {
          id: data.createdBy,
        },
      },
    },
    include: {
      productOrders: true,
      userProviderOrderCreated: true,
      userProviderOrderUpdated: true,
      details: true,
      purchase: true,
    },
  });
};

/**
 * Update a provider order by ID.
 *
 * @param {number} id - providerOrder ID.
 * @param {Object} data - Updated providerOrder data.
 * @param {number} [data.supplierId] - Supplier ID.
 * @param {number} [data.updatedBy] - User ID who updated the providerOrder.
 * @returns {Promise<Object>} Updated provider order with related data.
 */
export const updateProviderOrderById = async (id, data) => {
  return prisma.providerOrder.update({
    where: { id },
    data: {
      supplierId: data.supplierId,
      updatedBy: data.updatedBy,
      notes: data.notes,
      updatedOn: data.updatedOn,
      productOrders: {
        connect: {
          id: data.supplierId,
        },
      },
      userProviderOrderUpdated: {
        connect: {
          id: data.updatedBy,
        },
      },
    },
    include: {
      productOrders: true,
      userProviderOrderCreated: true,
      userProviderOrderUpdated: true,
      details: true,
      purchase: true,
    },
  });
};

/**
 * Delete a provider order by ID.
 *
 * @param {number} id - providerOrder ID.
 * @returns {Promise<Object>} Deleted provider order.
 */
export const deleteProviderOrderById = async (id) => {
  return prisma.providerOrder.delete({
    where: { id },
  });
};
