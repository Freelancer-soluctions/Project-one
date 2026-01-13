import {
  PermissionFiltersForm,
  PermissionDialog,
  PermissionDatatable,
} from '../components'; // Adjusted import path
import { BackDashBoard } from '@/components/backDash/BackDashBoard';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import {
  useLazyGetAllPermissionsQuery,
  useUpdatePermissionByIdMutation,
  useCreatePermissionMutation,
  useDeletePermissionByIdMutation,
} from '../api/permissionApi'; // Adjusted import path
import { useGetAllEmployeesFiltersQuery } from '@/modules/employees/api/employeesApi'; // Import employee query
import AlertDialogComponent from '@/components/alertDialog/AlertDialog';
import { Spinner } from '@/components/loader/Spinner';

const Permission = () => {
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

  const {
    data: dataEmployees = { data: [] },
    isLoading: isLoadingEmployees,
    isFetching: isFetchingEmployees,
  } = useGetAllEmployeesFiltersQuery();

  const [
    getAllPermissions,
    {
      data: dataPermissions = { data: [] },
      isLoading: isLoadingPermissions,
      isFetching: isFetchingPermissions,
      refetch,
    },
  ] = useLazyGetAllPermissionsQuery();

  const [updatePermissionById, { isLoading: isLoadingPut }] =
    useUpdatePermissionByIdMutation();

  const [createPermission, { isLoading: isLoadingPost }] =
    useCreatePermissionMutation();

  const [deletePermissionById, { isLoading: isLoadingDelete }] =
    useDeletePermissionByIdMutation();

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
    getAllPermissions({
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

  const handleSubmit = async (values, permissionId) => {
    try {
      const action = permissionId ? updatePermissionById : createPermission;
      const payload = permissionId
        ? {
            id: permissionId,
            data: {
              type: values.type,
              startDate: values.startDate,
              endDate: values.endDate,
              reason: values.reason,
              employeeId: values.employeeId,
              status: values.status,
              comments: values.comments,
            },
          }
        : values;

      await action(payload).unwrap();

      setAlertProps({
        alertTitle: t(permissionId ? 'update_record' : 'add_record'),
        alertMessage: t(
          permissionId ? 'updated_successfully' : 'added_successfully'
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
      setAlertProps({
        alertTitle: t('error'),
        alertMessage: t('operation_failed'),
        cancel: false,
        success: false,
        destructive: true,
        variantDestructive: 'destructive',
      });
      setOpenAlertDialog(true);
    }
  };

  const handleAddDialog = () => {
    setActionDialog(t('add_permission')); // Adjust key
    setOpenDialog(true);
  };

  const handleEditDialog = (row) => {
    setActionDialog(t('edit_permission')); // Adjust key
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
            await deletePermissionById(id).unwrap();

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
            setAlertProps({
              alertTitle: t('error'),
              alertMessage: t('delete_failed'),
              cancel: false,
              success: false,
              destructive: true,
              variantDestructive: 'destructive',
            });
            setOpenAlertDialog(true);
          }
        },
      });
      setOpenAlertDialog(true);
    } catch (err) {
      console.error('Error initiating delete:', err);
    }
  };

  return (
    <>
      <BackDashBoard link={'/home'} moduleName={t('permission')} />{' '}
      {/* Adjust module name */}
      <div className="relative">
        {/* Spinner */}
        {(isLoadingPermissions ||
          isLoadingPut ||
          isLoadingPost ||
          isLoadingDelete ||
          isLoadingEmployees ||
          isFetchingEmployees ||
          isFetchingPermissions) && <Spinner />}

        <div className="grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5">
          <div className="col-span-2 row-span-1 md:col-span-5">
            <PermissionFiltersForm
              onSubmit={handleSubmitFilters}
              onAddDialog={handleAddDialog}
              dataEmployees={dataEmployees.data} // Pass employee data
            />
          </div>
          {/* Datatable */}
          <div className="flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5">
            <PermissionDatatable
              dataPermissions={dataPermissions} // Pass permission data
              onEditDialog={handleEditDialog}
              pagination={pagination}
              onPaginationChange={setPagination}
            />
          </div>
          {/* Dialog */}
          <PermissionDialog
            openDialog={openDialog}
            onCloseDialog={handleCloseDialog}
            selectedRow={selectedRow}
            onSubmit={handleSubmit}
            onDeleteById={handleDelete}
            actionDialog={actionDialog}
            dataEmployees={dataEmployees.data} // Pass employee data
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

export default Permission;
