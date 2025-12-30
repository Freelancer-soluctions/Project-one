import { prisma, Prisma } from '../../config/db.js'

/**
 * @description Retrieve permissions from the database with optional filters
 * @param {Object} filters - Filter criteria
 * @param {number} [filters.employeeId] - Filter by employee ID
 * @param {string} [filters.type] - Filter by permission type (SICK, PERSONAL, MATERNITY, PATERNITY, OTHER)
 * @param {string} [filters.status] - Filter by status (PENDING, APPROVED, REJECTED)
 * @param {string} [filters.fromDate] - Filter by start date (ISO format)
 * @param {string} [filters.toDate] - Filter by end date (ISO format)
 * @param {number} take- take to filter by
 * @param {number} skip - skip to filter by
 * @returns {Promise<Array>} List of permissions with related employee and approver data
 */
export const getAllPermissions = async (filters, take, skip) => {
  const whereClauses = []

  if (filters.employeeId) {
    whereClauses.push(Prisma.sql`pe."employeeId" = ${Number(filters.employeeId)}`)
  }

  if (filters.startDate) {
    whereClauses.push(Prisma.sql`pe."createdOn" >= ${filters.startDate}`)
  }

  if (filters.endDate) {
    whereClauses.push(Prisma.sql`pe."createdOn" <= ${filters.endDate}`)
  }

  if (filters.status) {
    // Using ILIKE for case-insensitive search for description
    whereClauses.push(Prisma.sql`pe."status" ILIKE ${'%' + filters.status + '%'}`)
  }
  if (filters.type) {
    // Using ILIKE for case-insensitive search for description
    whereClauses.push(Prisma.sql`pe."type" ILIKE ${'%' + filters.type + '%'}`)
  }

  const whereSql = whereClauses.length
    ? Prisma.sql`WHERE ${Prisma.join(whereClauses, Prisma.sql` AND `)}`
    : Prisma.empty

  const permissions = await prisma.$queryRaw`
      SELECT 
        pe.*,
        e.name AS "employeeName",
        u.name AS "userPermissionCreatedName",
        uu.name AS "userPermissionUpdatedName"
      FROM "permission" pe
      LEFT JOIN "employees" e ON pe."employeeId" = e.id
      LEFT JOIN "users" u ON pe."createdBy" = u.id
      LEFT JOIN "users" uu ON pe."updatedBy" = uu.id
      ${whereSql}
      ORDER BY pe."createdOn" DESC
      LIMIT ${take}
      OFFSET ${skip}
    `
  const total = await prisma.permission.count({
    where: {
      ...(filters.employeeId && {
        employeeId: Number(filters.employeeId)
      }),

      ...(filters.startDate && {
        createdOn: {
          gte: new Date(filters.startDate)
        }
      }),

      ...(filters.endDate && {
        createdOn: {
          ...(filters.startDate
            ? { gte: new Date(filters.startDate) }
            : {}),
          lte: new Date(filters.endDate)
        }
      }),

      ...(filters.status && {
        status: {
          contains: filters.status,
          mode: 'insensitive' // equivalente a ILIKE
        }
      }),

      ...(filters.type && {
        type: {
          contains: filters.type,
          mode: 'insensitive' // equivalente a ILIKE
        }
      })
    }
  })

  return { dataList: permissions, total }
}

/**
 * @description Create a new permission record in the database
 * @param {Object} data - Permission data
 * @param {number} data.employeeId - Employee ID
 * @param {string} data.type - Permission type (SICK, PERSONAL, MATERNITY, PATERNITY, OTHER)
 * @param {string} data.startDate - Start date (ISO format)
 * @param {string} data.endDate - End date (ISO format)
 * @param {string} data.reason - Reason for permission
 * @param {string} [data.status] - Permission status (defaults to PENDING)
 * @param {number} [data.approvedBy] - ID of user who approved/rejected
 * @param {string} [data.comments] - Additional comments
 * @returns {Promise<Object>} Created permission record with related data
 */
export const createPermission = async (data) => {
  return await prisma.permission.create({
    data: {
      createdOn: data.createdOn,
      fromDate: data.startDate,
      toDate: data.endDate,
      type: data.type,
      status: data.status,
      reason: data.reason,
      comments: data.comments,
      employee: {
        connect: { id: data.employeeId }
      },
      userPermissionCreated: {
        connect: { id: data.createdBy }
      }
    },
    include: {
      employee: true
    }
  })
}

/**
 * @description Update an existing permission record in the database
 * @param {number|string} id - Permission ID
 * @param {Object} data - Updated permission data
 * @param {number} [data.employeeId] - Employee ID
 * @param {string} [data.type] - Permission type
 * @param {string} [data.startDate] - Start date (ISO format)
 * @param {string} [data.endDate] - End date (ISO format)
 * @param {string} [data.reason] - Reason for permission
 * @param {string} [data.status] - Permission status
 * @param {number} [data.approvedBy] - ID of user who approved/rejected
 * @param {string} [data.comments] - Additional comments
 * @returns {Promise<Object>} Updated permission record with related data
 */
export const updatePermissionById = async (id, data) => {
  return await prisma.permission.update({
    where: { id },
    data: {
      updatedOn: data.updatedOn,
      fromDate: data.startDate,
      toDate: data.endDate,
      type: data.type,
      status: data.status,
      reason: data.reason,
      comments: data.comments,
      employee: {
        connect: { id: data.employeeId }
      },
      userPermissionUpdated: {
        connect: { id: data.updatedBy }
      }
    },
    include: {
      employee: true
    }
  })
}

/**
 * @description Delete a permission record from the database
 * @param {number|string} id - Permission ID
 * @returns {Promise<Object>} Deleted permission record with related data
 * @throws {Error} If permission not found or cannot be deleted
 */
export const deletePermissionById = async (id) => {
  return await prisma.permission.delete({
    where: { id }
  })
}
