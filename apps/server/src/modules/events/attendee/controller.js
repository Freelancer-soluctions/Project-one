import globalResponse from '../../../utils/responses&Errors/globalResponse.js';
import handleCatchErrorAsync from '../../../utils/responses&Errors/handleCatchErrorAsync.js';
import * as eventAttendeeService from './service.js';

/**
 * Register self for an event.
 *
 * @param {Object} req - Request object
 * @param {Object} req.params - { eventId }
 * @param {number} req.userId - Auth user ID from JWT
 * @param {Object} res - Response object
 */
export const registerForEvent = handleCatchErrorAsync(async (req, res) => {
  const userId = req.userId;
  const { eventId } = req.params;
  const attendee = await eventAttendeeService.register(Number(eventId), userId);
  globalResponse(res, 201, attendee, 'Registration successful');
});

/**
 * Cancel own registration for an event.
 *
 * @param {Object} req - Request object
 * @param {Object} req.params - { eventId }
 * @param {number} req.userId - Auth user ID from JWT
 * @param {Object} res - Response object
 */
export const cancelRegistration = handleCatchErrorAsync(async (req, res) => {
  const userId = req.userId;
  const { eventId } = req.params;
  const attendee = await eventAttendeeService.cancel(Number(eventId), userId);
  globalResponse(res, 200, attendee, 'Registration cancelled');
});

/**
 * List attendees for an event (admin).
 *
 * @param {Object} req - Request object
 * @param {Object} req.params - { eventId }
 * @param {Object} req.safeQuery - { page, limit, status? }
 * @param {Object} res - Response object
 */
export const listEventAttendees = handleCatchErrorAsync(async (req, res) => {
  const { eventId } = req.params;
  const query = req.safeQuery;
  const result = await eventAttendeeService.listAttendees(Number(eventId), query);
  globalResponse(res, 200, result);
});

/**
 * Update attendee status (admin).
 *
 * @param {Object} req - Request object
 * @param {Object} req.params - { eventId, attendeeId }
 * @param {Object} req.body - { status, reason? }
 * @param {number} req.userId - Auth user ID from JWT
 * @param {Object} res - Response object
 */
export const updateAttendeeStatus = handleCatchErrorAsync(async (req, res) => {
  const userId = req.userId;
  const { attendeeId } = req.params;
  const { status } = req.body;
  const attendee = await eventAttendeeService.updateAttendeeStatus(Number(attendeeId), status, userId);
  globalResponse(res, 200, attendee, 'Attendee status updated');
});