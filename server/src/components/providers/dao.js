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
  status
) => {
  const whereClauses = []

  if (name) {
    whereClauses.push(Prisma.sql`p."name" ILIKE ${'%' + name + '%'}`)
  }

  if (status) {
    whereClauses.push(Prisma.sql`p."status" = ${status}`)
  }

  const whereSql = whereClauses.length
    ? Prisma.sql`WHERE ${Prisma.join(whereClauses, Prisma.sql` AND `)}`
    : Prisma.empty

  const providers = await prisma.$queryRaw`
    SELECT p.*, 
    u.name AS "userProductCreatedName",
    uu.name AS "userProductUpdatedName"
    FROM "providers" p
    LEFT JOIN "users" u ON p."createdBy" = u.id
    LEFT JOIN "users" uu ON p."updatedBy" = uu.id
    ${whereSql}
  `

  return providers
}

/**
 * Creates a new row in the database with the provided data.
 *
 * @param {Object} data - The data to insert into the database.
 * @returns {Promise<Object>} The created row in the database.
 */
export const createProvider = async (data) => {
  const savedProvider = await prisma.products.create({
    data: {
      ode: data.sku,
      name: data.name,
      status: data.status,
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      address: data.address,
      createdOn: data.createdOn,

      // Claves foráneas
      userProvidersCreated: {
        connect: {
          id: data.createdBy
        }
      }

    }
  })
  return Promise.resolve(savedProvider)
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
