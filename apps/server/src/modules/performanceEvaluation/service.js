import {
  getAllPerformanceEvaluations as getAllPerformanceEvaluationsDao,
  createPerformanceEvaluation as createPerformanceEvaluationDao,
  updatePerformanceEvaluationById as updatePerformanceEvaluationByIdDao,
  deletePerformanceEvaluationById as deletePerformanceEvaluationByIdDao,
} from './dao.js';
import { getSafePagination } from '../../utils/pagination/pagination.js';

/**
 * Get all performance evaluations with optional filters
 * @param {Object} filters - Optional filters for the query
 * @returns {Promise<Array>} List of performance evaluations
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
 * Create a new performance evaluation
 * @param {Object} data - Performance evaluation data
 * @returns {Promise<Object>} Created performance evaluation
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
 * Update a performance evaluation by ID
 * @param {number} id - Performance evaluation ID
 * @param {Object} data - Updated performance evaluation data
 * @returns {Promise<Object>} Updated performance evaluation
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
 * Delete a performance evaluation by ID
 * @param {number} id - Performance evaluation ID
 * @returns {Promise<Object>} Deleted performance evaluation
 */
export const deletePerformanceEvaluationById = async (id) => {
  return deletePerformanceEvaluationByIdDao(Number(id));
};
