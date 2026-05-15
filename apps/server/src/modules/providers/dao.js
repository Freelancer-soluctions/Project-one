import * as prismaService from '../../utils/prisma/dao.js';
import { TABLESNAMES } from '../../utils/constants/enums.js';
import { prisma, Prisma } from '../../config/db.js';

const tableName = TABLESNAMES.PROVIDERS;

/**
 * Get all providers with optional filters.
 *
 * @param {string} [name] - The name filter for providers (partial match).
 * @param {boolean} [status] - The status filter for providers.
 * @param {number} take - Number of records to retrieve.
 * @param {number} skip - Number of records to skip.
 * @returns {Promise<Object>} Object containing dataList and total count.
 */

export const getAllProviders = async (name, status, take, skip) => {
  const whereClauses = [];

  if (name) {
    whereClauses.push(Prisma.sql`p."name" ILIKE ${'%' + name + '%'}`);
  }
  if (status !== null) {
    whereClauses.push(Prisma.sql`p."status" = ${status}::boolean`);
  }
  const whereSql = whereClauses.length
    ? Prisma.sql`WHERE ${Prisma.join(whereClauses, Prisma.sql` AND `)}`
    : Prisma.empty;

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
    ${whereSql}
    ORDER BY p."createdOn" DESC
    LIMIT ${take}
    OFFSET ${skip}
  `;

  const total = await prisma.productProviders.count({
    where: {
      ...(name && {
        name: {
          contains: name,
          mode: 'insensitive', // equivalente a ILIKE
        },
      }),

      ...(status !== null && {
        status: Boolean(status),
      }),
    },
  });

  return { dataList: providers, total };
};

/**
 * Get all providers for UI filters.
 *
 * @returns {Promise<Array>} List of all providers.
 */

export const getAllProvidersFilters = async () => {
  return await prisma.productProviders.findMany();
};

/**
 * Create a new provider.
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
          id: data.createdBy,
        },
      },
    },
  });
  return Promise.resolve(savedProvider);
};

/**
 * Update a provider by conditions.
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
          id: data.updatedBy,
        },
      },
    },
  });
  return Promise.resolve(result);
};

/**
 * Delete a provider by conditions.
 *
 * @param {Object} where - The conditions to identify the provider to delete.
 * @returns {Promise<Object>} The deleted provider.
 */
export const deleteRow = async (where) =>
  prismaService.deleteRow(tableName, where);
