import { prisma, Prisma } from '../../config/db.js';
import type {
  Client,
  ClientDaoFilters,
  ClientListRow,
  ClientServiceResult,
  CreateClientData,
  UpdateClientData,
} from './types.js';

/**
 * Get all clients with optional filters.
 *
 * @param {Object} filters - Filter parameters.
 * @param {string} [filters.name] - Filter by client name.
 * @param {string} [filters.email] - Filter by client email.
 * @param {string} [filters.phone] - Filter by client phone.
 * @param {number} take - Number of records to retrieve.
 * @param {number} skip - Number of records to skip.
 * @returns {Promise<Object>} Object containing dataList and total count.
 */
export const getAllClients = async (
  filters: ClientDaoFilters = {},
  take: number,
  skip: number
): Promise<ClientServiceResult> => {
  const whereClauses: Prisma.Sql[] = [];

  if (filters.name) {
    whereClauses.push(Prisma.sql`c."name" ILIKE ${filters.name}`);
  }

  if (filters.email) {
    whereClauses.push(Prisma.sql`c."email" ILIKE ${filters.email}`);
  }

  const whereSql = whereClauses.length
    ? Prisma.sql`WHERE ${Prisma.join(whereClauses, ' AND ')}`
    : Prisma.empty;

  const clients = await prisma.$queryRaw<ClientListRow[]>`
  SELECT 
     c.*,
     u.name AS "userClientCreatedName",
     uu.name AS "userClientUpdatedName"
   FROM "clients" c
   LEFT JOIN "users" u ON c."createdBy" = u.id
   LEFT JOIN "users" uu ON c."updatedBy" = uu.id
   ${whereSql}
   ORDER BY c."createdOn" DESC
   LIMIT ${take}
   OFFSET ${skip}
  `;

  const total = await prisma.clients.count({
    where: {
      ...(filters.name && {
        name: {
          contains: filters.name,
          mode: 'insensitive', // equivalente a ILIKE
        },
      }),

      ...(filters.email && {
        email: {
          contains: filters.email,
          mode: 'insensitive', // equivalente a ILIKE
        },
      }),
    },
  });

  return { dataList: clients, total };
};

/**
 * Get all clients for UI filters.
 *
 * @returns {Promise<Array>} List of all clients.
 */

export const getAllClientsFilters = async (): Promise<Client[]> => {
  return prisma.clients.findMany();
};

/**
 * Create a new client.
 *
 * @param {Object} data - Client data.
 * @param {string} data.name - Client name.
 * @param {string} data.email - Client email.
 * @param {string} data.phone - Client phone.
 * @param {string} data.address - Client address.
 * @param {number} data.createdBy - User ID who created the client.
 * @returns {Promise<Object>} Created client with related data.
 */
export const createClient = async (data: CreateClientData): Promise<Client> => {
  return prisma.clients.create({
    data: {
      name: data.name,
      email: data.email!,
      phone: data.phone,
      address: data.address!,
      createdOn: data.createdOn ? new Date(data.createdOn) : new Date(),
      userClientCreated: {
        connect: {
          id: data.createdBy,
        },
      },
    },
  });
};

/**
 * Update a client by ID.
 *
 * @param {number} id - Client ID.
 * @param {Object} data - Updated client data.
 * @param {string} [data.name] - Client name.
 * @param {string} [data.email] - Client email.
 * @param {string} [data.phone] - Client phone.
 * @param {string} [data.address] - Client address.
 * @param {number} data.updatedBy - User ID who updated the client.
 * @returns {Promise<Object>} Updated client with related data.
 */
export const updateClientById = async (
  id: number,
  data: UpdateClientData
): Promise<Client> => {
  return prisma.clients.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email!,
      phone: data.phone,
      address: data.address,
      updatedOn: data.updatedOn,
      userClientUpdated: {
        ...(data.updatedBy !== undefined && {
          connect: {
            id: data.updatedBy,
          },
        }),
      },
    },
  });
};

/**
 * Delete a client by ID.
 *
 * @param {number} id - Client ID.
 * @returns {Promise<Object>} Deleted client.
 */
export const deleteClientById = async (id: number): Promise<Client> => {
  return prisma.clients.delete({
    where: { id },
  });
};
