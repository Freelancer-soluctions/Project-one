import { prisma } from '../../config/db.js';
import * as notesDao from './dao.js';

/**
 * Parses the content to extract mentions using @username pattern.
 *
 * @param {string} content - The content to parse for mentions.
 * @returns {Array} An array of objects containing username and position information.
 */
export const parseMentions = (content) => {
  if (!content) return [];

  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push({
      username: match[1],
      positionStart: match.index,
      positionEnd: match.index + match[0].length,
    });
  }

  return mentions;
};

/**
 * Finds a user by their name (case-insensitive).
 *
 * @param {string} username - The username to search for.
 * @returns {Promise<Object|null>} The user object if found, null otherwise.
 */
export const findUserByName = async (username) => {
  return await prisma.users.findFirst({
    where: {
      name: {
        equals: username,
        mode: 'insensitive',
      },
    },
    select: { id: true, name: true },
  });
};

/**
 * Process mentions when creating or updating a note.
 *
 * @param {string} content - The note content to parse.
 * @param {number} noteId - The ID of the note.
 * @param {number} mentionedByUserId - The ID of the user who created the mention.
 * @returns {Promise<{hasMentions: boolean, mentionsCount: number}>} Result of processing.
 */
export const processMentions = async (content, noteId, mentionedByUserId) => {
  const parsedMentions = parseMentions(content);

  if (parsedMentions.length === 0) {
    return { hasMentions: false, mentionsCount: 0 };
  }

  // Delete existing mentions for the note (for updates)
  await prisma.mentions.deleteMany({
    where: { noteId },
  });

  // Process each mention
  const mentionsData = [];
  for (const mention of parsedMentions) {
    const user = await findUserByName(mention.username);
    if (user) {
      mentionsData.push({
        noteId,
        mentionedUserId: user.id,
        mentionedByUserId,
        positionStart: mention.positionStart,
        positionEnd: mention.positionEnd,
      });
    }
  }

  if (mentionsData.length > 0) {
    await prisma.mentions.createMany({
      data: mentionsData,
    });
  }

  return {
    hasMentions: mentionsData.length > 0,
    mentionsCount: mentionsData.length,
  };
};

/**
 * Get all notes from the database with optional filters.
 *
 * @param {Object} params - The parameters for filtering the news.
 * @param {string} params.searchTerm - The searchTerm filter.
 * @param {string} params.statusCode - The statusCode filter.

 * @returns {Promise<Array>} A list of news items matching the filters.
 */
export const getAllNotes = async (searchTerm, statusCode) => {
  const data = await notesDao.getAllNotes(searchTerm, statusCode);
  return data;
};

/**
 * Create a new notes item in the database.
 *
 * @param {Object} data - The data for the new notes item.
 * @param {string} data.title - The description of the notes item.
 * @param {string} data.createdOn - The date of the notes item.
 * @param {string} data.content - The description of the notes item.
 * @param {string} data.color - The description of the notes item.
 * @param {number} data.columnId - The ID of the status for the notes item.
 * @returns {Promise<Object>} The created notes item.
 */
export const createNote = async (data, userId) => {
  const { columnId, ...dataWithOutForeignKeys } = data;
  dataWithOutForeignKeys.createdOn = new Date();

  const createdNote = await notesDao.createNote(
    dataWithOutForeignKeys,
    Number(userId),
    Number(columnId)
  );

  // Process mentions after note creation
  if (data.content) {
    const { hasMentions } = await processMentions(
      data.content,
      createdNote.id,
      Number(userId)
    );

    // Update hasMentions field if mentions were found
    if (hasMentions) {
      await notesDao.updateNoteById(createdNote.id, { hasMentions: true });
    }
  }

  return createdNote;
};

/**
 * Get all available notes columns from the database.
 *
 * @returns {Promise<Array>} A list of all notes columns.
 */

export const getAllNotesColumns = async () => {
  const data = await notesDao.getAllNotesColumns();
  return data;
};

/**
 * Update an existing column item in the database by its ID.
 *
 * @param {Object} data - The updated data for the notes item.
 * @param {number} data.id - The ID of the notes item to update.
 * @param {number} data.columnId - The ID of the column note item to update.
 * @param {string} data.color - The column color of the note item.
 * @returns {Promise<Object>} The updated notes item.
 */
export const updateNoteColumId = async (data) => {
  data.updatedOn = new Date();
  const { id, ...newdata } = data;
  return notesDao.updateNoteColumId(id, newdata);
};

/**
 * Update an existing column item in the database by its ID.
 *
 * @param {Object} data - The updated data for the notes item.
 * @param {number} id - The ID of the notes item to update.
 * @param {number} data.title - The ID of the column note item to update.
 * @param {string} data.content - The column color of the note item.
 * @returns {Promise<Object>} The updated notes item.
 */
export const updateNoteById = async (id, data, userId) => {
  data.updatedOn = new Date();
  await notesDao.updateNoteById(Number(id), data);

  // Process mentions if content was updated
  if (data.content !== undefined) {
    const { hasMentions } = await processMentions(
      data.content,
      Number(id),
      Number(userId)
    );

    // Update hasMentions field
    await notesDao.updateNoteById(Number(id), { hasMentions });
  }

  return { message: 'Item updated successfully' };
};

/**
 * Delete a note item from the database by its ID.
 *
 * @param {number} id - The ID of the note item to delete.
 * @returns {Promise<Object>} The result of the deletion.
 */
export const deleteById = async (id) => {
  const rowId = Number(id);
  return notesDao.deleteRow(rowId);
};

/**
 * Get all number of  notes from the database.
 *
 * @returns {Promise<Array>} A list of all notes columns number.
 */

export const getAllNotesCount = async () => {
  const data = await notesDao.getAllNotesCount();
  return data;
};

/**
 * Get all mentions for a specific note.
 *
 * @param {number} noteId - The ID of the note to get mentions for.
 * @returns {Promise<Array>} A list of mentions for the note.
 */
export const getMentionsByNoteId = async (noteId) => {
  return await notesDao.getMentionsByNoteId(Number(noteId));
};
