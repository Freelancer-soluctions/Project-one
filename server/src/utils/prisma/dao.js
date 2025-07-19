import { prisma } from '../../config/db.js'

/**
 *
 * @param {*} params :: filter params
 * @returns All rows by filter
 */

export const getRows = async ({
  tableName,
  where,
  include,
  select,
  orderBy
}) => {
  return prisma[tableName].findMany({
    ...(where && { where }),
    ...(include && { include }),
    ...(select && { select }),
    ...(orderBy && { orderBy })
  })
}

/**

 * @param {*} params :: filter params
 *
 * @returns One row by ID
 */
export const getOneRow = async ({ tableName, where, include }) => {
  return prisma[tableName].findUnique({
    ...(where && { where }),
    ...(include && { include })
  })
}

/**

 * @param {*} params :: filter params
 *
 * @returns One row by ramdon param
 */
export const getRow = async ({ tableName, where, include }) => {
  return prisma[tableName].findFirst({
    ...(where && { where }),
    ...(include && { include })
  })
}

/**
 *
 * @param {*} data :: Argument to create an item in DB
 * @returns Created row in db
 */
export const createRow = async (tableName, data) => {
  return prisma[tableName].create({ data })
}

/**
 *
 * @param {*} data :: Argument to create many items in Db.
 * @returns  Created row in db
 */

export const createManyRows = async (tableName, data) => {
  return prisma[tableName].createMany({
    skipDuplicates: true,
    data
  })
}

/**
 *
 * @param {*} data :: Fields to update rows in Db.
 * @param {*} where :: DB filter
 * @returns
 */
export const updateRow = async (tableName, data, where) => {
  return prisma[tableName].update({
    where,
    data
  })
}

/**
 *
 * @param {*} where :: DB filter
 * @returns
 */
export const deleteRow = async (tableName, where) => {
  return prisma[tableName].delete({ where })
}

/**
 *
 * @param {*} item :: Object returned from BD
 * @param {*} keys :: fileds to exclude
 * @returnsdata item without excluded fields

 */
export const excludefromObject = (item, keys) => {
  return Object.fromEntries(
    Object.entries(item).filter(([key]) => !keys.includes(key))
  )
}

/**
   *
   * @param {*} item :: Array returned from BD
   * @param {*} keys :: fileds to exclude
   * @returnsdata items without excluded fields

   */
export const excludefromArray = (items, keys) => (items.map((item) => (excludefromObject(item, keys))))
