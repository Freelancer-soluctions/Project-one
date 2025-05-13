import {
  getAllUsers as getAllUsersDao,
  createUser as createDao,
  updateUserById as updateDao,
  deleteUserById as deleteDao,
  getUserById as getUserByIdDao
} from './dao.js'

/**
 * Get all users with optional filters
 * @param {Object} filters - Optional filters for the query
 * @returns {Promise<Array>} List of users
 */
export const getAllUsers = async (filters) => {
  return getAllUsersDao(filters)
}

/**
 * Get a user by ID
 * @param {number} id - User ID
 * @returns {Promise<Object>} User
 */
export const getUserById = async (id) => {
  return getUserByIdDao(id)
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