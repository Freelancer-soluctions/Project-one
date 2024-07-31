import * as prismaService from '../utils/dao.js'
import prisma from '../../config/db.js'

const tableName = 'news'
/**
 *
 * @param {*} params :: filter params
 * @returns All rows by filter
 */

export const getAllRows = async (description, statusId, toDate, fromDate) => {
  console.log(description, statusId, toDate, fromDate)
  const news = await prisma.news.findMany({
    where: {
      description,

      createdOn: {
        lte: toDate, // End of date range
        gte: fromDate // Start of date range

      }
    }
  })

  console.log('resultnews', news)
  return Promise.resolve(news)
}

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
