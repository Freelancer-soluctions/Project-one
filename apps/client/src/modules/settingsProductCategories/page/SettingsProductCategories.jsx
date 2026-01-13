import {
  SettingsProductCategoriesFiltersForm,
  SettingsProductCategoriesDatatable,
  SettingsProductsCategoryForm,
} from '../components/index';
import { useLazyGetAllCategoriesQuery } from '../api/SettingsProductCategoriesAPI';
import { Spinner } from '@/components/loader/Spinner';
import { useState, useEffect } from 'react';

export const SettingsProductCategories = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const [filters, setFilters] = useState({});

  const [
    getAllCategories,
    {
      data: dataCategories = { data: [] },
      isLoading: isLoadingCategories,
      isFetching: isFetchingCategories,
    },
  ] = useLazyGetAllCategoriesQuery();

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
    getAllCategories({
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

  const handleCategory = (row) => {
    setShowForm(true);
    setSelectedRow(row);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedRow(null);
  };

  return (
    <>
      {showForm ? (
        <SettingsProductsCategoryForm
          onClose={handleCloseForm}
          selectedRow={selectedRow}
        />
      ) : (
        <div className="relative p-4">
          {/* Show spinner when loading or fetching */}
          {(isLoadingCategories || isFetchingCategories) && <Spinner />}

          <div className="grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5">
            {/* filters */}
            <div className="col-span-2 row-span-1 md:col-span-5">
              <SettingsProductCategoriesFiltersForm
                onSubmit={handleSubmitFilters}
                onAdd={handleCategory}
              />
            </div>
            {/* Datatable */}
            <div className="flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5">
              <SettingsProductCategoriesDatatable
                dataCategories={dataCategories}
                onEdit={handleCategory}
                pagination={pagination}
                onPaginationChange={setPagination}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
