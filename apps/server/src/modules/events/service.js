import * as eventDao from './dao.js';

/**
 * Creates a new event item in the database.
 *
 * @param {Object} data - The data for the new event item.
 * @param {string} data.title - The title of the event item.
 * @param {string} data.description - The description of the event item.
 * @param {string} data.speaker - The speaker of the event item.
 * @param {string} data.startTime - The startTime of the event item.
 * @param {string} data.endTime - The endTime of the event item.
 * @param {string} data.eventDate - The eventDate of the event item.
 * @param {string} data.type - The type of the event item.
 * @param {number} userId - The ID of the user creating the event.
 * @returns {Promise<Object>} The created event item.
 */
export const createEvent = async (data, userId) => {
  const { type, ...dataToSave } = data;
  const createData = {
    ...dataToSave,
    createdOn: new Date(),
  };
  const foreignKeys = {
    type: Number(type),
    createdBy: Number(userId),
  };
  return eventDao.createEvent(createData, foreignKeys);
};

/**
 * Retrieves all available event types from the database.
 *
 * @returns {Promise<Array>} A list of all event types.
 */
export const getAllEventTypes = async () => {
  const data = await eventDao.getAllEventTypes();
  return data;
};

/**
 * Retrieves all events from the database with optional filters.
 *
 * @param {Object} searchQuery - The parameters for filtering the events.
 * @param {string} [searchQuery.title] - Filter by event title.
 * @param {string} [searchQuery.type] - Filter by event type.
 * @param {Date} [searchQuery.startDate] - Filter by start date.
 * @param {Date} [searchQuery.endDate] - Filter by end date.
 * @param {number} [searchQuery.page] - Page number for pagination.
 * @param {number} [searchQuery.limit] - Number of items per page.
 * @returns {Promise<Object>} A paginated list of events matching the filters.
 */
export const getAllEvents = async ({ searchQuery }) => {
  return await eventDao.getAllEvents(searchQuery);
};

/**
 * Updates an existing event item in the database by its ID.
 *
 * @param {number} eventId - The ID of the event item to update.
 * @param {Object} data - The updated data for the event item.
 * @param {string} [data.title] - The title of the event item.
 * @param {string} [data.description] - The description of the event item.
 * @param {string} [data.speaker] - The speaker of the event item.
 * @param {string} [data.startTime] - The startTime of the event item.
 * @param {string} [data.endTime] - The endTime of the event item.
 * @param {string} [data.eventDate] - The eventDate of the event item.
 * @param {string} [data.type] - The type of the event item.
 * @returns {Promise<Object>} The updated event item.
 */
export const updateEventById = async (eventId, data) => {
  const rowId = Number(eventId);
  data.updatedOn = new Date();
  const { type, ...dataToSave } = data;
  const foreignKeys = { type: Number(type) };
  return eventDao.updateEventById(dataToSave, foreignKeys, { id: rowId });
};

/**
 * Deletes an event item from the database by its ID.
 *
 * @param {number} id - The ID of the event item to delete.
 * @returns {Promise<Object>} The result of the deletion.
 */
export const deleteEventById = async (id) => {
  const rowId = Number(id);
  return eventDao.deleteEventById({ id: rowId });
};
