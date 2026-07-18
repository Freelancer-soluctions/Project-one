import * as eventDao from './dao.js';
import { getSafePagination } from '../../utils/pagination/pagination.js';

/**
 * Converts a time string in "HH:mm" format to a Date object on the fixed epoch date (1970-01-01).
 * Used for Prisma input when writing to Time(0) columns.
 *
 * @param {string} timeStr - Time string in "HH:mm" format (e.g., "14:30")
 * @returns {Date} Date object with the time set on 1970-01-01
 */
export const timeStrToDate = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') {
    throw new Error(`timeStrToDate: expected a valid HH:mm string, got ${typeof timeStr}`);
  }
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) {
    throw new Error(`timeStrToDate: invalid time string "${timeStr}"`);
  }
  // Use UTC to avoid local timezone offset shifting the time
  return new Date(Date.UTC(1970, 0, 1, hours, minutes));
};

/**
 * Extracts "HH:mm" string from a Date object.
 * Used for API response serialization when reading from Time(0) columns.
 *
 * @param {Date} date - Date object (typically from Prisma Time(0) column)
 * @returns {string|null} Time string in "HH:mm" format (e.g., "09:05") or null if date is falsy
 */
export const formatTime = (date) => {
  if (!date) return null;
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

/**
 * Validates modality-specific field requirements and clears opposing fields.
 * - ONLINE: meetingUrl required, location cleared
 * - IN_PERSON: location required, meetingUrl cleared
 * - HYBRID: both meetingUrl and location required
 *
 * @param {Object} data - Event data containing modality, meetingUrl, location
 * @param {Object} [currentEvent] - Current event from DB (for update validation)
 * @returns {Object} data with opposing fields cleared based on modality
 * @throws {Error} If validation fails
 */
export const validateEventModality = (data, currentEvent = null) => {
  const { modality, meetingUrl, location } = data;

  // Determine effective modality (new or current)
  const effectiveModality = modality || (currentEvent?.modality);

  // Skip if no modality at all
  if (!effectiveModality) {
    return data;
  }

  // Create mutable copy to clear opposing fields
  const validatedData = { ...data };

  // Use currentEvent fields as fallback when modality in payload but meetingUrl/location missing
  const effectiveLocation = location ?? currentEvent?.location;
  const effectiveMeetingUrl = meetingUrl ?? currentEvent?.meetingUrl;

  // Modality-specific validation AND field clearing
  if (effectiveModality === 'ONLINE') {
    // Clear location for ONLINE
    validatedData.location = null;
    if (!effectiveMeetingUrl) {
      throw new Error('meetingUrl is required for ONLINE events');
    }
  } else if (effectiveModality === 'IN_PERSON') {
    // Clear meetingUrl for IN_PERSON
    validatedData.meetingUrl = null;
    if (!effectiveLocation) {
      throw new Error('location is required for IN_PERSON events');
    }
  } else if (effectiveModality === 'HYBRID') {
    if (!effectiveMeetingUrl || !effectiveLocation) {
      throw new Error('both meetingUrl and location are required for HYBRID events');
    }
  }

  return validatedData;
};

/**
 * Creates a new event item in the database.
 *
 * @param {Object} data - The data for the new event item.
 * @param {string} data.title - The title of the event item.
 * @param {string} data.description - The description of the event item.
 * @param {string} data.speaker - The speaker of the event item.
 * @param {string} data.startTime - The startTime of the event item (HH:mm format).
 * @param {string} data.endTime - The endTime of the event item (HH:mm format).
 * @param {string} data.eventDate - The eventDate of the event item.
 * @param {string} data.type - The type of the event item.
 * @param {number} userId - The ID of the user creating the event.
 * @returns {Promise<Object>} The created event item.
 */
export const createEvent = async (data, userId) => {
  // Validate modality-specific requirements before creating
  validateEventModality(data);
  // BEFORE: const { type, ...dataToSave } = data;
  // BEFORE: const createData = { ...dataToSave, createdOn: new Date() };
  // BEFORE: const foreignKeys = { type: Number(type), createdBy: Number(userId) };
  // BEFORE: return eventDao.createEvent(createData, foreignKeys);
  const { type, startTime, endTime, ...dataToSave } = data;
  const createData = {
    ...dataToSave,
    startTime: timeStrToDate(startTime),
    endTime: timeStrToDate(endTime),
    createdOn: new Date(),
  };
  const foreignKeys = {
    type: Number(type),
    createdBy: Number(userId),
  };
  const createdEvent = await eventDao.createEvent(createData, foreignKeys);
  // Format response times back to HH:mm for API consumers
  return {
    ...createdEvent,
    startTime: formatTime(createdEvent.startTime),
    endTime: formatTime(createdEvent.endTime),
  };
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
 * Retrieves all events from the database with optional filters and pagination.
 *
 * @param {Object} params - The parameters for fetching events.
 * @param {string} [params.searchQuery] - Filter by search term (title, description, speaker).
 * @param {number} [params.page] - Page number for pagination.
 * @param {number} [params.limit] - Number of items per page.
 * @param {boolean} [params.showDeleted=false] - Whether to include soft-deleted events.
 * @param {number} [params.type] - Filter by event type ID (exact match on eventTypeId).
 * @param {Date|string} [params.dateFrom] - Filter by start date (inclusive, ISO date string).
 * @param {Date|string} [params.dateTo] - Filter by end date (inclusive, ISO date string, normalized to end-of-day).
 * @param {string} [params.speaker] - Filter by speaker name (case-insensitive partial match).
 * @param {string} [params.status] - Filter by status: 'upcoming', 'past', or 'all'.
 * @param {string} [params.modality] - Filter by modality: 'ONLINE', 'IN_PERSON', or 'HYBRID'.
 * @returns {Promise<Object>} A paginated list of events matching the filters.
 */
export const getAllEvents = async ({
  searchQuery,
  page,
  limit,
  showDeleted = false,
  type,
  dateFrom,
  dateTo,
  speaker,
  status,
  modality,
}) => {
  const { take, skip } = getSafePagination({ page, limit });
  const result = await eventDao.getAllEvents({
    searchQuery,
    take,
    skip,
    page,
    pageSize: limit,
    showDeleted,
    type,
    dateFrom: dateFrom ? new Date(dateFrom) : undefined,
    dateTo: dateTo ? new Date(dateTo) : undefined,
    speaker,
    status,
    modality,
  });
  // Format startTime/endTime from Date to HH:mm for all events in response
  if (result.data && Array.isArray(result.data)) {
    result.data = result.data.map((event) => ({
      ...event,
      startTime: formatTime(event.startTime),
      endTime: formatTime(event.endTime),
    }));
  }
  return result;
};

/**
 * Updates an existing event item in the database by its ID.
 * Handles restore operation when deletedAt is explicitly set to null in the request body.
 *
 * @param {number} eventId - The ID of the event item to update.
 * @param {Object} data - The updated data for the event item.
 * @param {string} [data.title] - The title of the event item.
 * @param {string} [data.description] - The description of the event item.
 * @param {string} [data.speaker] - The speaker of the event item.
 * @param {string} [data.startTime] - The startTime of the event item (HH:mm format).
 * @param {string} [data.endTime] - The endTime of the event item (HH:mm format).
 * @param {string} [data.eventDate] - The eventDate of the event item.
 * @param {string} [data.type] - The type of the event item.
 * @param {Date|null} [data.deletedAt] - Set to null to restore a soft-deleted event.
 * @param {number|null} [data.deletedBy] - User ID who deleted (cleared on restore).
 * @returns {Promise<Object|null>} The updated/restored event item, or null if not found.
 */
export const updateEventById = async (eventId, data) => {
  const rowId = Number(eventId);
  const { type, startTime, endTime, deletedAt, deletedBy, ...dataToSave } = data;
  const isRestoreRequest = deletedAt === null;

  // Fetch current event for modality validation when modality-related fields are updated
  let currentEvent = null;
  if (data.modality !== undefined || data.meetingUrl !== undefined || data.location !== undefined) {
    currentEvent = await eventDao.getEventById(rowId);
    if (!currentEvent) {
      return null; // Event not found
    }
    // Validate modality and clear opposing fields
    Object.assign(dataToSave, validateEventModality(data, currentEvent));
  }

  if (startTime !== undefined) {
    dataToSave.startTime = timeStrToDate(startTime);
  }
  if (endTime !== undefined) {
    dataToSave.endTime = timeStrToDate(endTime);
  }
  dataToSave.updatedOn = new Date();
  const foreignKeys = { type: Number(type) };

  if (isRestoreRequest) {
    // Attempt restore first — DAO returns null if not found
    const restoredEvent = await eventDao.restoreEventById(rowId);
    if (!restoredEvent) {
      // Event not found
      return null;
    }
    // If there are other fields to update besides restore fields, apply them
    if (Object.keys(dataToSave).length > 1) { // more than just updatedOn
      const updatedEvent = await eventDao.updateEventById(dataToSave, foreignKeys, { id: rowId });
      return {
        ...updatedEvent,
        startTime: formatTime(updatedEvent.startTime),
        endTime: formatTime(updatedEvent.endTime),
      };
    }
    // Restore-only, no other field changes
    return {
      ...restoredEvent,
      startTime: formatTime(restoredEvent.startTime),
      endTime: formatTime(restoredEvent.endTime),
    };
  }

  // Normal update (no restore)
  const updatedEvent = await eventDao.updateEventById(dataToSave, foreignKeys, { id: rowId });
  return {
    ...updatedEvent,
    startTime: formatTime(updatedEvent.startTime),
    endTime: formatTime(updatedEvent.endTime),
  };
};

/**
 * Soft deletes an event item from the database by its ID.
 *
 * @param {number} id - The ID of the event item to delete.
 * @param {number} userId - The ID of the user performing the deletion.
 * @returns {Promise<Object>} The result with status code and event data or error message.
 */
export const deleteEventById = async (id, userId) => {
  const rowId = Number(id);
  const result = await eventDao.softDeleteEventById(rowId, userId);

  if (result.status === 'not-found') {
    return { status: 404, message: 'Event not found' };
  }
  if (result.status === 'already-deleted') {
    return { status: 409, message: 'Event already deleted' };
  }
  // status === 'deleted'
  return { status: 200, event: result.event };
};
