import globalResponse from '../../utils/responses&Errors/globalResponse.js';
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js';
import * as notesService from './service.js';

/**
 * Get all notes with optional filtering by search term and status code.
 * 
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.safeQuery - Validated query parameters.
 * @param {string} [req.safeQuery.searchTerm] - Optional search term to filter notes by title or content.
 * @param {number} [req.safeQuery.statusCode] - Optional status code to filter notes by their column's status.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a 200 response with the list of filtered notes.
 */
export const getAllNotes = handleCatchErrorAsync(async (req, res) => {
  const { searchTerm, statusCode } = req.safeQuery;
  const items = await notesService.getAllNotes(searchTerm, statusCode);
  globalResponse(res, 200, items);
});

/**
 * Create a new note item.
 * 
 * @param {Object} req - The HTTP request object.
 * @param {string} req.userId - Authenticated user ID from token.
 * @param {Object} req.body - Request body containing the note data.
 * @param {string} req.body.title - The title of the note.
 * @param {string} [req.body.content] - Optional content/description of the note.
 * @param {string} [req.body.color] - Optional color for the note (hex code or color name).
 * @param {number} [req.body.columnId] - Optional ID of the column to assign the note to.
 * @param {Array<number>} [req.body.mentions] - Optional array of user IDs mentioned in the note.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a 201 response with the created note and success message.
 */
export const createNote = handleCatchErrorAsync(async (req, res) => {
  const userId = req.userId; // viene del token
  const { body } = req;
  console.log("nota", body)
  const createdNote = await notesService.createNote(body, userId);
  globalResponse(res, 201, createdNote, 'Item created successfully');
});

/**
 * Get the status of all notes items.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response containing the status of all news items.
 */
export const getAllNotesColumns = handleCatchErrorAsync(async (req, res) => {
  const data = await notesService.getAllNotesColumns();
  globalResponse(res, 200, data);
});

/**
 * Update a note's column ID and/or color.
 * 
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - Request body containing the update data.
 * @param {number} req.body.id - The ID of the note to update.
 * @param {number} req.body.columnId - The new column ID to assign to the note.
 * @param {string} [req.body.color] - Optional new color for the note.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a 200 response with a success message.
 */
export const updateNoteColumId = handleCatchErrorAsync(async (req, res) => {
  const { body } = req;
  await notesService.updateNoteColumId(body);
  globalResponse(res, 200, { message: 'Item updated successfully' });
});

/**
 * Update a note by ID with new data.
 * 
 * @param {Object} req - The HTTP request object.
 * @param {string} req.userId - Authenticated user ID from token.
 * @param {Object} req.params - URL parameters.
 * @param {string} req.params.id - The ID of the note to update.
 * @param {Object} req.body - Request body containing the fields to update.
 * @param {string} [req.body.title] - Optional new title for the note.
 * @param {string} [req.body.content] - Optional new content for the note.
 * @param {string} [req.body.color] - Optional new color for the note.
 * @param {number} [req.body.columnId] - Optional new column ID for the note.
 * @param {Array<number>} [req.body.mentions] - Optional array of user IDs to mention.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a 200 response with a success message.
 */
export const updateNoteById = handleCatchErrorAsync(async (req, res) => {
  const { body } = req;
  const { id } = req.params;
  const userId = req.userId;
  await notesService.updateNoteById(id, body, userId);
  globalResponse(res, 200, { message: 'Item updated successfully' });
});

/**
 * Get all user mentions for a specific note by note ID.
 * 
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - URL parameters.
 * @param {string} req.params.id - The ID of the note to get mentions for.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a 200 response with the list of users mentioned in the note.
 */
export const getMentionsByNoteId = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params;
  const data = await notesService.getMentionsByNoteId(id);
  globalResponse(res, 200, data);
});

/**
 * Delete a note by ID.
 * 
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - URL parameters.
 * @param {string} req.params.id - The ID of the note to delete.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a 200 response with a success message.
 */
export const deleteById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params;
  await notesService.deleteById(id);
  globalResponse(res, 200, { message: 'Item deleted successfully' });
});

/**
 * Get the number of all notes items.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response containing the number of all news items.
 */
export const getAllNotesCount = handleCatchErrorAsync(async (req, res) => {
  const data = await notesService.getAllNotesCount();
  globalResponse(res, 200, data);
});
