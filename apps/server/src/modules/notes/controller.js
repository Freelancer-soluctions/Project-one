import globalResponse from '../../utils/responses&Errors/globalResponse.js';
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js';
import * as notesService from './service.js';

/**
 * Get all notes with optional filtering by search term, status code, hashtag IDs, and scope.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.safeQuery - Validated query parameters.
 * @param {string} [req.safeQuery.searchTerm] - Filter notes by title or content.
 * @param {number} [req.safeQuery.statusCode] - Filter notes by column status code.
  * @param {string|string[]} [req.safeQuery.hashtagId] - Filter notes by hashtag ID(s).
  * @param {'mine'|'mixed'} [req.safeQuery.scope] - Scope filter for notes visibility.
  * @param {Object} res - Express response object.
 * @returns {Promise<void>} Responds with 200 and filtered notes array.
 */
export const getAllNotes = handleCatchErrorAsync(async (req, res) => {
  const { searchTerm, statusCode, hashtagId, isFavorite, scope } = req.safeQuery;
  const userId = req.userId;
  const hashtagIds = hashtagId
    ? Array.isArray(hashtagId) ? hashtagId : [hashtagId]
    : undefined;
  const items = await notesService.getAllNotes(searchTerm, statusCode, hashtagIds, userId, isFavorite, scope);
  globalResponse(res, 200, items);
});

/**
 * Create a new note with optional mentions and hashtag associations.
 *
 * @param {Object} req - Express request object.
 * @param {number} req.userId - Authenticated user ID from token.
 * @param {Object} req.body - Validated note data.
 * @param {string} req.body.title - Note title.
 * @param {string} [req.body.content] - Note content (plain text).
 * @param {number} req.body.columnId - Column/status ID for the note.
 * @param {number[]} [req.body.hashtagIds] - Hashtag IDs to associate.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Responds with 201 and created note.
 */
export const createNote = handleCatchErrorAsync(async (req, res) => {
  const userId = req.userId;
  const { body } = req;
  const createdNote = await notesService.createNote(body, userId);
  globalResponse(res, 201, createdNote, 'Item created successfully');
});

/**
 * Get all available note columns (statuses).
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Responds with 200 and columns array.
 */
export const getAllNotesColumns = handleCatchErrorAsync(async (req, res) => {
  const data = await notesService.getAllNotesColumns();
  globalResponse(res, 200, data);
});

/**
 * Update a note's column ID and/or color (drag-and-drop).
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.body - Update payload.
 * @param {number} req.body.id - Note ID.
 * @param {number} req.body.columnId - New column ID.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Responds with 200 and success message.
 */
export const updateNoteColumId = handleCatchErrorAsync(async (req, res) => {
  const { body } = req;
  await notesService.updateNoteColumId(body);
  globalResponse(res, 200, { message: 'Item updated successfully' });
});

/**
 * Update a note by ID (title, content, mentions, hashtags).
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.params - URL parameters.
 * @param {string} req.params.id - Note ID.
 * @param {Object} req.body - Update payload.
 * @param {string} [req.body.title] - New title.
 * @param {string} [req.body.content] - New content.
 * @param {number[]} [req.body.hashtagIds] - Hashtag IDs to re-associate.
 * @param {number} req.userId - Authenticated user ID.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Responds with 200 and success message.
 */
export const updateNoteById = handleCatchErrorAsync(async (req, res) => {
  const { body } = req;
  const { id } = req.params;
  const userId = req.userId;
  await notesService.updateNoteById(id, body, userId);
  globalResponse(res, 200, { message: 'Item updated successfully' });
});

/**
 * Get all mentions for a specific note.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.params - URL parameters.
 * @param {string} req.params.id - Note ID.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Responds with 200 and mentions array.
 */
export const getMentionsByNoteId = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params;
  const data = await notesService.getMentionsByNoteId(id);
  globalResponse(res, 200, data);
});

/**
 * Delete a note by ID.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.params - URL parameters.
 * @param {string} req.params.id - Note ID to delete.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Responds with 200 and success message.
 */
export const deleteById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params;
  await notesService.deleteById(id);
  globalResponse(res, 200, { message: 'Item deleted successfully' });
});

/**
 * Get total count of all notes with optional scope filter.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.safeQuery - Validated query parameters.
 * @param {'mine'|'mixed'} [req.safeQuery.scope] - Scope filter for notes visibility.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Responds with 200 and count object.
 */
export const getAllNotesCount = handleCatchErrorAsync(async (req, res) => {
  const { scope } = req.safeQuery;
  const userId = req.userId;
  const data = await notesService.getAllNotesCount(scope, userId);
  globalResponse(res, 200, data);
});

// ============================================================
// FAVORITE HANDLERS
// ============================================================

/**
 * Toggle favorite status for a note (PATCH /notes/:id/fav).
 *
 * @param {Object} req - Express request object.
 * @param {number} req.userId - Authenticated user ID.
 * @param {Object} req.params - URL parameters.
 * @param {number} req.params.id - Note ID.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Responds with 200 and new favorite state.
 */
export const toggleFavorite = handleCatchErrorAsync(async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  const result = await notesService.toggleFavorite(userId, Number(id));
  globalResponse(res, 200, result);
});

// ============================================================
// HASHTAG HANDLERS
// ============================================================

/**
 * Get all hashtags ordered by name ascending.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Responds with 200 and hashtags array (each includes note count).
 */
export const getAllHashtags = handleCatchErrorAsync(async (req, res) => {
  const data = await notesService.getAllHashtags();
  globalResponse(res, 200, data);
});

/**
 * Create a new hashtag.
 *
 * @param {Object} req - Express request object.
 * @param {number} req.userId - Authenticated user ID (creator).
 * @param {Object} req.body - Request body.
 * @param {string} req.body.name - Hashtag name (unique).
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Responds with 201 and created hashtag.
 */
export const createHashtag = handleCatchErrorAsync(async (req, res) => {
  const userId = req.userId;
  const { name } = req.body;
  const hashtag = await notesService.createHashtag(name, userId);
  globalResponse(res, 201, hashtag, 'Hashtag created successfully');
});

/**
 * Update a hashtag name by ID.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.params - URL parameters.
 * @param {string} req.params.id - Hashtag ID.
 * @param {Object} req.body - Request body.
 * @param {string} req.body.name - New hashtag name.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Responds with 200 and updated hashtag.
 */
export const updateHashtag = handleCatchErrorAsync(async (req, res) => {
  const { name } = req.body;
  const { id } = req.params;
  const hashtag = await notesService.updateHashtag(id, name);
  globalResponse(res, 200, hashtag, 'Hashtag updated successfully');
});

/**
 * Delete a hashtag by ID (cascades note_hashtags relations).
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.params - URL parameters.
 * @param {string} req.params.id - Hashtag ID to delete.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Responds with 200 and success message.
 */
export const deleteHashtag = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params;
  await notesService.deleteHashtag(id);
  globalResponse(res, 200, { message: 'Hashtag deleted successfully' });
});
