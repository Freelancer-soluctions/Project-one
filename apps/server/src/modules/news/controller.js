import globalResponse from '../../utils/responses&Errors/globalResponse.js';
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js';
import * as newsService from './service.js';

/**
 * Get all news with query parameters.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response containing the news items.
 */
export const getAllNews = handleCatchErrorAsync(async (req, res) => {
  const queryParams = req.safeQuery;
  const items = await newsService.getAllNews(queryParams);
  globalResponse(res, 200, items);
});

/**
 * Create a news item.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response confirming the creation of the news item.
 */
export const createNew = handleCatchErrorAsync(async (req, res) => {
  const userId = req.userId; // viene del token cambiar al body
  const { body } = req;
  await newsService.createNew(userId, body);
  globalResponse(res, 201, { message: 'Item created successfully' });
});

/**
 * Update a news item by its ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response confirming the update of the news item.
 */
export const updateById = handleCatchErrorAsync(async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  const { body } = req;
  await newsService.updateById(userId, id, body);
  globalResponse(res, 200, { message: 'Item updated successfully' });
});

/**
 * Delete a news item by its ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response confirming the deletion of the news item.
 */
export const deleteById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params;
  await newsService.deleteById(id);
  globalResponse(res, 200, { message: 'Item deleted successfully' });
});

/**
 * Get the status of all news items.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response containing the status of all news items.
 */
export const getAllNewsStatus = handleCatchErrorAsync(async (req, res) => {
  const data = await newsService.getAllNewsStatus();
  globalResponse(res, 200, data);
});
