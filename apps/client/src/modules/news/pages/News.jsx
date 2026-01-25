import { useState, useEffect } from 'react';
import {
  NewsFiltersForm,
  NewsDialog,
  NewsDatatable,
} from '../components/index';
import { Spinner } from '@/components/loader/Spinner';
import { BackDashBoard } from '@/components/backDash/BackDashBoard';
import AlertDialogComponent from '@/components/alertDialog/AlertDialog';

import {
  useLazyGetAllNewsQuery,
  useGetAllNewsStatusQuery,
  useUpdateNewByIdMutation,
  useCreateNewMutation,
  useDeleteNewByIdMutation,
} from '../api/newsAPI';
import { useTranslation } from 'react-i18next';
const News = () => {
  const [selectedRow, setSelectedRow] = useState({}); //data from datatable
  const [openDialog, setOpenDialog] = useState(false); //dialog open/close
  const [actionDialog, setActionDialog] = useState(''); //actionDialog edit / add
  const [alertProps, setAlertProps] = useState({});
  const [openAlertDialog, setOpenAlertDialog] = useState(false); //alert dialog open/close
  const { t } = useTranslation(); // Accede a las traducciones
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const [filters, setFilters] = useState({});

  // filter form
  const [trigger, { data: dataNews = { data: [] }, isLoading, isFetching }] =
    useLazyGetAllNewsQuery();

  const {
    data: datastatus,
    isLoading: isLoadingStatus,
    isFetching: isFetchingStatus,
  } = useGetAllNewsStatusQuery();

  const [updateNewById, { isLoading: isLoadingPut }] =
    useUpdateNewByIdMutation();

  const [createNew, { isLoading: isLoadingPost }] = useCreateNewMutation();

  const [deleteNewById, { isLoading: isLoadingDelete }] =
    useDeleteNewByIdMutation();

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
  }, [pagination.pageIndex, pagination.pageSize, filters, trigger]);

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

  const handleSubmit = async (values, newId) => {
    try {
      newId
        ? await updateNewById({
            id: newId,
            data: {
              description: values.description,
              statusId: values.status.id,
              statusCode: values.status.code,
              document: values.document,
            },
          }).unwrap()
        : await createNew({
            document: values.document,
            statusId: values.status.id,
            statusCode: values.status.code,
            description: values.description,
          }).unwrap();

      setAlertProps({
        alertTitle: t(newId ? 'update_record' : 'add_record'),
        alertMessage: t(newId ? 'updated_successfully' : 'added_successfully'),
        cancel: false,
        success: true,
        onSuccess: () => {
          setOpenDialog(false);
        },
        variantSuccess: 'info',
      });
      setOpenAlertDialog(true);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      setAlertProps({
        alertTitle: t('delete_record'),
        alertMessage: t('request_delete_record'),
        cancel: true,
        success: false,
        destructive: true,
        variantSuccess: '',
        variantDestructive: 'destructive',
        onSuccess: () => {},
        onDelete: async () => {
          try {
            await deleteNewById(id).unwrap();

            setAlertProps({
              alertTitle: '',
              alertMessage: t('deleted_successfully'),
              cancel: false,
              success: true,
              onSuccess: () => {
                setOpenDialog(false);
              },
              variantSuccess: 'info',
            });
            setOpenAlertDialog(true); // Open alert dialog
          } catch (err) {
            console.error('Error deleting:', err);
          }
        },
      });
      setOpenAlertDialog(true);
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  return (
    <>
      <BackDashBoard link={'/home'} moduleName={t('news')} />
      <div className="relative">
        {/* Show spinner when loading or fetching */}
        {(isLoading ||
          isLoadingStatus ||
          isLoadingPut ||
          isLoadingPost ||
          isLoadingDelete ||
          isFetching ||
          isFetchingStatus) && <Spinner />}

        <div className="grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5">
          {/* filters */}
          <div className="col-span-2 row-span-1 md:col-span-5">
            <NewsFiltersForm
              onSubmit={handleSubmitFilters}
              setActionDialog={setActionDialog}
              setOpenDialog={setOpenDialog}
              datastatus={datastatus}
            />
          </div>
          {/* Datatable */}
          <div className="flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5">
            <NewsDatatable
              dataNews={dataNews}
              setSelectedRow={setSelectedRow}
              setOpenDialog={setOpenDialog}
              setActionDialog={setActionDialog}
              pagination={pagination}
              onPaginationChange={setPagination}
            />
          </div>
          {/* Dialog */}
          <NewsDialog
            openDialog={openDialog}
            setSelectedRow={setSelectedRow}
            selectedRow={selectedRow}
            setOpenDialog={setOpenDialog}
            actionDialog={actionDialog}
            datastatus={datastatus}
            onCreateUpdate={handleSubmit}
            onDeleteById={handleDelete}
          />

          <AlertDialogComponent
            openAlertDialog={openAlertDialog}
            setOpenAlertDialog={setOpenAlertDialog}
            alertProps={alertProps}
          />
        </div>
      </div>
    </>
  );
};
export default News;
