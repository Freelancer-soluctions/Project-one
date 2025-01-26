import { saveLanguage as saveLanguageDao, getLanguage as getLanguageDao } from './dao.js'

export const saveLanguage = async ({id, language}) => {
  const language = await saveLanguageDao()
}

export const getLanguage = async(userId) => {
    const language = await getLanguageDao(id)

}