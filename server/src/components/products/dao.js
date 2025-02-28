import * as prismaService from '../utils/dao.js'
import { TABLESNAMES } from '../utils/enums/enums.js'
import { prisma, Prisma } from '../../config/db.js'

const tableName = TABLESNAMES.PRODUCTS

/**
 * Retrieves all products from the database based on the provided filters.
 *
 * @param {string} description - The description to filter products by.
 * @param {string} params.productTypeCode - The status type code filter.
 * @param {string} params.productCategoryCode - The status category code filter.
 * @param {string} statusCode - The status code to filter products by.
 * @returns {Promise<Array>} A list of products matching the filters from the database.
 */

export const getAllProducts = async (
  name,
  productTypeCode,
  productCategoryCode,
  statusCode
) => {
  const whereClauses = []

  if (name) {
    whereClauses.push(Prisma.sql`p."name" ILIKE ${'%' + name + '%'}`)
  }
  if (productTypeCode) {
    whereClauses.push(Prisma.sql`p."productTypeCode" = ${productTypeCode}`)
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

    pt.id AS "typeId", 
    pt.code AS "typeCode",     
    pt.description AS "typeDescription",

    ps.id AS "statusId", 
    ps.code AS "statusCode", 
    ps.description AS "statusDescription",
    u.name AS "userProductCreatedName",
    uu.name AS "userProductUpdatedName"
    FROM "products" p
    LEFT JOIN "productCategories" pc ON p."productCategoryId" = pc.id
    LEFT JOIN "productType" pt ON p."productTypeId" = pt.id
    LEFT JOIN "productStatus" ps ON p."productStatusId" = ps.id
    LEFT JOIN "users" u ON p."createdBy" = u.id
    LEFT JOIN "users" uu ON p."updatedBy" = uu.id
    ${whereSql}
  `

  return products
}

/**
 * Retrieves all available products statuses from the database.
 *
 * @returns {Promise<Array>} A list of products statuses from the database.
 */
export const getAllProductStatus = async () => {
  const products = await prisma.productStatus.findMany()
  return Promise.resolve(products)
}

/**
 * Retrieves all available products statuses from the database.
 *
 * @returns {Promise<Array>} A list of products categories from the database.
 */
export const getAllProductCategories = async () => {
  const products = await prisma.productCategories.findMany()
  return Promise.resolve(products)
}

/**
 * Retrieves all available products statuses from the database.
 *
 * @returns {Promise<Array>} A list of products types from the database.
 */
export const getAllProductTypes = async () => {
  const products = await prisma.productTypes.findMany()
  return Promise.resolve(products)
}

/**
 * Retrieves one row from the database based on the provided filter parameters.
 *
 * @param {Object} params - The filter parameters for retrieving the row.
 * @param {Object} params.where - The conditions to find the row.
 * @param {Object} params.include - Additional related data to include.
 * @returns {Promise<Object>} The requested row from the database.
 */
export const getOneRow = async ({ where, include }) =>
  prismaService.getOneRow({
    tableName,
    where,
    include
  })

/**
 * Creates a new row in the database with the provided data.
 *
 * @param {Object} data - The data to insert into the database.
 * @returns {Promise<Object>} The created row in the database.
 */
export const createRow = async (data) => {
  const savedProduct = await prisma.products.create({
    data: {
      sku: data.sku,
      name: data.name,
      price: data.price,
      cost: data.cost,
      stock: data.stock,
      description: data.description,
      barCode: data.barCode,
      createdOn: data.createdOn,
      createdBy: data.createdBy,

      // Claves foráneas
      productCategories: {
        connect: { id: data.productCategoryId }
      },
      productType: {
        connect: { id: data.productTypeId }
      },
      productStatus: {
        connect: { id: data.productStatusId }
      }
    }
  })
  return Promise.resolve(savedProduct)
}

/**
 * Updates an existing row in the database based on the provided filter and data.
 *
 * @param {Object} data - The fields to update in the row.
 * @param {Object} where - The conditions to identify the row to update.
 * @returns {Promise<Object>} The updated row in the database.
 */
export const updateRow = async (data, where) => {
  const result = await prisma.products.update({
    where,
    data: {
      description: data.description,
      document: data.document,
      documentId: data.documentId,
      pendingOn: data.pendingOn ? data.pendingOn : undefined,
      userNewsPending: data.pendingBy
        ? {
            connect: {
              id: data.pendingBy
            }
          }
        : undefined,
      closedOn: data.closedOn ? data.closedOn : undefined,
      userNewsClosed: data.closedBy
        ? {
            connect: {
              id: data.closedBy
            }
          }
        : undefined,
      status: {
        connect: {
          id: data.statusId
        }
      }
    }
  })
  return Promise.resolve(result)
}

/**
 * Deletes a row from the database based on the provided filter.
 *
 * @param {Object} where - The filter conditions to identify the row to delete.
 * @returns {Promise<Object>} The result of the delete operation.
 */
export const deleteRow = async (where) =>
  prismaService.deleteRow(tableName, where)
