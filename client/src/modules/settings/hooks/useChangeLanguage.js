import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { saveSettingLanguageFetch } from '../slice/settingsSlice'

export function useChangeLanguage() {
  const dispatch = useDispatch()
  const { i18n } = useTranslation()
  const { id } = useSelector(
    state => state.settings.dataSettings?.userSettings?.data
  )

  const onChangeLanguage = async value => {
    try {
      // let userLanguage
      // if (!response.data) {
      //   // Forzar un refetch para obtener los datos frescos desde el servidor
      //   const { data: refetchData } = await refetch({ forceRefetch: true })
      //   userLanguage = refetchData.data
      // } else {
      //   userLanguage = response.data
      // }

      const lang = id ? { id: id, language: value } : { language: value }

      dispatch(saveSettingLanguageFetch(lang))
      i18n.changeLanguage(value)
    } catch (error) {
      console.error('Error updating language:', error)
    }
  }

  return { onChangeLanguage }
}
