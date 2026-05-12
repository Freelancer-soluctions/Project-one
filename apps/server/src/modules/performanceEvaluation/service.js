import {
  getAllPerformanceEvaluations as getAllPerformanceEvaluationsDao,
  createPerformanceEvaluation as createPerformanceEvaluationDao,
  updatePerformanceEvaluationById as updatePerformanceEvaluationByIdDao,
  deletePerformanceEvaluationById as deletePerformanceEvaluationByIdDao,
} from './dao.js';
import { getSafePagination } from '../../utils/pagination/pagination.js';

/**
 * Get all performance evaluations with optional filters.
 *
 * @param {Object} filters - Optional filters for the query.
 * @param {number} [filters.page] - Page number for pagination.
 * @param {number} [filters.limit] - Number of items per page.
 * @param {number} [filters.employeeId] - Filter by employee ID.
 * @param {string} [filters.period] - Filter by evaluation period.
 * @param {string} [filters.status] - Filter by evaluation status.
 * @returns {Promise<Object>} Paginated list of performance evaluations with metadata.
 * @throws {Error} When pagination parameters are missing or invalid.
 */
export const getAllPerformanceEvaluations = async (filters) => {
  const { take, skip } = getSafePagination({
    page: filters.page,
    limit: filters.limit,
  });

  if (!take || take <= 0) {
    throw new Error('Pagination is required');
  }
  return await getAllPerformanceEvaluationsDao(filters, take, skip);
};

/**
 * Create a new performance evaluation.
 *
 * @param {Object} data - Performance evaluation data.
 * @param {number} data.employeeId - Employee ID.
 * @param {string} data.period - Evaluation period (e.g., "2024-Q1").
 * @param {number} data.rating - Overall rating (1-5).
 * @param {string} data.status - Evaluation status (DRAFT, SUBMITTED, APPROVED, REJECTED).
 * @param {string} data.comments - Evaluation comments.
 * @param {Date} data.date - Evaluation date.
 * @param {number} userId - User ID who created the evaluation.
 * @returns {Promise<Object>} Created performance evaluation.
 */
export const createPerformanceEvaluation = async (data, userId) => {
  const evaluationData = {
    ...data,
    createdOn: new Date(),
    date: new Date(data.date),
    createdBy: userId,
  };
  return createPerformanceEvaluationDao(evaluationData);
};

/**
 * Update a performance evaluation by ID.
 *
 * @param {number} id - Performance evaluation ID.
 * @param {Object} data - Updated performance evaluation data.
 * @param {number} [data.rating] - Overall rating (1-5).
 * @param {string} [data.status] - Evaluation status (DRAFT, SUBMITTED, APPROVED, REJECTED).
 * @param {string} [data.comments] - Evaluation comments.
 * @param {Date} data.date - Evaluation date.
 * @param {number} userId - User ID who updated the evaluation.
 * @returns {Promise<Object>} Updated performance evaluation.
 */
export const updatePerformanceEvaluationById = async (id, data, userId) => {
  const evaluationData = {
    ...data,
    updatedOn: new Date(),
    date: new Date(data.date),
    updatedBy: userId,
  };
  return updatePerformanceEvaluationByIdDao(Number(id), evaluationData);
};

/**
 * Delete a performance evaluation by ID.
 *
 * @param {number} id - Performance evaluation ID.
 * @returns {Promise<Object>} Deleted performance evaluation.
 */
export const deletePerformanceEvaluationById = async (id) => {
  return deletePerformanceEvaluationByIdDao(Number(id));
};
