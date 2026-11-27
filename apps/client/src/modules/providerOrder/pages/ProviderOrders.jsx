import {
  ProviderOrdersFiltersForm,
  ProviderOrdersDialog,
  ProviderOrdersDatatable,
} from '../components';
import { BackDashBoard } from '@/components/backDash/BackDashBoard';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import {
  useLazyGetAllProviderOrdersQuery,
  useUpdateProviderOrderByIdMutation,
  useCreateProviderOrderMutation,
  useDeleteProviderOrderByIdMutation,
  useConvertProviderOrderToPurchaseMutation,
} from '../api/providerOrderApi';
import AlertDialogComponent from '@/components/alertDialog/AlertDialog';
import { Spinner } from '@/components/loader/Spinner';

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

/** Save handler: create or update, then show the success alert. */
const makeSaveHandler =
  ({
    t,
    updateProviderOrderById,
    createProviderOrder,
    setAlertProps,
    setOpenAlertDialog,
    setOpenDialog,
  }) =>
  async (result) => {
    try {
      if (result?.id) {
        // edit → result = { id, body } with only changed fields (PATCH)
        await updateProviderOrderById({
          id: result.id,
          data: result.body,
        }).unwrap();
      } else {
        // create → result = form values (POST)
        await createProviderOrder(result).unwrap();
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
    setActionDialog(t('add_provider_order'));
    setOpenDialog(true);
  },
  handleEditDialog: (row) => {
    setActionDialog(t('edit_provider_order'));
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

/** Converts an order into a purchase and shows the success alert. */
const makeConvertHandler =
  ({
    t,
    convertProviderOrderToPurchase,
    setAlertProps,
    setOpenAlertDialog,
    setOpenDialog,
  }) =>
  async (id) => {
    try {
      await convertProviderOrderToPurchase(id).unwrap();

      setAlertProps({
        alertTitle: t('convert_order'),
        alertMessage: t('converted_successfully'),
        cancel: false,
        success: true,
        onSuccess: () => {
          setOpenDialog(false);
        },
        variantSuccess: 'info',
      });
      setOpenAlertDialog(true);
    } catch (err) {
      console.error('Error converting:', err);
    }
  };

/** Delete-confirmation handler for a provider order. */
const makeDeleteHandler =
  ({
    t,
    deleteProviderOrderById,
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
            await deleteProviderOrderById(id).unwrap();

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
 * Page state: lazy query, mutations, dialog/alert state and pagination.
 * El efecto de `getAllProviderOrders` es la única fuente de verdad para
 * disparar la consulta: se ejecuta al montar y cuando cambian página o filtros.
 */
function useProviderOrdersPageState() {
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
    triggerProviderOrders,
    {
      data: dataProviderOrders = { data: { dataList: [], total: 0 } },
      isLoading: isLoadingProviderOrders,
      isFetching: isFetchingProviderOrders,
    },
  ] = useLazyGetAllProviderOrdersQuery();

  useEffect(() => {
    triggerProviderOrders({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      ...filters,
    });
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    filters,
    triggerProviderOrders,
  ]);

  const [updateProviderOrderById, { isLoading: isLoadingPut }] =
    useUpdateProviderOrderByIdMutation();

  const [createProviderOrder, { isLoading: isLoadingPost }] =
    useCreateProviderOrderMutation();

  const [deleteProviderOrderById, { isLoading: isLoadingDelete }] =
    useDeleteProviderOrderByIdMutation();

  const [convertProviderOrderToPurchase, { isLoading: isLoadingConvert }] =
    useConvertProviderOrderToPurchaseMutation();

  const handleSubmitFilters = (data) => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    setFilters(data);
  };

  const isLoadingPage =
    isLoadingProviderOrders ||
    isLoadingPut ||
    isLoadingPost ||
    isLoadingDelete ||
    isLoadingConvert ||
    isFetchingProviderOrders;

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
    dataProviderOrders,
    isLoadingPage,
    handleSubmitFilters,
    updateProviderOrderById,
    createProviderOrder,
    deleteProviderOrderById,
    convertProviderOrderToPurchase,
  };
}

/** Static page layout for the provider orders module. */
const buildProviderOrdersLayout = ({
  t,
  page,
  dialogHandlers,
  saveHandler,
  deleteHandler,
  convertHandler,
}) => (
  <>
    <BackDashBoard link={'/home'} moduleName={t('provider_orders')} />
    <div className="relative">
      {/* Show spinner when loading or fetching */}
      {page.isLoadingPage && <Spinner />}

      <div className="grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5">
        {/* filters */}
        <div className="col-span-2 row-span-1 md:col-span-5">
          <ProviderOrdersFiltersForm
            onSubmit={page.handleSubmitFilters}
            onAddDialog={dialogHandlers.handleAddDialog}
          />
        </div>
        {/* Datatable */}
        <div className="flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5">
          <ProviderOrdersDatatable
            dataProviderOrders={page.dataProviderOrders}
            onEditDialog={dialogHandlers.handleEditDialog}
            pagination={page.pagination}
            onPaginationChange={page.setPagination}
          />
        </div>
        {/* Dialog */}
        <ProviderOrdersDialog
          openDialog={page.openDialog}
          onCloseDialog={dialogHandlers.handleCloseDialog}
          selectedRow={page.selectedRow}
          onSubmit={saveHandler}
          onDeleteById={deleteHandler}
          onConvertById={convertHandler}
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

const ProviderOrders = () => {
  const { t } = useTranslation();
  const page = useProviderOrdersPageState();

  const dialogHandlers = makeDialogHandlers({
    t,
    setOpenDialog: page.setOpenDialog,
    setActionDialog: page.setActionDialog,
    setSelectedRow: page.setSelectedRow,
  });
  const saveHandler = makeSaveHandler({
    t,
    updateProviderOrderById: page.updateProviderOrderById,
    createProviderOrder: page.createProviderOrder,
    setAlertProps: page.setAlertProps,
    setOpenAlertDialog: page.setOpenAlertDialog,
    setOpenDialog: page.setOpenDialog,
  });
  const deleteHandler = makeDeleteHandler({
    t,
    deleteProviderOrderById: page.deleteProviderOrderById,
    setAlertProps: page.setAlertProps,
    setOpenAlertDialog: page.setOpenAlertDialog,
    setOpenDialog: page.setOpenDialog,
  });
  const convertHandler = makeConvertHandler({
    t,
    convertProviderOrderToPurchase: page.convertProviderOrderToPurchase,
    setAlertProps: page.setAlertProps,
    setOpenAlertDialog: page.setOpenAlertDialog,
    setOpenDialog: page.setOpenDialog,
  });

  return buildProviderOrdersLayout({
    t,
    page,
    dialogHandlers,
    saveHandler,
    deleteHandler,
    convertHandler,
  });
};

export default ProviderOrders;
