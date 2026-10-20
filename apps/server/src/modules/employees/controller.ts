import {
  getAllEmployees as getAllEmployeesService,
  getAllEmployeesFilters as getAllEmployeesFiltersService,
  createEmployee as createEmployeeService,
  updateEmployeeById as updateEmployeeByIdService,
  deleteEmployeeById as deleteEmployeeByIdService,
} from './service.js';
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js';
import globalResponse from '../../utils/responses&Errors/globalResponse.js';
import type {
  CreateEmployeeInput,
  EmployeeFilters,
  UpdateEmployeeInput,
} from './types.js';

/**
 * Get all employees with optional filters.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.safeQuery - Safe query parameters with filters
 * @param {number} [req.safeQuery.page] - Page number for pagination
 * @param {number} [req.safeQuery.limit] - Number of items per page
 * @param {string} [req.safeQuery.name] - Filter by employee name
 * @param {string} [req.safeQuery.email] - Filter by employee email
 * @param {string} [req.safeQuery.position] - Filter by employee position
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Returns paginated list of employees
 */
export const getAllEmployees = handleCatchErrorAsync(async (req, res) => {
  // Cast único de la query validada por Joi
  const filters = req.safeQuery as EmployeeFilters;
  const employees = await getAllEmployeesService(filters);
  globalResponse(res, 200, employees);
});

/**
 * Get all employees for UI filters.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Returns list of all employees
 */
export const getAllEmployeesFilters = handleCatchErrorAsync(
  async (req, res) => {
    const employees = await getAllEmployeesFiltersService();
    globalResponse(res, 200, employees);
  }
);

/**
 * Create a new employee.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - Request body containing employee data
 * @param {string} req.body.name - Employee name
 * @param {string} req.body.email - Employee email address
 * @param {string} req.body.phone - Employee phone number
 * @param {string} req.body.position - Employee position
 * @param {number} req.body.salary - Employee salary
 * @param {Date} req.body.hireDate - Employee hire date
 * @param {string} req.userId - Authenticated user ID from token verification
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Creates new employee and returns employee object
 */
export const createEmployee = handleCatchErrorAsync(async (req, res) => {
  console.log(req.body);
  // Cast único del body validado por Joi
  const body = req.body as Omit<CreateEmployeeInput, 'createdBy'>;
  const employee = await createEmployeeService({
    ...body,
    createdBy: req.userId as number,
  });
  globalResponse(res, 201, employee);
});

/**
 * Update an employee by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Employee ID from URL
 * @param {Object} req.body - Request body containing employee data to update
 * @param {string} [req.body.name] - Employee name
 * @param {string} [req.body.email] - Employee email address
 * @param {string} [req.body.phone] - Employee phone number
 * @param {string} [req.body.position] - Employee position
 * @param {number} [req.body.salary] - Employee salary
 * @param {string} req.userId - Authenticated user ID from token verification
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Updates employee and returns updated employee object
 */
export const updateEmployeeById = handleCatchErrorAsync(async (req, res) => {
  // Cast único del body validado por Joi
  const body = req.body as Omit<UpdateEmployeeInput, 'updatedBy'>;
  const employee = await updateEmployeeByIdService(req.params.id, {
    ...body,
    updatedBy: req.userId as number,
  });
  globalResponse(res, 200, employee);
});

/**
 * Delete an employee by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Employee ID from URL
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Deletes employee and returns confirmation message
 */
export const deleteEmployeeById = handleCatchErrorAsync(async (req, res) => {
  await deleteEmployeeByIdService(req.params.id);
  globalResponse(res, 200, { message: 'Employee deleted successfully' });
});
