import {
  getAllPerformanceEvaluations as getAllPerformanceEvaluationsService,
  createPerformanceEvaluation as createPerformanceEvaluationService,
  updatePerformanceEvaluationById as updatePerformanceEvaluationByIdService,
  deletePerformanceEvaluationById as deletePerformanceEvaluationByIdService,
} from './service.js';
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js';
import globalResponse from '../../utils/responses&Errors/globalResponse.js';

/**
 * Get all performance evaluations with optional filters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllPerformanceEvaluations = handleCatchErrorAsync(
  async (req, res) => {
    const evaluations = await getAllPerformanceEvaluationsService(req.query);
    globalResponse(res, 200, evaluations);
  }
);

/**
 * Create a new performance evaluation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
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
 * Update a performance evaluation by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
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
 * Delete a performance evaluation by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deletePerformanceEvaluationById = handleCatchErrorAsync(
  async (req, res) => {
    const evaluation = await deletePerformanceEvaluationByIdService(
      req.params.id
    );
    globalResponse(res, 200, evaluation);
  }
);
