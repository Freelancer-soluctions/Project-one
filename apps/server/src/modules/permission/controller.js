import {
  getAllPermissions as getAllPermissionsService,
  createPermission as createPermissionService,
  updatePermissionById as updatePermissionByIdService,
  deletePermissionById as deletePermissionByIdService,
} from './service.js';
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js';
import globalResponse from '../../utils/responses&Errors/globalResponse.js';

/**
 * Get all permissions with optional filters.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.safeQuery - Validated query parameters
 * @param {number} [req.safeQuery.employeeId] - Filter by employee ID
 * @param {string} [req.safeQuery.type] - Filter by permission type (SICK, PERSONAL, MATERNITY, PATERNITY, OTHER)
 * @param {string} [req.safeQuery.status] - Filter by status (PENDING, APPROVED, REJECTED)
 * @param {string} [req.safeQuery.fromDate] - Filter by start date (ISO format)
 * @param {string} [req.safeQuery.toDate] - Filter by end date (ISO format)
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends response with list of permissions
 */
export const getAllPermissions = handleCatchErrorAsync(async (req, res) => {
  const filters = req.safeQuery;
  const permissions = await getAllPermissionsService(filters);
  return globalResponse(res, 200, permissions);
});

/**
 * Create a new permission request.
 *
 * @param {Object} req - The HTTP request object.
* @param {string} req.userId - Authenticated user ID from token
 * @param {Object} req.body - Permission data
 * @param {number} req.body.employeeId - Employee ID
 * @param {string} req.body.type - Permission type
 * @param {string} req.body.startDate - Start date (ISO format)
 * @param {string} req.body.endDate - End date (ISO format)
 * @param {string} req.body.reason - Reason for permission
 * @param {string} [req.body.status] - Permission status (defaults to PENDING)
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends response with created permission
 */
export const createPermission = handleCatchErrorAsync(async (req, res) => {
  const permission = await createPermissionService(req.body, req.userId);
  return globalResponse(res, 201, permission);
});

/**
 * Update an existing permission by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - Permission ID
 * @param {Object} req.body - Updated permission data
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends response with updated permission
 */
export const updatePermissionById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params;
  const permission = await updatePermissionByIdService(id, req.body);
  return globalResponse(res, 200, permission);
});

/**
 * Delete a permission by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - Permission ID
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends response with deletion confirmation
 */
export const deletePermissionById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params;
  const permission = await deletePermissionByIdService(id);
  return globalResponse(res, 200, {
    message: 'Permission deleted successfully',
    permission,
  });
});
