import globalResponse from '../../utils/responses&Errors/globalResponse.js';
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js';
import * as newsService from './service.js';
import type { CreateNewsInput, NewsFilters, UpdateNewsInput } from './types.js';

/**
 * Get all news with optional filters.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.safeQuery - Safe query parameters with filters
 * @param {number} [req.safeQuery.page] - Page number for pagination
 * @param {number} [req.safeQuery.limit] - Number of items per page
 * @param {string} [req.safeQuery.title] - Filter by news title
 * @param {string} [req.safeQuery.status] - Filter by news status
 * @param {Date} [req.safeQuery.startDate] - Filter by start date
 * @param {Date} [req.safeQuery.endDate] - Filter by end date
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Returns paginated list of news items
 */
export const getAllNews = handleCatchErrorAsync(async (req, res) => {
  // Cast único de la query validada por Joi (NewsFilters)
  const queryParams = req.safeQuery as NewsFilters;
  const items = await newsService.getAllNews(queryParams);
  globalResponse(res, 200, items);
});

/**
 * Create a news item.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - Request body containing news data
 * @param {string} req.body.title - News title
 * @param {string} req.body.content - News content
 * @param {string} req.body.status - News status (DRAFT, PUBLISHED, ARCHIVED)
 * @param {Date} req.body.publishDate - News publish date
 * @param {string} req.userId - Authenticated user ID from token verification
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Creates new news item and returns confirmation message
 */
export const createNew = handleCatchErrorAsync(async (req, res) => {
  const userId = req.userId; // viene del token cambiar al body
  // Cast único del body validado por Joi (NewsCreateSchema)
  const body = req.body as CreateNewsInput;
  await newsService.createNew(userId, body);
  globalResponse(res, 201, { message: 'Item created successfully' });
});

/**
 * Update a news item by its ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - News ID from URL
 * @param {Object} req.body - Request body containing news data to update
 * @param {string} [req.body.title] - News title
 * @param {string} [req.body.content] - News content
 * @param {string} [req.body.status] - News status (DRAFT, PUBLISHED, ARCHIVED)
 * @param {Date} [req.body.publishDate] - News publish date
 * @param {string} req.userId - Authenticated user ID from token verification
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Updates news item and returns confirmation message
 */
export const updateById = handleCatchErrorAsync(async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  // Cast único del body validado por Joi (NewsUpdate)
  const body = req.body as UpdateNewsInput;
  await newsService.updateById(userId, id, body);
  globalResponse(res, 200, { message: 'Item updated successfully' });
});

/**
 * Delete a news item by its ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - News ID from URL
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Deletes news item and returns confirmation message
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
 * @returns {Promise<void>} Returns list of news status values
 */
export const getAllNewsStatus = handleCatchErrorAsync(async (req, res) => {
  const data = await newsService.getAllNewsStatus();
  globalResponse(res, 200, data);
});
