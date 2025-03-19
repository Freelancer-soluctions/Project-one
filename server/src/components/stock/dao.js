import { prisma } from '../../config/db.js'

/**
 * Get all stock entries with optional filters
 * @param {number} productId - Product ID to filter by
 * @param {number} warehouseId - Warehouse ID to filter by
 * @param {string} lot - Lot number to filter by
 * @param {string} unitMeasure - Unit measure to filter by
 * @returns {Promise<Array>} List of stock entries
 */
export const getAllStock = async (
  productId = null,
  warehouseId = null,
  lot = '',
  unitMeasure = ''
) => {
  /*   const providers = await prisma.$queryRaw`
  SELECT s.*,
  u.name AS "userStockCreatedName",
  uu.name AS "userStockUpdatedName",
  p.name AS "productName",
  p.price AS "productPrice",
  p.cost AS "productCost",
  w.name AS "warehouseName"

  FROM "stock" s
  LEFT JOIN "users" u ON s."createdBy" = u.id
  LEFT JOIN "users" uu ON s."updatedBy" = uu.id
  LEFT JOIN "products" p ON s."productId" = p.id
  LEFT JOIN "warehouse" w ON s."warehouseId" = w.id

  WHERE
    (${productId} IS NULL OR s."productId" = ${productId}::INTEGER) -- 🔹 Forzar a INTEGER
    AND (${warehouseId} IS NULL OR s."warehouseId" = ${warehouseId}::INTEGER) -- 🔹 Forzar a INTEGER
    AND (${lot} IS NULL OR s."lot" ILIKE '%' || ${lot} || '%')
    AND (${unitMeasure} IS NULL OR s."unitMeasure" = ${unitMeasure}::"unitMeasureStock") -- 🔹 Conversión explícita a ENUM
` */

  const query = `
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
    (COALESCE($1, NULL) IS NULL OR s."productId" = COALESCE($1::INTEGER, s."productId"))
    AND (COALESCE($2, NULL) IS NULL OR s."warehouseId" = COALESCE($2::INTEGER, s."warehouseId"))
    AND (COALESCE($3, '') = '' OR s."lot" ILIKE '%' || $3 || '%') 
    AND (COALESCE($4, NULL) IS NULL OR s."unitMeasure" = $4::"unitMeasureStock")
`

  const stocks = await prisma.$queryRawUnsafe(
    query,
    productId ? Number(productId) : null,
    warehouseId ? Number(warehouseId) : null,
    lot || '',
    unitMeasure || null
  )
  return stocks
}

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
          id: data.warehouseId
        }
      },
      product: {
        connect: {
          id: data.productId
        }
      },
      userStockCreated: {
        connect: {
          id: data.createdBy
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
          id: data.warehouseId
        }
      },
      product: {
        connect: {
          id: data.productId
        }
      },
      userStockUpdated: {
        connect: {
          id: data.updatedBy
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
export const deleteStock = async (where) => {
  const stock = await prisma.stock.delete({
    where
  })

  return stock
}
