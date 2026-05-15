import * as prismaService from '../../utils/prisma/dao.js';
import { TABLESNAMES } from '../../utils/constants/enums.js';
import { prisma, Prisma } from '../../config/db.js';

const tableName = TABLESNAMES.EVENTS;

/**
 * Creates a new event in the database.
 *
 * @param {Object} data - The data to insert into the database.
 * @param {string} data.title - The title of the event.
 * @param {string} data.description - The description of the event.
 * @param {string} data.speaker - The speaker of the event.
 * @param {string} data.startTime - The start time of the event.
 * @param {string} data.endTime - The end time of the event.
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
 * Retrieves all events from the database based on the provided filters.
 *
 * @param {string} searchQuery - Search term to filter events.
 * @returns {Promise<Array>} A list of events matching the filters from the database.
 */
export const getAllEvents = async (searchQuery) => {
  const events = await prisma.$queryRaw`
    SELECT e.*, 
           et.id AS "eventTypeId", et.code AS "eventTypeCode", et.description AS "eventTypeDescription",
           u.name AS "userEventCreatedName"
    FROM "events" e
    LEFT JOIN "eventTypes" et ON e."eventTypeId" = et.id
    LEFT JOIN "users" u ON e."createdBy" = u.id
    ${
      searchQuery
        ? Prisma.sql`
      WHERE e."title" ILIKE ${'%' + searchQuery + '%'}
         OR e."description" ILIKE ${'%' + searchQuery + '%'}
         OR e."speaker" ILIKE ${'%' + searchQuery + '%'}
    `
        : Prisma.empty
    }
    ORDER BY e."createdOn" DESC
  `;

  return events;
};

// //old version
// export const getAllEvents = async (searchQuery) => {
//   const events = await prisma.events.findMany({
//     where: {
//       ...(searchQuery
//         ? {
//             OR: [
//               { title: { contains: searchQuery, mode: 'insensitive' } },
//               { description: { contains: searchQuery, mode: 'insensitive' } },
//               { speaker: { contains: searchQuery, mode: 'insensitive' } }
//             ]
//           }
//         : {})

//     },
//     include: {
//       eventTypes: { select: { id: true, code: true, description: true } },
//       userEventCreated: { select: { name: true } }

//     }
//   })
//   return Promise.resolve(events)
// }

/**
 * Updates an existing event in the database based on the provided filter and data.
 *
 * @param {Object} data - The fields to update in the event.
 * @param {string} [data.title] - The title of the event.
 * @param {string} [data.description] - The description of the event.
 * @param {string} [data.speaker] - The speaker of the event.
 * @param {string} [data.startTime] - The start time of the event.
 * @param {string} [data.endTime] - The end time of the event.
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
 * Deletes an event from the database by its ID.
 *
 * @param {Object} where - The filter conditions to identify the event to delete.
 * @returns {Promise<Object>} The result of the delete operation.
 */
export const deleteEventById = async (where) =>
  prismaService.deleteRow(tableName, where);
