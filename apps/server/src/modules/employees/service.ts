import {
  getAllEmployees as getAllEmployeesDao,
  getAllEmployeesFilters as getAllEmployeesFiltersDao,
  createEmployee as createEmployeeDao,
  updateEmployeeById as updateEmployeeByIdDao,
  deleteEmployeeById as deleteEmployeeByIdDao,
  positionExists as positionExistsDao,
  departmentExists as departmentExistsDao,
} from './dao.js';
import type {
  CreateEmployeeInput,
  Employee,
  EmployeeFilters,
  EmployeeServiceResult,
  UpdateEmployeeInput,
} from './types.js';
import { getSafePagination } from '../../utils/pagination/pagination.js';
import ClientError from '../../utils/responses&Errors/errors.js';

/**
 * Ensures every referenced catalog id exists (spec RN-EC-005: invalid
 * positionId/departmentId → 400, not the 409 that the raw FK violation maps
 * to in the global error handler).
 *
 * @param {Object} data - Employee payload with optional catalog ids.
 * @throws {ClientError} 400 when a referenced catalog row does not exist.
 */
const assertCatalogsExist = async (data: {
  positionId?: number | null;
  departmentId?: number | null;
}): Promise<void> => {
  if (data.positionId === null || data.departmentId === null) {
    throw new ClientError('Catalog ids cannot be null', 400);
  }
  if (data.positionId != null && !(await positionExistsDao(data.positionId))) {
    throw new ClientError('Position not found', 400);
  }
  if (
    data.departmentId != null &&
    !(await departmentExistsDao(data.departmentId))
  ) {
    throw new ClientError('Department not found', 400);
  }
};

/**
 * Get all employees with optional filters.
 *
 * @param {Object} filters - Optional filters for the query.
 * @param {number} [filters.page] - Page number for pagination.
 * @param {number} [filters.limit] - Number of items per page.
 * @param {string} [filters.name] - Filter by employee name.
 * @param {string} [filters.email] - Filter by employee email.
 * @param {number} [filters.positionId] - Filter by position catalog id.
 * @param {number} [filters.departmentId] - Filter by department catalog id.
 * @returns {Promise<Object>} Paginated list of employees with metadata.
 * @throws {Error} When pagination parameters are missing or invalid.
 */
export const getAllEmployees = async (
  filters: EmployeeFilters
): Promise<EmployeeServiceResult> => {
  const { take, skip } = getSafePagination({
    page: filters.page,
    limit: filters.limit,
  });

  if (!take || take <= 0) {
    throw new Error('Pagination is required');
  }
  return getAllEmployeesDao(filters, take, skip);
};

/**
 * Get all employees for UI filters.
 *
 * @returns {Promise<Array>} List of all employees.
 */
export const getAllEmployeesFilters = async (): Promise<Employee[]> => {
  return getAllEmployeesFiltersDao();
};

/**
 * Create a new employee.
 *
 * @param {Object} data - Employee data.
 * @param {string} data.name - Employee name.
 * @param {string} data.email - Employee email address.
 * @param {string} data.phone - Employee phone number.
 * @param {number} data.positionId - Position catalog id.
 * @param {number} data.departmentId - Department catalog id.
 * @param {number} data.salary - Employee salary.
 * @param {Date} data.hireDate - Employee hire date.
 * @param {number} data.createdBy - User ID who created the employee.
 * @returns {Promise<Object>} Created employee.
 */
export const createEmployee = async (
  data: CreateEmployeeInput
): Promise<Employee> => {
  await assertCatalogsExist(data);

  const dataEmployee = {
    ...data,
    createdOn: new Date(),
  };
  return createEmployeeDao(dataEmployee);
};

/**
 * Update an employee by ID.
 *
 * @param {number} id - Employee ID.
 * @param {Object} data - Updated employee data.
 * @param {string} [data.name] - Employee name.
 * @param {string} [data.email] - Employee email address.
 * @param {string} [data.phone] - Employee phone number.
 * @param {number} [data.positionId] - Position catalog id.
 * @param {number} [data.departmentId] - Department catalog id.
 * @param {number} [data.salary] - Employee salary.
 * @param {number} data.updatedBy - User ID who updated the employee.
 * @returns {Promise<Object>} Updated employee.
 */
export const updateEmployeeById = async (
  id: number | string,
  data: UpdateEmployeeInput
): Promise<Employee> => {
  await assertCatalogsExist(data);

  const dataEmployee = {
    ...data,
    updatedOn: new Date(),
  };
  return updateEmployeeByIdDao(Number(id), dataEmployee);
};

/**
 * Delete an employee by ID.
 *
 * @param {number} id - Employee ID.
 * @returns {Promise<Object>} Deleted employee.
 */
export const deleteEmployeeById = async (
  id: number | string
): Promise<Employee> => {
  return deleteEmployeeByIdDao(Number(id));
};
