import { prisma } from '../../config/db.js'

/**
 * Get all stock entries with optional filters
 * @param {number} productId - Product ID to filter by
 * @param {number} warehouseId - Warehouse ID to filter by
 * @param {string} lot - Lot number to filter by
 * @param {string} unitMeasure - Unit measure to filter by
 * @returns {Promise<Array>} List of stock entries
 */
export const getAllStock = async (productId, warehouseId, lot, unitMeasure) => {
  const stock = await prisma.stock.findMany({
    where: {
      ...(productId
        ? {
            productId: Number(productId)
          }
        : {}),
      ...(warehouseId
        ? {
            warehouseId: Number(warehouseId)
          }
        : {}),
      ...(lot
        ? {
            lot: {
              contains: lot,
              mode: 'insensitive'
            }
          }
        : {}),
      ...(unitMeasure
        ? {
            unitMeasure
          }
        : {})
    },
    include: {
      product: true,
      warehouse: true,
      userStockCreated: {
        select: {
          id: true,
          name: true
        }
      },
      userStockUpdated: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      createdOn: 'desc'
    }
  })

  return stock
}

/**
 * Create a new stock entry
 * @param {Object} data - Stock entry data
 * @returns {Promise<Object>} Created stock entry
 */
export const createStock = async data => {
  const stock = await prisma.stock.create({
    data,
    include: {
      product: true,
      warehouse: true,
      userStockCreated: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })

  return stock
}

/**
 * Update a stock entry
 * @param {Object} data - Updated stock data
 * @param {Object} where - Query conditions
 * @returns {Promise<Object>} Updated stock entry
 */
export const updateStock = async (data, where) => {
  const stock = await prisma.stock.update({
    where,
    data,
    include: {
      product: true,
      warehouse: true,
      userStockCreated: {
        select: {
          id: true,
          name: true
        }
      },
      userStockUpdated: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })

  return stock
}

/**
 * Delete a stock entry
 * @param {Object} where - Query conditions
 * @returns {Promise<Object>} Deleted stock entry
 */
export const deleteStock = async where => {
  const stock = await prisma.stock.delete({
    where
  })

  return stock
}
