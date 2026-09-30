import {
  InventoryMovementFiltersForm,
  InventoryMovementDialog,
  InventoryMovementDatatable,
} from '../components';
import { BackDashBoard } from '@/components/backDash/BackDashBoard';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import {
  useLazyGetAllInventoryMovementsQuery,
  useUpdateInventoryMovementByIdMutation,
  useCreateInventoryMovementMutation,
  useDeleteInventoryMovementByIdMutation,
} from '../api/inventoryMovementAPI';
import { useGetAllProductsFiltersQuery } from '@/modules/products/api/productsAPI';
import { useGetAllWarehousesFiltersQuery } from '@/modules/warehouse/api/warehouseAPI';
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

/** Save handler: create or update, then show the success alert. */
const makeSaveHandler =
  ({
    t,
    updateInventoryMovementById,
    createInventoryMovement,
    setAlertProps,
    setOpenAlertDialog,
    setOpenDialog,
  }) =>
  async (result) => {
    try {
      if (result?.id) {
        // edit → result = { id, body } with only changed fields (PATCH)
        await updateInventoryMovementById({
          id: result.id,
          data: result.body,
        }).unwrap();
      } else {
        // create → result = form values (POST)
        await createInventoryMovement(result).unwrap();
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
    setActionDialog(t('add_inventory_movement'));
    setOpenDialog(true);
  },
  handleEditDialog: (row) => {
    setActionDialog(t('edit_inventory_movement'));
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

/** Delete-confirmation handler for an inventory movement. */
const makeDeleteHandler =
  ({
    t,
    deleteInventoryMovementById,
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
            await deleteInventoryMovementById(id).unwrap();

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
 * `triggerMovements` es la única fuente de verdad para disparar la
 * consulta al backend: se ejecuta al montar y cuando cambian página,
 * tamaño de página o filtros.
 */
function useInventoryMovementPageState() {
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

  const [
    triggerMovements,
    {
      data: dataInventoryMovements = { data: [] },
      isLoading: isLoadingInventoryMovements,
      isFetching: isFetchingInventoryMovements,
    },
  ] = useLazyGetAllInventoryMovementsQuery();

  const {
    data: dataProducts = { data: [] },
    isLoading: isLoadingProducts,
    isFetching: isFetchingProducts,
  } = useGetAllProductsFiltersQuery();

  const {
    data: dataWarehouses = { data: [] },
    isLoading: isLoadingWarehouses,
    isFetching: isFetchingWarehouses,
  } = useGetAllWarehousesFiltersQuery();

  const [updateInventoryMovementById, { isLoading: isLoadingPut }] =
    useUpdateInventoryMovementByIdMutation();

  const [createInventoryMovement, { isLoading: isLoadingPost }] =
    useCreateInventoryMovementMutation();

  const [deleteInventoryMovementById, { isLoading: isLoadingDelete }] =
    useDeleteInventoryMovementByIdMutation();

  /**
   * Este efecto es la única fuente de verdad para disparar
   * la consulta al backend. Se ejecuta al montar y cuando
   * cambian página, tamaño de página o filtros.
   */
  useEffect(() => {
    triggerMovements({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      ...filters,
    });
  }, [pagination.pageIndex, pagination.pageSize, filters, triggerMovements]);

  const isLoadingPage =
    isLoadingInventoryMovements ||
    isLoadingPut ||
    isLoadingPost ||
    isLoadingProducts ||
    isLoadingDelete ||
    isLoadingWarehouses ||
    isFetchingInventoryMovements ||
    isFetchingWarehouses ||
    isFetchingProducts;

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
    dataInventoryMovements,
    dataProducts,
    dataWarehouses,
    isLoadingPage,
    updateInventoryMovementById,
    createInventoryMovement,
    deleteInventoryMovementById,
  };
}

/** Static page layout for the inventory movements module. */
const buildInventoryMovementLayout = ({
  t,
  page,
  filterHandlers,
  dialogHandlers,
  saveHandler,
  deleteHandler,
}) => (
  <>
    <BackDashBoard link={'/home'} moduleName={t('inventory_movements')} />
    <div className="relative">
      {/* Show spinner when loading or fetching */}
      {page.isLoadingPage && <Spinner />}

      <div className="grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5">
        {/* filters */}
        <div className="col-span-2 row-span-1 md:col-span-5">
          <InventoryMovementFiltersForm
            onSubmit={filterHandlers.handleSubmitFilters}
            onAddDialog={dialogHandlers.handleAddDialog}
            products={page.dataProducts.data}
            warehouses={page.dataWarehouses.data}
          />
        </div>
        {/* Datatable */}
        <div className="flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5">
          <InventoryMovementDatatable
            dataInventoryMovements={page.dataInventoryMovements}
            onEditDialog={dialogHandlers.handleEditDialog}
            pagination={page.pagination}
            onPaginationChange={page.setPagination}
          />
        </div>
        {/* Dialog */}
        <InventoryMovementDialog
          openDialog={page.openDialog}
          onCloseDialog={dialogHandlers.handleCloseDialog}
          selectedRow={page.selectedRow}
          onSubmit={saveHandler}
          onDeleteById={deleteHandler}
          actionDialog={page.actionDialog}
          products={page.dataProducts.data}
          warehouses={page.dataWarehouses.data}
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

const InventoryMovement = () => {
  const { t } = useTranslation();
  const page = useInventoryMovementPageState();

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
    updateInventoryMovementById: page.updateInventoryMovementById,
    createInventoryMovement: page.createInventoryMovement,
    setAlertProps: page.setAlertProps,
    setOpenAlertDialog: page.setOpenAlertDialog,
    setOpenDialog: page.setOpenDialog,
  });
  const deleteHandler = makeDeleteHandler({
    t,
    deleteInventoryMovementById: page.deleteInventoryMovementById,
    setAlertProps: page.setAlertProps,
    setOpenAlertDialog: page.setOpenAlertDialog,
    setOpenDialog: page.setOpenDialog,
  });

  return buildInventoryMovementLayout({
    t,
    page,
    filterHandlers,
    dialogHandlers,
    saveHandler,
    deleteHandler,
  });
};

export default InventoryMovement;
