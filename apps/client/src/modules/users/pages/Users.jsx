import { UsersFiltersForm, UsersDatatable } from '../components';
import { BackDashBoard } from '@/components/backDash/BackDashBoard';
import { useTranslation } from 'react-i18next';
import {
  useLazyGetAllUsersQuery,
  useGetAllUsersStatusQuery,
  useGetAllUsersRolQuery,
} from '../api/usersApi';
import { Spinner } from '@/components/loader/Spinner';
import { useNavigate } from 'react-router';
import { useState, useEffect } from 'react';

const Users = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const [filters, setFilters] = useState({});

  const [
    getAllUsers,
    {
      data: dataUsers = { data: [] },
      isLoading: isLoadingUsers,
      isFetching: isFetchingUsers,
    },
  ] = useLazyGetAllUsersQuery();

  const {
    data: dataUsersStatus = { data: [] },
    isLoading: isLoadingStatus,
    isFetching: isFetchingStatus,
  } = useGetAllUsersStatusQuery();

  const {
    data: dataUsersRol = { data: [] },
    isLoading: isLoadingRol,
    isFetching: isFetchingRol,
  } = useGetAllUsersRolQuery();

  /**
   * Este efecto es la única fuente de verdad para disparar
   * la consulta al backend.
   *
   * Se ejecuta automáticamente:
   * - Al montar el componente (primer render)
   * - Cuando cambia la página
   * - Cuando cambia el tamaño de página
   * - Cuando cambian los filtros
   *
   * No se realizan llamadas manuales al backend desde handlers
   * para evitar duplicación de lógica y estados inconsistentes.
   */
  useEffect(() => {
    getAllUsers({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      ...filters,
    });
  }, [pagination.pageIndex, pagination.pageSize, filters, getAllUsers]);

  /**
   * Al aplicar nuevos filtros:
   * - Se resetea la página a la primera (pageIndex = 0)
   * - Se actualiza el estado de filtros
   *
   * No se llama directamente al backend aquí.
   * El cambio de estado dispara el useEffect, manteniendo
   * un flujo reactivo y predecible.
   */
  const handleSubmitFilters = (newFilters) => {
    setPagination((prev) => ({
      ...prev,
      pageIndex: 0,
    }));

    setFilters(newFilters);
  };

  const handleUsersForms = (row) => {
    navigate('/home/userForm', { state: { row } });
  };

  return (
    <>
      <BackDashBoard link={'/home'} moduleName={t('users')} />
      <div className="relative">
        {/* Show spinner when loading or fetching */}
        {(isLoadingUsers ||
          isFetchingUsers ||
          isLoadingStatus ||
          isFetchingStatus ||
          isLoadingRol ||
          isFetchingRol) && <Spinner />}

        <div className="grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5">
          {/* filters */}
          <div className="col-span-2 row-span-1 md:col-span-5">
            <UsersFiltersForm
              onSubmit={handleSubmitFilters}
              dataStatus={dataUsersStatus}
              dataRol={dataUsersRol}
            />
          </div>
          {/* Datatable */}
          <div className="flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5">
            <UsersDatatable
              dataUsers={dataUsers}
              onOpenUsersForms={handleUsersForms}
              pagination={pagination}
              onPaginationChange={setPagination}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Users;
