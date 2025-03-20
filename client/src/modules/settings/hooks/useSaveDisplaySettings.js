import { useDispatch } from 'react-redux'
import { saveSettingDisplayFetch } from '../slice/settingsSlice'

export const useSaveDisplaySettings = settings => {
  const dispatch = useDispatch()

  const onSaveDisplaySettings = async values => {
    try {
      const displaySettings = settings?.id
        ? { id: settings.id, displayOptions: { ...values } }
        : { displayOptions: { ...values } }

      dispatch(saveSettingDisplayFetch(displaySettings))
      // 🔹 Refrescar la configuración desde el backend para asegurar datos actualizados
      //await dispatch(getSettingsByUserIdFetch())
    } catch (error) {
      console.error('Error updating display settings:', error)
    }
  }

  return { onSaveDisplaySettings }
}
