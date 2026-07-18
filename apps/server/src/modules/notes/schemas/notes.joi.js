import Joi from 'joi';

/**
 * Validation schema for filtering notes.
 * 
 * @property {string} searchTerm - Search term for filtering notes (optional, min 1, max 150 chars)
 * @property {string} statusCode - Status code filter (optional, min 3, max 3 chars)
 * @property {number|number[]} [hashtagId] - Hashtag ID or array of IDs to filter by (optional)
 * @property {'mine'|'mixed'} [scope] - Scope filter for notes visibility (optional, default: 'mine')
 */
export const NotesFilters = Joi.object({
  searchTerm: Joi.string().min(1).max(100).allow(''),
  statusCode: Joi.string().min(3).max(3).allow(''),
  hashtagId: Joi.alternatives().try(
    Joi.number().integer(),
    Joi.array().items(Joi.number().integer())
  ).optional(),
  isFavorite: Joi.boolean().optional(),
   scope: Joi.string().valid('mine', 'mixed').default('mine').optional(),
});

/**
 * Validation schema for creating a new note.
 * 
 * @property {string} title - Note title (required, max 50 chars)
 * @property {string} content - Note content (required, max 2000 chars)
 * @property {number} columnId - Column/status ID (required)
 * @property {number[]} [hashtagIds] - Hashtag IDs to associate (optional, max 20)
 */
export const NoteCreate = Joi.object({
  title: Joi.string().max(50).required(),
  content: Joi.string().max(2000).required(),
  columnId: Joi.number().integer().required(),
  hashtagIds: Joi.array().items(Joi.number().integer()).max(20).optional(),
  isFavorite: Joi.boolean().optional(),
});

/**
 * Validation schema for updating an existing note (PATCH).
 * All fields are optional, at least one field must be provided.
 */
export const NoteUpdate = Joi.object({
  title: Joi.string().max(50).optional(),
  content: Joi.string().max(2000).optional(),
  columnId: Joi.number().integer().optional(),
  hashtagIds: Joi.array().items(Joi.number().integer()).max(20).optional(),
  isFavorite: Joi.boolean().optional(),
}).min(1);

/**
 * Validation schema for updating a note's column/status.
 * 
 * @property {number} id - Note ID (required)
 * @property {number} columnId - New column/status ID (required)
 */
export const NoteColumnUpdate = Joi.object({
  id: Joi.number().required(),
  columnId: Joi.number().integer().required(),
});

/**
 * Validation schema for creating a new hashtag.
 * 
 * @property {string} name - Hashtag name (required, max 50 chars, trimmed)
 */
export const CreateHashtagSchema = Joi.object({
  name: Joi.string().max(50).required().trim(),
});

/**
 * Validation schema for updating an existing hashtag (PATCH).
 * All fields are optional, at least one field must be provided.
 */
export const HashtagUpdateSchema = Joi.object({
  name: Joi.string().max(50).optional().trim(),
}).min(1);