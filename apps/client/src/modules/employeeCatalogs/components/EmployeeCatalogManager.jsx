import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

import { EmployeeCatalogFiltersForm } from './EmployeeCatalogFiltersForm';
import { EmployeeCatalogDatatable } from './EmployeeCatalogDatatable';
import { EmployeeCatalogDialog } from './EmployeeCatalogDialog';
import AlertDialogComponent from '@/components/alertDialog/AlertDialog';
import { Spinner } from '@/components/loader/Spinner';

/** Success alert props for create/update/delete flows. */
const buildSuccessAlertProps = ({ t, messageKey, setOpenDialog }) => ({
  alertTitle: '',
  alertMessage: t(messageKey),
  cancel: false,
  success: true,
  onSuccess: () => setOpenDialog(false),
  variantSuccess: 'info',
});

/** Create/update handler: dispatches by presence of `result.id`. */
const buildSaveHandler =
  ({
    t,
    createRecord,
    updateRecord,
    setAlertProps,
    setOpenAlertDialog,
    setOpenDialog,
  }) =>
  async (result) => {
    try {
      if (result?.id) {
        await updateRecord({ id: result.id, data: result.body }).unwrap();
      } else {
        await createRecord(result).unwrap();
      }

      setAlertProps(
        buildSuccessAlertProps({
          t,
          messageKey: result?.id
            ? 'updated_successfully'
            : 'added_successfully',
          setOpenDialog,
        })
      );
      setOpenAlertDialog(true);
    } catch (err) {
      console.error('Error saving catalog record:', err);
    }
  };

/** Delete-confirmation handler for one catalog row. */
const buildDeleteHandler =
  ({ t, deleteRecord, setAlertProps, setOpenAlertDialog, setOpenDialog }) =>
  (id) => {
    const onDeleted = () => {
      setAlertProps(
        buildSuccessAlertProps({
          t,
          messageKey: 'deleted_successfully',
          setOpenDialog,
        })
      );
      setOpenAlertDialog(true);
    };

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
          await deleteRecord(id).unwrap();
          onDeleted();
        } catch (err) {
          console.error('Error deleting catalog record:', err);
        }
      },
    });
    setOpenAlertDialog(true);
  };

/** Page state: list query, pagination, filters and dialog/alert state. */
function useCatalogManagerState(config) {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [filters, setFilters] = useState({});
  const [selectedRow, setSelectedRow] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [actionDialog, setActionDialog] = useState('');
  const [openAlertDialog, setOpenAlertDialog] = useState(false);
  const [alertProps, setAlertProps] = useState({});

  const [triggerList, queryState] = config.useLazyList();
  const [createRecord, { isLoading: isCreating }] = config.useCreate();
  const [updateRecord, { isLoading: isUpdating }] = config.useUpdate();
  const [deleteRecord, { isLoading: isDeleting }] = config.useDelete();

  useEffect(() => {
    triggerList({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      ...filters,
    });
  }, [pagination.pageIndex, pagination.pageSize, filters, triggerList]);

  const handleSubmitFilters = (newFilters) => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    setFilters(newFilters);
  };

  const handleCloseDialog = () => {
    setSelectedRow({});
    setOpenDialog(false);
  };

  return {
    pagination,
    setPagination,
    filters,
    setFilters,
    selectedRow,
    setSelectedRow,
    openDialog,
    setOpenDialog,
    actionDialog,
    setActionDialog,
    openAlertDialog,
    setOpenAlertDialog,
    alertProps,
    setAlertProps,
    queryState,
    createRecord,
    updateRecord,
    deleteRecord,
    isLoading:
      queryState.isLoading ||
      queryState.isFetching ||
      isCreating ||
      isUpdating ||
      isDeleting,
    handleSubmitFilters,
    handleCloseDialog,
  };
}

/**
 * Catalog manager: one instance per kind (position/department). The hooks
 * arrive through `config`, so each instance always calls the same hooks.
 */
export const EmployeeCatalogManager = ({ config }) => {
  const { t } = useTranslation();
  const page = useCatalogManagerState(config);

  const dataList = page.queryState.data?.data?.dataList ?? [];
  const total = page.queryState.data?.data?.total ?? 0;

  const handleAddDialog = () => {
    page.setActionDialog(t(config.addTitleKey));
    page.setOpenDialog(true);
  };

  const handleEditDialog = (row) => {
    page.setActionDialog(t(config.editTitleKey));
    page.setSelectedRow(row);
    page.setOpenDialog(true);
  };

  const handleSave = buildSaveHandler({
    t,
    createRecord: page.createRecord,
    updateRecord: page.updateRecord,
    setAlertProps: page.setAlertProps,
    setOpenAlertDialog: page.setOpenAlertDialog,
    setOpenDialog: page.setOpenDialog,
  });

  const handleDeleteById = buildDeleteHandler({
    t,
    deleteRecord: page.deleteRecord,
    setAlertProps: page.setAlertProps,
    setOpenAlertDialog: page.setOpenAlertDialog,
    setOpenDialog: page.setOpenDialog,
  });

  return (
    <div className="relative">
      {page.isLoading && <Spinner />}

      <div className="grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5">
        <div className="col-span-2 row-span-1 md:col-span-5">
          <EmployeeCatalogFiltersForm
            onSubmit={page.handleSubmitFilters}
            onAdd={handleAddDialog}
          />
        </div>
        <div className="flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5">
          <EmployeeCatalogDatatable
            dataList={dataList}
            total={total}
            onEdit={handleEditDialog}
            pagination={page.pagination}
            onPaginationChange={page.setPagination}
          />
        </div>

        <EmployeeCatalogDialog
          kind={config.kind}
          openDialog={page.openDialog}
          onCloseDialog={page.handleCloseDialog}
          selectedRow={page.selectedRow}
          onSubmit={handleSave}
          onDeleteById={handleDeleteById}
          actionDialog={page.actionDialog}
        />

        <AlertDialogComponent
          openAlertDialog={page.openAlertDialog}
          setOpenAlertDialog={page.setOpenAlertDialog}
          alertProps={page.alertProps}
        />
      </div>
    </div>
  );
};

EmployeeCatalogManager.propTypes = {
  config: PropTypes.shape({
    kind: PropTypes.oneOf(['position', 'department']).isRequired,
    addTitleKey: PropTypes.string.isRequired,
    editTitleKey: PropTypes.string.isRequired,
    useLazyList: PropTypes.func.isRequired,
    useCreate: PropTypes.func.isRequired,
    useUpdate: PropTypes.func.isRequired,
    useDelete: PropTypes.func.isRequired,
  }).isRequired,
};
