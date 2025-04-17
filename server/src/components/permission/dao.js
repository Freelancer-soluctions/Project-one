import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * @description Retrieve permissions from the database with optional filters
 * @param {Object} filters - Filter criteria
 * @param {number} [filters.employeeId] - Filter by employee ID
 * @param {string} [filters.type] - Filter by permission type (SICK, PERSONAL, MATERNITY, PATERNITY, OTHER)
 * @param {string} [filters.status] - Filter by status (PENDING, APPROVED, REJECTED)
 * @param {string} [filters.fromDate] - Filter by start date (ISO format)
 * @param {string} [filters.toDate] - Filter by end date (ISO format)
 * @returns {Promise<Array>} List of permissions with related employee and approver data
 */
export const getAllPermissions = async (filters) => {
  const {
    employeeId,
    type,
    status,
    fromDate,
    toDate
  } = filters

  const where = {}

  if (employeeId) {
    where.employeeId = parseInt(employeeId)
  }

  if (type) {
    where.type = type
  }

  if (status) {
    where.status = status
  }

  if (fromDate && toDate) {
    where.startDate = {
      gte: new Date(fromDate),
      lte: new Date(toDate)
    }
  }

  return await prisma.permission.findMany({
    where,
    include: {
      employee: true,
      approver: true
    },
    orderBy: {
      createdOn: 'desc'
    }
  })
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
    data,
    include: {
      employee: true,
      approver: true
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
    where: { id: parseInt(id) },
    data,
    include: {
      employee: true,
      approver: true
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
    where: { id: parseInt(id) },
    include: {
      employee: true,
      approver: true
    }
  })
}
