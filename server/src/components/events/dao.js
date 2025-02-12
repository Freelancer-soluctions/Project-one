import * as prismaService from '../utils/dao.js'
import { TABLESNAMES } from '../utils/enums/enums.js'
import prisma from '../../config/db.js'

const tableName = TABLESNAMES.EVENTS

/**
 * Retrieves all events from the database based on the provided filters.
 *
 * @param {string} description - The description to filter events by.
 * @param {Date} fromDate - The start date to filter events by.
 * @param {Date} toDate - The end date to filter events by.
 * @param {string} statusCode - The status code to filter events by.
 * @returns {Promise<Array>} A list of events matching the filters from the database.
 */
export const getAllEvents = async (description, fromDate, toDate, statusCode) => {
  const events = await prisma.events.findMany({
    where: {
      ...(description
        ? {
            AND: [
              {
                description: { contains: description }
              }
            ]
          }
        : {}),
      ...((fromDate && toDate)
        ? {
            AND: [
              {
                createdOn: {
                  gte: new Date(fromDate),
                  lte: new Date(toDate)
                }
              }
            ]
          }
        : {}),
      ...(statusCode
        ? {
            status: {
              code: { equals: statusCode }
            }
          }
        : {})
    },
    include: {
      status: { select: { id: true, code: true, description: true } },
      userEventCreated: { select: { name: true } },
      userEventClosed: { select: { name: true } },
      userEventPending: { select: { name: true } }
    }
  })
  return Promise.resolve(events)
}

/**
 * Retrieves all available event statuses from the database.
 *
 * @returns {Promise<Array>} A list of event statuses from the database.
 */
export const getAllEventStatus = async () => {
  const events = await prisma.eventStatus.findMany()
  return Promise.resolve(events)
}

/**
 * Retrieves one row from the database based on the provided filter parameters.
 *
 * @param {Object} params - The filter parameters for retrieving the row.
 * @param {Object} params.where - The conditions to find the row.
 * @param {Object} params.include - Additional related data to include.
 * @returns {Promise<Object>} The requested row from the database.
 */
export const getOneRow = async ({ where, include }) => prismaService.getOneRow({
  tableName,
  where,
  include
})

/**
 * Creates a new row in the database with the provided data.
 *
 * @param {Object} data - The data to insert into the database.
 * @returns {Promise<Object>} The created row in the database.
 */
export const createEvent = async (data) => {
  const result = await prisma.events.create({
    data: {
      ...data,
      userEventCreated: {
        connect: {
          id: data.createdBy
        }
      }

    }
  })
  return Promise.resolve(result)
}

/**
 * Updates an existing row in the database based on the provided filter and data.
 *
 * @param {Object} data - The fields to update in the row.
 * @param {Object} where - The conditions to identify the row to update.
 * @returns {Promise<Object>} The updated row in the database.
 */
export const updateRow = async (data, where) => {
  const result = await prisma.events.update({
    where,
    data: {
      description: data.description,
      document: data.document,
      documentId: data.documentId,
      pendingOn: data.pendingOn ? data.pendingOn : undefined,
      userEventPending: data.pendingBy
        ? {
            connect: {
              id: data.pendingBy
            }
          }
        : undefined,
      closedOn: data.closedOn ? data.closedOn : undefined,
      userEventClosed: data.closedBy
        ? {
            connect: {
              id: data.closedBy
            }
          }
        : undefined,
      status: {
        connect: {
          id: data.statusId
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
export const deleteRow = async (where) => prismaService.deleteRow(tableName, where)
