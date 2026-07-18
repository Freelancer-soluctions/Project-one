import { prisma } from '../../config/db.js';

/**
 * Get all inventory movements with optional filters.
 *
 * @param {Object} filters - Filter parameters.
 * @param {number} [filters.productId] - Product ID to filter by.
 * @param {number} [filters.warehouseId] - Warehouse ID to filter by.
 * @param {string} [filters.type] - Movement type to filter by.
 * @param {number} take - Number of records to retrieve.
 * @param {number} skip - Number of records to skip.
 * @returns {Promise<Object>} Object containing dataList and total count.
 */
export const getAllInventoryMovements = async ({
  productId,
  warehouseId,
  type,
  take,
  skip,
}) => {
  const inventoryMovements = await prisma.inventoryMovement.findMany({
    where: {
      ...(productId
        ? {
            productId: {
              equals: productId,
            },
          }
        : {}),
      ...(warehouseId
        ? {
            warehouseId: {
              equals: warehouseId,
            },
          }
        : {}),
      ...(type
        ? {
            type: {
              equals: type,
            },
          }
        : {}),
    },
    include: {
      product: true,
      warehouse: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take,
    skip,
  });

  const total = await prisma.inventoryMovement.count({
    where: {
      ...(productId
        ? {
            productId: {
              equals: productId,
            },
          }
        : {}),
      ...(warehouseId
        ? {
            warehouseId: {
              equals: warehouseId,
            },
          }
        : {}),
      ...(type
        ? {
            type: {
              equals: type,
            },
          }
        : {}),
    },
  });

  return { dataList: inventoryMovements, total };
};

/**
 * Create a new inventory movement.
 *
 * @param {Object} data - Inventory movement data.
 * @returns {Promise<Object>} Created inventory movement.
 */
export const createInventoryMovement = async (data) => {
  const inventoryMovement = await prisma.inventoryMovement.create({
    data,
    include: {
      product: true,
      warehouse: true,
    },
  });

  return inventoryMovement;
};

/**
 * Update an inventory movement by ID.
 *
 * @param {number} id - Inventory movement ID.
 * @param {Object} data - Updated inventory movement data.
 * @returns {Promise<Object>} Updated inventory movement.
 */
export const updateInventoryMovementById = async (id, data) => {
  const inventoryMovement = await prisma.inventoryMovement.update({
    where: { id },
    data,
    include: {
      product: true,
      warehouse: true,
    },
  });

  return inventoryMovement;
};

/**
 * Delete an inventory movement by ID.
 *
 * @param {number} id - Inventory movement ID.
 * @returns {Promise<Object>} Deleted inventory movement.
 */
export const deleteInventoryMovementById = async (id) => {
  const inventoryMovement = await prisma.inventoryMovement.delete({
    where: { id },
  });

  return inventoryMovement;
};
