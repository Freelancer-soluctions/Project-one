import * as prismaService from '../utils/dao.js'
import { TABLESNAMES } from '../utils/enums/enums.js'
import { prisma, Prisma } from '../../config/db.js'

const tableName = TABLESNAMES.PROVIDERS

/**
 * Retrieves all providers from the database based on optional filters.
 *
 * @param {string} [name] - The name filter for providers (partial match).
 * @param {boolean} [status] - The status filter for providers.
 * @returns {Promise<Array>} A list of providers matching the filters.
 */

export const getAllProducts = async (
  name,
  status
) => {
  // const whereClauses = []

  // if (name) {
  //  whereClauses.push(Prisma.sql`p."name" ILIKE ${`%${name}%`}`)
  // }

  // if (status !== undefined) {
  //  const statusBool = status === 'true'
  //  whereClauses.push(Prisma.sql`p."status" = ${statusBool}`)
  // }

  // Construimos la condición WHERE manualmente sin Prisma.join()
  // let whereSql = Prisma.empty
  // if (whereClauses.length === 1) {
  //  whereSql = Prisma.sql`WHERE ${whereClauses[0]}`
  // } else if (whereClauses.length > 1) {
  //  whereSql = Prisma.sql`WHERE ${whereClauses[0]} AND ${whereClauses[1]}`
  // }

  const providers = await prisma.$queryRaw`
    SELECT p.*, 
    CASE 
      WHEN p."status" = TRUE THEN 'ACTIVE'
      ELSE 'INACTIVE' 
    END AS "statusText",
    u.name AS "userProvidersCreatedName",
    uu.name AS "userProvidersUpdatedName"
    FROM "productProviders" p
    LEFT JOIN "users" u ON p."createdBy" = u.id
    LEFT JOIN "users" uu ON p."updatedBy" = uu.id
    WHERE 
  (${name} IS NULL OR p."name" ILIKE '%' || ${name} || '%')
  AND 
  (${status} IS NULL OR p."status" = ${status}::BOOLEAN)
  `
  return providers
}

/**
 * Creates a new provider in the database.
 *
 * @param {Object} data - The data for the new provider.
 * @param {string} data.code - The unique code of the provider (max 3 characters).
 * @param {string} data.name - The name of the provider (max 100 characters).
 * @param {boolean} data.status - The status of the provider (active/inactive).
 * @param {string} [data.contactName] - The contact name of the provider (max 60 characters, optional).
 * @param {string} [data.contactEmail] - The contact email of the provider (max 80 characters, optional).
 * @param {string} [data.contactPhone] - The contact phone number of the provider (max 15 characters, optional).
 * @param {string} [data.address] - The address of the provider (max 120 characters, optional).
 * @param {Date} data.createdOn - The creation timestamp.
 * @param {number} data.createdBy - The ID of the user who created the provider.
 * @returns {Promise<Object>} The created provider.
 */
export const createProvider = async (data) => {
  const savedProvider = await prisma.productProviders.create({
    data: {
      code: data.code,
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
 * Updates an existing provider in the database.
 *
 * @param {Object} data - The fields to update in the provider.
 * @param {Object} where - The conditions to identify the provider to update.
 * @param {string} [data.code] - The unique code of the provider (max 3 characters).
 * @param {string} [data.name] - The name of the provider (max 100 characters).
 * @param {boolean} [data.status] - The status of the provider (active/inactive).
 * @param {string} [data.contactName] - The contact name of the provider (max 60 characters, optional).
 * @param {string} [data.contactEmail] - The contact email of the provider (max 80 characters, optional).
 * @param {string} [data.contactPhone] - The contact phone number of the provider (max 15 characters, optional).
 * @param {string} [data.address] - The address of the provider (max 120 characters, optional).
 * @param {Date} data.updatedOn - The timestamp of the last update.
 * @param {number} data.updatedBy - The ID of the user updating the provider.
 * @returns {Promise<Object>} The updated provider.
 */
export const updateRow = async (data, where) => {
  const result = await prisma.productProviders.update({
    where,
    data: {
      code: data.code,
      name: data.name,
      status: data.status,
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      address: data.address,
      updatedOn: data.updatedOn,

      // Claves foráneas
      userProvidersUpdated: {
        connect: {
          id: data.updatedBy
        }
      }

    }
  })
  return Promise.resolve(result)
}

/**
 * Deletes a provider from the database based on the provided filter.
 *
 * @param {Object} where - The conditions to identify the provider to delete.
 * @returns {Promise<Object>} The result of the deletion operation.
 */
export const deleteRow = async (where) =>
  prismaService.deleteRow(tableName, where)
