import { prisma } from '../../config/db.js';

/**
 * Get all notes from the database with optional filters.
 *
 * @param {string} searchTerm - Search term to filter notes by.
 * @param {string} statusCode - Status code to filter notes by.
 * @returns {Promise<Array>} A list of notes matching the filters.
 */

export const getAllNotes = async (searchTerm, statusCode) => {
  return await prisma.noteColumns.findMany({
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
              : {}, // Si no hay `searchTerm`, no se aplica este filtro

            statusCode
              ? { columnStatus: { code: statusCode } } // Aplica el filtro solo si `statusCode` tiene un valor
              : {}, // Si no hay `statusCode`, no se aplica este filtro
          ],
        },

        // searchTerm
        //   ? {
        //       OR: [
        //         { content: { contains: searchTerm, mode: 'insensitive' } },
        //         { title: { contains: searchTerm, mode: 'insensitive' } }
        //       ]

        //       // content: {
        //       //   contains: searchTerm, // Filtra por contenido si description está presente
        //       //   mode: 'insensitive' // Ignora mayúsculas/minúsculas
        //       // }
        //     }
        //   : {} // Si no hay filtro, trae todas las notas
      },
    },
  });
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