import { prisma } from '../../config/db.js';

/**
 * Get all notes from the database with optional filters.
 *
 * @param {string} searchTerm - Search term to filter notes by.
 * @param {string} statusCode - Status code to filter notes by.
 * @param {Array<number>} hashtagIds - Hashtag IDs to filter notes by.
 * @param {number} userId - Current user ID (for favorite filter and per-note status).
 * @param {boolean} isFavorite - If true, only return notes favorited by userId.
 * @param {'mine'|'mixed'} [scope] - Scope filter for notes visibility (optional, default: 'mine')
 * @returns {Promise<Array>} A list of notes matching the filters. Each note includes:
 *  - isOwner: boolean indicating if the note was created by the current user
 *  - isMentioned: boolean indicating if the current user is mentioned in the note
 */
export const getAllNotes = async (
  searchTerm,
  statusCode,
  hashtagIds,
  userId,
  isFavorite,
  scope = 'mine'
) => {
  const columns = await prisma.noteColumns.findMany({
    include: {
      notes: {
        where: {
          AND: [
            searchTerm
              ? {
                  OR: [
                    { content: { contains: searchTerm, mode: 'insensitive' } },
                    { title: { contains: searchTerm, mode: 'insensitive' } },
                  ],
                }
              : {},

            statusCode ? { columnStatus: { code: statusCode } } : {},

            hashtagIds && hashtagIds.length > 0
              ? {
                  noteHashtags: {
                    some: {
                      hashtagId: { in: hashtagIds.map(Number) },
                    },
                  },
                }
              : {},

            isFavorite && userId
              ? {
                  favoriteBy: {
                    some: {
                      userId: userId,
                    },
                  },
                }
              : {},

            // Scope filters
            scope === 'mine'
              ? { createdBy: userId }
              : scope === 'mixed'
                ? {
                    OR: [
                      { createdBy: userId },
                      { mentions: { some: { mentionedUserId: userId } } },
                    ],
                  }
                : {},
          ],
        },
        include: {
          noteHashtags: {
            include: {
              hashtag: true,
            },
          },
        },
      },
    },
  });

  // Batch lookup: get all note IDs favorited by current user
  let favoriteNoteIds = new Set();
  if (userId) {
    const userFavorites = await prisma.user_notes_favorites.findMany({
      where: { userId },
      select: { noteId: true },
    });
    favoriteNoteIds = new Set(userFavorites.map((f) => f.noteId));
  }

  // Batch lookup: get all note IDs and mention IDs where current user is mentioned
  let mentionsByNote = new Map();
  if (userId) {
    const userMentions = await prisma.mentions.findMany({
      where: { mentionedUserId: userId },
      select: { id: true, noteId: true, isRead: true },
    });
    userMentions.forEach((m) => {
      if (!mentionsByNote.has(m.noteId)) {
        mentionsByNote.set(m.noteId, []);
      }
      mentionsByNote.get(m.noteId).push(m);
    });
  }

  return columns.map((column) => ({
    ...column,
    notes: column.notes.map((note) => {
      const noteMentions = mentionsByNote.get(note.id) || [];
      const mentionIds = noteMentions.map((m) => m.id);
      const hasUnreadMentions = noteMentions.some((m) => !m.isRead);
      return {
        ...note,
        hashtags: note.noteHashtags
          ? note.noteHashtags.map((nh) => ({
              id: nh.hashtag.id,
              name: nh.hashtag.name,
            }))
          : [],
        isFavorited: favoriteNoteIds.has(note.id),
        isOwner: note.createdBy === userId,
        isMentioned: noteMentions.length > 0,
        mentionIds: mentionIds,
        hasUnreadMentions: hasUnreadMentions,
      };
    }),
  }));
};

/**
 * Create a new note in the database.
 *
 * @param {Object} data - The data for the new note.
 * @param {number} userId - User ID who creates the note.
 * @param {number} columnId - Column ID for the note.
 * @returns {Promise<Object>} The created note.
 */

export const createNote = async (data, userId, columnId, isFavorite) => {
  const result = await prisma.notes.create({
    data: {
      ...data,
      userNoteCreated: {
        connect: {
          id: userId,
        },
      },
      columnStatus: {
        connect: {
          id: columnId,
        },
      },
    },
  });

  if (isFavorite) {
    await prisma.user_notes_favorites.create({
      data: { userId, noteId: result.id },
    });
  }

  return Promise.resolve(result);
};

/**
 * Retrieves all available notes columns from the database.
 *
 * @returns {Promise<Array>} A list of notes columns from the database.
 */
export const getAllNotesColumns = async () => {
  return await prisma.noteColumns.findMany();
};

/**
 * Update note column ID by note ID.
 *
 * @param {number} id - Note ID.
 * @param {Object} data - Updated data.
 * @returns {Promise<Object>} The updated note.
 */
export const updateNoteColumId = async (id, data) => {
  const result = await prisma.notes.update({
    where: { id },
    data,
  });
  return Promise.resolve(result);
};

/**
 * Update a note by ID.
 *
 * @param {number} id - Note ID.
 * @param {Object} data - Updated note data.
 * @param {number} [userId] - User ID (for isFavorite handling).
 * @returns {Promise<Object>} The updated note.
 */
export const updateNoteById = async (id, data, userId) => {
  const updateData = { ...data };

  // Extract and handle isFavorite (not a note field, handled separately)
  const { isFavorite } = updateData;
  delete updateData.isFavorite;

  // Handle columnId -> columnStatus connect
  if (updateData.columnId !== undefined) {
    updateData.columnStatus = {
      connect: { id: updateData.columnId },
    };
    delete updateData.columnId;
  }

  // Handle hashtagIds synchronization
  const hashtagIds = updateData.hashtagIds;
  delete updateData.hashtagIds;

  // Update the note
  const result = await prisma.notes.update({
    where: { id },
    data: updateData,
  });

  // Sync hashtags if provided
  if (hashtagIds !== undefined) {
    await syncNoteHashtags(id, hashtagIds);
  }

  // Handle isFavorite sync if provided and userId available
  if (isFavorite !== undefined && userId) {
    if (isFavorite) {
      await prisma.user_notes_favorites.upsert({
        where: { noteId_userId: { noteId: id, userId } },
        create: { noteId: id, userId },
        update: {},
      });
    } else {
      await prisma.user_notes_favorites.deleteMany({
        where: { noteId: id, userId },
      });
    }
  }

  return Promise.resolve(result);
};

/**
 * Delete a note by ID.
 *
 * @param {number} id - Note ID.
 * @returns {Promise<Object>} The deleted note.
 */
export const deleteRow = async (id) => {
  await prisma.notes.delete({ where: { id } });
};

/**
 * Get a single note by ID.
 * @param {number} id - Note ID
 * @returns {Promise<Object|null>} Note record or null
 */
export const getNoteById = async (id) => {
  return prisma.notes.findUnique({ where: { id } });
};

/**
 * Get a column by ID.
 * @param {number} id - Column ID
 * @returns {Promise<Object|null>} Column record or null
 */
export const getColumnById = async (id) => {
  return prisma.noteColumns.findUnique({ where: { id } });
};

/**
 * Get count of notes by column status with optional scope filter.
 *
 * @param {'mine'|'mixed'} [scope] - Scope filter for notes visibility (optional)
 * @param {number} userId - Current user ID (for scope filtering)
 * @returns {Promise<Object>} Object with counts for each column status (backlog, active, completed).
 * When scope is provided, counts are filtered by the scope; when omitted, all notes are counted.
 */
export const getAllNotesCount = async (scope = 'mine', userId) => {
  // Build scope conditions similar to getAllNotes
  const scopeConditions = [];

  if (scope === 'mine') {
    scopeConditions.push({ createdBy: userId });
  } else if (scope === 'mixed') {
    scopeConditions.push({
      OR: [
        { createdBy: userId },
        { mentions: { some: { mentionedUserId: userId } } },
      ],
    });
  }
  // For scope undefined or other values, no additional conditions (all notes)

  const backlogCount = await prisma.notes.count({
    where: {
      AND: [{ columnStatus: { code: 'C01' } }, ...scopeConditions],
    },
  });

  const activeCount = await prisma.notes.count({
    where: {
      AND: [{ columnStatus: { code: 'C02' } }, ...scopeConditions],
    },
  });

  const completedCount = await prisma.notes.count({
    where: {
      AND: [{ columnStatus: { code: 'C03' } }, ...scopeConditions],
    },
  });

  return {
    backlog: backlogCount,
    active: activeCount,
    completed: completedCount,
  };
};

/**
 * Get all mentions for a specific note.
 *
 * @param {number} noteId - Note ID.
 * @returns {Promise<Array>} List of mentions with user details.
 */
export const getMentionsByNoteId = async (noteId) => {
  return await prisma.mentions.findMany({
    where: { noteId },
    include: {
      mentionedUser: {
        select: { id: true, name: true, picture: true },
      },
      mentionedByUser: {
        select: { id: true, name: true, picture: true },
      },
    },
  });
};

/**
 * Create a new note mention in the database.
 *
 * @param {Object} mentionsData - The data for the new note.
 */
export const saveNoteMentions = async (mentionsData) => {
  await prisma.mentions.createMany({
    data: mentionsData,
  });
};

/**
 * Dellete Mentions by note id
 * @param {Number} noteId
 */
export const deleteMentionsByNoteId = async (noteId) => {
  await prisma.mentions.deleteMany({
    where: { noteId },
  });
};

// === FAVORITE FUNCTIONS ===

/**
 * Create a favorite record for a note by a user.
 *
 * @param {number} userId - User ID.
 * @param {number} noteId - Note ID.
 * @returns {Promise<Object>} Created favorite record.
 */
export const createFavorite = async (userId, noteId) => {
  return prisma.user_notes_favorites.create({
    data: { userId, noteId },
  });
};

/**
 * Delete a favorite record for a note by a user.
 *
 * @param {number} userId - User ID.
 * @param {number} noteId - Note ID.
 * @returns {Promise<Object>} Deletion result.
 */
export const deleteFavorite = async (userId, noteId) => {
  return prisma.user_notes_favorites.deleteMany({
    where: { userId, noteId },
  });
};

/**
 * Check if a note is favorited by a user (EXISTS check).
 *
 * @param {number} userId - User ID.
 * @param {number} noteId - Note ID.
 * @returns {Promise<boolean>} True if favorited.
 */
export const isFavorited = async (userId, noteId) => {
  const count = await prisma.user_notes_favorites.count({
    where: { userId, noteId },
  });
  return count > 0;
};

// === HASHTAG FUNCTIONS ===

/**
 * Create a new hashtag.
 *
 * @param {string} name - Hashtag name (unique constraint).
 * @param {number} userId - ID of the creating user.
 * @returns {Promise<Object>} Created hashtag record.
 */
export const createHashtag = async (name, userId) => {
  return prisma.hashtags.create({
    data: { name, createdBy: userId },
  });
};

/**
 * Get all hashtags ordered by name ascending.
 * Includes count of associated notes.
 *
 * @returns {Promise<Array>} Array of hashtag objects with _count.notes.
 */
export const getAllHashtags = async () => {
  return prisma.hashtags.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { notes: true } } },
  });
};

/**
 * Find a hashtag by its unique name.
 *
 * @param {string} name - Hashtag name to search for.
 * @returns {Promise<Object|null>} Hashtag record or null if not found.
 */
export const findHashtagByName = async (name) => {
  return prisma.hashtags.findUnique({ where: { name } });
};

/**
 * Find a hashtag by its ID.
 *
 * @param {number} id - Hashtag ID.
 * @returns {Promise<Object|null>} Hashtag record or null if not found.
 */
export const findHashtagById = async (id) => {
  return prisma.hashtags.findUnique({ where: { id } });
};

/**
 * Update a hashtag's name by ID.
 *
 * @param {number} id - Hashtag ID.
 * @param {string} name - New hashtag name.
 * @returns {Promise<Object>} Updated hashtag record.
 */
export const updateHashtag = async (id, name) => {
  return prisma.hashtags.update({
    where: { id },
    data: { name, updatedOn: new Date() },
  });
};

/**
 * Delete a hashtag by ID. Prisma cascades to note_hashtags join records.
 *
 * @param {number} id - Hashtag ID to delete.
 * @returns {Promise<Object>} Deleted hashtag record.
 */
export const deleteHashtag = async (id) => {
  return prisma.hashtags.delete({ where: { id } });
};

/**
 * Sync note-hashtag associations: delete all existing and insert new ones.
 * Uses deleteMany + createMany for atomic replacement.
 *
 * @param {number} noteId - Note ID to sync associations for.
 * @param {number[]} hashtagIds - Array of hashtag IDs to associate.
 * @returns {Promise<void>}
 */
export const syncNoteHashtags = async (noteId, hashtagIds) => {
  await prisma.note_hashtags.deleteMany({ where: { noteId } });
  if (hashtagIds && hashtagIds.length > 0) {
    const data = hashtagIds.map((hashtagId) => ({
      noteId,
      hashtagId,
      createdOn: new Date(),
    }));
    await prisma.note_hashtags.createMany({ data });
  }
};

/**
 * Get all hashtag associations for a specific note.
 *
 * @param {number} noteId - Note ID.
 * @returns {Promise<Array>} Array of note_hashtags records with included hashtag data.
 */
export const getNoteHashtags = async (noteId) => {
  return prisma.note_hashtags.findMany({
    where: { noteId },
    include: { hashtag: true },
  });
};
