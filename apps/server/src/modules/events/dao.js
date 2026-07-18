import { prisma, Prisma } from '../../config/db.js';

/**
 * Creates a new event in the database.
 *
 * @param {Object} data - The data to insert into the database.
 * @param {string} data.title - The title of the event.
 * @param {string} data.description - The description of the event.
 * @param {string} data.speaker - The speaker of the event.
 * @param {Date} data.startTime - The start time of the event (Time(0) column).
 * @param {Date} data.endTime - The end time of the event (Time(0) column).
 * @param {string} data.eventDate - The event date.
 * @param {Date} data.createdOn - The creation timestamp.
 * @param {Object} foreignKeys - The foreign keys for the event.
 * @param {number} foreignKeys.createdBy - The ID of the user who created the event.
 * @param {number} foreignKeys.type - The ID of the event type.
 * @returns {Promise<Object>} The created event in the database.
 */
export const createEvent = async (data, foreignKeys) => {
  const result = await prisma.events.create({
    data: {
      ...data,
      userEventCreated: {
        connect: {
          id: foreignKeys.createdBy,
        },
      },
      eventTypes: {
        connect: {
          id: foreignKeys.type,
        },
      },
    },
  });
  return Promise.resolve(result);
};

/**
 * Retrieves all available event types from the database.
 *
 * @returns {Promise<Array>} A list of event types from the database.
 */
export const getAllEventTypes = async () => {
  const events = await prisma.eventTypes.findMany();
  return Promise.resolve(events);
};

/**
 * Retrieves all events from the database based on the provided filters with pagination.
 *
 * @param {Object} params - Query parameters.
 * @param {string} [params.searchQuery] - Search term to filter events.
 * @param {number} params.take - Number of items to take (limit).
 * @param {number} params.skip - Number of items to skip (offset).
 * @param {number} params.page - Current page number.
 * @param {number} params.pageSize - Number of items per page.
 * @param {boolean} [params.showDeleted=false] - Whether to include soft-deleted events.
 * @param {number} [params.type] - Filter by event type ID (exact match on eventTypeId).
 * @param {Date} [params.dateFrom] - Filter by start date (inclusive).
 * @param {Date} [params.dateTo] - Filter by end date (inclusive, normalized to end-of-day).
 * @param {string} [params.speaker] - Filter by speaker name (case-insensitive partial match).
 * @param {string} [params.status] - Filter by status: 'upcoming', 'past', or 'all'.
 * @param {string} [params.modality] - Filter by modality: 'ONLINE', 'IN_PERSON', or 'HYBRID'.
 * @returns {Promise<Object>} Paginated list of events with total count.
 */
export const getAllEvents = async ({
  searchQuery,
  take,
  skip,
  page,
  pageSize,
  showDeleted = false,
  type,
  dateFrom,
  dateTo,
  speaker,
  status,
  modality,
}) => {
  const conditions = [];

  // Deleted filter (always present unless showDeleted=true)
  if (!showDeleted) {
    conditions.push({ deletedAt: null });
  }

  // Search query filter (existing OR block on title/description/speaker)
  if (searchQuery) {
    conditions.push({
      OR: [
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } },
        { speaker: { contains: searchQuery, mode: 'insensitive' } },
      ],
    });
  }

  // Type filter: exact match on eventTypeId
  if (type !== undefined) {
    conditions.push({ eventTypeId: type });
  }

  // Date range filter: inclusive range with dateTo normalized to end-of-day
  if (dateFrom !== undefined || dateTo !== undefined) {
    const dateFilter = {};
    if (dateFrom !== undefined) {
      dateFilter.gte = dateFrom;
    }
    if (dateTo !== undefined) {
      // Normalize dateTo to end-of-day (23:59:59.999) for inclusive range
      const dateToEndOfDay = new Date(dateTo.getTime() + 24 * 60 * 60 * 1000 - 1);
      dateFilter.lte = dateToEndOfDay;
    }
    conditions.push({ eventDate: dateFilter });
  }

  // Speaker filter: case-insensitive partial match
  if (speaker) {
    conditions.push({ speaker: { contains: speaker, mode: 'insensitive' } });
  }

  // Status filter: derive upcoming/past from server UTC time
  if (status && status !== 'all') {
    const now = new Date();
    const endOfTodayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    const startOfTodayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const currentTimeOnEpoch = new Date(Date.UTC(1970, 0, 1, now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));

    if (status === 'upcoming') {
      conditions.push({
        OR: [
          { eventDate: { gt: endOfTodayUTC } },
          {
            AND: [
              { eventDate: { gte: startOfTodayUTC, lte: endOfTodayUTC } },
              { endTime: { gt: currentTimeOnEpoch } },
            ],
          },
        ],
      });
    } else if (status === 'past') {
      conditions.push({
        OR: [
          { eventDate: { lt: startOfTodayUTC } },
          {
            AND: [
              { eventDate: { gte: startOfTodayUTC, lte: endOfTodayUTC } },
              { endTime: { lte: currentTimeOnEpoch } },
            ],
          },
        ],
      });
    }
  }

  // Modality filter: exact match on modality enum
  if (modality) {
    conditions.push({ modality });
  }

  const where = conditions.length > 0 ? { AND: conditions } : {};

  const [data, total] = await Promise.all([
    prisma.events.findMany({
      where,
      include: {
        eventTypes: true,
        userEventCreated: true,
      },
      orderBy: [{ eventDate: 'desc' }, { startTime: 'asc' }],
      take,
      skip,
    }),
    prisma.events.count({ where }),
  ]);

  return { data, total, page, pageSize };
};

/**
 * Updates an existing event in the database based on the provided filter and data.
 *
 * @param {Object} data - The fields to update in the event.
 * @param {string} [data.title] - The title of the event.
 * @param {string} [data.description] - The description of the event.
 * @param {string} [data.speaker] - The speaker of the event.
 * @param {Date} [data.startTime] - The start time of the event (Time(0) column).
 * @param {Date} [data.endTime] - The end time of the event (Time(0) column).
 * @param {string} [data.eventDate] - The event date.
 * @param {Date} [data.updatedOn] - The timestamp of the last update.
 * @param {Object} foreignKeys - The foreign keys for the event.
 * @param {number} foreignKeys.type - The ID of the event type.
 * @param {Object} where - The conditions to identify the event to update.
 * @returns {Promise<Object>} The updated event in the database.
 */
export const updateEventById = async (data, foreignKeys, where) => {
  const result = await prisma.events.update({
    where,
    data: {
      ...data,
      ...(data.type !== undefined && {
        eventTypes: {
          connect: {
            id: foreignKeys.type,
          },
        },
      }),
    },
  });
  return Promise.resolve(result);
};

/**
 * Soft deletes an event by setting deletedAt and deletedBy fields.
 *
 * @param {number} id - The ID of the event to soft delete.
 * @param {number} userId - The ID of the user performing the deletion.
 * @returns {Promise<Object>} Result object with status and event data.
 * @throws {Error} If database operation fails.
 */
export const softDeleteEventById = async (id, userId) => {
  const event = await prisma.events.findUnique({ where: { id } });

  if (!event) {
    return { status: 'not-found' };
  }

  if (event.deletedAt !== null) {
    return { status: 'already-deleted' };
  }

  const updatedEvent = await prisma.events.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      deletedBy: userId,
      updatedOn: new Date(),
    },
  });

  return { status: 'deleted', event: updatedEvent };
};

/**
 * Restores a soft-deleted event by clearing deletedAt and deletedBy fields.
 *
 * @param {number} id - The ID of the event to restore.
 * @returns {Promise<Object|null>} The restored event or null if not found.
 * @throws {Error} If database operation fails.
 */
export const restoreEventById = async (id) => {
  const event = await prisma.events.findUnique({ where: { id } });

  if (!event) {
    return null;
  }

  const restoredEvent = await prisma.events.update({
    where: { id },
    data: {
      deletedAt: null,
      deletedBy: null,
      updatedOn: new Date(),
    },
  });

  return Promise.resolve(restoredEvent);
};
