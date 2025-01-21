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
export const SettingsLanguage = () => {
  const {
    t,
    i18n: { changeLanguage, language }
  } = useTranslation()

  const onChangeLanguage = value => {
    console.log('values:', value)
    changeLanguage(value) // Cambiar el idioma con i18n
  }
  return (
    <TabsContent value='language' className='space-y-6'>
      <Card>
        <CardContent className='p-6 space-y-4'>
          <div className='space-y-2'>
            <Label>Idioma de la aplicación</Label>
            <Select value={language} onValueChange={onChangeLanguage}>
              <SelectTrigger>
                <SelectValue placeholder='Seleccionar idioma' />
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
