import globalResponse from '../../utils/responses&Errors/globalResponse.js'
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js'
import * as eventService from './service.js'

// /**
//  * Get all events
//  *
//  * @param {*} req
//  * @param {*} res
//  * @returns A message
//  */
// export const getAllEvents = handleCatchErrorAsync(async (req, res) => {
//   const query = req.query
//   const items = await eventService.getAllEvents(query)
//   globalResponse(res, 200, items)
// })

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

// /**
//  * Get the status of all event items.
//  *
//  * @param {Object} req - The HTTP request object.
//  * @param {Object} res - The HTTP response object.
//  * @returns {Promise<void>} Sends a response containing the status of all event items.
//  */
// export const getAllEventColumns = handleCatchErrorAsync(async (req, res) => {
//   const data = await eventService.getAllEventColumns()
//   globalResponse(res, 200, data)
// })

// /**
//  * Update event column by ID
//  *
//  * @param {*} req
//  * @param {*} res
//  * @returns a message
//  */
// export const updateEventColumnById = handleCatchErrorAsync(async (req, res) => {
//   const { body } = req
//   await eventService.updateEventColumnById(body)
//   globalResponse(res, 200, { message: 'Item updated successfully' })
// })

// /**
//  * Update event by ID
//  *
//  * @param {*} req
//  * @param {*} res
//  * @returns a message
//  */
// export const updateEventById = handleCatchErrorAsync(async (req, res) => {
//   const { body } = req
//   console.log(body)
//   const { id } = req.params
//   await eventService.updateEventById(id, body)
//   globalResponse(res, 200, { message: 'Item updated successfully' })
// })

// /**
//  * Delete event by ID
//  *
//  * @param {*} req
//  * @param {*} res
//  * @returns a message
//  */
// export const deleteEventById = handleCatchErrorAsync(async (req, res) => {
//   const { id } = req.params
//   await eventService.deleteEventById(id)
//   globalResponse(res, 200, { message: 'Item deleted successfully' })
// })
