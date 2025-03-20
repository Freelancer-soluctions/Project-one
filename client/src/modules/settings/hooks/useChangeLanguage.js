import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { saveSettingLanguageFetch } from '../slice/settingsSlice'
import { useToast } from '@/components/ui/use-toast'

export function useChangeLanguage() {
  const dispatch = useDispatch()
  const { i18n, t } = useTranslation()
  const { data } = useSelector(
    state => state.settings.dataSettings?.userSettings
  )
  const { toast } = useToast()

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

      const lang = data ? { id: data.id, language: value } : { language: value }

      dispatch(saveSettingLanguageFetch(lang))
      i18n.changeLanguage(value)
      toast({
        title: t('language_message_change_success'),
        description: t('language_message_change_success_message'),
        variant: 'success'
      })
    } catch (error) {
      console.error('Error updating language:', error)
      toast({
        title: t('language_message_change_error'),
        description: error || t('language_message_change_error_message'),
        variant: 'destructive'
      })
    }
  }

  return { onChangeLanguage }
}


