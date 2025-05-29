import {
  getAllPermissions as getAllPermissionsDao,
  createPermission as createPermissionDao,
  updatePermissionById as updatePermissionByIdDao,
  deletePermissionById as deletePermissionByIdDao
} from './dao.js'

/**
 * @description Retrieve all permissions with optional filters
 * @param {Object} filters - Filter criteria
 * @param {number} [filters.employeeId] - Filter by employee ID
 * @param {string} [filters.type] - Filter by permission type (SICK, PERSONAL, MATERNITY, PATERNITY, OTHER)
 * @param {string} [filters.status] - Filter by status (PENDING, APPROVED, REJECTED)
 * @param {string} [filters.fromDate] - Filter by start date (ISO format)
 * @param {string} [filters.toDate] - Filter by end date (ISO format)
 * @returns {Promise<Array>} List of permissions matching the filters
 */
export const getAllPermissions = async (filters) => {
  return await getAllPermissionsDao(filters)
}

/**
 * @description Create a new permission record
 * @param {Object} data - Permission data
 * @param {number} data.employeeId - Employee ID
 * @param {string} data.type - Permission type
 * @param {string} data.startDate - Start date (ISO format)
 * @param {string} data.endDate - End date (ISO format)
 * @param {string} data.reason - Reason for permission
 * @param {string} [data.status] - Permission status (defaults to PENDING)
 * @returns {Promise<Object>} Created permission record
 */
export const createPermission = async (data, userId) => {
  const permissionData = {
    ...data,
    employeeId: Number(data.employeeId),
    createdOn: new Date(),
    fromDate: new Date(data.fromDate),
    toDate: new Date(data.toDate),
    createdBy: userId

  }
  return await createPermissionDao(permissionData)
}

/**
 * @description Update an existing permission record
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
 * @returns {Promise<Object>} Updated permission record
 */
export const updatePermissionById = async (id, data, userId) => {
  const permissionData = {
    ...data,
    employeeId: Number(data.employeeId),
    updatedOn: new Date(),
    fromDate: new Date(data.fromDate),
    toDate: new Date(data.toDate),
    updatedBy: userId

  }
  return await updatePermissionByIdDao(id, permissionData)
}

/**
 * @description Delete a permission record
 * @param {number|string} id - Permission ID
 * @returns {Promise<Object>} Deleted permission record
 */
export const deletePermissionById = async (id) => {
  return await deletePermissionByIdDao(id)
}
