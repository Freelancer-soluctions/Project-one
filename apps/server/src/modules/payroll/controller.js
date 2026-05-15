import * as payrollService from './service.js';
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js';
import globalResponse from '../../utils/responses&Errors/globalResponse.js';

/**
 * Get all payroll records with optional filters.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.safeQuery - Safe query parameters with filters
 * @param {number} [req.safeQuery.page] - Page number for pagination
 * @param {number} [req.safeQuery.limit] - Number of items per page
 * @param {number} [req.safeQuery.employeeId] - Filter by employee ID
 * @param {string} [req.safeQuery.period] - Filter by payroll period
 * @param {string} [req.safeQuery.status] - Filter by payroll status
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Returns paginated list of payroll records
 */
export const getAllPayroll = handleCatchErrorAsync(async (req, res) => {
  const filters = req.safeQuery;
  const payroll = await payrollService.getAllPayroll(filters);
  globalResponse(res, 200, payroll, 'Payroll retrieved successfully');
});

/**
 * Create a new payroll record.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - Request body containing payroll data
 * @param {number} req.body.employeeId - Employee ID
 * @param {string} req.body.period - Payroll period (e.g., "2024-01")
 * @param {number} req.body.grossSalary - Gross salary amount
 * @param {number} req.body.netSalary - Net salary amount
 * @param {number} req.body.deductions - Total deductions
 * @param {number} req.body.bonuses - Total bonuses
 * @param {string} req.body.status - Payroll status (DRAFT, PAID, CANCELLED)
 * @param {string} req.userId - Authenticated user ID from token verification
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Creates new payroll record and returns payroll object
 */
export const createPayroll = handleCatchErrorAsync(async (req, res) => {
  const payroll = await payrollService.createPayroll(req.body, req.userId);
  globalResponse(res, 201, payroll, 'Payroll created successfully');
});

/**
 * Update a payroll record by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Payroll ID from URL
 * @param {Object} req.body - Request body containing payroll data to update
 * @param {number} [req.body.grossSalary] - Gross salary amount
 * @param {number} [req.body.netSalary] - Net salary amount
 * @param {number} [req.body.deductions] - Total deductions
 * @param {number} [req.body.bonuses] - Total bonuses
 * @param {string} [req.body.status] - Payroll status (DRAFT, PAID, CANCELLED)
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Updates payroll record and returns updated payroll object
 */
export const updatePayrollById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params;
  const payroll = await payrollService.updatePayrollById(id, req.body);
  globalResponse(res, 200, payroll, 'Payroll updated successfully');
});

/**
 * Delete a payroll record by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Payroll ID from URL
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Deletes payroll record and returns confirmation message
 */
export const deletePayrollById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params;
  await payrollService.deletePayrollById(id);
  globalResponse(res, 200, 'Payroll deleted successfully');
});
