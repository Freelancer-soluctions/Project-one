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
 * Get one by id
 *
 * @param {*} req
 * @param {*} res
 * @returns A message
 */
export const getOneById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params
  const item = await noteService.getOneById(id)
  globalResponse(res, 200, item)
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
