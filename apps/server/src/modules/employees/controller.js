import {
  getAllEmployees as getAllEmployeesService,
  getAllEmployeesFilters as getAllEmployeesFiltersService,
  createEmployee as createEmployeeService,
  updateEmployeeById as updateEmployeeByIdService,
  deleteEmployeeById as deleteEmployeeByIdService,
} from './service.js';
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js';
import globalResponse from '../../utils/responses&Errors/globalResponse.js';

/**
 * Get all employees with optional filters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllEmployees = handleCatchErrorAsync(async (req, res) => {
  const employees = await getAllEmployeesService(req.safeQuery);
  globalResponse(res, 200, employees);
});

/**
 * Get all employees to ui filters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllEmployeesFilters = handleCatchErrorAsync(
  async (req, res) => {
    const employees = await getAllEmployeesFiltersService();
    globalResponse(res, 200, employees);
  }
);

/**
 * Create a new employee
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createEmployee = handleCatchErrorAsync(async (req, res) => {
  console.log(req.body);
  const employee = await createEmployeeService({
    ...req.body,
    createdBy: req.userId,
  });
  globalResponse(res, 201, employee);
});

/**
 * Update an employee by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateEmployeeById = handleCatchErrorAsync(async (req, res) => {
  const employee = await updateEmployeeByIdService(req.params.id, {
    ...req.body,
    updatedBy: req.userId,
  });
  globalResponse(res, 200, employee);
});

/**
 * Delete an employee by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteEmployeeById = handleCatchErrorAsync(async (req, res) => {
  await deleteEmployeeByIdService(req.params.id);
  globalResponse(res, 200, { message: 'Employee deleted successfully' });
});
