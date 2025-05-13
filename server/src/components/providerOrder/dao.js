import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Get all providerOrders with optional filters
 * @param {Object} filters - Optional filters for the query
 * @returns {Promise<Array>} List of providerOrders with their related data
 */
export const getAllProviderOrders = async (filters = {}) => {
  console.log(filters)
  const providerOrders = await prisma.providerOrder.findMany({
    where: filters,
    include: {
      productOrders: true,
      userProviderOrderCreated: true,
      userProviderOrderUpdated: true,
      details: true,
      purchase: true
    }
  })

  return providerOrders
}

/**
 * Create a new providerOrder
 * @param {Object} data - providerOrder data
 * @param {number} data.supplierId - Supplier ID
 * @param {number} data.createdBy - User ID who created the providerOrder
 * @returns {Promise<Object>} Created providerOrder with related data
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
          id: data.supplierId
        }
      },
      userProviderOrderCreated: {
        connect: {
          id: data.createdBy
        }
      }
    },
    include: {
      productOrders: true,
      userProviderOrderCreated: true,
      userProviderOrderUpdated: true,
      details: true,
      purchase: true
    }
  })
}

/**
 * Update a providerOrder by ID
 * @param {number} id - providerOrder ID
 * @param {Object} data - Updated providerOrder data
 * @param {number} data.supplierId - Supplier ID
 * @param {number} data.updatedBy - User ID who updated the providerOrder
 * @returns {Promise<Object>} Updated providerOrder with related data
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
 * Delete a providerOrder by ID
 * @param {number} id - providerOrder ID
 * @returns {Promise<Object>} Deleted providerOrder
 */
export const deleteProviderOrderById = async (id) => {
  return prisma.providerOrder.delete({
    where: { id },
  });
};