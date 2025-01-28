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
import {
  useLazyGetSettingLanguageById,
  useSaveSettingLanguageMutation
} from '../slice/settingsSlice'

export const SettingsLanguage = ({ userId }) => {
  const {
    t,
    i18n: { changeLanguage, language }
  } = useTranslation()
  const [getLanguage, { data, isLoading, isError }] =
    useLazyGetSettingLanguageById()
  const [
    saveLanguage,
    { isLoading: isLoadingPost, isError: isErrorPost, isSuccess: isSuccessPost }
  ] = useSaveSettingLanguageMutation()

  const onChangeLanguage = async value => {
    console.log('values:', value)
    try {
      await getLanguage({ userId })
      const lang =
        data.id && data.language ? { language } : { userId, language }
      const result = await saveLanguage(lang).unwrap() // Desenvuelve la respuesta para manejar errores
      changeLanguage(value) // Cambiar el idioma con i18n
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
