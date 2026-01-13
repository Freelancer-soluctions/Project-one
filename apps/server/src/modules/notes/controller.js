import globalResponse from '../../utils/responses&Errors/globalResponse.js';
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js';
import * as notesService from './service.js';

/**
 * Get all
 *
 * @param {*} req
 * @param {*} res
 * @returns A message
 */
export const getAllNotes = handleCatchErrorAsync(async (req, res) => {
  const { searchTerm, statusCode } = req.query;
  const items = await notesService.getAllNotes(searchTerm, statusCode);
  globalResponse(res, 200, items);
});

/**
 * Create a note item.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response confirming the creation of the news item.
 */
export const createNote = handleCatchErrorAsync(async (req, res) => {
  const userId = req.userId; // viene del token
  const { body } = req;
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
 * Update column By ID
 *
 * @param {*} req
 * @param {*} res
 * @returns  a message
 */
export const updateNoteColumId = handleCatchErrorAsync(async (req, res) => {
  const { body } = req;
  await notesService.updateNoteColumId(body);
  globalResponse(res, 200, { message: 'Item updated successfully' });
});

/**
 * Update By ID
 *
 * @param {*} req
 * @param {*} res
 * @returns  a message
 */
export const updateNoteById = handleCatchErrorAsync(async (req, res) => {
  const { body } = req;
  const { id } = req.params;
  await notesService.updateNoteById(id, body);
  globalResponse(res, 200, { message: 'Item updated successfully' });
});

/**
 * Delete By ID
 *
 * @param {*} req
 * @param {*} res
 * @returns a message
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
