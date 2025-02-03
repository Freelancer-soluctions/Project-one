
import {
    useGetSettingLanguageByIdQuery
  } from '@/modules/settings/slice/settingsSlice'

export const useGetTranslation = (userId) => {
    const { data:response
        , isError, isLoading, isFetching, isSuccess, error, refetch } =
      useGetSettingLanguageByIdQuery(userId, {
        skip: !userId, //para evitar que se ejecute al montarse el componente
        //refetchOnMountOrArgChange: true, //debe de cambiar el userid para obligar al hook hacer la consulta nuevamente o montarse nuevamente el componente
        keepUnusedDataFor: 0
      })
  return{response, isError, isLoading, isFetching, isSuccess, error, refetch }
}
