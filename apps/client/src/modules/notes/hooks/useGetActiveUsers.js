import { useGetUsersByStatusQuery } from '@/modules/users/api/usersApi';
import { USER_STATUS_CODE } from '@/modules/users/constants/users';

/**
 * Custom hook que encapsula la consulta de usuarios activos.
 * 
 * RTK Query cachea y deduplica automáticamente:
 * - Si múltiples componentes usan este hook, solo se hace UNA petición.
 * - La data se comparte vía el cache global de RTK Query.
 * - El refetching/revalidation es manejado automáticamente.
 * 
 * @returns {object} { dataUsers, isLoadingUsers, isFetchingUsers }
 */
export function useGetActiveUsers() {
  const {
    data: dataUsers = { data: [] },
    isLoading: isLoadingUsers,
    isFetching: isFetchingUsers,
  } = useGetUsersByStatusQuery(USER_STATUS_CODE.ACTIVE);

  return {
    dataUsers: dataUsers?.data,
    isLoadingUsers,
    isFetchingUsers,
  };
}