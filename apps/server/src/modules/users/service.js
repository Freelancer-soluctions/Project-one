import {
  getAllUsers as getAllUsersDao,
  createUser as createDao,
  updateUserById as updateDao,
  deleteUserById as deleteDao,
  getAllUsersStatus as getAllUserStatusDao,
  getAllUsersRoles as getAllUserRolesDao,
  getUserRoleByCode as getUserRoleByCodeDao,
  getUserRoleByUserId as getUserRoleByUserIdDao,
  getAllUserPermits as getAllUserPermitsDao
} from './dao.js'
import { getSafePagination } from '../../utils/pagination/pagination.js'
/**
 * Get all users with optional filters
 * @param {Object} filters - Optional filters for the query
 * @returns {Promise<Array>} List of users
 */
export const getAllUsers = async (filters) => {
  const { take, skip } = getSafePagination({ page: filters.page, limit: filters.limit })

  if (!take || take <= 0) {
    throw new Error('Pagination is required')
  }
  return await getAllUsersDao(filters, take, skip)
}

/**
 * Get all user permits by ID
 * @param {number} id - User ID
 * @returns {Promise<Array>} List of users
 */
export const getAllUserPermits = async (id) => {
  const { allPermissions, user } = await getAllUserPermitsDao(Number(id))

  const userPermits = user?.userPermits || []

  const userPermissionIds = new Set(userPermits.map(p => p.permissionId))
  const permissions = allPermissions.map(p => ({
    ...p,
    assigned: userPermissionIds.has(p.id) // ✅ marcado si pertenece al usuario
  }))

  return permissions
}

/**
 * Get all available user statuses from the database.
 *
 * @returns {Promise<Array>} A list of all user statuses.
 */

export const getAllUsersStatus = async () => {
  const data = await getAllUserStatusDao()
  return data
}

/**
 * Get all available user roles from the database.
 *
 * @returns {Promise<Array>} A list of all user roles.
 */

export const getAllUsersRoles = async () => {
  const data = await getAllUserRolesDao()
  return data
}

/**
 * Create a new user
 * @param {Object} data - User data
 * @returns {Promise<Object>} Created user
 */
export const createUser = async (data) => {
  const userData = {
    ...data,
    lastUpdatedOn: new Date()
  }
  return createDao(userData)
}

/**
 * Update a user by ID
 * @param {number} id - User ID
 * @param {Object} data - Updated user data
 * @returns {Promise<Object>} Updated user
 */
export const updateUserById = async (id, data) => {
  const userData = {
    ...data,
    lastUpdatedBy: Number(id),
    lastUpdatedOn: new Date()
  }
  return updateDao(Number(id), userData)
}

/**
 * Delete a user by ID
 * @param {number} id - User ID
 * @returns {Promise<Object>} Deleted user
 */
export const deleteUserById = async (id) => {
  return deleteDao(Number(id))
}

export const getUserRoleByCode = async (code) => {
  return getUserRoleByCodeDao(code)
}

export const getUserRoleByUserId = async (userId) => {
  return getUserRoleByUserIdDao(Number(userId))
}
