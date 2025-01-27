import { saveLanguage as saveLanguageDao, getLanguage as getLanguageDao } from './dao.js'

/**
 *
 * @param {object} data
 * @returns a object that just be saved
 */
export const saveLanguage = async ({ id, language }) => {
  // const { id, ...dataWithoutId } = data
  const rowId = Number(id)
  return await saveLanguageDao(rowId, language)
}

/**
 *
 * @param {Number} userId
 * @returns
 */
export const getLanguage = async (userId) => {
  return await getLanguageDao(userId)
}
