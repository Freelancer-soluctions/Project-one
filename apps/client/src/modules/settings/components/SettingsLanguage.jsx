import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

export const SettingsLanguage = ({ onChangeLanguage }) => {
  const {
    t,
    i18n: { language },
  } = useTranslation();

  // useEffect(() => {
  //   if (languageLoaded && isSuccess) {
  //     // Definir la función asincrónica dentro del efecto
  //     async function fetchData() {
  //       try {
  //         const lang =
  //           data?.data?.id && data?.data?.language
  //             ? { id: data?.data?.id, language: newLanguage }
  //             : { userId, language: newLanguage }
  //         const result1 = await saveLanguage(lang).unwrap()
  //         setLanguageLoaded(false)
  //       } catch (error) {
  //         console.error('Error fetching data:', error)
  //       }
  //     }

  //     // Llamamos a la función
  //     fetchData()
  //   }
  // }, [languageLoaded, isSuccess])

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="space-y-2">
          <Label>{t('app_language')}</Label>
          <Select value={language} onValueChange={onChangeLanguage}>
            <SelectTrigger>
              <SelectValue placeholder={t('select_language_placeholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="es">{t('spanish')}</SelectItem>
              <SelectItem value="en">{t('english')}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {t('language_message_change')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
