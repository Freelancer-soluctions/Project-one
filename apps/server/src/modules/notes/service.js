import { prisma } from '../../config/db.js';
import * as notesDao from './dao.js';
import { extractMentionIds } from './utils/mentionParser.js';

/**
 * Get all notes with optional filters.
 *
 * @param {string} [searchTerm] - Filter notes by title or content (partial match).
 * @param {string} [statusCode] - Filter by column status code.
 * @param {number[]} [hashtagIds] - Filter by hashtag IDs (notes matching ANY).
 * @returns {Promise<Array>} Filtered notes array.
 */
export const getAllNotes = async (searchTerm, statusCode, hashtagIds) => {
  const data = await notesDao.getAllNotes(searchTerm, statusCode, hashtagIds);
  return data;
};

/**
 * Create a new note with mentions and hashtag associations.
 *
 * @param {Object} data - Note creation payload.
 * @param {string} data.title - Note title.
 * @param {string} [data.content] - Note content.
 * @param {string} [data.color] - Note color.
 * @param {number} data.columnId - Column/status ID.
 * @param {number[]} [data.hashtagIds] - Hashtag IDs to associate.
 * @param {number} userId - Authenticated user ID.
 * @returns {Promise<Object>} Created note.
 */
export const createNote = async (data, userId) => {
  const { columnId, hashtagIds, ...dataWithOutForeignKeys } = data;
  dataWithOutForeignKeys.createdOn = new Date();

  const createdNote = await notesDao.createNote(
    dataWithOutForeignKeys,
    Number(userId),
    Number(columnId)
  );

  if (dataWithOutForeignKeys.content) {
    const mentionsId = await extractMentionIds(dataWithOutForeignKeys.content);
    if (mentionsId.length > 0) {
      const mentionsData = [];
      for (const mention of mentionsId) {
        mentionsData.push({
          noteId: createdNote.id,
          mentionedUserId: mention.id,
          mentionedByUserId: Number(userId),
          createdOn: new Date()
        });
      }
      if (mentionsData.length > 0) {
        await notesDao.saveNoteMentions(mentionsData);
        await notesDao.updateNoteById(createdNote.id, { hasMentions: true });
      }
    }
  }

  if (hashtagIds && hashtagIds.length > 0) {
    await notesDao.syncNoteHashtags(createdNote.id, hashtagIds);
  }

  return createdNote;
};

/**
 * Get all note columns (statuses).
 *
 * @returns {Promise<Array>} Columns array.
 */
export const getAllNotesColumns = async () => {
  const data = await notesDao.getAllNotesColumns();
  return data;
};

/**
 * Update a note's column assignment (drag-and-drop).
 *
 * @param {Object} data - Update payload.
 * @param {number} data.id - Note ID.
 * @param {number} data.columnId - New column ID.
 * @param {string} [data.color] - New color.
 * @returns {Promise<Object>} Updated note.
 */
export const updateNoteColumId = async (data) => {
  data.updatedOn = new Date();
  const { id, ...newdata } = data;
  return notesDao.updateNoteColumId(id, newdata);
};

/**
 * Update a note by ID (title, content, mentions, hashtags).
 *
 * @param {string} id - Note ID.
 * @param {Object} data - Update payload.
 * @param {string} [data.title] - New title.
 * @param {string} [data.content] - New content (triggers mention re-sync).
 * @param {string} [data.color] - New color.
 * @param {number[]} [data.hashtagIds] - Hashtag IDs to re-associate.
 * @param {number} userId - Authenticated user ID.
 * @returns {Promise<Object>} Success message.
 */
export const updateNoteById = async (id, data, userId) => {
  const { hashtagIds, ...restData } = data;
  restData.updatedOn = new Date();
  await notesDao.updateNoteById(Number(id), restData);

  if (restData.content) {
    await notesDao.deleteMentionsByNoteId(Number(id));
    const mentionsId = await extractMentionIds(restData.content);
    if (mentionsId.length > 0) {
      const mentionsData = [];
      for (const mention of mentionsId) {
        mentionsData.push({
          noteId: Number(id),
          mentionedUserId: mention.id,
          mentionedByUserId: Number(userId),
          createdOn: new Date()
        });
      }
      if (mentionsData.length > 0) {
        await notesDao.saveNoteMentions(mentionsData);
        await notesDao.updateNoteById(Number(id), { hasMentions: true });
      }
    }
  }

  if (hashtagIds) {
    await notesDao.syncNoteHashtags(Number(id), hashtagIds);
  }

  return { message: 'Item updated successfully' };
};

/**
 * Delete a note by ID.
 *
 * @param {string} id - Note ID to delete.
 * @returns {Promise<Object>} Deletion result.
 */
export const deleteById = async (id) => {
  const rowId = Number(id);
  return notesDao.deleteRow(rowId);
};

/**
 * Get total count of all notes.
 *
 * @returns {Promise<number>} Notes count.
 */
export const getAllNotesCount = async () => {
  const data = await notesDao.getAllNotesCount();
  return data;
};

/**
 * Get all mentions for a specific note.
 *
 * @param {number} noteId - Note ID.
 * @returns {Promise<Array>} Mentions array.
 */
export const getMentionsByNoteId = async (noteId) => {
  return await notesDao.getMentionsByNoteId(Number(noteId));
};

// ============================================================
// HASHTAG SERVICE FUNCTIONS
// ============================================================

/**
 * Get all hashtags ordered by name ascending.
 *
 * @returns {Promise<Array>} Hashtags array with note count.
 */
export const getAllHashtags = async () => {
  return notesDao.getAllHashtags();
};

/**
 * Create a new hashtag.
 *
 * @param {string} name - Hashtag name (must be unique).
 * @param {number} userId - ID of the creating user.
 * @returns {Promise<Object>} Created hashtag.
 */
export const createHashtag = async (name, userId) => {
  return notesDao.createHashtag(name, userId);
};

/**
 * Update a hashtag name by ID.
 *
 * @param {string} id - Hashtag ID.
 * @param {string} name - New hashtag name.
 * @returns {Promise<Object>} Updated hashtag.
 */
export const updateHashtag = async (id, name) => {
  return notesDao.updateHashtag(Number(id), name);
};

/**
 * Delete a hashtag by ID. Cascades note_hashtags relations via Prisma.
 *
 * @param {string} id - Hashtag ID to delete.
 * @returns {Promise<Object>} Deletion result.
 */
export const deleteHashtag = async (id) => {
  return notesDao.deleteHashtag(Number(id));
};
