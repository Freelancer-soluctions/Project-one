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
import { useGetTranslation } from '@/hooks/useGetTranslation'
import { useState } from 'react'
import { Spinner } from '@/components/loader/Spinner'

export const SettingsLanguage = ({ userId }) => {
  const [languageLoaded, setLanguageLoaded] = useState(false)
  const [newLanguage, setNewLanguage] = useState('')
  const {
    t,
    i18n: { changeLanguage, language }
  } = useTranslation()

  const [
    saveLanguage,
    { isLoading: isLoadingPost, isError: isErrorPost, isSuccess: isSuccessPost }
  ] = useSaveSettingLanguageMutation()
  // const { data, isError, isLoading, isFetching, isSuccess, error, refetch } =
  //   useGetSettingLanguageByIdQuery(userId, {
  //     // skip: !languageLoaded, para evitar que se ejecute al montarse el componente
  //     //refetchOnMountOrArgChange: true, //debe de cambiar el userid para obligar al hook hacer la consulta nuevamente o montarse nuevamente el componente
  //     keepUnusedDataFor: 0
  //   })

  const {
    response,
    isError,
    isLoading,
    isFetching,
    isSuccess,
    error,
    refetch
  } = useGetTranslation(userId)

  const onChangeLanguage = async value => {
    setLanguageLoaded(true) // Cargamos los datos una vez se necesiten
    setNewLanguage(value)

    try {
      let userLanguage
      if (!response.data) {
        // Forzar un refetch para obtener los datos frescos desde el servidor
        const { data: refetchData } = await refetch({ forceRefetch: true })
        userLanguage = refetchData.data
      } else {
        userLanguage = response.data
      }

      // Aquí manipulas los datos frescos que se han obtenido
      const lang =
        userLanguage?.id && userLanguage?.language
          ? { id: userLanguage.id, language: value }
          : { userId, language: value }

      // Guardar el nuevo idioma
      await saveLanguage(lang).unwrap()

      // Cambiar el idioma usando i18n
      changeLanguage(value)
    } catch (error) {
      console.error('Error updating:', error)
    }
  }

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
    <div className='relative'>
      {(isLoading || isFetching || isLoadingPost) && <Spinner />}
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
    </div>
  )
}
