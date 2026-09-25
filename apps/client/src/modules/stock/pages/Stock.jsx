import { StockFiltersForm, StockDialog, StockDatatable } from '../components';
import { BackDashBoard } from '@/components/backDash/BackDashBoard';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import {
  useLazyGetAllStockQuery,
  useUpdateStockByIdMutation,
  useCreateStockMutation,
  useDeleteStockByIdMutation,
} from '../api/stockAPI';
import { useGetAllProductsFiltersQuery } from '@/modules/products/api/productsAPI';
import { useGetAllWarehousesFiltersQuery } from '@/modules/warehouse/api/warehouseAPI';
import AlertDialogComponent from '@/components/alertDialog/AlertDialog';
import { Spinner } from '@/components/loader/Spinner';
import { unitMeasures } from '../utils';
import { useLocation } from 'react-router';

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

/** Create payload: strings back to numbers for the API. */
const toCreateStockPayload = (result) => ({
  quantity: Number(result.quantity),
  minimum: Number(result.minimum),
  maximum: result.maximum ? Number(result.maximum) : null,
  lot: result.lot,
  unitMeasure: result.unitMeasure,
  expirationDate: result.expirationDate,
  productId: Number(result.productId),
  warehouseId: Number(result.warehouseId),
});

/** Save handler: create or update, then show the success alert. */
const makeSaveHandler =
  ({
    t,
    updateStockById,
    createStock,
    setAlertProps,
    setOpenAlertDialog,
    setOpenDialog,
  }) =>
  async (result) => {
    try {
      if (result?.id) {
        // edit → result = { id, body } with only changed fields (PATCH)
        await updateStockById({ id: result.id, data: result.body }).unwrap();
      } else {
        // create → result = form values (POST)
        await createStock(toCreateStockPayload(result)).unwrap();
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
    setActionDialog(t('add_stock'));
    setOpenDialog(true);
    setSelectedRow({});
  },
  handleEditDialog: (row) => {
    setActionDialog(t('edit_stock'));
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

/** Delete-confirmation handler for a stock record. */
const makeDeleteHandler =
  ({ t, deleteStockById, setAlertProps, setOpenAlertDialog, setOpenDialog }) =>
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
            await deleteStockById(id).unwrap();

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
 * Page state: lazy query trigger, products/warehouses catalogs,
 * mutations and dialog/alert/pagination state. El efecto de
 * `triggerStock` es la única fuente de verdad para disparar la consulta
 * al backend: se ejecuta al montar y cuando cambian página, tamaño de
 * página o filtros.
 */
function useStockPageState() {
  const [selectedRow, setSelectedRow] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [openAlertDialog, setOpenAlertDialog] = useState(false);
  const [alertProps, setAlertProps] = useState({});
  const [actionDialog, setActionDialog] = useState('');
  const location = useLocation();
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const [filters, setFilters] = useState({});

  const [
    triggerStock,
    {
      data: dataStock = { data: [] },
      isLoading: isLoadingStock,
      isFetching: isFetchingStock,
    },
  ] = useLazyGetAllStockQuery();

  const [updateStockById, { isLoading: isLoadingPut }] =
    useUpdateStockByIdMutation();

  const [createStock, { isLoading: isLoadingPost }] = useCreateStockMutation();

  const [deleteStockById, { isLoading: isLoadingDelete }] =
    useDeleteStockByIdMutation();

  const {
    data: dataProducts = { data: [] },
    isLoading: isLoadingProducts,
    isFetching: isFetchingProduct,
  } = useGetAllProductsFiltersQuery();

  const {
    data: dataWarehouses = { data: [] },
    isLoading: isLoadingWarehouses,
    isFetching: isFetchingWarehouse,
  } = useGetAllWarehousesFiltersQuery();

  useEffect(() => {
    if (location.state?.filter) {
      triggerStock({ ...location.state.filter });
    }
  }, [location.state?.filter, triggerStock]);

  /**
   * Este efecto es la única fuente de verdad para disparar
   * la consulta al backend. Se ejecuta al montar y cuando
   * cambian página, tamaño de página o filtros.
   */
  useEffect(() => {
    triggerStock({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      ...filters,
    });
  }, [pagination.pageIndex, pagination.pageSize, filters, triggerStock]);

  const isLoadingPage =
    isLoadingStock ||
    isLoadingPut ||
    isLoadingPost ||
    isLoadingDelete ||
    isFetchingStock ||
    isFetchingProduct ||
    isFetchingWarehouse ||
    isLoadingProducts ||
    isLoadingWarehouses;

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
    dataStock,
    dataProducts,
    dataWarehouses,
    isLoadingPage,
    updateStockById,
    createStock,
    deleteStockById,
  };
}

/** Static page layout for the stock module. */
const buildStockLayout = ({
  t,
  page,
  filterHandlers,
  dialogHandlers,
  saveHandler,
  deleteHandler,
}) => (
  <>
    <BackDashBoard link={'/home'} moduleName={t('stock')} />
    <div className="relative">
      {page.isLoadingPage && <Spinner />}

      <div className="grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5">
        {/* filters */}
        <div className="col-span-2 row-span-1 md:col-span-5">
          <StockFiltersForm
            onSubmit={filterHandlers.handleSubmitFilters}
            onAddDialog={dialogHandlers.handleAddDialog}
            unitMeasures={unitMeasures}
            products={page.dataProducts.data}
            warehouses={page.dataWarehouses.data}
          />
        </div>
        {/* Datatable */}
        <div className="flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5">
          <StockDatatable
            dataStock={page.dataStock}
            onEditDialog={dialogHandlers.handleEditDialog}
            pagination={page.pagination}
            onPaginationChange={page.setPagination}
          />
        </div>
        {/* Dialog */}
        <StockDialog
          openDialog={page.openDialog}
          onCloseDialog={dialogHandlers.handleCloseDialog}
          selectedRow={page.selectedRow}
          unitMeasures={unitMeasures}
          products={page.dataProducts.data}
          warehouses={page.dataWarehouses.data}
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

const Stock = () => {
  const { t } = useTranslation();
  const page = useStockPageState();

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
    updateStockById: page.updateStockById,
    createStock: page.createStock,
    setAlertProps: page.setAlertProps,
    setOpenAlertDialog: page.setOpenAlertDialog,
    setOpenDialog: page.setOpenDialog,
  });
  const deleteHandler = makeDeleteHandler({
    t,
    deleteStockById: page.deleteStockById,
    setAlertProps: page.setAlertProps,
    setOpenAlertDialog: page.setOpenAlertDialog,
    setOpenDialog: page.setOpenDialog,
  });

  return buildStockLayout({
    t,
    page,
    filterHandlers,
    dialogHandlers,
    saveHandler,
    deleteHandler,
  });
};

export default Stock;
