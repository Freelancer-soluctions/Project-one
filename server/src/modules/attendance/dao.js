import { prisma, Prisma } from '../../config/db.js'

/**
 * Get all attendance records with optional filters
 * @param {Object} filters - Optional filters for the query
 * @param {number} [filters.employeeId] - Filter by employee ID
 * @param {Date} [filters.date] - Filter by date
 * @param {Date} [filters.fromDate] - Filter by date range start
 * @param {Date} [filters.toDate] - Filter by date range end
 * @returns {Promise<Array>} List of attendance records with their related data
 */
export const getAllAttendance = async (filters = {}) => {
  const whereClauses = []

  if (filters.employeeId) {
    whereClauses.push(Prisma.sql`a."employeeId" = ${Number(filters.employeeId)}`)
  }

  if (filters.date) {
    whereClauses.push(Prisma.sql`a."date" = ${new Date(filters.date)}`)
  }

  if (filters.fromDate && filters.toDate) {
    whereClauses.push(Prisma.sql`a."date" BETWEEN ${new Date(filters.fromDate)} AND ${new Date(filters.toDate)}`)
  } else if (filters.fromDate) {
    whereClauses.push(Prisma.sql`a."date" >= ${new Date(filters.fromDate)}`)
  } else if (filters.toDate) {
    whereClauses.push(Prisma.sql`a."date" <= ${new Date(filters.toDate)}`)
  }

  const whereSql = whereClauses.length
    ? Prisma.sql`WHERE ${Prisma.join(whereClauses, Prisma.sql` AND `)}`
    : Prisma.empty

  const attendance = await prisma.$queryRaw`
  SELECT 
     a.*,
     e.name AS "employeeName",
     e."lastName" AS "employeeLastName",
     u.name AS "userAttendanceCreatedName",
     uu.name AS "userAttendanceUpdatedName"
   FROM "attendance" a
   LEFT JOIN "employees" e ON a."employeeId" = e.id
   LEFT JOIN "users" u ON a."createdBy" = u.id
   LEFT JOIN "users" uu ON a."updatedBy" = uu.id
   ${whereSql}
   ORDER BY a."date" DESC, a."entryTime" DESC
 `
  return attendance
}

/**
 * Create a new attendance record
 * @param {Object} data - Attendance data
 * @param {number} data.employeeId - Employee ID
 * @param {Date} data.date - Attendance date
 * @param {string} data.entryTime - Entry time
 * @param {string} data.exitTime - Exit time
 * @param {number} data.workedHours - Worked hours
 * @param {number} data.createdBy - User ID who created the attendance record
 * @returns {Promise<Object>} Created attendance record with related data
 */
export const createAttendance = async (data) => {
  return prisma.attendance.create({
    data: {
      date: data.date,
      entryTime: data.entryTime,
      exitTime: data.exitTime,
      workedHours: data.workedHours,
      createdOn: data.createdOn,
      userAttendanceCreated: {
        connect: {
          id: data.createdBy
        }
      },
      employee: {
        connect: {
          id: data.employeeId
        }
      }
    }
  })
}

/**
 * Update an attendance record by ID
 * @param {number} id - Attendance ID
 * @param {Object} data - Updated attendance data
 * @param {number} [data.employeeId] - Employee ID
 * @param {Date} [data.date] - Attendance date
 * @param {string} [data.entryTime] - Entry time
 * @param {string} [data.exitTime] - Exit time
 * @param {number} [data.workedHours] - Worked hours
 * @param {number} data.updatedBy - User ID who updated the attendance record
 * @returns {Promise<Object>} Updated attendance record with related data
 */
export const updateAttendanceById = async (id, data) => {
  return prisma.attendance.update({
    where: { id },
    data: {
      date: data.date,
      entryTime: data.entryTime,
      exitTime: data.exitTime,
      workedHours: data.workedHours,
      updatedOn: data.updatedOn,
      employee: {
        connect: {
          id: data.employeeId
        }
      },
      userAttendanceUpdated: {
        connect: {
          id: data.updatedBy
        }
      }
    }
  })
}

/**
 * Delete an attendance record by ID
 * @param {number} id - Attendance ID
 * @returns {Promise<Object>} Deleted attendance record
 */
export const deleteAttendanceById = async (id) => {
  return prisma.attendance.delete({
    where: { id }
  })
}
