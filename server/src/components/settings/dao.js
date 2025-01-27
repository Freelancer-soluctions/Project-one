import prisma from '../../config/db.js'

/**
 *
 * @param {object} where
 * @param {object} data
 * @returns a object that just be saved
 */
export const saveLanguage = async (where, data) => {
  const result = await prisma.language.update({ where, data })
  return Promise.resolve(result)
}

/**
 *
 * @param {object} where
 * @returns all languages from db
 */

export const getLanguage = async (where) => {
  const result = await prisma.language.findMany({ where })
  return Promise.resolve(result)
}
