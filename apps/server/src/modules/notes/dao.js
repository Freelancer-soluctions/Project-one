import { prisma } from '../../config/db.js';

/**
 * Get all notes from the database with optional filters.
 *
 * @param {string} searchTerm - Search term to filter notes by.
 * @param {string} statusCode - Status code to filter notes by.
 * @param {Array<number>} hashtagIds - Hashtag IDs to filter notes by.
 * @returns {Promise<Array>} A list of notes matching the filters.
 */

export const getAllNotes = async (searchTerm, statusCode, hashtagIds) => {
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

            statusCode
              ? { columnStatus: { code: statusCode } }
              : {},

            hashtagIds && hashtagIds.length > 0
              ? {
                  noteHashtags: {
                    some: {
                      hashtagId: { in: hashtagIds.map(Number) }
                    }
                  }
                }
              : {},
          ],
        },
        include: {
          noteHashtags: {
            include: {
              hashtag: true
            }
          }
        },
      },
    },
  });

  return columns.map((column) => ({
    ...column,
    notes: column.notes.map((note) => ({
      ...note,
      hashtags: note.noteHashtags
        ? note.noteHashtags.map((nh) => ({
            id: nh.hashtag.id,
            name: nh.hashtag.name,
          }))
        : [],
    })),
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

export const createNote = async (data, userId, columnId) => {
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
 * @returns {Promise<Object>} The updated note.
 */

export const updateNoteById = async (id, data) => {
  const result = await prisma.notes.update({
    where: { id },
    data,
  });
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
 * Delete mentions by note ID.
 *
 * @param {number} noteId - Note ID.
 * @returns {Promise<Object>} The result of the delete operation.
 */
export const deleteMnetionsByNoteId = async (noteId) => {
  await prisma.mentions.deleteMany({
    where: { noteId },
  });
}

/**
 * Get count of notes by column status.
 *
 * @returns {Promise<Object>} Object with counts for each column status (low, medium, high).
 */
export const getAllNotesCount = async () => {
  const lowCount = await prisma.notes.count({
    where: { columnStatus: { code: 'C01' } },
  });

  const mediumCount = await prisma.notes.count({
    where: { columnStatus: { code: 'C02' } },
  });

  const highCount = await prisma.notes.count({
    where: { columnStatus: { code: 'C03' } },
  });

  const notesCount = { low: lowCount, medium: mediumCount, high: highCount };

  return notesCount;

  // Regresa un array lo cual no es optimo en esta ocacion para manejkar en el front end
  // const notesCount = await prisma.$queryRaw`
  // SELECT
  //   CAST(COUNT(CASE WHEN nc.code = 'C01' THEN 1 ELSE NULL END) AS INT) AS LOW,
  //   CAST(COUNT(CASE WHEN nc.code = 'C02' THEN 1 ELSE NULL END) AS INT) AS MEDIUM,
  //   CAST(COUNT(CASE WHEN nc.code = 'C03' THEN 1 ELSE NULL END) AS INT) AS HIGH
  //   FROM public.notes n
  //   LEFT JOIN public."noteColumns" nc ON nc.id = n."columnId";
  //  `

  // return notesCount
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
}

/**
 * Dellete Mentions by note id
 * @param {Number} noteId 
 */
export const deleteMentionsByNoteId = async(noteId)=>{
    await prisma.mentions.deleteMany({
    where: { noteId },
  });
}


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
    data: { name, createdBy: userId }
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
    include: { _count: { select: { notes: true } } }
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
    data: { name, updatedOn: new Date() }
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
    const data = hashtagIds.map(hashtagId => ({
      noteId,
      hashtagId,
      createdOn: new Date()
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
    include: { hashtag: true }
  });
};
