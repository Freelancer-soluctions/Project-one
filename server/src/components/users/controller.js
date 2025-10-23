import {
  getAllUsers as getAllUsersService,
  createUser as createUserService,
  updateUserById as updateUserByIdService,
  deleteUserById as deleteUserByIdService,
  getAllUsersStatus as getAllUsersStatusService,
  getAllUsersRoles as getAllUsersRolesService
} from './service.js'
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js'
import globalResponse from '../../utils/responses&Errors/globalResponse.js'

/**
 * Get all users with optional filters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllUsers = handleCatchErrorAsync(async (req, res) => {
  const users = await getAllUsersService(req.query)
  globalResponse(res, 200, users)
})

/**
 * Get all users statuses.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response containing the status of all product items.
 */
export const getAllUsersStatus = handleCatchErrorAsync(async (req, res) => {
  const data = await getAllUsersStatusService()
  console.log('User statuses retrieved:', data)
  globalResponse(res, 200, data)
})

/**
 * Get all users roles.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response containing the status of all product items.
 */
export const getAllUsersRoles = handleCatchErrorAsync(async (req, res) => {
  const data = await getAllUsersRolesService()
  globalResponse(res, 200, data)
})

/**
 * Create a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createUser = handleCatchErrorAsync(async (req, res) => {
  console.log(req.body)
  const user = await createUserService({
    ...req.body,
    lastUpdatedBy: req.userId
  })
  globalResponse(res, 201, user)
})

/**
 * Update a user by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateUserById = handleCatchErrorAsync(async (req, res) => {
  const user = await updateUserByIdService(req.params.id, {
    ...req.body
  })
  globalResponse(res, 200, user)
})

/**
 * Delete a user by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteUserById = handleCatchErrorAsync(async (req, res) => {
  await deleteUserByIdService(req.params.id)
  globalResponse(res, 200, { message: 'User deleted successfully' })
})
