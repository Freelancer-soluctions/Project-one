import {
  ClientOrderFiltersForm,
  ClientOrderDialog,
  ClientOrderDatatable,
} from '../components';
import { BackDashBoard } from '@/components/backDash/BackDashBoard';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import {
  useLazyGetAllClientOrderQuery,
  useUpdateClientOrderByIdMutation,
  useCreateClientOrderMutation,
  useDeleteClientOrderByIdMutation,
} from '../api/clientOrderApi';
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

/** Save handler: create or update, logging errors to the console. */
const makeSaveHandler =
  ({
    t,
    updateClientOrderById,
    createClientOrder,
    setAlertProps,
    setOpenAlertDialog,
    setOpenDialog,
  }) =>
  async (result) => {
    try {
      if (result?.id) {
        await updateClientOrderById({
          id: result.id,
          data: result.body,
        }).unwrap();
      } else {
        await createClientOrder(result).unwrap();
      }

      setAlertProps(
        buildSuccessAlertProps({ t, isEdit: !!result?.id, setOpenDialog })
      );
      setOpenAlertDialog(true);
    } catch (err) {
      console.error('Error:', err);
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
    setActionDialog(t('add_clientOrder'));
    setOpenDialog(true);
  },
  handleEditDialog: (row) => {
    setActionDialog(t('edit_clientOrder'));
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

/** Delete-confirmation handler for a client order record. */
const makeDeleteHandler =
  ({
    t,
    deleteClientOrderById,
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
            await deleteClientOrderById(id).unwrap();

            setAlertProps(buildDeletedAlertProps({ t, setOpenDialog }));
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

/**
 * Page state: lazy query trigger, mutations and dialog/alert/pagination
 * state. El efecto de `getAllClientOrder` es la única fuente de verdad
 * para disparar la consulta al backend: se ejecuta al montar y cuando
 * cambian página, tamaño de página o filtros.
 */
function useClientOrderPageState() {
  const [selectedRow, setSelectedRow] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [openAlertDialog, setOpenAlertDialog] = useState(false);
  const [alertProps, setAlertProps] = useState({});
  const [actionDialog, setActionDialog] = useState('');
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });

  const [
    getAllClientOrder,
    {
      data: dataClientOrder = { data: [] },
      isLoading: isLoadingClientOrder,
      isFetching: isFetchingClientOrder,
    },
  ] = useLazyGetAllClientOrderQuery();

  const [updateClientOrderById, { isLoading: isLoadingPut }] =
    useUpdateClientOrderByIdMutation();

  const [createClientOrder, { isLoading: isLoadingPost }] =
    useCreateClientOrderMutation();

  const [deleteClientOrderById, { isLoading: isLoadingDelete }] =
    useDeleteClientOrderByIdMutation();

  /**
   * Este efecto es la única fuente de verdad para disparar
   * la consulta al backend. Se ejecuta al montar y cuando
   * cambian página, tamaño de página o filtros.
   */
  useEffect(() => {
    getAllClientOrder({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      ...filters,
    });
  }, [pagination.pageIndex, pagination.pageSize, filters, getAllClientOrder]);

  const isLoadingPage =
    isLoadingClientOrder ||
    isFetchingClientOrder ||
    isLoadingPut ||
    isLoadingPost ||
    isLoadingDelete;

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
    dataClientOrder,
    isLoadingPage,
    updateClientOrderById,
    createClientOrder,
    deleteClientOrderById,
  };
}

/** Static page layout for the client order module. */
const buildClientOrderLayout = ({
  t,
  page,
  filterHandlers,
  dialogHandlers,
  saveHandler,
  deleteHandler,
}) => (
  <>
    <BackDashBoard link={'/home'} moduleName={t('clientOrder')} />
    <div className="relative">
      {/* Show spinner when loading or fetching */}
      {page.isLoadingPage && <Spinner />}

      <div className="grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5">
        {/* filters */}
        <div className="col-span-2 row-span-1 md:col-span-5">
          <ClientOrderFiltersForm
            onSubmit={filterHandlers.handleSubmitFilters}
            onAddDialog={dialogHandlers.handleAddDialog}
          />
        </div>
        {/* Datatable */}
        <div className="flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5">
          <ClientOrderDatatable
            dataClientOrder={page.dataClientOrder}
            onEditDialog={dialogHandlers.handleEditDialog}
            pagination={page.pagination}
            onPaginationChange={page.setPagination}
          />
        </div>
        {/* Dialog */}
        <ClientOrderDialog
          openDialog={page.openDialog}
          onCloseDialog={dialogHandlers.handleCloseDialog}
          selectedRow={page.selectedRow}
          onSubmit={saveHandler}
          onDeleteById={deleteHandler}
          actionDialog={page.actionDialog}
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

const ClientOrder = () => {
  const { t } = useTranslation();
  const page = useClientOrderPageState();

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
    updateClientOrderById: page.updateClientOrderById,
    createClientOrder: page.createClientOrder,
    setAlertProps: page.setAlertProps,
    setOpenAlertDialog: page.setOpenAlertDialog,
    setOpenDialog: page.setOpenDialog,
  });
  const deleteHandler = makeDeleteHandler({
    t,
    deleteClientOrderById: page.deleteClientOrderById,
    setAlertProps: page.setAlertProps,
    setOpenAlertDialog: page.setOpenAlertDialog,
    setOpenDialog: page.setOpenDialog,
  });

  return buildClientOrderLayout({
    t,
    page,
    filterHandlers,
    dialogHandlers,
    saveHandler,
    deleteHandler,
  });
};

export default ClientOrder;
