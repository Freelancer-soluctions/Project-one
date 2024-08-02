import * as prismaService from '../utils/dao.js'
import prisma from '../../config/db.js'

const tableName = 'news'

/**
 *
 * @param {string} description
 * @param {string} statusCode
 * @param {Date} toDate
 * @param {Date} fromDate
 * @returns all news from db
 */
export const getAllNews = async (description, statusCode, toDate, fromDate) => {
  const news = await prisma.news.findMany({
    where: {
      description: { contains: description },
      createdOn: {
        gte: new Date(fromDate),
        lte: new Date(toDate)

      }

    }
  })

  return Promise.resolve(news)
}

export const getAllNewsStatus = async () => {
  const news = await prisma.newsStatus.findMany()
  return Promise.resolve(news)
}

/**
 *
 * @param {*} params :: filter params
 * @returns All rows by filter
 */

export const getAllRows = async ({ where, include }) => prismaService.getRows({
  tableName,
  where,
  include
})

/**

 * @param {*} params :: filter params
 *
 * @returns One row by ID
 */
export const getOneRow = async ({ where, include }) => prismaService.getOneRow({
  tableName,
  where,
  include
})

/**
 *
 * @param {*} data :: Argument to create an item in DB
 * @returns Created row in db
 */
export const createRow = async (data) => prismaService.createRow(tableName, data)

/**
 *
 * @param {*} data :: Argument to create many items in Db.
 * @returns  Created row in db
 */

export const createManyRows = async (data) => prismaService.createManyRows(tableName, data)

/**
 *
 * @param {*} data :: Fields to update rows in Db.
 * @param {*} where :: DB filter
 * @returns
 */
export const updateRow = async (data, where) => prismaService.updateRow(tableName, data, where)

/**
 *
 * @param {*} where :: DB filter
 * @returns
 */
export const deleteRow = async (where) => prismaService.deleteRow(tableName, where)
