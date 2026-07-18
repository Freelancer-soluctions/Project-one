import {
  getAllEmployees as getAllEmployeesDao,
  getAllEmployeesFilters as getAllEmployeesFiltersDao,
  createEmployee as createEmployeeDao,
  updateEmployeeById as updateEmployeeByIdDao,
  deleteEmployeeById as deleteEmployeeByIdDao,
} from './dao.js';
import { getSafePagination } from '../../utils/pagination/pagination.js';

/**
 * Get all employees with optional filters.
 *
 * @param {Object} filters - Optional filters for the query.
 * @param {number} [filters.page] - Page number for pagination.
 * @param {number} [filters.limit] - Number of items per page.
 * @param {string} [filters.name] - Filter by employee name.
 * @param {string} [filters.email] - Filter by employee email.
 * @param {string} [filters.position] - Filter by employee position.
 * @returns {Promise<Object>} Paginated list of employees with metadata.
 * @throws {Error} When pagination parameters are missing or invalid.
 */
export const getAllEmployees = async (filters) => {
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
export const getAllEmployeesFilters = async () => {
  return getAllEmployeesFiltersDao();
};

/**
 * Create a new employee.
 *
 * @param {Object} data - Employee data.
 * @param {string} data.name - Employee name.
 * @param {string} data.email - Employee email address.
 * @param {string} data.phone - Employee phone number.
 * @param {string} data.position - Employee position.
 * @param {number} data.salary - Employee salary.
 * @param {Date} data.hireDate - Employee hire date.
 * @param {number} data.createdBy - User ID who created the employee.
 * @returns {Promise<Object>} Created employee.
 */
export const createEmployee = async (data) => {
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
 * @param {string} [data.position] - Employee position.
 * @param {number} [data.salary] - Employee salary.
 * @param {number} data.updatedBy - User ID who updated the employee.
 * @returns {Promise<Object>} Updated employee.
 */
export const updateEmployeeById = async (id, data) => {
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
export const deleteEmployeeById = async (id) => {
  return deleteEmployeeByIdDao(Number(id));
};
