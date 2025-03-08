import * as prismaService from '../utils/dao.js'
import { TABLESNAMES } from '../utils/enums/enums.js'
import { prisma, Prisma } from '../../config/db.js'

const tableName = TABLESNAMES.PRODUCTS
const tableName2 = TABLESNAMES.PRODUCTATTRIBUTES

/**
 * Retrieves all products from the database based on the provided filters.
 *
 * @param {string} description - The description to filter products by.
 * @param {string} params.productProviderCode - The status provider code filter.
 * @param {string} params.productCategoryCode - The status category code filter.
 * @param {string} statusCode - The status code to filter products by.
 * @returns {Promise<Array>} A list of products matching the filters from the database.
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
    pt.description AS "providerDescription",

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
export const getAllProductProviders = async () => {
  const products = await prisma.productProviders.findMany()
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
      sku: data.sku,
      name: data.name,
      price: data.price,
      cost: data.cost,
      stock: data.stock,
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
 * Deletes a row from the database based on the provided filter.
 *
 * @param {Object} where - The filter conditions to identify the row to delete.
 * @returns {Promise<Object>} The result of the delete operation.
 */
export const deleteRow = async (where) =>
  prismaService.deleteRow(tableName, where)

/**
 * Retrieves all available products statuses from the database.
 *
 * @returns {Promise<Array>} A list of products types from the database.
 */
export const getAllProductAttributesByProductId = async (where) => {
  const attributes = await prisma.productAttributes.findMany({
    where
  })

  return Promise.resolve(attributes)
}

/**
 * Guarda o actualiza atributos de producto en la base de datos.
 *
 * @param {Array} attributes - Lista de atributos a guardar o actualizar.
 * @param {number} [attributes[].id] - ID del atributo (si existe, se actualizará; si no, se creará uno nuevo).
 * @param {number} attributes[].productId - ID del producto al que pertenece el atributo.
 * @param {string} attributes[].name - Nombre del atributo.
 * @param {string} attributes[].value - Valor del atributo.
 * @returns {Promise<Array>} - Promesa que resuelve con los atributos guardados o actualizados.
 *
 * @throws {Error} - Lanza un error si la transacción falla.
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
 * Deletes a row from the database based on the provided filter.
 *
 * @param {Object} where - The filter conditions to identify the row to delete.
 * @returns {Promise<Object>} The result of the delete operation.
 */
export const deleteProductsAttributeById = async (where) =>
  prismaService.deleteRow(tableName2, where)
