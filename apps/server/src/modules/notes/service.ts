import * as notesDao from './dao.js';
import { computeColorFromCode, extractMentionIds } from './utils/index.js';
import bus, { BUS_EVENTS } from '../../socket/notificationBus.js';
import ClientError from '../../utils/responses&Errors/errors.js';
import type {
  FavoriteToggleResult,
  NoteColumnRecord,
  NoteColumnUpdateInput,
  NoteColumnWithNotes,
  NoteCreateData,
  NoteCreateInput,
  NoteMentionData,
  NotesCount,
  NoteScope,
  NoteUpdateData,
  NoteUpdateInput,
} from './types.js';

/**
 * Get all notes with optional filters.
 *
 * @param {string} [searchTerm] - Filter notes by title or content (partial match).
 * @param {string} [statusCode] - Filter by column status code.
 * @param {number[]} [hashtagIds] - Filter by hashtag IDs (notes matching ANY).
 * @param {number} [userId] - Current user ID (for favorite filter and per-note status).
 * @param {boolean} [isFavorite] - If true, only return notes favorited by userId.
 * @returns {Promise<Array>} Filtered notes array.
 */
export const getAllNotes = async (
  searchTerm?: string,
  statusCode?: string,
  hashtagIds?: number[],
  userId?: number,
  isFavorite?: boolean,
  scope?: NoteScope
): Promise<NoteColumnWithNotes[]> => {
  const data = await notesDao.getAllNotes(
    searchTerm,
    statusCode,
    hashtagIds,
    userId,
    isFavorite,
    scope
  );
  return data;
};

/**
 * Create a new note with mentions and hashtag associations.
 * Self-mentions (where mentionedUserId === userId) are filtered out.
 *
 * @param {Object} data - Note creation payload.
 * @param {string} data.title - Note title.
 * @param {string} [data.content] - Note content.
 * @param {number} data.columnId - Column/status ID.
 * @param {number[]} [data.hashtagIds] - Hashtag IDs to associate.
 * @param {number} userId - Authenticated user ID.
 * @returns {Promise<Object>} Created note.
 */
export const createNote = async (
  data: NoteCreateInput,
  userId: number
): Promise<{ id: number; title: string }> => {
  const { columnId, hashtagIds, isFavorite, ...dataWithOutForeignKeys } = data;

  // Compute color from column
  const column = await notesDao.getColumnById(Number(columnId));

  const noteData: NoteCreateData = {
    ...dataWithOutForeignKeys,
    createdOn: new Date(),
    color: computeColorFromCode(column.code),
  };

  const createdNote = await notesDao.createNote(
    noteData,
    Number(userId),
    Number(columnId),
    isFavorite
  );

  if (noteData.content) {
    const mentionsId = await extractMentionIds(noteData.content);
    // Filter out self-mentions (don't create mentions for the user themselves)
    const filteredMentions = mentionsId.filter((m) => m.id !== Number(userId));
    if (filteredMentions.length > 0) {
      const mentionsData: NoteMentionData[] = [];
      for (const mention of filteredMentions) {
        mentionsData.push({
          noteId: createdNote.id,
          mentionedUserId: mention.id,
          mentionedByUserId: Number(userId),
          createdOn: new Date(),
        });
      }
      if (mentionsData.length > 0) {
        await notesDao.saveNoteMentions(mentionsData);
        await notesDao.updateNoteById(createdNote.id, { hasMentions: true });
        // Emitir evento al bus para cada mención (notificación en tiempo real)
        for (const mention of mentionsData) {
          bus.emit(BUS_EVENTS.MENTION_CREATED, {
            noteId: mention.noteId,
            noteTitle: createdNote.title,
            mentionedByUserId: mention.mentionedByUserId,
            mentionedUserId: mention.mentionedUserId,
            excerpt: (noteData.content || '').substring(0, 200),
          });
        }
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
export const getAllNotesColumns = async (): Promise<NoteColumnRecord[]> => {
  const data = await notesDao.getAllNotesColumns();
  return data;
};

/**
 * Update a note's column assignment (drag-and-drop).
 *
 * @param {Object} data - Update payload.
 * @param {number} data.id - Note ID.
 * @param {number} data.columnId - New column ID.
 * @returns {Promise<Object>} Updated note.
 */
export const updateNoteColumId = async (data: NoteColumnUpdateInput) => {
  const { id, columnId } = data;
  const column = await notesDao.getColumnById(Number(columnId));
  return notesDao.updateNoteColumId(Number(id), {
    columnId: Number(columnId),
    color: computeColorFromCode(column.code),
    updatedOn: new Date(),
  });
};

/**
 * Update a note by ID (title, content, mentions, hashtags).
 * Self-mentions (where mentionedUserId === userId) are filtered out when content is updated.
 *
 * @param {string} id - Note ID.
 * @param {Object} data - Update payload.
 * @param {string} [data.title] - New title.
 * @param {string} [data.content] - New content (triggers mention re-sync).
 * @param {number} [data.columnId] - New column ID (triggers color recomputation).
 * @param {number[]} [data.hashtagIds] - Hashtag IDs to re-associate.
 * @param {number} userId - Authenticated user ID.
 * @returns {Promise<Object>} Success message.
 */
export const updateNoteById = async (
  id: string,
  data: NoteUpdateInput,
  userId: number
): Promise<{ message: string }> => {
  const { hashtagIds, columnId, ...restData } = data;
  const dataToSave: NoteUpdateData = { ...restData };
  dataToSave.updatedOn = new Date();

  // If columnId changed, recompute color
  if (columnId) {
    const currentNote = await notesDao.getNoteById(Number(id));
    if (!currentNote) throw new Error('Note not found');

    if (Number(columnId) !== currentNote.columnId) {
      const column = await notesDao.getColumnById(Number(columnId));
      dataToSave.color = computeColorFromCode(column.code);
      dataToSave.columnId = Number(columnId);
    }
  }

  await notesDao.updateNoteById(Number(id), dataToSave, Number(userId));

  if (dataToSave.content) {
    await notesDao.deleteMentionsByNoteId(Number(id));
    const mentionsId = await extractMentionIds(dataToSave.content);
    // Filter out self-mentions (don't create mentions for the user themselves)
    const filteredMentions = mentionsId.filter((m) => m.id !== Number(userId));
    if (filteredMentions.length > 0) {
      const mentionsData: NoteMentionData[] = [];
      for (const mention of filteredMentions) {
        mentionsData.push({
          noteId: Number(id),
          mentionedUserId: mention.id,
          mentionedByUserId: Number(userId),
          createdOn: new Date(),
        });
      }
      if (mentionsData.length > 0) {
        await notesDao.saveNoteMentions(mentionsData);
        await notesDao.updateNoteById(Number(id), { hasMentions: true });
        // Emitir evento al bus para cada mención (notificación en tiempo real)
        for (const mention of mentionsData) {
          bus.emit(BUS_EVENTS.MENTION_CREATED, {
            noteId: mention.noteId,
            noteTitle: dataToSave.title || 'Nota',
            mentionedByUserId: mention.mentionedByUserId,
            mentionedUserId: mention.mentionedUserId,
            excerpt: (dataToSave.content || '').substring(0, 200),
          });
        }
      }
    }
  }

  if (hashtagIds) {
    await notesDao.syncNoteHashtags(Number(id), hashtagIds);
  }

  return { message: 'Item updated successfully' };
};

// ============================================================
// FAVORITE SERVICE FUNCTIONS
// ============================================================

/**
 * Toggle favorite status for a note by the current user.
 * Checks current state, inserts or deletes, returns new state.
 * Handles Prisma P2002 (unique constraint) as already-favorited.
 *
 * @param {number} userId - Authenticated user ID.
 * @param {number} noteId - Note ID to toggle.
 * @returns {Promise<Object>} New favorite state { isFavorited: boolean }.
 */
export const toggleFavorite = async (
  userId: number,
  noteId: number
): Promise<FavoriteToggleResult> => {
  // Check if note exists
  const note = await notesDao.getNoteById(noteId);
  if (!note) {
    throw new ClientError('Note not found', 404);
  }

  const isCurrentlyFavorited = await notesDao.isFavorited(userId, noteId);

  if (isCurrentlyFavorited) {
    await notesDao.deleteFavorite(userId, noteId);
    return { isFavorited: false };
  } else {
    try {
      await notesDao.createFavorite(userId, noteId);
    } catch (err) {
      // Prisma P2002 = unique constraint violation → already favorited
      // (cast para leer `code` sin imponer un gate instanceof — cero cambio de comportamiento)
      if ((err as { code?: string }).code === 'P2002') {
        return { isFavorited: true };
      }
      throw err;
    }
    return { isFavorited: true };
  }
};

/**
 * Delete a note by ID.
 *
 * @param {string} id - Note ID to delete.
 * @returns {Promise<void>}
 */
export const deleteById = async (id: string): Promise<void> => {
  const rowId = Number(id);
  return notesDao.deleteRow(rowId);
};

/**
 * Get total count of all notes with optional scope filter.
 *
 * @param {'mine'|'mixed'} [scope] - Scope filter for notes visibility (optional)
 * @param {number} userId - Current user ID (for scope filtering)
 * @returns {Promise<Object>} Object with counts for each column status (backlog, active, completed).
 * When scope is provided, counts are filtered by the scope; when omitted, all notes are counted.
 */
export const getAllNotesCount = async (
  scope: NoteScope | undefined,
  userId: number
): Promise<NotesCount> => {
  const data = await notesDao.getAllNotesCount(scope, userId);
  return data;
};

/**
 * Get all mentions for a specific note.
 *
 * @param {number} noteId - Note ID.
 * @returns {Promise<Array>} Mentions array.
 */
export const getMentionsByNoteId = async (noteId: number) => {
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
export const createHashtag = async (name: string, userId: number) => {
  return notesDao.createHashtag(name, userId);
};

/**
 * Update a hashtag name by ID.
 *
 * @param {string} id - Hashtag ID.
 * @param {string} name - New hashtag name.
 * @returns {Promise<Object>} Updated hashtag.
 */
export const updateHashtag = async (id: string, name: string) => {
  return notesDao.updateHashtag(Number(id), name);
};

/**
 * Delete a hashtag by ID. Cascades note_hashtags relations via Prisma.
 *
 * @param {string} id - Hashtag ID to delete.
 * @returns {Promise<Object>} Deletion result.
 */
export const deleteHashtag = async (id: string) => {
  return notesDao.deleteHashtag(Number(id));
};
