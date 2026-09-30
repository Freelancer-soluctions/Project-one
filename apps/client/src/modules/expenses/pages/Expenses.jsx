import {
  ExpensesFiltersForm,
  ExpensesDialog,
  ExpensesDatatable,
} from '../components';
import { BackDashBoard } from '@/components/backDash/BackDashBoard';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import {
  useLazyGetAllExpensesQuery,
  useUpdateExpenseByIdMutation,
  useCreateExpenseMutation,
  useDeleteExpenseByIdMutation,
} from '../api/expensesApi';
import { useQueryData, useLoadingState } from '@/hooks';
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
const buildErrorAlertProps = ({ t, err }) => ({
  alertTitle: t('error_occurred_message'),
  alertMessage:
    err.data?.message || err.message || t('operation_failed_message'),
  cancel: false,
  success: true, // To show only one button "OK"
  onSuccess: () => {
    /* stay on dialog or close if needed */
  },
  variantSuccess: 'destructive', // Show error styling
});

/** Save handler: create or update, then show success/error alert. */
const makeSaveHandler =
  ({
    t,
    updateExpenseById,
    createExpense,
    setAlertProps,
    setOpenAlertDialog,
    setOpenDialog,
  }) =>
  async (result) => {
    try {
      if (result?.id) {
        // edit → result = { id, body } with only changed fields
        await updateExpenseById({ id: result.id, data: result.body }).unwrap();
      } else {
        // create → result = { description, total, category }
        await createExpense(result).unwrap();
      }

      setAlertProps(
        buildSuccessAlertProps({ t, isEdit: !!result?.id, setOpenDialog })
      );
      setOpenAlertDialog(true);
    } catch (err) {
      // Handle error display, perhaps another AlertDialog
      setAlertProps(buildErrorAlertProps({ t, err }));
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
    setActionDialog(t('add_expense'));
    setOpenDialog(true);
  },
  handleEditDialog: (row) => {
    setActionDialog(t('edit_expense'));
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
    setOpenDialog(false); // Close main dialog if delete was from there
  },
  variantSuccess: 'info',
});

/** Error alert props for the delete flow. */
const buildDeleteErrorAlertProps = ({ t, err }) => ({
  alertTitle: t('error_occurred_message'),
  alertMessage: err.data?.message || err.message || t('delete_failed_message'),
  cancel: false,
  success: true,
  onSuccess: () => {},
  variantSuccess: 'destructive',
});

/** Delete-confirmation handler for an expense record. */
const makeDeleteHandler =
  ({
    t,
    deleteExpenseById,
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
            await deleteExpenseById(id).unwrap();

            setAlertProps(buildDeletedAlertProps({ t, setOpenDialog }));
            setOpenAlertDialog(true);
          } catch (err) {
            console.error('Error deleting:', err);
            setAlertProps(buildDeleteErrorAlertProps({ t, err }));
            setOpenAlertDialog(true);
          }
        },
      });
      setOpenAlertDialog(true);
    } catch (err) {
      // This catch is unlikely to be hit if the main action is in onDelete,
      // but kept for safety.
      console.error('Error preparing delete confirmation:', err);
    }
  };

/**
 * Page state: lazy query trigger, mutations and dialog/alert/pagination
 * state. El efecto de `triggerExpenses` es la única fuente de verdad
 * para disparar la consulta al backend.
 */
function useExpensesPageState() {
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

  const [triggerExpenses, queryState] = useLazyGetAllExpensesQuery();
  const {
    data: dataExpenses,
    isLoading,
    isFetching,
  } = useQueryData(queryState);
  const { isLoading: isLoadingExpenses, isFetching: isFetchingExpenses } =
    useLoadingState([{ isLoading, isFetching }]);

  const [updateExpenseById, { isLoading: isLoadingPut }] =
    useUpdateExpenseByIdMutation();

  const [createExpense, { isLoading: isLoadingPost }] =
    useCreateExpenseMutation();

  const [deleteExpenseById, { isLoading: isLoadingDelete }] =
    useDeleteExpenseByIdMutation();

  /**
   * Este efecto es la única fuente de verdad para disparar la consulta
   * al backend: se ejecuta al montar y cuando cambian página, tamaño de
   * página o filtros. No hay llamadas manuales desde handlers para
   * evitar duplicación de lógica y estados inconsistentes.
   */
  useEffect(() => {
    triggerExpenses({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      ...filters,
    });
  }, [pagination.pageIndex, pagination.pageSize, filters, triggerExpenses]);

  const isLoadingPage =
    isLoadingExpenses ||
    isFetchingExpenses ||
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
    dataExpenses,
    isLoadingPage,
    updateExpenseById,
    createExpense,
    deleteExpenseById,
  };
}

/** Static page layout for the expenses module. */
const buildExpensesLayout = ({
  t,
  page,
  filterHandlers,
  dialogHandlers,
  saveHandler,
  deleteHandler,
}) => (
  <>
    <BackDashBoard link={'/home'} moduleName={t('expenses')} />
    <div className="relative">
      {page.isLoadingPage && <Spinner />}

      <div className="grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5">
        {/* filters */}
        <div className="col-span-2 row-span-1 md:col-span-5">
          <ExpensesFiltersForm
            onSubmit={filterHandlers.handleSubmitFilters}
            onAddDialog={dialogHandlers.handleAddDialog}
          />
        </div>
        {/* Datatable */}
        <div className="flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5">
          <ExpensesDatatable
            dataExpenses={page.dataExpenses}
            onEditDialog={dialogHandlers.handleEditDialog}
            pagination={page.pagination}
            onPaginationChange={page.setPagination}
          />
        </div>
        {/* Dialog */}
        <ExpensesDialog
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

const Expenses = () => {
  const { t } = useTranslation();
  const page = useExpensesPageState();

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
    updateExpenseById: page.updateExpenseById,
    createExpense: page.createExpense,
    setAlertProps: page.setAlertProps,
    setOpenAlertDialog: page.setOpenAlertDialog,
    setOpenDialog: page.setOpenDialog,
  });
  const deleteHandler = makeDeleteHandler({
    t,
    deleteExpenseById: page.deleteExpenseById,
    setAlertProps: page.setAlertProps,
    setOpenAlertDialog: page.setOpenAlertDialog,
    setOpenDialog: page.setOpenDialog,
  });

  return buildExpensesLayout({
    t,
    page,
    filterHandlers,
    dialogHandlers,
    saveHandler,
    deleteHandler,
  });
};

export default Expenses;
