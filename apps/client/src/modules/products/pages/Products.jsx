import { ProductsFiltersForm, ProductsDatatable } from '../components/index';
import { Spinner } from '@/components/loader/Spinner';
import { BackDashBoard } from '@/components/backDash/BackDashBoard';

import {
  useLazyGetAllProductsQuery,
  useGetAllProductsStatusQuery,
  useGetAllProductCategoriesQuery,
} from '../api/productsAPI';
import { useGetAllProvidersFiltersQuery } from '../../providers/api/providersAPI';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
const Products = () => {
  const { t } = useTranslation(); // Accede a las traducciones
  const navigate = useNavigate();
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const [filters, setFilters] = useState({});

  const {
    data: dataCategory,
    isError: isErrorCategory,
    isLoading: isLoadingCategory,
    isFetching: isFetchingCategory,
    isSuccess: isSuccessCategory,
    error: errorCategory,
  } = useGetAllProductCategoriesQuery();

  const {
    data: dataProviders,
    isError: isErrorProviders,
    isLoading: isLoadingProviders,
    isFetching: isFetchingProviders,
    isSuccess: isSuccessProviders,
    error: errorProviders,
  } = useGetAllProvidersFiltersQuery();

  const {
    data: datastatus,
    isError: isErrorStatus,
    isLoading: isLoadingStatus,
    isFetching: isFetchingStatus,
    isSuccess: isSuccessStatus,
    error: errorStatus,
  } = useGetAllProductsStatusQuery();

  // filter form
  const [
    trigger,
    {
      data: dataProducts = { data: [] },
      isError,
      isLoading,
      isFetching,
      isSuccess,
      error,
    },
    lastPromiseInfo,
  ] = useLazyGetAllProductsQuery();

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
    trigger({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      ...filters,
    });
  }, [pagination.pageIndex, pagination.pageSize, filters]);

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

  const handleProductsForms = (row) => {
    navigate('/home/productsForms', { state: { row } });
  };

  return (
    <>
      <BackDashBoard link={'/home'} moduleName={t('products')} />
      <div className="relative">
        {/* Show spinner when loading or fetching */}
        {(isLoading ||
          isLoadingCategory ||
          isLoadingProviders ||
          isLoadingStatus ||
          isFetching ||
          isFetchingProviders ||
          isFetchingCategory ||
          isFetchingStatus) && <Spinner />}

        <div className="grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5">
          {/* filters */}
          <div className="col-span-2 row-span-1 md:col-span-5">
            <ProductsFiltersForm
              onSubmit={handleSubmitFilters}
              onOpenProductsForms={handleProductsForms}
              datastatus={datastatus}
              dataCategory={dataCategory}
              dataProviders={dataProviders}
            />
          </div>
          {/* Datatable */}
          <div className="flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5">
            <ProductsDatatable
              dataProducts={dataProducts}
              onOpenProductsForms={handleProductsForms}
              pagination={pagination}
              onPaginationChange={setPagination}
            />
          </div>
        </div>
      </div>
    </>
  );
};
export default Products;
