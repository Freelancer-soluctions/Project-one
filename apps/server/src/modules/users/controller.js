import {
  getAllUsers as getAllUsersService,
  createUser as createUserService,
  updateUserById as updateUserByIdService,
  deleteUserById as deleteUserByIdService,
  getAllUsersStatus as getAllUsersStatusService,
  getAllUsersRoles as getAllUsersRolesService,
  getAllUserPermits as getAllUserPermitsService,
  getUsersByStatus as getUsersByStatusService,
} from './service.js';
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js';
import globalResponse from '../../utils/responses&Errors/globalResponse.js';

/**
 * Get all users with optional filters.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.safeQuery - Safe query parameters with filters
 * @param {number} [req.safeQuery.page] - Page number for pagination
 * @param {number} [req.safeQuery.limit] - Number of items per page
 * @param {string} [req.safeQuery.name] - Filter by user name
 * @param {string} [req.safeQuery.email] - Filter by user email
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Returns paginated list of users
 */
export const getAllUsers = handleCatchErrorAsync(async (req, res) => {
  const users = await getAllUsersService(req.safeQuery);
  globalResponse(res, 200, users);
});

/**
 * Get all user permits by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {string} req.userId - Authenticated user ID from token verification
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Returns user permits and permissions
 */
export const getAllUserPermits = handleCatchErrorAsync(async (req, res) => {
  const id = req.userId;
  const users = await getAllUserPermitsService(id);
  globalResponse(res, 200, users);
});

/**
 * Get users by status.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.status - User status code to filter by
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Returns users filtered by status.
 */
export const getUsersByStatus = handleCatchErrorAsync(async (req, res) => {
  const { statusCode } = req.safeQuery;
  console.log("STATUSCODE", statusCode)
  const data = await getUsersByStatusService(statusCode);
  console.log("result", data)
  globalResponse(res, 200, data);
});

/**
 * Get all users statuses.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response containing all user statuses.
 */
export const getAllUsersStatus = handleCatchErrorAsync(async (req, res) => {
  const data = await getAllUsersStatusService();
  globalResponse(res, 200, data);
});

/**
 * Get all users roles.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response containing all user roles.
 */
export const getAllUsersRoles = handleCatchErrorAsync(async (req, res) => {
  const data = await getAllUsersRolesService();
  globalResponse(res, 200, data);
});

/**
 * Create a new user.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - Request body containing user data
 * @param {string} req.body.name - User name
 * @param {string} req.body.email - User email address
 * @param {string} req.body.password - User password
 * @param {number} req.body.roleId - User role ID
 * @param {string} req.userId - Authenticated user ID from token verification
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Creates new user and returns user object
 */
export const createUser = handleCatchErrorAsync(async (req, res) => {
  const user = await createUserService({
    ...req.body,
    lastUpdatedBy: req.userId,
  });
  globalResponse(res, 201, user);
});

/**
 * Update a user by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - User ID from URL
 * @param {Object} req.body - Request body containing user data to update
 * @param {string} [req.body.name] - User name
 * @param {string} [req.body.email] - User email address
 * @param {string} [req.body.password] - User password
 * @param {number} [req.body.roleId] - User role ID
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Updates user and returns updated user object
 */
export const updateUserById = handleCatchErrorAsync(async (req, res) => {
  const user = await updateUserByIdService(req.params.id, {
    ...req.body,
  });
  globalResponse(res, 200, user);
});

/**
 * Delete a user by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - User ID from URL
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Deletes user and returns confirmation message
 */
export const deleteUserById = handleCatchErrorAsync(async (req, res) => {
  await deleteUserByIdService(req.params.id);
  globalResponse(res, 200, { message: 'User deleted successfully' });
});
