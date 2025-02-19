import * as notesDao from './dao.js'

/**
 * Get all notes from the database with optional filters.
 *
 * @param {Object} params - The parameters for filtering the news.
 * @param {string} params.description - The description filter.
 * @returns {Promise<Array>} A list of news items matching the filters.
 */
export const getAllNotes = async ({ description }) => {
  const data = await notesDao.getAllNotes(description)
  return data
}

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
  const { columnId, ...dataWithOutForeignKeys } = data
  dataWithOutForeignKeys.createdOn = new Date()
  return notesDao.createNote(dataWithOutForeignKeys, Number(userId), Number(columnId))
}

/**
 * Get all available notes columns from the database.
 *
 * @returns {Promise<Array>} A list of all notes columns.
 */

export const getAllNotesColumns = async () => {
  const data = await notesDao.getAllNotesColumns()
  return data
}

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
  data.updatedOn = new Date()
  const { id, ...newdata } = data
  return notesDao.updateNoteColumId(id, newdata)
}

/**
 * Update an existing column item in the database by its ID.
 *
 * @param {Object} data - The updated data for the notes item.
 * @param {number} id - The ID of the notes item to update.
 * @param {number} data.title - The ID of the column note item to update.
 * @param {string} data.content - The column color of the note item.
 * @returns {Promise<Object>} The updated notes item.
 */
export const updateNoteById = async (id, data) => {
  data.updatedOn = new Date()
  return notesDao.updateNoteById(Number(id), data)
}

/**
 * Delete a note item from the database by its ID.
 *
 * @param {number} id - The ID of the note item to delete.
 * @returns {Promise<Object>} The result of the deletion.
 */
export const deleteById = async (id) => {
  const rowId = Number(id)
  return notesDao.deleteRow(rowId)
}

/**
 * Get all number of  notes from the database.
 *
 * @returns {Promise<Array>} A list of all notes columns number.
 */

export const getAllNotesCount = async () => {
  const data = await notesDao.getAllNotesCount()
  return data
}
