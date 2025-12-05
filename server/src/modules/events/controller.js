import globalResponse from '../../utils/responses&Errors/globalResponse.js'
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js'
import * as eventService from './service.js'

/**
 * Get all events with or without filter.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response confirming the creation of the event item.
 */
export const getAllEvents = handleCatchErrorAsync(async (req, res) => {
  const query = req.query
  const items = await eventService.getAllEvents(query)
  globalResponse(res, 200, items)
})

/**
 * Create an event item.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response confirming the creation of the event item.
 */
export const createEvent = handleCatchErrorAsync(async (req, res) => {
  const userId = req.userId // viene del token
  const { body } = req
  const createdEvent = await eventService.createEvent(body, userId)
  globalResponse(res, 201, createdEvent, 'Item created successfully')
})

/**
 * Get the event types.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response containing the event types.
 */
export const getAllEventTypes = handleCatchErrorAsync(async (req, res) => {
  const data = await eventService.getAllEventTypes()
  globalResponse(res, 200, data)
})

/**
 * Update an event item.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response containing the event types.
 */
export const updateEventById = handleCatchErrorAsync(async (req, res) => {
  const { body } = req
  const { id } = req.params
  console.log('llega', id)
  await eventService.updateEventById(id, body)
  globalResponse(res, 200, { message: 'Item updated successfully' })
})

/**
 * Delete event by ID
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns a message
 */
export const deleteEventById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params
  await eventService.deleteEventById(id)
  globalResponse(res, 200, { message: 'Item deleted successfully' })
})
