import { prisma } from '../../config/db.js'

/**
 * Get all warehouses with optional filters
 * @param {string} name - Name to filter by
 * @param {string} status - Status to filter by
 * @returns {Promise<Array>} List of warehouses
 */
export const getAllWarehouses = async (name, status) => {
  const warehouses = await prisma.warehouse.findMany({
    where: {

      ...(name
        ? {
            AND: [
              {
                name: {
                  contains: name,
                  mode: 'insensitive'
                }
              }

            ]
          }
        : {}),

      ...(status
        ? {
            status: {
              equals: status
            }

          }
        : {})
    },
    orderBy: {
      name: 'asc'
    }
  })

  return warehouses
}

/**
 * Create a new warehouse
 * @param {Object} data - Warehouse data
 * @returns {Promise<Object>} Created warehouse
 */
export const createWarehouse = async data => {
  const warehouse = await prisma.warehouse.create({
    data
  })

  return warehouse
}

/**
 * Update a warehouse
 * @param {Object} data - Updated warehouse data
 * @param {Object} where - Query conditions
 * @returns {Promise<Object>} Updated warehouse
 */
export const updateWarehouse = async (data, where) => {
  const warehouse = await prisma.warehouse.update({
    where,
    data
  })

  return warehouse
}

/**
 * Delete a warehouse
 * @param {Object} where - Query conditions
 * @returns {Promise<Object>} Deleted warehouse
 */
export const deleteWarehouse = async where => {
  const warehouse = await prisma.warehouse.delete({
    where
  })

  return warehouse
}
