import { prisma, Prisma } from '../../config/db.js';

/**
 * Get all stock entries with optional filters
 * @param {number} productId - Product ID to filter by
 * @param {number} warehouseId - Warehouse ID to filter by
 * @param {string} lot - Lot number to filter by
 * @param {string} unitMeasure - Unit measure to filter by
 * @param {number} take- take to filter by
 * @param {number} skip - skip to filter by
 * @returns {Promise<Array>} List of stock entries
 */
export const getAllStock = async ({
  productId,
  warehouseId,
  lot,
  unitMeasure,
  stocksExpirated,
  stocksLow,
  take,
  skip,
}) => {
  const stocks = await prisma.$queryRaw(
    Prisma.sql`
      SELECT s.*, 
        u.name AS "userStockCreatedName",
        uu.name AS "userStockUpdatedName",
        p.name AS "productName",
        p.price AS "productPrice",
        p.cost AS "productCost",
        w.name AS "warehouseName",

        CASE 
          WHEN s."expirationDate" IS NULL THEN NULL
          WHEN s."expirationDate" < CURRENT_DATE THEN 'EXPIRED'
          ELSE 'NOT EXPIRED'
        END AS "expirationStatus",
        (s."quantity" * p."price") AS "totalCost"

      FROM "stock" s
      LEFT JOIN "users" u ON s."createdBy" = u.id
      LEFT JOIN "users" uu ON s."updatedBy" = uu.id
      LEFT JOIN "products" p ON s."productId" = p.id
      LEFT JOIN "warehouse" w ON s."warehouseId" = w.id

      WHERE 
        (
          ${productId ? Number(productId) : null} IS NULL 
          OR s."productId" = ${productId ? Number(productId) : null}
        )
        AND (
          ${warehouseId ? Number(warehouseId) : null} IS NULL 
          OR s."warehouseId" = ${warehouseId ? Number(warehouseId) : null}
        )
        AND (
          ${lot || ''} = '' 
          OR s."lot" ILIKE ${'%' + (lot || '') + '%'}
        )
        AND (
          ${unitMeasure || null} IS NULL 
          OR s."unitMeasure" = ${unitMeasure}::"unitMeasureStock"
        )
        AND (
          (
            ${Boolean(stocksExpirated)} = FALSE 
            OR s."expirationDate" IS NULL 
            OR s."expirationDate" < CURRENT_DATE
          )
          AND (
            ${Boolean(stocksLow)} = FALSE 
            OR s."quantity" < s."minimum"
          )
        )
        ORDER BY s."createdOn" DESC
        LIMIT ${take}
        OFFSET ${skip}
    `
  );

  return stocks;
};

/**
 * Get stock by product ID
 * @param {number} id - Product ID
 * @returns {Promise<Object>} Stock entry
 */
export const getStockByProductId = async (id) => {
  return prisma.stock.findUnique({
    where: { productId: id },
  });
};

/**
 * Get all stock alerts
 * @returns {Promise<Object>} Stock alerts
 */
export const getStockAlerts = async () => {
  const stockAlerts = await prisma.$queryRaw`
   SELECT 
      CAST(COUNT(CASE WHEN s."expirationDate" < CURRENT_DATE THEN 1 END) AS INTEGER) AS "expired",
      CAST(COUNT(CASE WHEN s."quantity" < s."minimum" THEN 1 END) AS INTEGER) AS "lowStock"  
    FROM "stock" s
  `;

  const { expired, lowStock } = stockAlerts[0];
  return { expired, lowStock };
};

/**
 * Create a new stock entry
 * @param {Object} data - Stock entry data
 * @returns {Promise<Object>} Created stock entry
 */
export const createStock = async (data) => {
  const stock = await prisma.stock.create({
    data: {
      quantity: data.quantity,
      minimum: data.minimum,
      maximum: data.maximum,
      lot: data.lot,
      unitMeasure: data.unitMeasure,
      expirationDate: data.expirationDate,

      createdOn: data.createdOn,
      warehouse: {
        connect: {
          id: data.warehouseId,
        },
      },
      product: {
        connect: {
          id: data.productId,
        },
      },
      userStockCreated: {
        connect: {
          id: data.createdBy,
        },
      },
    },
  });
  return stock;
};

/**
 * Update a stock entry
 * @param {Object} data - Updated stock data
 * @param {Object} where - Query conditions
 * @returns {Promise<Object>} Updated stock entry
 */
export const updateStock = async (data, where) => {
  const stock = await prisma.stock.update({
    where,
    data: {
      quantity: data.quantity,
      minimum: data.minimum,
      maximum: data.maximum,
      lot: data.lot,
      unitMeasure: data.unitMeasure,
      expirationDate: data.expirationDate,
      updatedOn: data.updatedOn,
      warehouse: {
        connect: {
          id: data.warehouseId,
        },
      },
      product: {
        connect: {
          id: data.productId,
        },
      },
      userStockUpdated: {
        connect: {
          id: data.updatedBy,
        },
      },
    },
  });

  return stock;
};

/**
 * Delete a stock entry
 * @param {Object} where - Query conditions
 * @returns {Promise<Object>} Deleted stock entry
 */
export const deleteStock = async (where) => {
  const stock = await prisma.stock.delete({
    where,
  });

  return stock;
};
