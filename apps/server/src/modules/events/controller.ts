import globalResponse from '../../utils/responses&Errors/globalResponse.js';
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js';
import * as eventService from './service.js';
import { EventsFilters } from './schemas/events.joi.js';
import type {
  CreateEventInput,
  EventFilters,
  UpdateEventInput,
} from './types.js';

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
  // Self-validate query params using EventsFilters schema; fallback to req.query
  // when req.safeQuery is undefined (e.g., test mocks passthrough middleware).
  const validated = EventsFilters.validate(req.query, {
    abortEarly: false,
    allowUnknown: false,
  });
  // Cast único de la query validada por Joi (EventsFilters)
  const query = validated.value as EventFilters;

  // Validation failed -> return 400 with error messages
  if (validated.error) {
    const messages = validated.error.details.map((d) => d.message).join(', ');
    res.status(400).json({ message: messages });

    return;
  }

  // Fallback: if safeQuery was not set (test mocks), use validated req.query
  // Ensure required pagination fields exist with defaults
  if (!query.page) query.page = 1;
  if (!query.limit) query.limit = 20;

  const showDeleted = query.showDeleted ?? false;

  // Admin-only showDeleted guard (Task 6.4)
  if (showDeleted && req.userRole !== 'ADMIN') {
    res.status(403).json({
      success: false,
      statusCode: 403,
      message: 'Access denied: showDeleted requires ADMIN role',
    });

    return;
  }

  const { data, total } = await eventService.getAllEvents({
    ...query,
    showDeleted,
  });

  globalResponse(res, 200, {
    data,
    total,
    page: query.page,
    limit: query.limit,
  });
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
  const userId = req.userId as number; // viene del token
  // Cast único del body validado por Joi (EventsCreateSchema)
  const body = req.body as CreateEventInput;
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
  const { id } = req.params;
  // Cast único del body validado por Joi (EventsUpdateSchema)
  const body = req.body as UpdateEventInput;
  const result = await eventService.updateEventById(Number(id), body);
  if (result === null) {
    res
      .status(404)
      .json({ success: false, statusCode: 404, message: 'Event not found' });

    return;
  }
  globalResponse(
    res,
    200,
    { message: 'Item updated successfully' },
    'Item updated successfully'
  );
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
  const userId = req.userId as number; // viene del token JWT
  const result = await eventService.deleteEventById(Number(id), userId);

  // Handle status codes from service (Task 6.1)
  if (result.status === 404) {
    res
      .status(404)
      .json({ success: false, statusCode: 404, message: 'Event not found' });

    return;
  }
  if (result.status === 409) {
    res.status(409).json({
      success: false,
      statusCode: 409,
      message: 'Event already deleted',
    });
  }

  globalResponse(res, 200, result.event, 'Item deleted successfully');
});
