import * as eventDao from './dao.js'

/**
 * Create a new event item in the database.
 *
 * @param {number} userId - The ID of the user creating the event.
 * @param {Object} data - The data for the new event item.
 * @param {string} data.description - The description of the event item.
 * @param {number} data.statusId - The ID of the status for the event item.
 * @param {string} data.statusCode - The status code of the event item.
 * @returns {Promise<Object>} The created event item.
 */
export const createEvent = async (userId, data) => {
  const createData = {
    ...data,
    createdBy: Number(userId),
    createdOn: new Date()

  }
  return eventDao.createEvent(createData)
}

// /**
//  * Get all events from the database with optional filters.
//  *
//  * @param {Object} params - The parameters for filtering the events.
//  * @param {string} params.description - The description filter.
//  * @param {Date} params.fromDate - The start date filter.
//  * @param {Date} params.toDate - The end date filter.
//  * @param {string} params.statusCode - The status code filter.
//  * @returns {Promise<Array>} A list of event items matching the filters.
//  */
// export const getAllEvents = async ({ description, fromDate, toDate, statusCode }) => {
//   const data = await eventDao.getAllEvents(description, fromDate, toDate, statusCode)
//   return data
// }

// /**
//  * Get one event item from the database by its ID.
//  *
//  * @param {number} id - The ID of the event item.
//  * @returns {Promise<Object>} The event item matching the ID.
//  */
// export const getOneById = async (id) => {
//   return eventDao.getOneRow({ where: { id } })
// }

// /**
//  * Update an existing event item in the database by its ID.
//  *
//  * @param {number} userId - The ID of the user updating the event.
//  * @param {number} eventId - The ID of the event item to update.
//  * @param {Object} data - The updated data for the event item.
//  * @param {string} data.statusCode - The status code of the event item.
//  * @returns {Promise<Object>} The updated event item.
//  */
// export const updateById = async (userId, eventId, data) => {
//   const rowId = Number(eventId)

//   if (data.statusCode === EventStatusCode.CLOSED) {
//     data.closedBy = Number(userId)
//     data.closedOn = new Date()
//   }

//   if (data.statusCode === EventStatusCode.PENDING) {
//     data.pendingBy = Number(userId)
//     data.pendingOn = new Date()
//   }

//   return eventDao.updateRow(data, { id: rowId })
// }

// /**
//  * Delete an event item from the database by its ID.
//  *
//  * @param {number} id - The ID of the event item to delete.
//  * @returns {Promise<Object>} The result of the deletion.
//  */
// export const deleteById = async (id) => {
//   const rowId = Number(id)
//   return eventDao.deleteRow({ id: rowId })
// }

// /**
//  * Get all available event statuses from the database.
//  *
//  * @returns {Promise<Array>} A list of all event statuses.
//  */
// export const getAllEventStatus = async () => {
//   const data = await eventDao.getAllEventStatus()
//   return data
// }
