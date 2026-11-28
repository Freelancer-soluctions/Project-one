import {
  getAllDepartments as getAllDepartmentsService,
  createDepartment as createDepartmentService,
  updateDepartmentById as updateDepartmentByIdService,
  deleteDepartmentById as deleteDepartmentByIdService,
  getDepartmentOptions as getDepartmentOptionsService,
} from './service.js';
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js';
import globalResponse from '../../utils/responses&Errors/globalResponse.js';
import type {
  CreateDepartmentInput,
  DepartmentFilters,
  UpdateDepartmentInput,
} from './types.js';

/**
 * Get all departments with optional filters.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.safeQuery - Safe query parameters with filters.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Returns paginated list of departments.
 */
export const getAllDepartments = handleCatchErrorAsync(async (req, res) => {
  const filters = req.safeQuery as DepartmentFilters;
  const departments = await getAllDepartmentsService(filters);
  globalResponse(res, 200, departments);
});

/**
 * Create a new department.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - Request body containing department data.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Creates the department and returns it.
 */
export const createDepartment = handleCatchErrorAsync(async (req, res) => {
  const body = req.body as CreateDepartmentInput;
  const department = await createDepartmentService(body);
  globalResponse(res, 201, department);
});

/**
 * Update a department by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters.
 * @param {string} req.params.id - Department ID from URL.
 * @param {Object} req.body - Request body containing department data to update.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Updates the department and returns it.
 */
export const updateDepartmentById = handleCatchErrorAsync(async (req, res) => {
  const body = req.body as UpdateDepartmentInput;
  const department = await updateDepartmentByIdService(
    Number(req.params['id']),
    body
  );
  globalResponse(res, 200, department);
});

/**
 * Delete a department by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters.
 * @param {string} req.params.id - Department ID from URL.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Deletes the department and returns a confirmation.
 */
export const deleteDepartmentById = handleCatchErrorAsync(async (req, res) => {
  await deleteDepartmentByIdService(Number(req.params['id']));
  globalResponse(res, 200, { message: 'Department deleted successfully' });
});

/**
 * All departments as `{ id, name }` for select inputs.
 *
 * @param {Object} _req - The HTTP request object (unused).
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Returns the full options list.
 */
export const getDepartmentOptions = handleCatchErrorAsync(async (_req, res) => {
  const options = await getDepartmentOptionsService();
  globalResponse(res, 200, options);
});
