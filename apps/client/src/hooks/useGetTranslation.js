import { useGetSettingLanguageByIdQuery } from '@/modules/settings/slice/settingsSlice';

export const useGetTranslation = (userId) => {
  const {
    data: response,
    isError,
    isLoading,
    isFetching,
    isSuccess,
    error,
    refetch,
  } = useGetSettingLanguageByIdQuery(userId);
  return {
    response,
    isError,
    isLoading,
    isFetching,
    isSuccess,
    error,
    refetch,
  };
};
