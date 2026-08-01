import { prisma } from '../../../config/db.js';

/**
 * Finds an attendee by event ID and user ID.
 *
 * @param {number} eventId - The event ID.
 * @param {number} userId - The user ID.
 * @param {Prisma.TransactionClient} [tx] - Optional Prisma transaction client.
 * @returns {Promise<Object|null>} The attendee or null if not found.
 */
export const findAttendeeByUserAndEvent = async (eventId, userId, tx) => {
  const client = tx || prisma;
  const attendee = await client.attendees.findFirst({
    where: {
      eventId,
      userId,
    },
  });
  return attendee;
};

/**
 * Finds an attendee by primary key ID, including user relation.
 *
 * @param {number} attendeeId - The attendee ID.
 * @param {Prisma.TransactionClient} [tx] - Optional Prisma transaction client.
 * @returns {Promise<Object|null>} The attendee with user relation (id, name, email) or null if not found.
 */
export const findAttendeeById = async (attendeeId, tx) => {
  const client = tx || prisma;
  const attendee = await client.attendees.findUnique({
    where: { id: attendeeId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
  return attendee;
};

/**
 * Counts confirmed attendees for an event.
 *
 * @param {number} eventId - The event ID.
 * @param {Prisma.TransactionClient} [tx] - Optional Prisma transaction client.
 * @returns {Promise<number>} Count of confirmed attendees.
 */
export const countConfirmedAttendees = async (eventId, tx) => {
  const client = tx || prisma;
  const count = await client.attendees.count({
    where: {
      eventId,
      status: 'CONFIRMED',
    },
  });
  return count;
};

/**
 * Finds the earliest waitlisted attendee for an event.
 *
 * @param {number} eventId - The event ID.
 * @param {Prisma.TransactionClient} [tx] - Optional Prisma transaction client.
 * @returns {Promise<Object|null>} The earliest waitlisted attendee or null if none.
 */
export const findEarliestWaitlist = async (eventId, tx) => {
  const client = tx || prisma;
  const attendee = await client.attendees.findFirst({
    where: {
      eventId,
      status: 'WAITLIST',
    },
    orderBy: { createdAt: 'asc' },
  });
  return attendee;
};

/**
 * Creates a new attendee record.
 *
 * @param {Object} data - The attendee data.
 * @param {number} data.eventId - The event ID.
 * @param {number} data.userId - The user ID.
 * @param {string} data.status - The attendee status (CONFIRMED, WAITLIST, CANCELLED).
 * @param {Prisma.TransactionClient} [tx] - Optional Prisma transaction client.
 * @returns {Promise<Object>} The created attendee.
 */
export const createAttendee = async (data, tx) => {
  const client = tx || prisma;
  const attendee = await client.attendees.create({
    data: {
      eventId: data.eventId,
      userId: data.userId,
      status: data.status,
      createdAt: new Date(),
    },
  });
  return attendee;
};

/**
 * Updates an attendee's status by ID.
 *
 * @param {number} attendeeId - The attendee ID.
 * @param {string} newStatus - The new status (CONFIRMED, WAITLIST, CANCELLED).
 * @param {Prisma.TransactionClient} [tx] - Optional Prisma transaction client.
 * @returns {Promise<Object>} The updated attendee.
 */
export const updateAttendeeStatus = async (attendeeId, newStatus, tx) => {
  const client = tx || prisma;
  const attendee = await client.attendees.update({
    where: { id: attendeeId },
    data: {
      status: newStatus,
      updatedAt: new Date(),
    },
  });
  return attendee;
};

/**
 * Atomically increments the attendee count on an event.
 *
 * @param {number} eventId - The event ID.
 * @param {Prisma.TransactionClient} [tx] - Optional Prisma transaction client.
 * @returns {Promise<Object>} The updated event.
 */
export const incrementAttendeeCount = async (eventId, tx) => {
  const client = tx || prisma;
  const event = await client.events.update({
    where: { id: eventId },
    data: {
      attendeeCount: { increment: 1 },
    },
  });
  return event;
};

/**
 * Atomically decrements the attendee count on an event.
 *
 * @param {number} eventId - The event ID.
 * @param {Prisma.TransactionClient} [tx] - Optional Prisma transaction client.
 * @returns {Promise<Object>} The updated event.
 */
export const decrementAttendeeCount = async (eventId, tx) => {
  const client = tx || prisma;
  const event = await client.events.update({
    where: { id: eventId },
    data: {
      attendeeCount: { decrement: 1 },
    },
  });
  return event;
};

/**
 * Creates an audit log entry in registration_log.
 *
 * @param {Object} data - The audit log data.
 * @param {number} data.attendeeId - The attendee ID.
 * @param {number} data.eventId - The event ID.
 * @param {string} data.previousStatus - The previous status.
 * @param {string} data.newStatus - The new status.
 * @param {number} data.changedBy - The user ID who made the change.
 * @param {Prisma.TransactionClient} [tx] - Optional Prisma transaction client.
 * @returns {Promise<Object>} The created audit log entry.
 */
export const createAuditLog = async (data, tx) => {
  const client = tx || prisma;
  const log = await client.registration_log.create({
    data: {
      attendeeId: data.attendeeId,
      eventId: data.eventId,
      previousStatus: data.previousStatus,
      newStatus: data.newStatus,
      changedBy: data.changedBy,
      createdOn: new Date(),
    },
  });
  return log;
};

/**
 * Lists attendees for an event with pagination and optional status filter.
 *
 * @param {number} eventId - The event ID.
 * @param {Object} query - Query parameters.
 * @param {number} [query.page=1] - Page number (1-based).
 * @param {number} [query.limit=20] - Items per page.
 * @param {string} [query.status] - Optional status filter (CONFIRMED, WAITLIST, CANCELLED).
 * @param {Prisma.TransactionClient} [tx] - Optional Prisma transaction client.
 * @returns {Promise<Object>} Paginated result: { data, total, page, limit, totalPages }.
 */
export const listAttendees = async (eventId, query, tx) => {
  const client = tx || prisma;
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  const where = {
    eventId,
    ...(query.status
      ? { status: query.status }
      : { status: { in: ['CONFIRMED', 'WAITLIST'] } }),
  };

  const [data, total] = await Promise.all([
    client.attendees.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
    }),
    client.attendees.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return { data, total, page, limit, totalPages };
};

/**
 * Finds an event by ID with selected fields.
 *
 * @param {number} eventId - The event ID.
 * @param {Prisma.TransactionClient} [tx] - Optional Prisma transaction client.
 * @returns {Promise<Object|null>} The event (id, capacity, attendeeCount, eventDate) or null.
 */
export const findEventById = async (eventId, tx) => {
  const client = tx || prisma;
  const event = await client.events.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      capacity: true,
      attendeeCount: true,
      eventDate: true,
    },
  });
  return event;
};

/**
 * Optimistic lock update of event attendee count.
 * Increments attendeeCount only if current value matches expectedCount.
 *
 * @param {number} eventId - The event ID.
 * @param {number} expectedCount - The expected current attendeeCount value.
 * @param {Prisma.TransactionClient} [tx] - Optional Prisma transaction client.
 * @returns {Promise<number>} The count of updated rows (0 = lock failed, 1 = success).
 */
export const updateEventAttendeeCountWithLock = async (
  eventId,
  expectedCount,
  tx
) => {
  const client = tx || prisma;
  const result = await client.events.updateMany({
    where: {
      id: eventId,
      attendeeCount: expectedCount,
    },
    data: {
      attendeeCount: { increment: 1 },
    },
  });
  return result.count;
};
