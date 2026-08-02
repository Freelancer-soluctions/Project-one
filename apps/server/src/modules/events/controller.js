import globalResponse from '../../utils/responses&Errors/globalResponse.js';
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js';
import * as eventService from './service.js';

/**
 * Get all events with optional filters.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.safeQuery - Safe query parameters with filters
 * @param {number} [req.safeQuery.page] - Page number for pagination
 * @param {number} [req.safeQuery.limit] - Number of items per page
 * @param {string} [req.safeQuery.type] - Filter by event type
 * @param {Date} [req.safeQuery.dateFrom] - Filter by start date
 * @param {Date} [req.safeQuery.dateTo] - Filter by end date
 * @param {boolean} [req.safeQuery.showDeleted] - Show deleted events (admin only)
 * @param {string} [req.userRole] - User role from JWT token
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Returns paginated list of events
 */
export const getAllEvents = handleCatchErrorAsync(async (req, res) => {
  const query = req.safeQuery;
  const showDeleted = req.safeQuery.showDeleted ?? false;

  // Admin-only showDeleted guard (Task 6.4)
  if (showDeleted && req.userRole !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      statusCode: 403,
      message: 'Access denied: showDeleted requires ADMIN role',
    });
  }

  const items = await eventService.getAllEvents({
    ...query,
    showDeleted,
  });
  globalResponse(res, 200, items);
});

/**
 * Create an event item.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - Request body containing event data
 * @param {string} req.body.title - Event title
 * @param {string} req.body.description - Event description
 * @param {Date} req.body.startDate - Event start date
 * @param {Date} req.body.endDate - Event end date
 * @param {string} req.body.type - Event type
 * @param {string} req.userId - Authenticated user ID from token verification
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Creates new event and returns event object
 */
export const createEvent = handleCatchErrorAsync(async (req, res) => {
  const userId = req.userId; // viene del token
  const { body } = req;
  const createdEvent = await eventService.createEvent(body, userId);
  globalResponse(res, 201, createdEvent, 'Item created successfully');
});

/**
 * Get the event types.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Returns list of event types
 */
export const getAllEventTypes = handleCatchErrorAsync(async (req, res) => {
  const data = await eventService.getAllEventTypes();
  globalResponse(res, 200, data);
});

/**
 * Update an event item.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Event ID from URL
 * @param {Object} req.body - Request body containing event data to update
 * @param {string} [req.body.title] - Event title
 * @param {string} [req.body.description] - Event description
 * @param {Date} [req.body.startDate] - Event start date
 * @param {Date} [req.body.endDate] - Event end date
 * @param {string} [req.body.type] - Event type
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Updates event and returns confirmation message
 */
export const updateEventById = handleCatchErrorAsync(async (req, res) => {
  const { body } = req;
  const { id } = req.params;
  const result = await eventService.updateEventById(id, body);
  if (result === null) {
    return res
      .status(404)
      .json({ success: false, statusCode: 404, message: 'Event not found' });
  }
  globalResponse(res, 200, { message: 'Item updated successfully' });
});

/**
 * Delete event by ID (soft delete).
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Event ID from URL
 * @param {string} req.userId - Authenticated user ID from JWT token
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Deletes event and returns confirmation message
 */
export const deleteEventById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId; // viene del token JWT
  const result = await eventService.deleteEventById(id, userId);

  // Handle status codes from service (Task 6.1)
  if (result.status === 404) {
    return res
      .status(404)
      .json({ success: false, statusCode: 404, message: 'Event not found' });
  }
  if (result.status === 409) {
    return res.status(409).json({
      success: false,
      statusCode: 409,
      message: 'Event already deleted',
    });
  }

  globalResponse(res, 200, result.event, 'Item deleted successfully');
});
