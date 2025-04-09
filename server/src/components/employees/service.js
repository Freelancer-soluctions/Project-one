import {
  getAllEmployees as getAllEmployeesDao,
  createEmployee as createEmployeeDao,
  updateEmployeeById as updateEmployeeByIdDao,
  deleteEmployeeById as deleteEmployeeByIdDao
} from './dao.js'

/**
 * Get all employees with optional filters
 * @param {Object} filters - Optional filters for the query
 * @returns {Promise<Array>} List of employees
 */
export const getAllEmployees = async (filters) => {
  return getAllEmployeesDao(filters)
}

/**
 * Create a new employee
 * @param {Object} data - Employee data
 * @returns {Promise<Object>} Created employee
 */
export const createEmployee = async (data) => {
  const dataEmployee = {
    ...data,
    createdOn: new Date()
  }
  return createEmployeeDao(dataEmployee)
}

/**
 * Update an employee by ID
 * @param {number} id - Employee ID
 * @param {Object} data - Updated employee data
 * @returns {Promise<Object>} Updated employee
 */
export const updateEmployeeById = async (id, data) => {
  const dataEmployee = {
    ...data,
    updatedOn: new Date()
  }
  return updateEmployeeByIdDao(Number(id), dataEmployee)
}

/**
 * Delete an employee by ID
 * @param {number} id - Employee ID
 * @returns {Promise<Object>} Deleted employee
 */
export const deleteEmployeeById = async (id) => {
  return deleteEmployeeByIdDao(Number(id))
}
