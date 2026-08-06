import * as attendeeDao from './dao.js';
import { canTransition } from '../stateMachine.js';
import { prisma } from '../../../config/db.js';
import ClientError from '../../../utils/responses&Errors/errors.js';

/**
 * Custom error creator with statusCode property for consistent error handling.
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @returns {Error} Error with statusCode property
 */
const createError = (statusCode, message) => {
  const error = new ClientError(message, statusCode);
  return error;
};

/**
 * Registers a user for an event.
 *
 * @param {number} eventId - The event ID.
 * @param {number} userId - The user ID.
 * @returns {Promise<Object>} The created or updated attendee record.
 * @throws {Error} If event not found, event is in the past, already registered, or capacity exceeded.
 */
export const register = async (eventId, userId) => {
  // 1. Find event
  const event = await attendeeDao.findEventById(eventId);
  if (!event) {
    throw createError(404, 'Event not found');
  }

  // 2. Check event is not in the past
  if (new Date(event.eventDate) < new Date()) {
    throw createError(400, 'Cannot register for past events');
  }

  // 3. Check existing registration — idempotent: if already registered, return current state
  const existing = await attendeeDao.findAttendeeByUserAndEvent(
    eventId,
    userId
  );
  if (existing) {
    if (existing.status === 'CONFIRMED' || existing.status === 'WAITLIST') {
      return existing;
    }
    // If CANCELLED, allow re-registration (will update existing row)
  }

  // 4. Determine status based on capacity
  let status;
  if (event.capacity === 0) {
    // Unlimited capacity
    status = 'CONFIRMED';
  } else {
    const confirmedCount = await attendeeDao.countConfirmedAttendees(eventId);
    if (confirmedCount >= event.capacity) {
      status = 'WAITLIST';
    } else {
      status = 'CONFIRMED';
    }
  }

  // 5. Execute in transaction
  return prisma.$transaction(async (tx) => {
    // Handle capacity check with optimistic lock for CONFIRMED with limited capacity
    if (event.capacity > 0 && status === 'CONFIRMED') {
      const updatedRows = await attendeeDao.updateEventAttendeeCountWithLock(
        eventId,
        event.attendeeCount,
        tx
      );
      if (updatedRows === 0) {
        // Race condition - someone else took the spot, put on waitlist
        status = 'WAITLIST';
      }
    }

    let attendee;
    const previousStatus = existing?.status || null;

    if (existing) {
      // Re-registration: update existing attendee
      attendee = await attendeeDao.updateAttendeeStatus(
        existing.id,
        status,
        tx
      );
    } else {
      // New registration
      attendee = await attendeeDao.createAttendee(
        { eventId, userId, status },
        tx
      );
    }

    // Optimistic lock already incremented attendeeCount for capacity > 0 above.
    // Only need explicit increment for unlimited capacity (no lock path).
    if (status === 'CONFIRMED' && event.capacity === 0) {
      // Unlimited capacity - simple increment
      await attendeeDao.incrementAttendeeCount(eventId, tx);
    }

    // Create audit log
    await attendeeDao.createAuditLog(
      {
        attendeeId: attendee.id,
        eventId,
        previousStatus,
        newStatus: status,
        changedBy: userId,
      },
      tx
    );

    return attendee;
  });
};

/**
 * Cancels a user's registration for an event.
 *
 * @param {number} eventId - The event ID.
 * @param {number} userId - The user ID.
 * @returns {Promise<Object>} The updated attendee record with CANCELLED status.
 * @throws {Error} If registration not found, already cancelled, or invalid transition.
 */
export const cancel = async (eventId, userId) => {
  // 1. Find attendee
  const attendee = await attendeeDao.findAttendeeByUserAndEvent(
    eventId,
    userId
  );
  if (!attendee) {
    throw createError(404, 'Registration not found');
  }

  // 2. Check if already cancelled
  if (attendee.status === 'CANCELLED') {
    throw createError(409, 'Registration already cancelled');
  }

  // 3. Validate state transition
  if (!canTransition(attendee.status, 'CANCELLED')) {
    throw createError(400, `Cannot cancel from ${attendee.status} status`);
  }

  const previousStatus = attendee.status;

  // 4. Execute in transaction
  return prisma.$transaction(async (tx) => {
    // Update attendee status to CANCELLED
    const updatedAttendee = await attendeeDao.updateAttendeeStatus(
      attendee.id,
      'CANCELLED',
      tx
    );

    // Decrement count if was CONFIRMED
    if (previousStatus === 'CONFIRMED') {
      await attendeeDao.decrementAttendeeCount(eventId, tx);
    }

    // Create audit log
    await attendeeDao.createAuditLog(
      {
        attendeeId: attendee.id,
        eventId,
        previousStatus,
        newStatus: 'CANCELLED',
        changedBy: userId,
      },
      tx
    );

    // Promote from waitlist if was CONFIRMED
    if (previousStatus === 'CONFIRMED') {
      await promoteFromWaitlist(eventId, tx);
    }

    return updatedAttendee;
  });
};

/**
 * Lists attendees for an event with pagination and optional status filter.
 *
 * @param {number} eventId - The event ID.
 * @param {Object} query - Query parameters.
 * @param {number} [query.page=1] - Page number (1-based).
 * @param {number} [query.limit=20] - Items per page.
 * @param {string} [query.status] - Optional status filter (CONFIRMED, WAITLIST, CANCELLED).
 * @returns {Promise<Object>} Paginated result: { data, total, page, limit, totalPages }.
 */
export const listAttendees = async (eventId, query) => {
  return attendeeDao.listAttendees(eventId, query);
};

/**
 * Updates an attendee's status (admin operation).
 *
 * @param {number} attendeeId - The attendee ID.
 * @param {string} newStatus - The new status (CONFIRMED, WAITLIST, CANCELLED).
 * @param {number} adminUserId - The admin user ID making the change.
 * @returns {Promise<Object>} The updated attendee record.
 * @throws {Error} If attendee not found, already in target status, invalid transition, or capacity exceeded.
 */
export const updateAttendeeStatus = async (
  attendeeId,
  newStatus,
  adminUserId
) => {
  // 1. Find attendee
  const attendee = await attendeeDao.findAttendeeById(attendeeId);
  if (!attendee) {
    throw createError(404, 'Attendee not found');
  }

  // 2. Check if already in target status
  if (attendee.status === newStatus) {
    throw createError(409, `Attendee already has status ${newStatus}`);
  }

  // 3. Validate state transition
  if (!canTransition(attendee.status, newStatus)) {
    throw createError(
      400,
      `Cannot transition from ${attendee.status} to ${newStatus}`
    );
  }

  const eventId = attendee.eventId;
  const previousStatus = attendee.status;

  // 4. If promoting to CONFIRMED, check event capacity
  if (newStatus === 'CONFIRMED') {
    const event = await attendeeDao.findEventById(eventId);
    if (event && event.capacity > 0) {
      const confirmedCount = await attendeeDao.countConfirmedAttendees(eventId);
      if (confirmedCount >= event.capacity) {
        throw createError(
          409,
          'Event at capacity, cannot promote to CONFIRMED'
        );
      }
    }
  }

  // 5. Execute in transaction
  return prisma.$transaction(async (tx) => {
    // Update attendee status
    const updatedAttendee = await attendeeDao.updateAttendeeStatus(
      attendeeId,
      newStatus,
      tx
    );

    // Adjust attendee count
    if (previousStatus === 'CONFIRMED' && newStatus !== 'CONFIRMED') {
      // Was confirmed, now not confirmed - decrement
      await attendeeDao.decrementAttendeeCount(eventId, tx);
    } else if (previousStatus !== 'CONFIRMED' && newStatus === 'CONFIRMED') {
      // Was not confirmed, now confirmed - increment
      await attendeeDao.incrementAttendeeCount(eventId, tx);
    }

    // Create audit log
    await attendeeDao.createAuditLog(
      {
        attendeeId,
        eventId,
        previousStatus,
        newStatus,
        changedBy: adminUserId,
      },
      tx
    );

    // If changed from CONFIRMED to CANCELLED, promote from waitlist
    if (previousStatus === 'CONFIRMED' && newStatus === 'CANCELLED') {
      await promoteFromWaitlist(eventId, tx);
    }

    return updatedAttendee;
  });
};

/**
 * Promotes the earliest waitlisted attendee to CONFIRMED (FIFO).
 * Called inside an existing transaction.
 *
 * @param {number} eventId - The event ID.
 * @param {Prisma.TransactionClient} tx - Prisma transaction client.
 * @returns {Promise<Object|null>} The promoted attendee or null if no waitlist.
 */
export const promoteFromWaitlist = async (eventId, tx) => {
  // 1. Find earliest waitlisted attendee
  const waitlistAttendee = await attendeeDao.findEarliestWaitlist(eventId, tx);
  if (!waitlistAttendee) {
    return null;
  }

  // 2. Update status to CONFIRMED
  const promotedAttendee = await attendeeDao.updateAttendeeStatus(
    waitlistAttendee.id,
    'CONFIRMED',
    tx
  );

  // 3. Increment attendee count
  await attendeeDao.incrementAttendeeCount(eventId, tx);

  // 4. Create audit log (changedBy: null for system promotion)
  await attendeeDao.createAuditLog(
    {
      attendeeId: waitlistAttendee.id,
      eventId,
      previousStatus: 'WAITLIST',
      newStatus: 'CONFIRMED',
      changedBy: null,
    },
    tx
  );

  return promotedAttendee;
};

/**
 * Creates an audit log entry for attendee status changes.
 *
 * @param {number} attendeeId - The attendee ID.
 * @param {number} eventId - The event ID.
 * @param {string|null} previousStatus - The previous status.
 * @param {string} newStatus - The new status.
 * @param {number|null} changedBy - The user ID who made the change (null for system).
 * @param {Prisma.TransactionClient} [tx] - Optional Prisma transaction client.
 * @returns {Promise<Object>} The created audit log entry.
 */
export const createAuditLog = async (
  attendeeId,
  eventId,
  previousStatus,
  newStatus,
  changedBy,
  tx
) => {
  return attendeeDao.createAuditLog(
    {
      attendeeId,
      eventId,
      previousStatus,
      newStatus,
      changedBy,
    },
    tx
  );
};
