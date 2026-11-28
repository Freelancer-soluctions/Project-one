import {
  getAllPositions as getAllPositionsService,
  createPosition as createPositionService,
  updatePositionById as updatePositionByIdService,
  deletePositionById as deletePositionByIdService,
  getPositionOptions as getPositionOptionsService,
} from './service.js';
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js';
import globalResponse from '../../utils/responses&Errors/globalResponse.js';
import type {
  CreatePositionInput,
  PositionFilters,
  UpdatePositionInput,
} from './types.js';

/**
 * Get all positions with optional filters.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.safeQuery - Safe query parameters with filters.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Returns paginated list of positions.
 */
export const getAllPositions = handleCatchErrorAsync(async (req, res) => {
  const filters = req.safeQuery as PositionFilters;
  const positions = await getAllPositionsService(filters);
  globalResponse(res, 200, positions);
});

/**
 * Create a new position.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - Request body containing position data.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Creates the position and returns it.
 */
export const createPosition = handleCatchErrorAsync(async (req, res) => {
  const body = req.body as CreatePositionInput;
  const position = await createPositionService(body);
  globalResponse(res, 201, position);
});

/**
 * Update a position by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters.
 * @param {string} req.params.id - Position ID from URL.
 * @param {Object} req.body - Request body containing position data to update.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Updates the position and returns it.
 */
export const updatePositionById = handleCatchErrorAsync(async (req, res) => {
  const body = req.body as UpdatePositionInput;
  const position = await updatePositionByIdService(
    Number(req.params['id']),
    body
  );
  globalResponse(res, 200, position);
});

/**
 * Delete a position by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters.
 * @param {string} req.params.id - Position ID from URL.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Deletes the position and returns a confirmation.
 */
export const deletePositionById = handleCatchErrorAsync(async (req, res) => {
  await deletePositionByIdService(Number(req.params['id']));
  globalResponse(res, 200, { message: 'Position deleted successfully' });
});

/**
 * All positions as `{ id, name }` for select inputs.
 *
 * @param {Object} _req - The HTTP request object (unused).
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Returns the full options list.
 */
export const getPositionOptions = handleCatchErrorAsync(async (_req, res) => {
  const options = await getPositionOptionsService();
  globalResponse(res, 200, options);
});
