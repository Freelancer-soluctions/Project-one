import { SalesFiltersForm, SalesDialog, SalesDatatable } from '../components';
import { BackDashBoard } from '@/components/backDash/BackDashBoard';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import {
  useLazyGetAllSalesQuery,
  useUpdateSaleByIdMutation,
  useUpdateSaleStatusMutation,
  useCreateSaleMutation,
  useDeleteSaleByIdMutation,
  useDeleteSaleDetailByIdMutation,
} from '../api/salesAPI';
import { useGetAllProductsFiltersQuery } from '@/modules/products/api/productsAPI';
import { useGetAllClientsFiltersQuery } from '@/modules/clients/api/clientsApi';
import AlertDialogComponent from '@/components/alertDialog/AlertDialog';
import { Spinner } from '@/components/loader/Spinner';
import { useLoadingState } from '@/hooks';
import { useNavigate } from 'react-router';

const EMPTY_DETAILS = [
  {
    productId: '',
    quantity: 0,
    price: 0,
  },
];

/**
 * Queries the sales list and the clients/products catalogs. El efecto
 * de `triggerSales` es la única fuente de verdad para disparar la
 * consulta al backend: se ejecuta al montar y cuando cambian página,
 * tamaño de página o filtros.
 */
function useSalesQueries({ pagination, filters }) {
  const [
    triggerSales,
    {
      data: dataSales = { data: [] },
      isLoading: isLoadingSales,
      isFetching: isFetchingSales,
    },
  ] = useLazyGetAllSalesQuery();

  const {
    data: dataClients = { data: [] },
    isLoading: isLoadingClients,
    isFetching: isFetchingClients,
  } = useGetAllClientsFiltersQuery();

  const {
    data: dataProducts = { data: [] },
    isLoading: isLoadingProducts,
    isFetching: isFetchingProducts,
  } = useGetAllProductsFiltersQuery();

  useEffect(() => {
    triggerSales({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      ...filters,
    });
  }, [pagination.pageIndex, pagination.pageSize, filters, triggerSales]);

  const { isLoading: isLoadingQueries, isFetching: isFetchingQueries } =
    useLoadingState([
      { isLoading: isLoadingSales, isFetching: isFetchingSales },
      { isLoading: isLoadingClients, isFetching: isFetchingClients },
      { isLoading: isLoadingProducts, isFetching: isFetchingProducts },
    ]);

  return {
    dataSales,
    dataClients,
    dataProducts,
    isLoadingQueries,
    isFetchingQueries,
  };
}

/** Delete-confirmation alert props. */
const buildDeleteConfirmAlertProps = ({ t, onDelete }) => ({
  alertTitle: t('delete_record'),
  alertMessage: t('request_delete_record'),
  cancel: true,
  success: false,
  destructive: true,
  variantSuccess: '',
  variantDestructive: 'destructive',
  onSuccess: () => {},
  onDelete,
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

/** Save handler: create or update, then show the success alert. */
const makeSaveHandler =
  ({
    t,
    updateSaleById,
    createSale,
    setAlertProps,
    setOpenAlertDialog,
    setOpenDialog,
  }) =>
  async (result) => {
    const showError = makeErrorAlertHandler({
      t,
      setAlertProps,
      setOpenAlertDialog,
    });
    try {
      if (result?.id) {
        // edit → result = { id, body } with only changed fields (PATCH)
        await updateSaleById({ id: result.id, data: result.body }).unwrap();
      } else {
        // create → result = form values (POST)
        await createSale(result).unwrap();
      }

      setAlertProps(
        buildSuccessAlertProps({ t, isEdit: !!result?.id, setOpenDialog })
      );
      setOpenAlertDialog(true);
    } catch (err) {
      console.error('Error:', err);
      showError();
    }
  };

const buildStatusUpdatedAlertProps = ({
  t,
  titleKey,
  messageKey,
  setOpenDialog,
}) => ({
  alertTitle: t(titleKey),
  alertMessage: t(messageKey),
  cancel: false,
  success: true,
  onSuccess: () => {
    setOpenDialog(false);
  },
  variantSuccess: 'info',
});

/** Generic failure alert (destructive styling). */
const buildErrorAlertProps = (t) => ({
  alertTitle: t('operation_failed'),
  alertMessage: t('operation_failed_message'),
  cancel: false,
  success: true,
  onSuccess: () => {},
  variantSuccess: 'destructive',
});

/** Reports a failed request through the alert dialog. */
const makeErrorAlertHandler =
  ({ t, setAlertProps, setOpenAlertDialog }) =>
  () => {
    setAlertProps(buildErrorAlertProps(t));
    setOpenAlertDialog(true);
  };

/** Shows a status/payment success alert. */
const makeStatusAlertHandler =
  ({ t, setAlertProps, setOpenAlertDialog, setOpenDialog }) =>
  (titleKey, messageKey) => {
    setAlertProps(
      buildStatusUpdatedAlertProps({
        t,
        titleKey,
        messageKey,
        setOpenDialog,
      })
    );
    setOpenAlertDialog(true);
  };

/** Confirmation for transitions that reverse stock (cancel/refund). */
const buildReversalConfirmAlertProps = ({ t, nextStatus, onConfirm }) => {
  const isCancel = nextStatus === 'CANCELLED';
  return {
    alertTitle: t(isCancel ? 'cancel_sale' : 'refund_sale'),
    alertMessage: t(isCancel ? 'confirm_cancel_sale' : 'confirm_refund_sale'),
    confirmLabel: t(isCancel ? 'cancel_sale' : 'status_action_refunded'),
    cancel: true,
    success: false,
    destructive: true,
    variantSuccess: '',
    variantDestructive: 'destructive',
    onSuccess: () => {},
    onDelete: onConfirm,
  };
};

/**
 * Status/payment handlers for the panel: transitions go through
 * `PATCH /sales/:id/status` (cancelling/refunding asks for confirmation
 * because they reverse stock) and payment edits through `PATCH /sales/:id`.
 */
const makeStatusHandlers = ({
  t,
  updateSaleStatus,
  updateSaleById,
  setAlertProps,
  setOpenAlertDialog,
  setOpenDialog,
}) => {
  const showError = makeErrorAlertHandler({
    t,
    setAlertProps,
    setOpenAlertDialog,
  });
  const showSuccess = makeStatusAlertHandler({
    t,
    setAlertProps,
    setOpenAlertDialog,
    setOpenDialog,
  });

  const runTransition = async (row, nextStatus) => {
    try {
      await updateSaleStatus({
        id: row.id,
        data: { status: nextStatus },
      }).unwrap();
      showSuccess('update_status', 'status_updated_successfully');
    } catch (err) {
      console.error('Error updating status:', err);
      showError();
    }
  };

  const handleTransitionStatus = (row, nextStatus) => {
    if (!row?.id || !nextStatus) return;

    if (nextStatus === 'CANCELLED' || nextStatus === 'REFUNDED') {
      setAlertProps(
        buildReversalConfirmAlertProps({
          t,
          nextStatus,
          onConfirm: () => runTransition(row, nextStatus),
        })
      );
      setOpenAlertDialog(true);
      return;
    }

    runTransition(row, nextStatus);
  };

  const handleSavePayment = async (row, payment) => {
    if (!row?.id) return;

    try {
      await updateSaleById({ id: row.id, data: payment }).unwrap();
      showSuccess('update_payment', 'payment_updated_successfully');
    } catch (err) {
      console.error('Error saving payment:', err);
      showError();
    }
  };

  return { handleTransitionStatus, handleSavePayment };
};

/** Dialog open/close/edit handlers (details reset on open). */
const makeDialogHandlers = ({
  t,
  setOpenDialog,
  setActionDialog,
  setSelectedRow,
  setDetails,
}) => ({
  handleAddDialog: () => {
    setActionDialog(t('add_sale'));
    setOpenDialog(true);
    setSelectedRow({});
    setDetails(EMPTY_DETAILS);
  },
  handleEditDialog: (row) => {
    setActionDialog(t('edit_sale'));
    setOpenDialog(true);
    setSelectedRow(row);
    setDetails(
      row.details && row.details.length > 0 ? row.details : EMPTY_DETAILS
    );
  },
  handleCloseDialog: () => {
    setOpenDialog(false);
  },
});

/** Delete-confirmation handler for a sale. */
const makeDeleteHandler =
  ({ t, deleteSaleById, setAlertProps, setOpenAlertDialog, setOpenDialog }) =>
  async (id) => {
    try {
      setAlertProps(
        buildDeleteConfirmAlertProps({
          t,
          onDelete: async () => {
            try {
              await deleteSaleById(id).unwrap();

              setAlertProps(buildDeletedAlertProps({ t, setOpenDialog }));
              setOpenAlertDialog(true);
            } catch (err) {
              console.error('Error deleting:', err);
            }
          },
        })
      );
      setOpenAlertDialog(true);
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

/** Removes the detail at `index` from state. */
const updateDetails = (setDetails) => (index) => {
  setDetails((prev) => {
    const newDetails = [...prev];
    if (index !== -1) {
      newDetails.splice(index, 1); // Elimina el atributo en el índice encontrado
    }
    return newDetails;
  });
};

/** Delete-confirmation handler for a sale detail. */
const makeRemoveDetailHandler =
  ({
    t,
    deleteSaleDetailById,
    setDetails,
    setAlertProps,
    setOpenAlertDialog,
    navigate,
  }) =>
  async (index, item) => {
    //Eliminacion logica
    if (item.id) {
      setAlertProps(
        buildDeleteConfirmAlertProps({
          t,
          onDelete: async () => {
            try {
              await deleteSaleDetailById(item.id).unwrap();
              updateDetails(setDetails)(index);
              setAlertProps({
                alertTitle: '',
                alertMessage: t('deleted_successfully'),
                cancel: false,
                success: true,
                onSuccess: () => {
                  navigate('/home/products');
                },
                variantSuccess: 'info',
              });
              setOpenAlertDialog(true); // Open alert dialog
            } catch (err) {
              console.error('Error deleting:', err);
            }
          },
        })
      );
      setOpenAlertDialog(true);
    } else {
      updateDetails(setDetails)(index);
    }
  };

/** Mirrors detail edits into state (marks the row dirty). */
const makeEditDetailHandler =
  ({ setDetails }) =>
  (index, field, value) => {
    setDetails((prev) =>
      prev.map((detail, i) =>
        i === index ? { ...detail, [field]: value, save: true } : detail
      )
    );
  };

/** Add a new empty detail row. */
const makeAddDetailHandler =
  ({ setDetails }) =>
  () => {
    setDetails((prev) => [
      ...prev,
      {
        productId: '',
        quantity: 0,
        price: 0,
      },
    ]);
  };

/**
 * Page state: lazy query trigger, clients/products catalogs,
 * mutations, sale details list and dialog/alert/pagination state.
 * El efecto de `triggerSales` es la única fuente de verdad para
 * disparar la consulta al backend: se ejecuta al montar y cuando
 * cambian página, tamaño de página o filtros.
 */
function useSalesPageState() {
  const navigate = useNavigate();
  const [selectedRow, setSelectedRow] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [openAlertDialog, setOpenAlertDialog] = useState(false);
  const [alertProps, setAlertProps] = useState({});
  const [actionDialog, setActionDialog] = useState('');
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const [details, setDetails] = useState(EMPTY_DETAILS);
  const [filters, setFilters] = useState({});

  const [updateSaleById, { isLoading: isLoadingPut }] =
    useUpdateSaleByIdMutation();

  const [updateSaleStatus, { isLoading: isLoadingStatus }] =
    useUpdateSaleStatusMutation();

  const [createSale, { isLoading: isLoadingPost }] = useCreateSaleMutation();

  const [deleteSaleById, { isLoading: isLoadingDelete }] =
    useDeleteSaleByIdMutation();

  const [deleteSaleDetailById, { isLoading: isLoadingDeleteDetail }] =
    useDeleteSaleDetailByIdMutation();

  const {
    dataSales,
    dataClients,
    dataProducts,
    isLoadingQueries,
    isFetchingQueries,
  } = useSalesQueries({ pagination, filters });

  const isLoadingPage =
    isLoadingQueries ||
    isFetchingQueries ||
    isLoadingPut ||
    isLoadingPost ||
    isLoadingDelete ||
    isLoadingDeleteDetail ||
    isLoadingStatus;

  return {
    navigate,
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
    details,
    setDetails,
    pagination,
    setPagination,
    setFilters,
    dataSales,
    dataClients,
    dataProducts,
    isLoadingPage,
    isSavingStatus: isLoadingPut || isLoadingStatus,
    updateSaleById,
    updateSaleStatus,
    createSale,
    deleteSaleById,
    deleteSaleDetailById,
  };
}

/** Static page layout for the sales module. */
const buildSalesLayout = ({
  t,
  page,
  filterHandlers,
  dialogHandlers,
  saveHandler,
  deleteHandler,
  detailHandlers,
}) => (
  <>
    <BackDashBoard link={'/home'} moduleName={t('sales')} />
    <div className="relative">
      {/* Show spinner when loading or fetching */}
      {page.isLoadingPage && <Spinner />}

      <div className="grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5">
        {/* filters */}
        <div className="col-span-2 row-span-1 md:col-span-5">
          <SalesFiltersForm
            onSubmit={filterHandlers.handleSubmitFilters}
            onAddDialog={dialogHandlers.handleAddDialog}
            clients={page.dataClients.data}
          />
        </div>
        {/* Datatable */}
        <div className="flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5">
          <SalesDatatable
            dataSales={page.dataSales}
            onEditDialog={dialogHandlers.handleEditDialog}
            pagination={page.pagination}
            onPaginationChange={page.setPagination}
          />
        </div>
        {/* Dialog */}
        <SalesDialog
          openDialog={page.openDialog}
          onCloseDialog={dialogHandlers.handleCloseDialog}
          selectedRow={page.selectedRow}
          onSubmit={saveHandler}
          onDeleteById={deleteHandler}
          onTransitionStatus={dialogHandlers.handleTransitionStatus}
          onSavePayment={dialogHandlers.handleSavePayment}
          isSavingStatus={page.isSavingStatus}
          actionDialog={page.actionDialog}
          onEditDetail={detailHandlers.handleEditDetail}
          onAddDetail={detailHandlers.handleAddDetail}
          onRemoveDetail={detailHandlers.handleRemoveDetail}
          products={page.dataProducts.data}
          details={page.details}
          clients={page.dataClients.data}
          setDetails={page.setDetails}
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

const Sales = () => {
  const { t } = useTranslation();
  const page = useSalesPageState();

  const filterHandlers = makeFilterHandlers({
    setPagination: page.setPagination,
    setFilters: page.setFilters,
  });
  const dialogHandlers = {
    ...makeDialogHandlers({
      t,
      setOpenDialog: page.setOpenDialog,
      setActionDialog: page.setActionDialog,
      setSelectedRow: page.setSelectedRow,
      setDetails: page.setDetails,
    }),
    ...makeStatusHandlers({
      t,
      updateSaleStatus: page.updateSaleStatus,
      updateSaleById: page.updateSaleById,
      setAlertProps: page.setAlertProps,
      setOpenAlertDialog: page.setOpenAlertDialog,
      setOpenDialog: page.setOpenDialog,
    }),
  };
  const saveHandler = makeSaveHandler({
    t,
    updateSaleById: page.updateSaleById,
    createSale: page.createSale,
    setAlertProps: page.setAlertProps,
    setOpenAlertDialog: page.setOpenAlertDialog,
    setOpenDialog: page.setOpenDialog,
  });
  const deleteHandler = makeDeleteHandler({
    t,
    deleteSaleById: page.deleteSaleById,
    setAlertProps: page.setAlertProps,
    setOpenAlertDialog: page.setOpenAlertDialog,
    setOpenDialog: page.setOpenDialog,
  });
  const detailHandlers = {
    handleEditDetail: makeEditDetailHandler({ setDetails: page.setDetails }),
    handleAddDetail: makeAddDetailHandler({ setDetails: page.setDetails }),
    handleRemoveDetail: makeRemoveDetailHandler({
      t,
      deleteSaleDetailById: page.deleteSaleDetailById,
      setDetails: page.setDetails,
      setAlertProps: page.setAlertProps,
      setOpenAlertDialog: page.setOpenAlertDialog,
      navigate: page.navigate,
    }),
  };

  return buildSalesLayout({
    t,
    page,
    filterHandlers,
    dialogHandlers,
    saveHandler,
    deleteHandler,
    detailHandlers,
  });
};

export default Sales;
