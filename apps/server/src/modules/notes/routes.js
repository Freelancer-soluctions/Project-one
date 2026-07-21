import { Router } from 'express';
import {
  NoteCreate,
  NoteColumnUpdate,
  NotesFilters,
  NoteUpdate,
  CreateHashtagSchema,
  HashtagUpdateSchema,
} from './schemas/notes.joi.js';
import * as noteController from './controller.js';
import {
  verifyToken,
  validateQueryParams,
  validateSchema,
  checkRoleAuthOrPermisssion,
  validatePathParam,
} from '../../middleware/index.js';
import { ROLESCODES } from '../../utils/constants/enums.js';

const router = Router();
// uso global de middleware
router.use(verifyToken);
router.use(
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER, ROLESCODES.USER],
  })
);

/**
 * @route GET /api/v1/notes
 * @description Get all notes with optional filters (searchTerm, statusCode, hashtagId)
 * @query {string} [searchTerm] - Search notes by title or content
 * @query {string} [statusCode] - Filter by column status code
 * @query {number|number[]} [hashtagId] - Filter by hashtag ID(s)
 * @returns {Array} 200 - Filtered notes grouped by column
 * @access Private
 */
router.get('/', validateQueryParams(NotesFilters), noteController.getAllNotes);

/**
 * @route POST /api/v1/notes
 * @description Create a new note with mentions and hashtags
 * @body {string} title - Note title
 * @body {string} content - Note content
 * @body {number} columnId - Column/status ID
 * @body {number[]} [hashtagIds] - Hashtag IDs to associate
 * @returns {Object} 201 - Created note
 * @access Private
 */
router.post('/', validateSchema(NoteCreate), noteController.createNote);

/**
 * @route GET /api/v1/notes/notesColumns
 * @description Get all note columns
 * @returns {Array} 200 - Array of note columns
 * @access Private
 */
router.get('/notesColumns', noteController.getAllNotesColumns);

/**
 * @route PATCH /api/v1/notes/notecolumn
 * @description Update a note's column (and compute color server-side)
 * @body {number} id - Note ID
 * @body {number} columnId - New column ID
 * @returns {Object} 200 - Updated note
 * @access Private
 */
router.patch(
  '/notecolumn',
  validateSchema(NoteColumnUpdate),
  noteController.updateNoteColumId
);

/**
 * @route PATCH /api/v1/notes/:id/fav
 * @description Toggle favorite status for a note
 * @path {number} id - Note ID
 * @returns {Object} 200 - New favorite state { isFavorited: boolean }
 * @access Private
 */
router.patch(
  '/:id/fav',
  validatePathParam,
  noteController.toggleFavorite
);

router.patch(
  '/:id',
  validatePathParam,
  validateSchema(NoteUpdate),
  noteController.updateNoteById
);

/**
 * @route DELETE /api/v1/notes/:id
 * @description Delete a note by ID
 * @path {number} id - Note ID
 * @returns {Object} 200 - Deletion confirmation
 * @access Private
 */
router.delete('/:id', validatePathParam, noteController.deleteById);

/**
 * @route GET /api/v1/notes/notesCount
 * @description Get count of notes grouped by column
 * @returns {Object} 200 - Count of notes per column ({ backlog, active, completed })
 * @access Private
 */
router.get('/notesCount', validateQueryParams(NotesFilters), noteController.getAllNotesCount);

/**
 * @route GET /api/v1/notes/:id/mentions
 * @description Get mentions for a specific note
 * @path {number} id - Note ID
 * @returns {Array} 200 - Array of mentions
 * @access Private
 */
// Get mentions for a specific note
router.get('/:id/mentions', validatePathParam, noteController.getMentionsByNoteId);

/**
 * @route GET /api/v1/notes/hashtags
 * @description Get all hashtags
 * @returns {Array} 200 - Array of hashtags
 * @access Private
 */
// Hashtag routes (within notes module)
router.get('/hashtags', noteController.getAllHashtags);

/**
 * @route POST /api/v1/notes/hashtags
 * @description Create a new hashtag
 * @body {string} name - Hashtag name
 * @returns {Object} 201 - Created hashtag
 * @access Private
 */
router.post('/hashtags', validateSchema(CreateHashtagSchema), noteController.createHashtag);

router.patch('/hashtags/:id', validatePathParam, validateSchema(HashtagUpdateSchema), noteController.updateHashtag);

/**
 * @route DELETE /api/v1/notes/hashtags/:id
 * @description Delete a hashtag by ID
 * @path {number} id - Hashtag ID
 * @returns {Object} 200 - Deletion confirmation
 * @access Private
 */
router.delete('/hashtags/:id', validatePathParam, noteController.deleteHashtag);

export default router;
