import { TabsContent } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useTranslation } from 'react-i18next'
import { useSaveSettingLanguageMutation } from '../slice/settingsSlice'
import { useState } from 'react'

export const SettingsLanguage = ({ userId, getLanguage, data }) => {
  const {
    t,
    i18n: { changeLanguage, language }
  } = useTranslation()

  const [
    saveLanguage,
    { isLoading: isLoadingPost, isError: isErrorPost, isSuccess: isSuccessPost }
  ] = useSaveSettingLanguageMutation()

  // Estado local para forzar un render
  const [trigger, setTrigger] = useState(false)

  const onChangeLanguage = async value => {
    try {
      setTrigger(prev => !prev)
      // Llamar a getLanguage para obtener los datos más recientes desde el servidor
      await getLanguage(userId, { preferCacheValue: false })

      // Manipulamos los datos frescos que ya fueron obtenidos
      const lang =
        data?.data?.id && data?.data?.language
          ? { id: data?.data?.id, language: value }
          : { userId, language: value }

      // Llamada para guardar el lenguaje seleccionado
      const result = await saveLanguage(lang).unwrap()

      // Cambiar el idioma usando i18n
      changeLanguage(value)
    } catch (error) {
      console.error('Error updating:', error)
    }
  }
  return (
    <TabsContent value='language' className='space-y-6'>
      <Card>
        <CardContent className='p-6 space-y-4'>
          <div className='space-y-2'>
            <Label>{t('app_language')}</Label>
            <Select value={language} onValueChange={onChangeLanguage}>
              <SelectTrigger>
                <SelectValue placeholder={t('select_language_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='es'>{t('spanish')}</SelectItem>
                <SelectItem value='en'>{t('english')}</SelectItem>
              </SelectContent>
            </Select>
            <p className='text-sm text-muted-foreground'>
              {t('language_message_change')}
            </p>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  )
}
