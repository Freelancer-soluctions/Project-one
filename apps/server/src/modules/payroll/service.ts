import * as payrollDao from './dao.js';
import { getSafePagination } from '../../utils/pagination/pagination.js';

/**
 * Get all payroll records with optional filters.
 *
 * @param {Object} filters - Optional filters for the query.
 * @param {number} [filters.page] - Page number for pagination.
 * @param {number} [filters.limit] - Number of items per page.
 * @param {number} [filters.employeeId] - Filter by employee ID.
 * @param {string} [filters.period] - Filter by payroll period.
 * @param {string} [filters.status] - Filter by payroll status.
 * @returns {Promise<Object>} Paginated list of payroll records with metadata.
 * @throws {Error} When pagination parameters are missing or invalid.
 */
export const getAllPayroll = async (filters) => {
  const { take, skip } = getSafePagination({
    page: filters.page,
    limit: filters.limit,
  });

  if (!take || take <= 0) {
    throw new Error('Pagination is required');
  }
  return await payrollDao.getAllPayroll(filters, take, skip);
};

/**
 * Create a new payroll record.
 *
 * @param {Object} data - Payroll data.
 * @param {number} data.employeeId - Employee ID.
 * @param {string} data.period - Payroll period (e.g., "2024-01").
 * @param {number} data.baseSalary - Base salary amount.
 * @param {number} data.extraHours - Extra hours amount.
 * @param {number} data.deductions - Total deductions.
 * @param {number} data.totalPayment - Total payment amount.
 * @param {string} data.status - Payroll status (DRAFT, PAID, CANCELLED).
 * @param {number} userId - User ID who created the payroll.
 * @returns {Promise<Object>} Created payroll record.
 */
export const createPayroll = async (data, userId) => {
  const payroll = {
    ...data,
    baseSalary: String(data.baseSalary),
    extraHours: String(data.extraHours),
    deductions: String(data.deductions),
    totalPayment: String(data.totalPayment),
    createdOn: new Date(),
    createdBy: userId,
  };
  return await payrollDao.createPayroll(payroll);
};

/**
 * Delete a payroll record by ID.
 *
 * @param {number} id - Payroll ID.
 * @returns {Promise<Object>} Deleted payroll record.
 */
export const deletePayrollById = async (id) => {
  return await payrollDao.deletePayrollById(Number(id));
};

/**
 * Partially update a payroll record by ID.
 *
 * @param {number} id - Payroll ID.
 * @param {Object} data - Partial payroll data to update.
 * @param {number} userId - ID of the user performing the update.
 * @returns {Promise<Object>} Updated payroll record.
 */
export const updatePayrollByIdPartial = async (id, data, userId) => {
  const payroll = {
    ...data,
    updatedOn: new Date(),
    updatedBy: userId,
  };
  return await payrollDao.updatePayrollById(id, payroll);
};
