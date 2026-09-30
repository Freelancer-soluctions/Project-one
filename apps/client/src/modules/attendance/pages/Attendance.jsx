import {
  AttendanceFiltersForm,
  AttendanceDialog,
  AttendanceDatatable,
} from '../components'; // Adjusted import path
import { BackDashBoard } from '@/components/backDash/BackDashBoard';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import {
  useLazyGetAllAttendanceQuery,
  useUpdateAttendanceByIdMutation,
  useCreateAttendanceMutation,
  useDeleteAttendanceByIdMutation,
} from '../api/attendanceApi'; // Adjusted import path
import { useGetAllEmployeesFiltersQuery } from '@/modules/employees/api/employeesApi'; // Assuming employee API exists
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
    updateAttendanceById,
    createAttendance,
    setAlertProps,
    setOpenAlertDialog,
    setOpenDialog,
  }) =>
  async (result) => {
    try {
      if (result?.id) {
        // edit → result = { id, body } with only changed fields (PATCH)
        await updateAttendanceById({
          id: result.id,
          data: result.body,
        }).unwrap();
      } else {
        // create → result = form values (POST)
        await createAttendance(result).unwrap();
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
    setActionDialog(t('add_attendance'));
    setOpenDialog(true);
  },
  handleEditDialog: (row) => {
    setActionDialog(t('edit_attendance'));
    setOpenDialog(true);
    setSelectedRow(row);
  },
  handleCloseDialog: () => {
    setSelectedRow({});
    setOpenDialog(false);
  },
});

/** Delete-confirmation handler for an attendance record. */
const makeDeleteHandler =
  ({
    t,
    deleteAttendanceById,
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
            await deleteAttendanceById(id).unwrap();

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
            // Optional: Show error alert on delete failure
            setAlertProps({
              alertTitle: t('error'),
              alertMessage: t('delete_failed'), // Add translation
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

/**
 * Page state: lazy query trigger, mutations and dialog/alert/pagination
 * state. El efecto de `triggerAttendance` es la única fuente de verdad
 * para disparar la consulta al backend: se ejecuta al montar y cuando
 * cambian página, tamaño de página o filtros.
 */
function useAttendancePageState() {
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

  const [triggerAttendance, queryStateAttendance] =
    useLazyGetAllAttendanceQuery();
  const {
    data: dataAttendance = [],
    isLoading: isLoadingAtt,
    isFetching: isFetchingAtt,
  } = useQueryData(queryStateAttendance);

  const {
    data: dataEmployees = [],
    isLoading: isLoadingEmp,
    isFetching: isFetchingEmp,
  } = useQueryData(useGetAllEmployeesFiltersQuery());

  const { isLoading: isLoadingAny, isFetching: isFetchingAny } =
    useLoadingState([
      { isLoading: isLoadingAtt, isFetching: isFetchingAtt },
      { isLoading: isLoadingEmp, isFetching: isFetchingEmp },
    ]);

  const [updateAttendanceById, { isLoading: isLoadingPut }] =
    useUpdateAttendanceByIdMutation();

  const [createAttendance, { isLoading: isLoadingPost }] =
    useCreateAttendanceMutation();

  const [deleteAttendanceById, { isLoading: isLoadingDelete }] =
    useDeleteAttendanceByIdMutation();

  useEffect(() => {
    triggerAttendance({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      ...filters,
    });
  }, [pagination.pageIndex, pagination.pageSize, filters, triggerAttendance]);

  const isLoadingPage =
    isLoadingAny ||
    isFetchingAny ||
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
    dataAttendance,
    dataEmployees,
    isLoadingPage,
    updateAttendanceById,
    createAttendance,
    deleteAttendanceById,
  };
}

/** Static page layout for the attendance module. */
const buildAttendanceLayout = ({
  t,
  page,
  filterHandlers,
  dialogHandlers,
  saveHandler,
  deleteHandler,
}) => (
  <>
    <BackDashBoard link={'/home'} moduleName={t('attendance')} />
    <div className="relative">
      {/* Show spinner when loading or fetching */}
      {page.isLoadingPage && <Spinner />}

      <div className="grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5">
        <div className="col-span-2 row-span-1 md:col-span-5">
          {/* Span full width */}
          <AttendanceFiltersForm
            onSubmit={filterHandlers.handleSubmitFilters}
            onAddDialog={dialogHandlers.handleAddDialog}
            dataEmployees={page.dataEmployees}
          />
        </div>
        {/* Datatable */}
        <div className="flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5">
          <AttendanceDatatable
            dataAttendance={page.dataAttendance}
            onEditDialog={dialogHandlers.handleEditDialog}
            pagination={page.pagination}
            onPaginationChange={page.setPagination}
          />
        </div>
        {/* Dialog */}
        <AttendanceDialog
          openDialog={page.openDialog}
          onCloseDialog={dialogHandlers.handleCloseDialog}
          selectedRow={page.selectedRow}
          onSubmit={saveHandler}
          onDeleteById={deleteHandler}
          actionDialog={page.actionDialog}
          dataEmployees={page.dataEmployees}
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

const Attendance = () => {
  const { t } = useTranslation();
  const page = useAttendancePageState();

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
    updateAttendanceById: page.updateAttendanceById,
    createAttendance: page.createAttendance,
    setAlertProps: page.setAlertProps,
    setOpenAlertDialog: page.setOpenAlertDialog,
    setOpenDialog: page.setOpenDialog,
  });
  const deleteHandler = makeDeleteHandler({
    t,
    deleteAttendanceById: page.deleteAttendanceById,
    setAlertProps: page.setAlertProps,
    setOpenAlertDialog: page.setOpenAlertDialog,
    setOpenDialog: page.setOpenDialog,
  });

  return buildAttendanceLayout({
    t,
    page,
    filterHandlers,
    dialogHandlers,
    saveHandler,
    deleteHandler,
  });
};

export default Attendance;
