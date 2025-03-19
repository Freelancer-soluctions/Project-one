import * as prismaService from '../utils/dao.js'
import { TABLESNAMES } from '../utils/enums/enums.js'
import { prisma, Prisma } from '../../config/db.js'

const tableName = TABLESNAMES.PRODUCTS
const tableName2 = TABLESNAMES.PRODUCTATTRIBUTES
/**
 * Retrieves all products from the database based on the provided filters.
 *
 * @param {string} name - The name to filter products by (optional).
 * @param {string} productProviderCode - The product provider code filter (optional).
 * @param {string} productCategoryCode - The product category code filter (optional).
 * @param {string} statusCode - The status code to filter products by (optional).
 * @returns {Promise<Array>} A list of products matching the filters.
 */

export const getAllProducts = async (
  name,
  productProviderCode,
  productCategoryCode,
  statusCode
) => {
  const whereClauses = []

  if (name) {
    whereClauses.push(Prisma.sql`p."name" ILIKE ${'%' + name + '%'}`)
  }
  if (productProviderCode) {
    whereClauses.push(Prisma.sql`p."productProviderCode" = ${productProviderCode}`)
  }
  if (productCategoryCode) {
    whereClauses.push(
      Prisma.sql`p."productCategoryCode" = ${productCategoryCode}`
    )
  }
  if (statusCode) {
    whereClauses.push(Prisma.sql`p."statusCode" = ${statusCode}`)
  }

  const whereSql = whereClauses.length
    ? Prisma.sql`WHERE ${Prisma.join(whereClauses, Prisma.sql` AND `)}`
    : Prisma.empty

  const products = await prisma.$queryRaw`
    SELECT p.*, 
    pc.id AS "categoryId", 
    pc.code AS "categoryCode",     
    pc.description AS "categoryDescription",

    pt.id AS "providerId", 
    pt.code AS "providerCode",     
    pt.name AS "providerDescription",

    ps.id AS "statusId", 
    ps.code AS "statusCode", 
    ps.description AS "statusDescription",
    u.name AS "userProductCreatedName",
    uu.name AS "userProductUpdatedName"
    FROM "products" p
    LEFT JOIN "productCategories" pc ON p."productCategoryId" = pc.id
    LEFT JOIN "productProviders" pt ON p."productProviderId" = pt.id
    LEFT JOIN "productStatus" ps ON p."productStatusId" = ps.id
    LEFT JOIN "users" u ON p."createdBy" = u.id
    LEFT JOIN "users" uu ON p."updatedBy" = uu.id
    ${whereSql}
  `

  return products
}

/**
 * Retrieves all available product statuses from the database.
 *
 * @returns {Promise<Array>} A list of product statuses.
 */

export const getAllProductStatus = async () => {
  const products = await prisma.productStatus.findMany()
  return Promise.resolve(products)
}

/**
 * Retrieves all available product categories from the database.
 *
 * @returns {Promise<Array>} A list of product categories.
 */
export const getAllProductCategories = async () => {
  const products = await prisma.productCategories.findMany()
  return Promise.resolve(products)
}

/**
 * Retrieves all available product providers from the database.
 *
 * @returns {Promise<Array>} A list of product providers.
 */
export const getAllProductProviders = async () => {
  const products = await prisma.productProviders.findMany()
  return Promise.resolve(products)
}

/**
 * Creates a new product in the database.
 *
 * @param {Object} data - The data for the new product.
 * @param {string} data.sku - The unique SKU of the product (max 16 characters).
 * @param {string} data.name - The name of the product (max 80 characters).
 * @param {number} data.productCategoryId - The ID of the product category.
 * @param {number} data.productProviderId - The ID of the product provider.
 * @param {number} data.price - The price of the product (decimal with 2 decimal places).
 * @param {number} data.cost - The cost of the product (decimal with 2 decimal places).
 * @param {string} data.description - The product description (max 2000 characters).
 * @param {string} [data.barCode] - The optional barcode of the product (max 25 characters).
 * @param {string} data.createdOn - The creation timestamp.
 * @param {number} data.createdBy - The ID of the user creating the product.
 * @returns {Promise<Object>} The created product.
 */
export const createRow = async (data) => {
  const savedProduct = await prisma.products.create({
    data: {
      sku: data.sku,
      name: data.name,
      price: data.price,
      cost: data.cost,
      description: data.description,
      barCode: data.barCode,
      createdOn: data.createdOn,

      // Claves foráneas
      productCategories: {
        connect: { id: data.productCategoryId }
      },
      productProviders: {
        connect: { id: data.productProviderId }
      },
      productStatus: {
        connect: { id: data.productStatusId }
      },
      userProductCreated: {
        connect: {
          id: data.createdBy
        }
      }

    }
  })
  return Promise.resolve(savedProduct)
}

/**
 * Updates an existing product in the database.
 *
 * @param {Object} data - The updated data for the product.
 * @param {string} data.sku - The updated SKU (max 16 characters).
 * @param {string} data.name - The updated name (max 80 characters).
 * @param {number} data.productCategoryId - The updated product category ID.
 * @param {number} data.productProviderId - The updated product provider ID.
 * @param {number} data.price - The updated price (decimal with 2 decimal places).
 * @param {number} data.cost - The updated cost (decimal with 2 decimal places).
 * @param {string} data.description - The updated product description (max 2000 characters).
 * @param {string} [data.barCode] - The updated barcode (max 25 characters).
 * @param {string} data.updatedOn - The update timestamp.
 * @param {number} data.updatedBy - The ID of the user updating the product.
 * @param {Object} where - The conditions to identify the product to update.
 * @returns {Promise<Object>} The updated product.
 */
export const updateRow = async (data, where) => {
  const result = await prisma.products.update({
    where,
    data: {
      sku: data.sku,
      name: data.name,
      price: data.price,
      cost: data.cost,
      description: data.description,
      barCode: data.barCode,
      updatedOn: data.updatedOn,

      // Claves foráneas
      productCategories: {
        connect: { id: data.productCategoryId }
      },
      productProviders: {
        connect: { id: data.productProviderId }
      },
      productStatus: {
        connect: { id: data.productStatusId }
      },
      userProductUpdated: {
        connect: {
          id: data.updatedBy
        }
      }
    }
  })
  return Promise.resolve(result)
}

/**
 * Deletes a product from the database.
 *
 * @param {Object} where - The conditions to identify the product to delete.
 * @returns {Promise<Object>} The result of the delete operation.
 */
export const deleteRow = async (where) =>
  prismaService.deleteRow(tableName, where)

/**
 * Retrieves all attributes for a product by its ID.
 *
 * @param {Object} where - The conditions to filter product attributes.
 * @returns {Promise<Array>} A list of attributes for the specified product.
 */

export const getAllProductAttributesByProductId = async (where) => {
  const attributes = await prisma.productAttributes.findMany({
    where
  })

  return Promise.resolve(attributes)
}

/**
 * Saves or updates product attributes in the database.
 *
 * @param {Array} attributes - List of attributes to save or update.
 * @param {number} [attributes[].id] - The attribute ID (if exists, it will be updated; if not, a new one will be created).
 * @param {number} attributes[].productId - The product ID the attribute belongs to.
 * @param {string} attributes[].name - The attribute name.
 * @param {string} attributes[].value - The attribute value.
 * @param {string} attributes[].createdOn - The creation timestamp (only for new attributes).
 * @returns {Promise<Array>} The saved or updated attributes.
 *
 * @throws {Error} Throws an error if the transaction fails.
 */
export const saveProductAttributes = async (attributes) => {
  const transaction = attributes.map((attr) => {
    if (attr.id) {
      // Si el atributo tiene ID, actualizarlo
      return prisma.productAttributes.update({
        where: { id: attr.id },
        data: {
          name: attr.name,
          description: attr.description
        }
      })
    } else {
      // Si no tiene ID, crearlo
      return prisma.productAttributes.create({
        data: {
          productId: attr.productId,
          name: attr.name,
          description: attr.description,
          createdOn: attr.createdOn
        }
      })
    }
  })

  // Ejecutar todo en una transacción
  return prisma.$transaction(transaction)
}

/**
 * Deletes a product attribute from the database by its ID.
 *
 * @param {Object} where - The conditions to identify the attribute to delete.
 * @returns {Promise<Object>} The result of the delete operation.
 */
export const deleteProductsAttributeById = async (where) =>
  prismaService.deleteRow(tableName2, where)
