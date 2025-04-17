import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Get all sales with optional filters
 * @param {Object} filters - Optional filters for the query
 * @param {number} [filters.clientId] - Filter by client ID
 * @param {Date} [filters.startDate] - Filter by start date
 * @param {Date} [filters.endDate] - Filter by end date
 * @param {number} [filters.minTotal] - Filter by minimum total
 * @param {number} [filters.maxTotal] - Filter by maximum total
 * @returns {Promise<Array>} List of sales with their related data
 */
export const getAllSales = async (filters = {}) => {
  const where = {
    ...(filters.clientId && { clientId: filters.clientId }),
    ...(filters.fromDate && { createdOn: { gte: filters.fromDate } }),
    ...(filters.toDate && { createdOn: { lte: filters.toDate } }),
    ...(filters.minTotal && { total: { gte: filters.minTotal } }),
    ...(filters.maxTotal && { total: { lte: filters.maxTotal } })
  }

  const sales = await prisma.sale.findMany({
    where,
    include: {
      client: true,
      saleDetail: true,
      userSaleCreated: {
        select: {
          name: true
        }
      },
      userSaleUpdated: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      createdOn: 'desc'
    }
  })

  return sales
}

/**
 * Create a new sale with details
 * @param {Object} data - Sale data
 * @param {number} data.clientId - Client ID
 * @param {number} data.total - Total amount
 * @param {Array} data.details - Array of sale details
 * @param {number} data.createdBy - User ID who created the sale
 * @returns {Promise<Object>} Created sale with related data
 */
export const createSale = async (data) => {
  const { details, ...saleData } = data
  return prisma.sale.create({
    data: {
      createdOn: saleData.createdOn,
      total: saleData.total,
      saleDetail: {
        create: details.map(detail => ({
          product: { connect: { id: Number(detail.productId) } }, // Conectar el producto existente
          quantity: Number(detail.quantity),
          price: Number(detail.price)
        }))
      },
      userSaleCreated: { connect: { id: saleData.createdBy } },
      client: { connect: { id: saleData.clientId } }
    }
  })
}

/**
 * Update a sale by ID
 * @param {number} id - Sale ID
 * @param {Object} data - Updated sale data
 * @param {number} [data.clientId] - Client ID
 * @param {number} [data.total] - Total amount
 * @param {Array} [data.details] - Array of sale details
 * @param {number} data.updatedBy - User ID who updated the sale
 * @returns {Promise<Object>} Updated sale with related data
 */
export const updateSaleById = async (id, data) => {
  const { details, ...saleData } = data

  // First delete existing details
  await prisma.saleDetail.deleteMany({
    where: { saleId: id }
  })

  // Then update the sale and create new details
  return prisma.sale.update({
    where: { id },
    data: {
      updatedOn: saleData.updatedOn,
      total: saleData.total,
      saleDetail: {
        create: details.map(detail => ({
          product: { connect: { id: Number(detail.productId) } }, // Conectar el producto existente
          quantity: Number(detail.quantity),
          price: Number(detail.price)
        }))
      },
      userSaleUpdated: { connect: { id: saleData.updatedBy } },
      client: { connect: { id: saleData.clientId } }
    }

  })
}

/**
 * Delete a sale by ID
 * @param {number} id - Sale ID
 * @returns {Promise<Object>} Deleted sale
 */
export const deleteSaleById = async (id) => {
  // First delete all related details
  await prisma.saleDetail.deleteMany({
    where: { saleId: id }
  })

  // Then delete the sale
  return prisma.sale.delete({
    where: { id }
  })
}
