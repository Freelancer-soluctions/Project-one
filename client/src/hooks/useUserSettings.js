import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getSettingsByUserIdFetch } from '@/modules/settings/slice/settingsSlice'
import { useTranslation } from 'react-i18next'

export const useUserSettings = () => {
  const dispatch = useDispatch()
  const { i18n } = useTranslation()
  const userId = useSelector(state => state.auth.user?.data?.user?.id)
  const response = useSelector(
    state => state.settings.dataSettings.userSettings?.data
  )

  useEffect(() => {
    if (userId) {
      dispatch(getSettingsByUserIdFetch(userId))
    }
  }, [dispatch, userId])

  useEffect(() => {
    if (response?.language) {
      i18n.changeLanguage(response.language)
    }
  }, [response])

  return { settings: response }
}
