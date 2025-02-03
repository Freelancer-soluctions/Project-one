import * as prismaService from '../utils/dao.js'
import { tableNames } from '../utils/enums/enums.js'
import prisma from '../../config/db.js'

const tableName = tableNames.NEWS

/**
 * Retrieves all news from the database based on the provided filters.
 *
 * @param {string} description - The description to filter news by.
 * @param {Date} fromDate - The start date to filter news by.
 * @param {Date} toDate - The end date to filter news by.
 * @param {string} statusCode - The status code to filter news by.
 * @returns {Promise<Array>} A list of news matching the filters from the database.
 */

export const getAllNews = async (description, fromDate, toDate, statusCode) => {
  const news = await prisma.news.findMany(
    {

      where: {
        ...(description
          ? {
              AND: [
                {
                  description: { contains: description }
                }
                // {
                //   NOT: { description: null }
                // }
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
              status:
                  {
                    code: { equals: statusCode }
                  }

            }
          : {})
        // status: { code: { equals: statusCode } }

      },
      include: {
        status: { select: { id: true, code: true, description: true } },
        userNewsCreated: { select: { name: true } },
        userNewsClosed: { select: { name: true } },
        userNewsPending: { select: { name: true } }

      }

      // select: {
      //   id: true,
      //   closedOn: true,
      //   createdOn: true,
      //   description: true,
      //   document: true,
      //   documentId: true,
      //   statusId: true,
      //   closedBy: true,
      //   createdBy: true,
      //   status: { select: { description: true } }

      // }

    })

  return Promise.resolve(news)
}

/**
 * Retrieves all available news statuses from the database.
 *
 * @returns {Promise<Array>} A list of news statuses from the database.
 */
export const getAllNewsStatus = async () => {
  // const statusId = 1
  const news = await prisma.newsStatus.findMany({
    // include: {
    //   news: { where: { statusId } }
    // }
  })
  return Promise.resolve(news)
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
export const createRow = async (data) => {
  const result = await prisma.news.create({
    data: {
      description: data.description,
      document: data.document,
      documentId: data.documentId,
      createdOn: data.createdOn,
      userNewsCreated: {
        connect: {
          id: data.createdBy
        }
      },

      userNewsPending: data.pendingBy
        ? {
            connect: {
              id: data.pendingBy // Si no hay un id, no incluyas esta propiedad
            }
          }
        : undefined,
      pendingOn: data.pendingOn ? data.pendingOn : undefined,
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
 * Updates an existing row in the database based on the provided filter and data.
 *
 * @param {Object} data - The fields to update in the row.
 * @param {Object} where - The conditions to identify the row to update.
 * @returns {Promise<Object>} The updated row in the database.
 */
export const updateRow = async (data, where) => {
  const result = await prisma.news.update({
    where,
    data: {
      description: data.description,
      document: data.document,
      documentId: data.documentId,
      pendingOn: data.pendingOn ? data.pendingOn : undefined,
      userNewsPending: data.pendingBy
        ? {
            connect: {
              id: data.pendingBy
            }
          }
        : undefined,
      closedOn: data.closedOn ? data.closedOn : undefined,
      userNewsClosed: data.closedBy
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
