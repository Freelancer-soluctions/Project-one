import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Get all vacation records with optional filters
 * @param {Object} filters - Filter criteria for vacation records
 * @param {number} [filters.employeeId] - Filter by employee ID
 * @param {string} [filters.status] - Filter by status (PENDING, APPROVED, REJECTED)
 * @param {Date} [filters.fromDate] - Filter by start date (greater than or equal)
 * @param {Date} [filters.toDate] - Filter by end date (less than or equal)
 * @returns {Promise<Array>} Array of vacation records with employee information
 */
export const getAllVacation = async (filters) => {
  const whereClauses = []

  if (filters.employeeId) {
    whereClauses.push(Prisma.sql`va."employeeId" = ${Number(filters.employeeId)}`)
  }

  if (filters.startDate) {
    whereClauses.push(Prisma.sql`va."createdOn" >= ${filters.fromDate}`)
  }

  if (filters.endDate) {
    whereClauses.push(Prisma.sql`va."createdOn" <= ${filters.toDate}`)
  }

  if (filters.status) {
    // Using ILIKE for case-insensitive search for description
    whereClauses.push(Prisma.sql`va."status" ILIKE ${'%' + filters.status + '%'}`)
  }
  if (filters.type) {
    // Using ILIKE for case-insensitive search for description
    whereClauses.push(Prisma.sql`va."type" ILIKE ${'%' + filters.type + '%'}`)
  }

  const whereSql = whereClauses.length
    ? Prisma.sql`WHERE ${Prisma.join(whereClauses, Prisma.sql` AND `)}`
    : Prisma.empty

  const permissions = await prisma.$queryRaw`
       SELECT 
         va.*,
         e.name AS "employeeName",
         u.name AS "userVacationCreatedName",
         uu.name AS "userVacationUpdatedName"
       FROM "vacation" va
       LEFT JOIN "employees" e ON va."employeeId" = e.id
       LEFT JOIN "users" u ON va."createdBy" = u.id
       LEFT JOIN "users" uu ON va."updatedBy" = uu.id
       ${whereSql}
       ORDER BY va."createdOn" DESC
     `

  return permissions
}

/**
 * Create a new vacation record
 * @param {Object} data - Vacation data to create
 * @param {number} data.employeeId - ID of the employee
 * @param {Date} data.startDate - Start date of the vacation
 * @param {Date} data.endDate - End date of the vacation
 * @param {string} [data.status] - Status of the vacation (default: PENDING)
 * @param {number} data.createdBy - ID of the user creating the record
 * @param {Date} data.createdOn - Creation timestamp
 * @returns {Promise<Object>} Created vacation record
 */
export const createVacation = async (data) => {
  return await prisma.vacation.create({
    data: {
      employeeId: data.employeeId,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status,
      createdBy: data.createdBy,
      createdOn: data.createdOn
    }
  })
}

/**
 * Update a vacation record by ID
 * @param {number} id - ID of the vacation record to update
 * @param {Object} data - Updated vacation data
 * @param {number} [data.employeeId] - ID of the employee
 * @param {Date} [data.startDate] - Start date of the vacation
 * @param {Date} [data.endDate] - End date of the vacation
 * @param {string} [data.status] - Status of the vacation
 * @param {number} [data.updatedBy] - ID of the user updating the record
 * @param {Date} [data.updatedOn] - Update timestamp
 * @returns {Promise<Object>} Updated vacation record
 */
export const updateVacationById = async (id, data) => {
  return await prisma.vacation.update({
    where: { id: parseInt(id) },
    data: {
      employeeId: data.employeeId,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status,
      updatedBy: data.updatedBy,
      updatedOn: data.updatedOn
    }
  })
}

/**
 * Delete a vacation record by ID
 * @param {number} id - ID of the vacation record to delete
 * @returns {Promise<Object>} Deleted vacation record
 */
export const deleteVacationById = async (id) => {
  return await prisma.vacation.delete({
    where: { id: parseInt(id) }
  })
}
