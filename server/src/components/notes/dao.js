import prisma from '../../config/db.js'

/**
 * Retrieves all notes from the database based on the provided filters.
 *
 * @param {string} description - The description to filter news by.
 * @returns {Promise<Array>} A list of news matching the filters from the database.
 */

export const getAllNotes = async (description) => {
  return await prisma.noteColumns.findMany({
    include: {
      notes: {
        where: description
          ? {
              content: {
                contains: description, // Filtra por contenido si description está presente
                mode: 'insensitive' // Ignora mayúsculas/minúsculas
              }
            }
          : {} // Si no hay filtro, trae todas las notas
      }
    }
  })
}

/**
 * Creates a note row in the database with the provided data.
 *
 * @param {Object} data - The data to insert into the database.
 * @returns {Promise<Object>} The created row in the database.
 */

export const createNote = async (data, userId, columnId) => {
  const result = await prisma.notes.create({
    data: {
      ...data,
      userNoteCreated: {
        connect: {
          id: userId
        }
      },
      columnStatus: {
        connect: {
          id: columnId
        }
      }
    }
  })
  return Promise.resolve(result)
}

/**
 * Retrieves all available notes columns from the database.
 *
 * @returns {Promise<Array>} A list of notes columns from the database.
 */
export const getAllNotesColumns = async () => {
  return await prisma.noteColumns.findMany()
}

/**
 * Updates an existing row in the database based on the provided filter and data.
 *
 * @param {Object} data - The fields to update in the row.
 * @param {Object} where - The conditions to identify the row to update.
 * @returns {Promise<Object>} The updated row in the database.
 */
export const updateNoteColumId = async (id, data) => {
  const result = await prisma.notes.update({
    where: { id },
    data
  })
  return Promise.resolve(result)
}

/**
 * Updates an existing row in the database based on the provided filter and data.
 *
 * @param {Object} data - The fields to update in the row.
 * @param {Object} where - The conditions to identify the row to update.
 * @returns {Promise<Object>} The updated row in the database.
 */
export const updateNoteById = async (id, data) => {
  const result = await prisma.notes.update({
    where: { id },
    data
  })
  return Promise.resolve(result)
}

/**
 * Deletes a row from the database based on the provided filter.
 *
 * @param {Object} where - The filter conditions to identify the row to delete.
 * @returns {Promise<Object>} The result of the delete operation.
 */
export const deleteRow = async (id) => {
  await prisma.notes.delete({ where: { id } })
}
