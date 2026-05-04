import {
  getAllPerformanceEvaluations as getAllPerformanceEvaluationsService,
  createPerformanceEvaluation as createPerformanceEvaluationService,
  updatePerformanceEvaluationById as updatePerformanceEvaluationByIdService,
  deletePerformanceEvaluationById as deletePerformanceEvaluationByIdService,
} from './service.js';
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js';
import globalResponse from '../../utils/responses&Errors/globalResponse.js';

/**
 * Get all performance evaluations with optional filters.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.safeQuery - Safe query parameters with filters
 * @param {number} [req.safeQuery.page] - Page number for pagination
 * @param {number} [req.safeQuery.limit] - Number of items per page
 * @param {number} [req.safeQuery.employeeId] - Filter by employee ID
 * @param {string} [req.safeQuery.period] - Filter by evaluation period
 * @param {string} [req.safeQuery.status] - Filter by evaluation status
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Returns paginated list of performance evaluations
 */
export const getAllPerformanceEvaluations = handleCatchErrorAsync(
  async (req, res) => {
    const evaluations = await getAllPerformanceEvaluationsService(
      req.safeQuery
    );
    globalResponse(res, 200, evaluations);
  }
);

/**
 * Create a new performance evaluation.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - Request body containing evaluation data
 * @param {number} req.body.employeeId - Employee ID
 * @param {string} req.body.period - Evaluation period (e.g., "2024-Q1")
 * @param {number} req.body.rating - Overall rating (1-5)
 * @param {string} req.body.status - Evaluation status (DRAFT, SUBMITTED, APPROVED, REJECTED)
 * @param {string} req.body.comments - Evaluation comments
 * @param {string} req.userId - Authenticated user ID from token verification
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Creates new performance evaluation and returns evaluation object
 */
export const createPerformanceEvaluation = handleCatchErrorAsync(
  async (req, res) => {
    const evaluation = await createPerformanceEvaluationService(
      {
        ...req.body,
      },
      req.userId
    );
    globalResponse(res, 201, evaluation);
  }
);

/**
 * Update a performance evaluation by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Performance evaluation ID from URL
 * @param {Object} req.body - Request body containing evaluation data to update
 * @param {number} [req.body.rating] - Overall rating (1-5)
 * @param {string} [req.body.status] - Evaluation status (DRAFT, SUBMITTED, APPROVED, REJECTED)
 * @param {string} [req.body.comments] - Evaluation comments
 * @param {string} req.userId - Authenticated user ID from token verification
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Updates performance evaluation and returns updated evaluation object
 */
export const updatePerformanceEvaluationById = handleCatchErrorAsync(
  async (req, res) => {
    const evaluation = await updatePerformanceEvaluationByIdService(
      req.params.id,
      {
        ...req.body,
      },
      req.userId
    );
    globalResponse(res, 200, evaluation);
  }
);

/**
 * Delete a performance evaluation by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Performance evaluation ID from URL
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Deletes performance evaluation and returns evaluation object
 */
export const deletePerformanceEvaluationById = handleCatchErrorAsync(
  async (req, res) => {
    const evaluation = await deletePerformanceEvaluationByIdService(
      req.params.id
    );
    globalResponse(res, 200, evaluation);
  }
);
