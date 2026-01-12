import * as prismaService from '../../utils/prisma/dao.js';
import { TABLESNAMES } from '../../utils/constants/enums.js';
import { prisma } from '../../config/db.js';

const tableName = TABLESNAMES.NEWS;

/**
 * Retrieves all news records from the database based on the provided filters.
 *
 * @param {string} [description] - Optional description to filter news by (partial match).
 * @param {Date} [fromDate] - Optional start date to filter news by.
 * @param {Date} [toDate] - Optional end date to filter news by.
 * @param {string} [statusCode] - Optional status code to filter news by.
 * @param {number} take- take to filter by
 * @param {number} skip - skip to filter by
 * @returns {Promise<Array>} A list of news records that match the filters.
 */
export const getAllNews = async (
  description,
  fromDate,
  toDate,
  statusCode,
  take,
  skip
) => {
  const news = await prisma.news.findMany({
    where: {
      ...(description
        ? {
            AND: [
              {
                description: { contains: description },
              },
              // {
              //   NOT: { description: null }
              // }
            ],
          }
        : {}),

      ...(fromDate && toDate
        ? {
            AND: [
              {
                createdOn: {
                  gte: new Date(fromDate),
                  lte: new Date(toDate),
                },
              },
            ],
          }
        : {}),
      ...(statusCode
        ? {
            status: {
              code: { equals: statusCode },
            },
          }
        : {}),
      // status: { code: { equals: statusCode } }
    },
    include: {
      status: { select: { id: true, code: true, description: true } },
      userNewsCreated: { select: { name: true } },
      userNewsClosed: { select: { name: true } },
      userNewsPending: { select: { name: true } },
    },
    take,
    skip,

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
  });

  const total = await prisma.news.count({
    where: {
      ...(description
        ? {
            AND: [
              {
                description: {
                  contains: description,
                },
              },
            ],
          }
        : {}),

      ...(fromDate && toDate
        ? {
            AND: [
              {
                createdOn: {
                  gte: new Date(fromDate),
                  lte: new Date(toDate),
                },
              },
            ],
          }
        : {}),

      ...(statusCode
        ? {
            status: {
              code: {
                equals: statusCode,
              },
            },
          }
        : {}),
    },
  });

  return { dataList: news, total };
};

/**
 * Retrieves all available news statuses from the database.
 *
 * @returns {Promise<Array>} A list of all possible news statuses.
 */
export const getAllNewsStatus = async () => {
  // const statusId = 1
  const news = await prisma.newsStatus.findMany({
    // include: {
    //   news: { where: { statusId } }
    // }
  });
  return Promise.resolve(news);
};

/**
 * Creates a new news entry in the database.
 *
 * @param {Object} data - The data for the new news entry.
 * @param {string} data.description - The description of the news.
 * @param {string} [data.document] - Optional document attached to the news.
 * @param {string} [data.documentId] - Optional document identifier.
 * @param {Date} data.createdOn - The timestamp when the news was created.
 * @param {number} data.createdBy - The ID of the user who created the news.
 * @param {number} data.statusId - The ID of the associated status.
 * @param {number} [data.pendingBy] - Optional ID of the user pending the news.
 * @param {Date} [data.pendingOn] - Optional timestamp when the news was marked as pending.
 * @returns {Promise<Object>} The newly created news entry.
 */
export const createNew = async (data) => {
  const result = await prisma.news.create({
    data: {
      description: data.description,
      document: data.document,
      documentId: data.documentId,
      createdOn: data.createdOn,
      userNewsCreated: {
        connect: {
          id: data.createdBy,
        },
      },

      userNewsPending: data.pendingBy
        ? {
            connect: {
              id: data.pendingBy, // Si no hay un id, no incluyas esta propiedad
            },
          }
        : undefined,
      pendingOn: data.pendingOn ? data.pendingOn : undefined,
      status: {
        connect: {
          id: data.statusId,
        },
      },
    },
  });
  return Promise.resolve(result);
};

/**
 * Updates an existing news entry in the database based on the provided conditions.
 *
 * @param {Object} data - The fields to update in the news entry.
 * @param {string} [data.description] - Optional new description.
 * @param {string} [data.document] - Optional new document.
 * @param {string} [data.documentId] - Optional new document identifier.
 * @param {Date} [data.pendingOn] - Optional new pending timestamp.
 * @param {number} [data.pendingBy] - Optional ID of the user marking the news as pending.
 * @param {Date} [data.closedOn] - Optional new closed timestamp.
 * @param {number} [data.closedBy] - Optional ID of the user closing the news.
 * @param {number} data.statusId - The new status ID for the news.
 * @param {Object} where - The conditions to identify the news entry to update.
 * @returns {Promise<Object>} The updated news entry.
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
              id: data.pendingBy,
            },
          }
        : undefined,
      closedOn: data.closedOn ? data.closedOn : undefined,
      userNewsClosed: data.closedBy
        ? {
            connect: {
              id: data.closedBy,
            },
          }
        : undefined,
      status: {
        connect: {
          id: data.statusId,
        },
      },
    },
  });
  return Promise.resolve(result);
};

/**
 * Deletes a news entry from the database based on the provided conditions.
 *
 * @param {Object} where - The conditions to identify the news entry to delete.
 * @returns {Promise<Object>} The result of the delete operation.
 */
export const deleteRow = async (where) =>
  prismaService.deleteRow(tableName, where);
