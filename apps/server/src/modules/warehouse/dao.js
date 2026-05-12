import { prisma } from '../../config/db.js';

/**
 * Get all warehouses with optional filters.
 *
 * @param {string} [name] - Warehouse name to filter by (case-insensitive).
 * @param {boolean} [status] - Warehouse status to filter by.
 * @param {number} take - Number of records to retrieve (pagination).
 * @param {number} skip - Number of records to skip (pagination).
 * @returns {Promise<Object>} Object containing dataList and total count.
 */
export const getAllWarehouses = async (name, status, take, skip) => {
  const warehouses = await prisma.warehouse.findMany({
    where: {
      ...(name
        ? {
            AND: [
              {
                name: {
                  contains: name,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),

      ...(status
        ? {
            status: {
              equals: status,
            },
          }
        : {}),
    },
    orderBy: {
      name: 'asc',
    },
    take,
    skip,
  });

  const total = await prisma.warehouse.count({
    where: {
      ...(name
        ? {
            AND: [
              {
                name: {
                  contains: name,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),

      ...(status
        ? {
            status: {
              equals: status,
            },
          }
        : {}),
    },
  });

  return { dataList: warehouses, total };
};

/**
 * Get all warehouses for UI filters.
 *
 * @returns {Promise<Array>} List of all warehouses.
 */
export const getAllWarehousesFilters = async () => {
  return await prisma.warehouse.findMany();
};

/**
 * Create a new warehouse.
 *
 * @param {Object} data - Warehouse data.
 * @param {string} data.name - Warehouse name.
 * @param {string} data.description - Warehouse description.
 * @param {string} data.address - Warehouse address.
 * @param {boolean} data.status - Warehouse status.
 * @param {Date} data.createdOn - Creation timestamp.
 * @returns {Promise<Object>} Created warehouse.
 */
export const createWarehouse = async (data) => {
  const warehouse = await prisma.warehouse.create({
    data,
  });

  return warehouse;
};

/**
 * Update a warehouse by conditions.
 *
 * @param {Object} data - Updated warehouse data.
 * @param {string} [data.name] - Updated warehouse name.
 * @param {string} [data.description] - Updated warehouse description.
 * @param {string} [data.address] - Updated warehouse address.
 * @param {boolean} [data.status] - Updated warehouse status.
 * @param {Date} [data.updatedOn] - Update timestamp.
 * @param {Object} where - Query conditions.
 * @param {number} where.id - Warehouse ID to update.
 * @returns {Promise<Object>} Updated warehouse record.
 */
export const updateWarehouse = async (data, where) => {
  const warehouse = await prisma.warehouse.update({
    where,
    data,
  });

  return warehouse;
};

/**
 * Delete a warehouse by conditions.
 *
 * @param {Object} where - Query conditions.
 * @param {number} where.id - Warehouse ID to delete.
 * @returns {Promise<Object>} Deleted warehouse record.
 */
export const deleteWarehouse = async (where) => {
  const warehouse = await prisma.warehouse.delete({
    where,
  });

  return warehouse;
};
