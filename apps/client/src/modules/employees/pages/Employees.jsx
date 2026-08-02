import {
  EmployeesFiltersForm,
  EmployeesDialog,
  EmployeesDatatable,
} from '../components';
import { BackDashBoard } from '@/components/backDash/BackDashBoard';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import {
  useLazyGetAllEmployeesQuery,
  useUpdateEmployeeByIdMutation,
  useCreateEmployeeMutation,
  useDeleteEmployeeByIdMutation,
} from '../api/employeesApi';
import { useQueryData, useLoadingState } from '@/hooks';
import AlertDialogComponent from '@/components/alertDialog/AlertDialog';
import { Spinner } from '@/components/loader/Spinner';

const Employees = () => {
  const { t } = useTranslation();
  const [selectedRow, setSelectedRow] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [openAlertDialog, setOpenAlertDialog] = useState(false);
  const [alertProps, setAlertProps] = useState({});
  const [actionDialog, setActionDialog] = useState('');
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const [filters, setFilters] = useState({});

  const [getAllEmployees, queryState] = useLazyGetAllEmployeesQuery();
  const {
    data: dataEmployees,
    isLoading: queryIsLoading,
    isFetching: queryIsFetching,
  } = useQueryData(queryState);
  const { isLoading: isEmployeesLoading, isFetching: isEmployeesFetching } =
    useLoadingState([
      { isLoading: queryIsLoading, isFetching: queryIsFetching },
    ]);

  const [updateEmployeeById, { isLoading: isLoadingPut }] =
    useUpdateEmployeeByIdMutation();

  const [createEmployee, { isLoading: isLoadingPost }] =
    useCreateEmployeeMutation();

  const [deleteEmployeeById, { isLoading: isLoadingDelete }] =
    useDeleteEmployeeByIdMutation();

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
    getAllEmployees({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      ...filters,
    });
  }, [pagination.pageIndex, pagination.pageSize, filters, getAllEmployees]);

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

  const handleSubmit = async (result) => {
    try {
      if (result?.id) {
        await updateEmployeeById({ id: result.id, data: result.body }).unwrap();
      } else {
        await createEmployee(result).unwrap();
      }

      setAlertProps({
        alertTitle: t(result?.id ? 'update_record' : 'add_record'),
        alertMessage: t(
          result?.id ? 'updated_successfully' : 'added_successfully'
        ),
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

  const handleAddDialog = () => {
    setActionDialog(t('add_employee'));
    setOpenDialog(true);
  };

  const handleEditDialog = (row) => {
    setActionDialog(t('edit_employee'));
    setOpenDialog(true);
    setSelectedRow(row);
  };

  const handleCloseDialog = () => {
    setSelectedRow({});
    setOpenDialog(false);
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
            await deleteEmployeeById(id).unwrap();

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
            setOpenAlertDialog(true);
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
      <BackDashBoard link={'/home'} moduleName={t('employees')} />
      <div className="relative">
        {/* Show spinner when loading or fetching */}
        {(isEmployeesLoading ||
          isEmployeesFetching ||
          isLoadingPut ||
          isLoadingPost ||
          isLoadingDelete) && <Spinner />}

        <div className="grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5">
          {/* filters */}
          <div className="col-span-2 row-span-1 md:col-span-5">
            <EmployeesFiltersForm
              onSubmit={handleSubmitFilters}
              onAddDialog={handleAddDialog}
            />
          </div>
          {/* Datatable */}
          <div className="flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5">
            <EmployeesDatatable
              dataEmployees={dataEmployees}
              onEditDialog={handleEditDialog}
              pagination={pagination}
              onPaginationChange={setPagination}
            />
          </div>
          {/* Dialog */}
          <EmployeesDialog
            openDialog={openDialog}
            onCloseDialog={handleCloseDialog}
            selectedRow={selectedRow}
            onSubmit={handleSubmit}
            onDeleteById={handleDelete}
            actionDialog={actionDialog}
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

export default Employees;
