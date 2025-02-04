import globalResponse from '../../utils/responses&Errors/globalResponse.js'
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js'
import * as noteService from './service.js'

/**
 * Get all
 *
 * @param {*} req
 * @param {*} res
 * @returns A message
 */
export const getAllNotes = handleCatchErrorAsync(async (req, res) => {
  const query = req.query
  const items = await noteService.getAll(query)
  globalResponse(res, 200, items)
})

/**
 * Create a note item.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response confirming the creation of the news item.
 */
export const createNote = handleCatchErrorAsync(async (req, res) => {
  const { body } = req
  const createdNote = await noteService.createNote(body)
  globalResponse(res, 201, createdNote, 'Item created successfully')
})

/**
 * Get the status of all notes items.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response containing the status of all news items.
 */
export const getAllNotesColumns = handleCatchErrorAsync(async (req, res) => {
  const data = await noteService.getAllNotesColumns()
  globalResponse(res, 200, data)
})

/**
 * Update By ID
 *
 * @param {*} req
 * @param {*} res
 * @returns  a message
 */
export const updateById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params
  const { body, file } = req
  await noteService.updateById(id, { ...body, file })
  globalResponse(res, 200, { message: 'Items updated successfully' })
})

/**
 * Delete By ID
 *
 * @param {*} req
 * @param {*} res
 * @returns a message
 */
export const deleteById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params
  await noteService.deleteById(id)
  globalResponse(res, 200, { message: 'Items deleted successfully' })
})
