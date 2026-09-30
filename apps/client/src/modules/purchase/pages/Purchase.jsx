import {
  PurchaseFiltersForm,
  PurchaseDialog,
  PurchaseDatatable,
} from '../components';
import { BackDashBoard } from '@/components/backDash/BackDashBoard';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  useLazyGetAllPurchasesQuery,
  useUpdatePurchaseByIdMutation,
  useCreatePurchaseMutation,
  useDeletePurchaseByIdMutation,
  useDeletePurchaseDetailByIdMutation,
} from '../api/purchaseAPI';
import { useGetAllProductsFiltersQuery } from '@/modules/products/api/productsAPI';
import { useGetAllProvidersFiltersQuery } from '@/modules/providers/api/providersAPI';
import AlertDialogComponent from '@/components/alertDialog/AlertDialog';
import { Spinner } from '@/components/loader/Spinner';
import { useLoadingState } from '@/hooks';

const EMPTY_DETAILS = [
  {
    productId: '',
    quantity: 0,
    price: 0,
  },
];

/**
 * Queries the purchases list and the providers/products catalogs.
 * El efecto de `triggerPurchases` es la única fuente de verdad para
 * disparar la consulta al backend: se ejecuta al montar y cuando
 * cambian página, tamaño de página o filtros.
 */
function usePurchaseQueries({ pagination, filters }) {
  const [
    triggerPurchases,
    {
      data: dataPurchases = { data: [] },
      isLoading: isLoadingPurchases,
      isFetching: isFetchingPurchases,
    },
  ] = useLazyGetAllPurchasesQuery();

  const {
    data: dataProviders = { data: [] },
    isLoading: isLoadingProviders,
    isFetching: isFetchingProviders,
  } = useGetAllProvidersFiltersQuery();

  const {
    data: dataProducts = { data: [] },
    isLoading: isLoadingProducts,
    isFetching: isFetchingProducts,
  } = useGetAllProductsFiltersQuery();

  useEffect(() => {
    triggerPurchases({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      ...filters,
    });
  }, [pagination.pageIndex, pagination.pageSize, filters, triggerPurchases]);

  const { isLoading: isLoadingQueries, isFetching: isFetchingQueries } =
    useLoadingState([
      { isLoading: isLoadingPurchases, isFetching: isFetchingPurchases },
      { isLoading: isLoadingProviders, isFetching: isFetchingProviders },
      { isLoading: isLoadingProducts, isFetching: isFetchingProducts },
    ]);

  return {
    dataPurchases,
    dataProviders,
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
    updatePurchaseById,
    createPurchase,
    setAlertProps,
    setOpenAlertDialog,
    setOpenDialog,
  }) =>
  async (result) => {
    try {
      if (result?.id) {
        // edit → result = { id, body } with only changed fields (PATCH)
        await updatePurchaseById({ id: result.id, data: result.body }).unwrap();
      } else {
        // create → result = form values (POST)
        await createPurchase(result).unwrap();
      }

      setAlertProps(
        buildSuccessAlertProps({ t, isEdit: !!result?.id, setOpenDialog })
      );
      setOpenAlertDialog(true);
    } catch (err) {
      console.error('Error:', err);
    }
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
    setActionDialog(t('add_purchase'));
    setOpenDialog(true);
    setDetails(EMPTY_DETAILS);
    setSelectedRow({});
  },
  handleEditDialog: (row) => {
    setActionDialog(t('edit_purchase'));
    setOpenDialog(true);
    setSelectedRow(row);
    // Cargar detalles de la fila seleccionada
    setDetails(
      row.details && row.details.length > 0 ? row.details : EMPTY_DETAILS
    );
  },
  handleCloseDialog: () => {
    setOpenDialog(false);
  },
});

/** Delete-confirmation handler for a purchase. */
const makeDeleteHandler =
  ({
    t,
    deletePurchaseById,
    setAlertProps,
    setOpenAlertDialog,
    setOpenDialog,
  }) =>
  async (id) => {
    try {
      setAlertProps(
        buildDeleteConfirmAlertProps({
          t,
          onDelete: async () => {
            try {
              await deletePurchaseById(id).unwrap();

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

/** Delete-confirmation handler for a purchase detail. */
const makeRemoveDetailHandler =
  ({
    t,
    deletePurchaseDetailById,
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
              await deletePurchaseDetailById(item.id).unwrap();
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
 * Page state: lazy query trigger, providers/products catalogs,
 * mutations, purchase details list and dialog/alert/pagination state.
 * El efecto de `triggerPurchases` es la única fuente de verdad para
 * disparar la consulta al backend: se ejecuta al montar y cuando
 * cambian página, tamaño de página o filtros.
 */
function usePurchasePageState() {
  const navigate = useNavigate();
  const [selectedRow, setSelectedRow] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [openAlertDialog, setOpenAlertDialog] = useState(false);
  const [alertProps, setAlertProps] = useState({});
  const [actionDialog, setActionDialog] = useState('');
  const [details, setDetails] = useState(EMPTY_DETAILS);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const [filters, setFilters] = useState({});

  const [updatePurchaseById, { isLoading: isLoadingPut }] =
    useUpdatePurchaseByIdMutation();

  const [createPurchase, { isLoading: isLoadingPost }] =
    useCreatePurchaseMutation();

  const [deletePurchaseById, { isLoading: isLoadingDelete }] =
    useDeletePurchaseByIdMutation();

  const [deletePurchaseDetailById, { isLoading: isLoadingDeleteDetail }] =
    useDeletePurchaseDetailByIdMutation();

  const {
    dataPurchases,
    dataProviders,
    dataProducts,
    isLoadingQueries,
    isFetchingQueries,
  } = usePurchaseQueries({ pagination, filters });

  const isLoadingPage =
    isLoadingQueries ||
    isFetchingQueries ||
    isLoadingPut ||
    isLoadingPost ||
    isLoadingDelete ||
    isLoadingDeleteDetail;

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
    dataPurchases,
    dataProviders,
    dataProducts,
    isLoadingPage,
    updatePurchaseById,
    createPurchase,
    deletePurchaseById,
    deletePurchaseDetailById,
  };
}

/** Static page layout for the purchases module. */
const buildPurchaseLayout = ({
  t,
  page,
  filterHandlers,
  dialogHandlers,
  saveHandler,
  deleteHandler,
  detailHandlers,
}) => (
  <>
    <BackDashBoard link={'/home'} moduleName={t('purchases')} />
    <div className="relative">
      {/* Show spinner when loading or fetching */}
      {page.isLoadingPage && <Spinner />}

      <div className="grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5">
        {/* filters */}
        <div className="col-span-2 row-span-1 md:col-span-5">
          <PurchaseFiltersForm
            onSubmit={filterHandlers.handleSubmitFilters}
            onAddDialog={dialogHandlers.handleAddDialog}
            providers={page.dataProviders.data}
          />
        </div>
        {/* Datatable */}
        <div className="flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5">
          <PurchaseDatatable
            dataPurchases={page.dataPurchases}
            onEditDialog={dialogHandlers.handleEditDialog}
            pagination={page.pagination}
            onPaginationChange={page.setPagination}
          />
        </div>
        {/* Dialog */}
        <PurchaseDialog
          openDialog={page.openDialog}
          onCloseDialog={dialogHandlers.handleCloseDialog}
          selectedRow={page.selectedRow}
          onSubmit={saveHandler}
          onDeleteById={deleteHandler}
          actionDialog={page.actionDialog}
          onEditDetail={detailHandlers.handleEditDetail}
          onAddDetail={detailHandlers.handleAddDetail}
          onRemoveDetail={detailHandlers.handleRemoveDetail}
          products={page.dataProducts.data}
          details={page.details}
          providers={page.dataProviders.data}
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

const Purchase = () => {
  const { t } = useTranslation();
  const page = usePurchasePageState();

  const filterHandlers = makeFilterHandlers({
    setPagination: page.setPagination,
    setFilters: page.setFilters,
  });
  const dialogHandlers = makeDialogHandlers({
    t,
    setOpenDialog: page.setOpenDialog,
    setActionDialog: page.setActionDialog,
    setSelectedRow: page.setSelectedRow,
    setDetails: page.setDetails,
  });
  const saveHandler = makeSaveHandler({
    t,
    updatePurchaseById: page.updatePurchaseById,
    createPurchase: page.createPurchase,
    setAlertProps: page.setAlertProps,
    setOpenAlertDialog: page.setOpenAlertDialog,
    setOpenDialog: page.setOpenDialog,
  });
  const deleteHandler = makeDeleteHandler({
    t,
    deletePurchaseById: page.deletePurchaseById,
    setAlertProps: page.setAlertProps,
    setOpenAlertDialog: page.setOpenAlertDialog,
    setOpenDialog: page.setOpenDialog,
  });
  const detailHandlers = {
    handleEditDetail: makeEditDetailHandler({ setDetails: page.setDetails }),
    handleAddDetail: makeAddDetailHandler({ setDetails: page.setDetails }),
    handleRemoveDetail: makeRemoveDetailHandler({
      t,
      deletePurchaseDetailById: page.deletePurchaseDetailById,
      setDetails: page.setDetails,
      setAlertProps: page.setAlertProps,
      setOpenAlertDialog: page.setOpenAlertDialog,
      navigate: page.navigate,
    }),
  };

  return buildPurchaseLayout({
    t,
    page,
    filterHandlers,
    dialogHandlers,
    saveHandler,
    deleteHandler,
    detailHandlers,
  });
};

export default Purchase;
