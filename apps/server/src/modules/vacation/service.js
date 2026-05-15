import {
  getAllVacation as getAllVacationDao,
  createVacation as createVacationDao,
  updateVacationById as updateVacationByIdDao,
  deleteVacationById as deleteVacationByIdDao,
} from './dao.js';
import { getSafePagination } from '../../utils/pagination/pagination.js';

/**
 * Get all vacation records with optional filters.
 *
 * @param {Object} filters - Filter criteria for vacation records.
 * @param {number} [filters.page] - Page number for pagination.
 * @param {number} [filters.limit] - Number of items per page.
 * @param {number} [filters.employeeId] - Filter by employee ID.
 * @param {string} [filters.status] - Filter by vacation status.
 * @param {Date} [filters.startDate] - Filter by start date.
 * @param {Date} [filters.endDate] - Filter by end date.
 * @returns {Promise<Object>} Paginated list of vacation records with metadata.
 * @throws {Error} When pagination parameters are missing or invalid.
 */
export const getAllVacation = async (filters) => {
  const { take, skip } = getSafePagination({
    page: filters.page,
    limit: filters.limit,
  });

  if (!take || take <= 0) {
    throw new Error('Pagination is required');
  }
  return await getAllVacationDao(filters, take, skip);
};

/**
 * Create a new vacation record.
 *
 * @param {Object} data - Vacation data to create.
 * @param {number} data.employeeId - Employee ID.
 * @param {Date} data.startDate - Vacation start date.
 * @param {Date} data.endDate - Vacation end date.
 * @param {string} data.type - Vacation type (ANNUAL, SICK, PERSONAL, UNPAID).
 * @param {string} data.status - Vacation status (PENDING, APPROVED, REJECTED, COMPLETED).
 * @param {string} data.reason - Reason for the vacation.
 * @returns {Promise<Object>} Created vacation record.
 */
export const createVacation = async (data) => {
  const vacation = {
    ...data,
    createdOn: new Date(),
  };
  return await createVacationDao(vacation);
};

/**
 * Update a vacation record by ID.
 *
 * @param {number} id - ID of the vacation record to update.
 * @param {Object} data - Updated vacation data.
 * @param {Date} [data.startDate] - Vacation start date.
 * @param {Date} [data.endDate] - Vacation end date.
 * @param {string} [data.type] - Vacation type (ANNUAL, SICK, PERSONAL, UNPAID).
 * @param {string} [data.status] - Vacation status (PENDING, APPROVED, REJECTED, COMPLETED).
 * @param {string} [data.reason] - Reason for the vacation.
 * @returns {Promise<Object>} Updated vacation record.
 */
export const updateVacationById = async (id, data) => {
  const vacation = {
    ...data,
    updatedOn: new Date(),
  };
  return await updateVacationByIdDao(id, vacation);
};

/**
 * Delete a vacation record by ID.
 *
 * @param {number} id - ID of the vacation record to delete.
 * @returns {Promise<Object>} Deleted vacation record.
 */
export const deleteVacationById = async (id) => {
  return await deleteVacationByIdDao(id);
};
