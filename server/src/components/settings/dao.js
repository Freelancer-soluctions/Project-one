import prisma from '../../config/db.js'

export const saveLanguage = async (where, data) => {
  const result = await prisma.language.update({ where, data })
  return Promise.resolve(result)
}

export const getLanguageByUserId = async (where) => {
  const result = await prisma.language.findMany({ where })
  return Promise.resolve(result)
}
