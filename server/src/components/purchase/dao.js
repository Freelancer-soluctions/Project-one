import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Get all purchases with optional filters
 * @param {Object} filters - Optional filters for the query
 * @param {number} [filters.providerId] - Filter by provider ID
 * @param {Date} [filters.startDate] - Filter by start date
 * @param {Date} [filters.endDate] - Filter by end date
 * @param {number} [filters.minTotal] - Filter by minimum total
 * @param {number} [filters.maxTotal] - Filter by maximum total
 * @returns {Promise<Array>} List of purchases with their details and related data
 */
export const getAllPurchases = async (filters = {}) => {
  const where = {
    ...(filters.providerId && { providerId: filters.providerId }),
    ...(filters.startDate && { createdOn: { gte: filters.startDate } }),
    ...(filters.endDate && { createdOn: { lte: filters.endDate } }),
    ...(filters.minTotal && { total: { gte: filters.minTotal } }),
    ...(filters.maxTotal && { total: { lte: filters.maxTotal } })
  }

  return prisma.purchase.findMany({
    where,
    include: {
      provider: true,
      details: {
        include: {
          product: true
        }
      }
    },
    orderBy: {
      createdOn: 'desc'
    }
  })
}

/**
 * Create a new purchase with its details
 * @param {Object} data - Purchase data including details
 * @param {number} data.providerId - Provider ID
 * @param {number} data.total - Total amount
 * @param {Array} data.details - Array of purchase details
 * @param {number} data.details[].productId - Product ID
 * @param {number} data.details[].quantity - Quantity
 * @param {number} data.details[].price - Price per unit
 * @param {number} data.createdBy - User ID who created the purchase
 * @returns {Promise<Object>} Created purchase with its details and related data
 */
export const createPurchase = async (data) => {
  const { details, ...purchaseData } = data

  return prisma.purchase.create({
    data: {
      ...purchaseData,
      details: {
        create: details
      }
    },
    include: {
      provider: true,
      details: {
        include: {
          product: true
        }
      }
    }
  })
}

/**
 * Update a purchase and its details
 * @param {number} id - Purchase ID
 * @param {Object} data - Updated purchase data
 * @param {number} [data.providerId] - Provider ID
 * @param {number} [data.total] - Total amount
 * @param {Array} [data.details] - Array of purchase details
 * @param {number} data.updatedBy - User ID who updated the purchase
 * @returns {Promise<Object>} Updated purchase with its details and related data
 */
export const updatePurchaseById = async (id, data) => {
  const { details, ...purchaseData } = data

  // First, delete existing details
  await prisma.purchaseDetail.deleteMany({
    where: { purchaseId: id }
  })

  // Then update the purchase and create new details
  return prisma.purchase.update({
    where: { id },
    data: {
      ...purchaseData,
      details: {
        create: details
      }
    },
    include: {
      provider: true,
      details: {
        include: {
          product: true
        }
      }
    }
  })
}

/**
 * Delete a purchase and its details
 * @param {number} id - Purchase ID
 * @returns {Promise<Object>} Deleted purchase
 */
export const deletePurchaseById = async (id) => {
  // First, delete all related details
  await prisma.purchaseDetail.deleteMany({
    where: { purchaseId: id }
  })

  // Then delete the purchase
  return prisma.purchase.delete({
    where: { id }
  })
}
