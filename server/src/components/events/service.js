import * as eventDao from './dao.js'

/**
 * Create a new event item in the database.
 *
 * @param {number} userId - The ID of the user creating the event.
 * @param {Object} data - The data for the new event item.
 * @param {string} data.title - The title of the event item.
 * @param {string} data.description - The description of the event item.
 * @param {string} data.speaker - The speaker of the event item.
 * @param {string} data.startTime - The startTime of the event item.
 * @param {string} data.endTime - The endTime of the event item.
 * @param {string} data.eventDate - The eventDate of the event item.
 * @param {string} data.type - The type of the event item.

 * @returns {Promise<Object>} The created event item.
 */
export const createEvent = async (data, userId) => {
  const { type, ...dataToSave } = data
  const createData = {
    ...dataToSave,
    createdOn: new Date()

  }
  const foreignKeys = {
    type: Number(type),
    createdBy: Number(userId)
  }
  return eventDao.createEvent(createData, foreignKeys)
}

/**
 * Get all available types from the database.
 *
 * @returns {Promise<Array>} A list of all event types.
 */
export const getAllEventTypes = async () => {
  const data = await eventDao.getAllEventTypes()
  return data
}

/**
 * Get all events from the database with optional filters.
 *
 * @param {Object} params - The parameters for filtering the events.
 * @param {string} params.description - The description filter.
 * @returns {Promise<Array>} A list of event items matching the filters.
 */
export const getAllEvents = async ({ searchQuery }) => {
  const data = await eventDao.getAllEvents(searchQuery)
  return data
}

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
