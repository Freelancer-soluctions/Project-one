import {
  getAllVacation as getAllVacationService,
  createVacation as createVacationService,
  updateVacationById as updateVacationByIdService,
  deleteVacationById as deleteVacationByIdService,
} from './service.js';
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js';
import globalResponse from '../../utils/responses&Errors/globalResponse.js';

/**
 * Get all vacation records with optional filters.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.safeQuery - Safe query parameters with filters
 * @param {number} [req.safeQuery.page] - Page number for pagination
 * @param {number} [req.safeQuery.limit] - Number of items per page
 * @param {number} [req.safeQuery.employeeId] - Filter by employee ID
 * @param {string} [req.safeQuery.status] - Filter by vacation status
 * @param {Date} [req.safeQuery.startDate] - Filter by start date
 * @param {Date} [req.safeQuery.endDate] - Filter by end date
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Returns paginated list of vacation records
 */
export const getAllVacation = handleCatchErrorAsync(async (req, res) => {
  const filters = req.safeQuery;
  const data = await getAllVacationService(filters);
  return globalResponse(res, 200, data);
});

/**
 * Create a new vacation record.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - Request body containing vacation data
 * @param {number} req.body.employeeId - Employee ID
 * @param {Date} req.body.startDate - Vacation start date
 * @param {Date} req.body.endDate - Vacation end date
 * @param {string} req.body.type - Vacation type (ANNUAL, SICK, PERSONAL, UNPAID)
 * @param {string} req.body.status - Vacation status (PENDING, APPROVED, REJECTED, COMPLETED)
 * @param {string} req.body.reason - Reason for the vacation
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Creates new vacation record and returns vacation object
 */
export const createVacation = handleCatchErrorAsync(async (req, res) => {
  const data = await createVacationService(req.body);
  return globalResponse(res, 201, data);
});

/**
 * Update a vacation record by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Vacation ID from URL
 * @param {Object} req.body - Request body containing vacation data to update
 * @param {Date} [req.body.startDate] - Vacation start date
 * @param {Date} [req.body.endDate] - Vacation end date
 * @param {string} [req.body.type] - Vacation type (ANNUAL, SICK, PERSONAL, UNPAID)
 * @param {string} [req.body.status] - Vacation status (PENDING, APPROVED, REJECTED, COMPLETED)
 * @param {string} [req.body.reason] - Reason for the vacation
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Updates vacation record and returns updated vacation object
 */
export const updateVacationById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params;
  const data = await updateVacationByIdService(id, req.body);
  return globalResponse(res, 200, data);
});

/**
 * Delete a vacation record by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Vacation ID from URL
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Deletes vacation record and returns confirmation message
 */
export const deleteVacationById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params;
  const data = await deleteVacationByIdService(id);
  return globalResponse(res, 200, data, 'Vacation record deleted successfully');
});
