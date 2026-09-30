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

/** Filter setter that also resets pagination to the first page. */
const makeFilterHandlers = ({ setPagination, setFilters }) => ({
  /**
   * Al aplicar nuevos filtros:
   * - Se resetea la página a la primera (pageIndex = 0)
   * - Se actualiza el estado de filtros
   *
   * No se llama directamente al backend aquí.
   * El cambio de estado dispara el useEffect, manteniendo
   * un flujo reactivo y predecible.
   */
  handleSubmitFilters: (newFilters) => {
    setPagination((prev) => ({
      ...prev,
      pageIndex: 0,
    }));

    setFilters(newFilters);
  },
});

/** Success alert props for the create/update flow. */
const buildSuccessAlertProps = ({ t, isEdit, setOpenDialog }) => ({
  alertTitle: t(isEdit ? 'update_record' : 'add_record'),
  alertMessage: t(isEdit ? 'updated_successfully' : 'added_successfully'),
  cancel: false,
  success: true,
  onSuccess: () => {
    setOpenDialog(false);
  },
  variantSuccess: 'info',
});

/** Error alert props for the create/update flow. */
const buildErrorAlertProps = ({ t }) => ({
  alertTitle: t('error'),
  alertMessage: t('operation_failed'),
  cancel: false,
  success: false,
  destructive: true,
  variantDestructive: 'destructive',
});

/** Save handler: create or update, then show success/error alert. */
const makeSaveHandler =
  ({
    t,
    updatePermissionById,
    createPermission,
    setAlertProps,
    setOpenAlertDialog,
    setOpenDialog,
  }) =>
  async (result) => {
    try {
      if (result?.id) {
        // edit → result = { id, body } with only changed fields (PATCH)
        await updatePermissionById({
          id: result.id,
          data: result.body,
        }).unwrap();
      } else {
        // create → result = form values (POST)
        await createPermission(result).unwrap();
      }

      setAlertProps(
        buildSuccessAlertProps({ t, isEdit: !!result?.id, setOpenDialog })
      );
      setOpenAlertDialog(true);
    } catch (err) {
      console.error('Error:', err);
      setAlertProps(buildErrorAlertProps({ t }));
      setOpenAlertDialog(true);
    }
  };

/** Dialog open/close/edit handlers. */
const makeDialogHandlers = ({
  t,
  setOpenDialog,
  setActionDialog,
  setSelectedRow,
}) => ({
  handleAddDialog: () => {
    setActionDialog(t('add_permission')); // Adjust key
    setOpenDialog(true);
  },
  handleEditDialog: (row) => {
    setActionDialog(t('edit_permission')); // Adjust key
    setOpenDialog(true);
    setSelectedRow(row);
  },
  handleCloseDialog: () => {
    setSelectedRow({});
    setOpenDialog(false);
  },
});

/** Success alert props after a record is deleted. */
const buildDeletedAlertProps = ({ t, setOpenDialog }) => ({
  alertTitle: '',
  alertMessage: t('deleted_successfully'),
  cancel: false,
  success: true,
  onSuccess: () => {
    setOpenDialog(false);
  },
  variantSuccess: 'info',
});

/** Error alert props for the delete flow. */
const buildDeleteErrorAlertProps = ({ t }) => ({
  alertTitle: t('error'),
  alertMessage: t('delete_failed'),
  cancel: false,
  success: false,
  destructive: true,
  variantDestructive: 'destructive',
});

/** Delete-confirmation handler for a permission record. */
const makeDeleteHandler =
  ({
    t,
    deletePermissionById,
    setAlertProps,
    setOpenAlertDialog,
    setOpenDialog,
  }) =>
  async (id) => {
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

            setAlertProps(buildDeletedAlertProps({ t, setOpenDialog }));
            setOpenAlertDialog(true);
          } catch (err) {
            console.error('Error deleting:', err);
            setAlertProps(buildDeleteErrorAlertProps({ t }));
            setOpenAlertDialog(true);
          }
        },
      });
      setOpenAlertDialog(true);
    } catch (err) {
      console.error('Error initiating delete:', err);
    }
  };

/**
 * Page state: lazy query trigger, employees catalog, mutations and
 * dialog/alert/pagination state. El efecto de `triggerPermissions` es
 * la única fuente de verdad para disparar la consulta al backend: se
 * ejecuta al montar y cuando cambian página, tamaño de página o filtros.
 */
function usePermissionPageState() {
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
    triggerPermissions,
    {
      data: dataPermissions = { data: [] },
      isLoading: isLoadingPermissions,
      isFetching: isFetchingPermissions,
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
   * la consulta al backend. Se ejecuta al montar y cuando
   * cambian página, tamaño de página o filtros.
   */
  useEffect(() => {
    triggerPermissions({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      ...filters,
    });
  }, [pagination.pageIndex, pagination.pageSize, filters, triggerPermissions]);

  const isLoadingPage =
    isLoadingPermissions ||
    isLoadingPut ||
    isLoadingPost ||
    isLoadingDelete ||
    isLoadingEmployees ||
    isFetchingEmployees ||
    isFetchingPermissions;

  return {
    selectedRow,
    setSelectedRow,
    openDialog,
    setOpenDialog,
    openAlertDialog,
    setOpenAlertDialog,
    alertProps,
    setAlertProps,
    actionDialog,
    setActionDialog,
    pagination,
    setPagination,
    setFilters,
    dataPermissions,
    dataEmployees,
    isLoadingPage,
    updatePermissionById,
    createPermission,
    deletePermissionById,
  };
}

/** Static page layout for the permission module. */
const buildPermissionLayout = ({
  t,
  page,
  filterHandlers,
  dialogHandlers,
  saveHandler,
  deleteHandler,
}) => (
  <>
    <BackDashBoard link={'/home'} moduleName={t('permission')} />{' '}
    {/* Adjust module name */}
    <div className="relative">
      {/* Spinner */}
      {page.isLoadingPage && <Spinner />}

      <div className="grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5">
        <div className="col-span-2 row-span-1 md:col-span-5">
          <PermissionFiltersForm
            onSubmit={filterHandlers.handleSubmitFilters}
            onAddDialog={dialogHandlers.handleAddDialog}
            dataEmployees={page.dataEmployees.data} // Pass employee data
          />
        </div>
        {/* Datatable */}
        <div className="flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5">
          <PermissionDatatable
            dataPermissions={page.dataPermissions} // Pass permission data
            onEditDialog={dialogHandlers.handleEditDialog}
            pagination={page.pagination}
            onPaginationChange={page.setPagination}
          />
        </div>
        {/* Dialog */}
        <PermissionDialog
          openDialog={page.openDialog}
          onCloseDialog={dialogHandlers.handleCloseDialog}
          selectedRow={page.selectedRow}
          onSubmit={saveHandler}
          onDeleteById={deleteHandler}
          actionDialog={page.actionDialog}
          dataEmployees={page.dataEmployees.data} // Pass employee data
        />

        <AlertDialogComponent
          openAlertDialog={page.openAlertDialog}
          setOpenAlertDialog={page.setOpenAlertDialog}
          alertProps={page.alertProps}
        />
      </div>
    </div>
  </>
);

const Permission = () => {
  const { t } = useTranslation();
  const page = usePermissionPageState();

  const filterHandlers = makeFilterHandlers({
    setPagination: page.setPagination,
    setFilters: page.setFilters,
  });
  const dialogHandlers = makeDialogHandlers({
    t,
    setOpenDialog: page.setOpenDialog,
    setActionDialog: page.setActionDialog,
    setSelectedRow: page.setSelectedRow,
  });
  const saveHandler = makeSaveHandler({
    t,
    updatePermissionById: page.updatePermissionById,
    createPermission: page.createPermission,
    setAlertProps: page.setAlertProps,
    setOpenAlertDialog: page.setOpenAlertDialog,
    setOpenDialog: page.setOpenDialog,
  });
  const deleteHandler = makeDeleteHandler({
    t,
    deletePermissionById: page.deletePermissionById,
    setAlertProps: page.setAlertProps,
    setOpenAlertDialog: page.setOpenAlertDialog,
    setOpenDialog: page.setOpenDialog,
  });

  return buildPermissionLayout({
    t,
    page,
    filterHandlers,
    dialogHandlers,
    saveHandler,
    deleteHandler,
  });
};

export default Permission;
