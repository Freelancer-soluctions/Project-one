import { prisma, Prisma } from '../../config/db.js';

/**
 * Get all client orders with optional filters.
 *
 * @param {Object} filters - Optional filters for the query.
 * @param {number} [filters.clientId] - Filter by client ID.
 * @param {string} [filters.status] - Filter by status.
 * @param {number} take - Number of records to retrieve.
 * @param {number} skip - Number of records to skip.
 * @returns {Promise<Object>} Object containing dataList and total count.
 */
export const getAllClientOrders = async (filters = {}, take, skip) => {
  const whereClauses = [];

  if (filters.clientId) {
    whereClauses.push(
      Prisma.sql`co."clientId" = ${parseInt(filters.clientId, 10)}`
    );
  }

  if (filters.status) {
    whereClauses.push(Prisma.sql`co."status" ILIKE ${filters.status}`);
  }

  const whereSql = whereClauses.length
    ? Prisma.sql`WHERE ${Prisma.join(whereClauses, Prisma.sql` AND `)}`
    : Prisma.empty;

  const clientOrders = await prisma.$queryRaw`
    SELECT
      co.*,
      c.name AS "clientName",
      u.name AS "userClientOrderCreatedName",
      uu.name AS "userClientOrderUpdatedName"
    FROM "clientOrder" co
    LEFT JOIN "clients" c ON co."clientId" = c.id
    LEFT JOIN "users" u ON co."createdBy" = u.id
    LEFT JOIN "users" uu ON co."updatedBy" = uu.id
    ${whereSql}
    ORDER BY co."createdOn" DESC
    LIMIT ${take}
    OFFSET ${skip}
  `;

  const total = await prisma.clientOrder.count({
    where: {
      ...(filters.clientId && {
        clientId: parseInt(filters.clientId, 10),
      }),

      ...(filters.status && {
        status: {
          contains: filters.status,
          mode: 'insensitive', // equivale a ILIKE en Postgres
        },
      }),
    },
  });

  return { dataList: clientOrders, total };
};

/**
 * Create a new client order.
 *
 * @param {Object} data - clientOrder data.
 * @param {number} data.clientId - Client ID.
 * @param {string} data.status - Status.
 * @param {string} data.notes - Notes.
 * @param {number} data.createdBy - User ID who created the clientOrder.
 * @returns {Promise<Object>} Created client order.
 */
export const createClientOrder = async (data) => {
  return prisma.clientOrder.create({
    data: {
      clientId: data.clientId,
      status: data.status,
      notes: data.notes,
      createdOn: data.createdOn,
      userClientOrderCreated: {
        connect: {
          id: data.createdBy,
        },
      },
    },
  });
};

/**
 * Update a client order by ID.
 *
 * @param {number} id - clientOrder ID.
 * @param {Object} data - Updated clientOrder data.
 * @param {number} [data.clientId] - Client ID.
 * @param {string} [data.status] - Status.
 * @param {string} [data.notes] - Notes.
 * @param {number} data.updatedBy - User ID who updated the clientOrder.
 * @returns {Promise<Object>} Updated client order.
 */
export const updateClientOrderById = async (id, data) => {
  return prisma.clientOrder.update({
    where: { id },
    data: {
      clientId: data.clientId,
      status: data.status,
      notes: data.notes,
      updatedOn: data.updatedOn,
      userClientOrderUpdated: {
        connect: {
          id: data.updatedBy,
        },
      },
    },
  });
};

/**
 * Delete a client order by ID.
 *
 * @param {number} id - clientOrder ID.
 * @returns {Promise<Object>} Deleted client order.
 */
export const deleteClientOrderById = async (id) => {
  return prisma.clientOrder.delete({
    where: { id },
  });
};
