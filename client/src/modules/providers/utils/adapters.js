
// Para prevenir la duplicidad de codigo se implementa el patron adaptor para el uso generalizado de useGetAllNewsStatusQuery 
// en los componentes que sea necesario
export const adaptQueryStatus = (queryHook) => {
    const {
      data: datastatus,
      isError: isErrorStatus,
      isLoading: isLoadingStatus,
      isFetching: isFetchingStatus,
      isSuccess: isSuccessStatus,
      error: errorStatus,
    } = queryHook();
  
    return {
      datastatus,
      isErrorStatus,
      isLoadingStatus,
      isFetchingStatus,
      isSuccessStatus,
      errorStatus,
    };
  };