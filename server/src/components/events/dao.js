import * as prismaService from '../../utils/prisma/dao.js'
import { TABLESNAMES } from '../../utils/constants/enums.js'
import { prisma, Prisma } from '../../config/db.js'

const tableName = TABLESNAMES.EVENTS

/**
 * Creates a new row in the database with the provided data.
 *
 * @param {Object} data - The data to insert into the database.
 * @returns {Promise<Object>} The created row in the database.
 */
export const createEvent = async (data, foreignKeys) => {
  const result = await prisma.events.create({
    data: {
      ...data,
      userEventCreated: {
        connect: {
          id: foreignKeys.createdBy
        }
      },
      eventTypes: {
        connect: {
          id: foreignKeys.type
        }
      }

    }
  })
  return Promise.resolve(result)
}

/**
 * Retrieves all available event statuses from the database.
 *
 * @returns {Promise<Array>} A list of event statuses from the database.
 */
export const getAllEventTypes = async () => {
  const events = await prisma.eventTypes.findMany()
  return Promise.resolve(events)
}

/**
 * Retrieves all events from the database based on the provided filters.
 *
 * @param {string} searchQuery - The description to filter events by.
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
    ${searchQuery
? Prisma.sql`
      WHERE e."title" ILIKE ${'%' + searchQuery + '%'}
         OR e."description" ILIKE ${'%' + searchQuery + '%'}
         OR e."speaker" ILIKE ${'%' + searchQuery + '%'}
    `
: Prisma.empty}
  `

  return events
}

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
 * Updates an existing row in the database based on the provided filter and data.
 *
 * @param {Object} data - The fields to update in the row.
 * @param {Object} foreignKeys - fo.
 * @param {Object} where - The conditions to identify the row to update.
 * @returns {Promise<Object>} The updated row in the database.
 */
export const updateEventById = async (data, foreignKeys, where) => {
  const result = await prisma.events.update({
    where,
    data: {
      ...data,
      eventTypes: {
        connect: {
          id: foreignKeys.type
        }
      }
    }
  })
  return Promise.resolve(result)
}

/**
 * Deletes a row from the database based on the provided filter.
 *
 * @param {Object} where - The filter conditions to identify the row to delete.
 * @returns {Promise<Object>} The result of the delete operation.
 */
export const deleteEventById = async (where) => prismaService.deleteRow(tableName, where)
