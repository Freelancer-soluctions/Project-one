import { useState, useEffect } from 'react';
import {
  NewsFiltersForm,
  NewsDialog,
  NewsDatatable,
} from '../components/index';
import { Spinner } from '@/components/loader/Spinner';
import { BackDashBoard } from '@/components/backDash/BackDashBoard';
import AlertDialogComponent from '@/components/alertDialog/AlertDialog';

import {
  useLazyGetAllNewsQuery,
  useGetAllNewsStatusQuery,
  useUpdateNewByIdMutation,
  useCreateNewMutation,
  useDeleteNewByIdMutation,
} from '../api/newsAPI';
import { useTranslation } from 'react-i18next';

/** Filter setter handlers sharing a single setFilters updater. */
const makeFilterHandlers = ({ setPagination, setFilters }) => ({
  handleSubmitFilters: (newFilters) => {
    setPagination((prev) => ({
      ...prev,
      pageIndex: 0,
    }));

    setFilters(newFilters);
  },
});

/** Success/error alert props for the create/update flow. */
const buildSaveAlertProps = ({ t, isEdit, success, setOpenDialog }) => ({
  alertTitle: t(isEdit ? 'update_record' : 'add_record'),
  alertMessage: t(isEdit ? 'updated_successfully' : 'added_successfully'),
  cancel: false,
  success,
  onSuccess: () => {
    setOpenDialog(false);
  },
  variantSuccess: success ? 'info' : 'destructive',
});

/** Error alert props for the create/update flow. */
const buildErrorAlertProps = ({ t, setOpenDialog }) => ({
  alertTitle: t('error'),
  alertMessage: t('something_went_wrong'),
  cancel: false,
  success: false,
  onSuccess: () => {
    setOpenDialog(false);
  },
  variantSuccess: 'destructive',
});

/** Save handler: create or update, then show success/error alert. */
const makeSaveHandler =
  ({
    t,
    updateNewById,
    createNew,
    setAlertProps,
    setOpenAlertDialog,
    setOpenDialog,
  }) =>
  async (result) => {
    try {
      if (result?.id) {
        await updateNewById({ id: result.id, data: result.body }).unwrap();
      } else {
        await createNew(result).unwrap();
      }

      setAlertProps(
        buildSaveAlertProps({
          t,
          isEdit: !!result?.id,
          success: true,
          setOpenDialog,
        })
      );
      setOpenAlertDialog(true);
    } catch (err) {
      console.error('Error:', err);
      setAlertProps(buildErrorAlertProps({ t, setOpenDialog }));
      setOpenAlertDialog(true);
    }
  };

/** Delete-confirmation handler for a news item. */
const makeDeleteHandler =
  ({ t, deleteNewById, setAlertProps, setOpenAlertDialog, setOpenDialog }) =>
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
            await deleteNewById(id).unwrap();

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
            setOpenAlertDialog(true); // Open alert dialog
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
 * Page state: query trigger, mutations and dialog/alert/pagination state.
 *
 * El efecto de `trigger` es la única fuente de verdad para disparar
 * la consulta al backend: se ejecuta al montar y cuando cambian página,
 * tamaño de página o filtros. No hay llamadas manuales al backend.
 */
function useNewsPageState() {
  const [selectedRow, setSelectedRow] = useState({}); //data from datatable
  const [openDialog, setOpenDialog] = useState(false); //dialog open/close
  const [actionDialog, setActionDialog] = useState(''); //actionDialog edit / add
  const [alertProps, setAlertProps] = useState({});
  const [openAlertDialog, setOpenAlertDialog] = useState(false); //alert dialog open/close
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const [filters, setFilters] = useState({});

  // filter form
  const [trigger, { data: dataNews = { data: [] }, isLoading, isFetching }] =
    useLazyGetAllNewsQuery();

  const {
    data: datastatus,
    isLoading: isLoadingStatus,
    isFetching: isFetchingStatus,
  } = useGetAllNewsStatusQuery();

  const [updateNewById, { isLoading: isLoadingPut }] =
    useUpdateNewByIdMutation();
  const [createNew, { isLoading: isLoadingPost }] = useCreateNewMutation();
  const [deleteNewById, { isLoading: isLoadingDelete }] =
    useDeleteNewByIdMutation();

  useEffect(() => {
    trigger({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      ...filters,
    });
  }, [pagination.pageIndex, pagination.pageSize, filters, trigger]);

  const isLoadingPage =
    isLoading ||
    isLoadingStatus ||
    isLoadingPut ||
    isLoadingPost ||
    isLoadingDelete ||
    isFetching ||
    isFetchingStatus;

  return {
    selectedRow,
    setSelectedRow,
    openDialog,
    setOpenDialog,
    actionDialog,
    setActionDialog,
    alertProps,
    setAlertProps,
    openAlertDialog,
    setOpenAlertDialog,
    pagination,
    setPagination,
    setFilters,
    dataNews,
    datastatus,
    isLoadingPage,
    updateNewById,
    createNew,
    deleteNewById,
  };
}

/** Static page layout for the news module. */
const buildNewsLayout = ({
  t,
  page,
  filterHandlers,
  saveHandler,
  deleteHandler,
}) => (
  <>
    <BackDashBoard link={'/home'} moduleName={t('news')} />
    <div className="relative">
      {/* Show spinner when loading or fetching */}
      {page.isLoadingPage && <Spinner />}

      <div className="grid grid-cols-2 grid-rows-4 gap-4 md:grid-cols-5">
        {/* filters */}
        <div className="col-span-2 row-span-1 md:col-span-5">
          <NewsFiltersForm
            onSubmit={filterHandlers.handleSubmitFilters}
            setActionDialog={page.setActionDialog}
            setOpenDialog={page.setOpenDialog}
            datastatus={page.datastatus}
          />
        </div>
        {/* Datatable */}
        <div className="flex flex-wrap w-full col-span-2 row-span-3 row-start-2 md:col-span-5">
          <NewsDatatable
            dataNews={page.dataNews}
            setSelectedRow={page.setSelectedRow}
            setOpenDialog={page.setOpenDialog}
            setActionDialog={page.setActionDialog}
            pagination={page.pagination}
            onPaginationChange={page.setPagination}
          />
        </div>
        {/* Dialog */}
        <NewsDialog
          openDialog={page.openDialog}
          setSelectedRow={page.setSelectedRow}
          selectedRow={page.selectedRow}
          setOpenDialog={page.setOpenDialog}
          actionDialog={page.actionDialog}
          datastatus={page.datastatus}
          onCreateUpdate={saveHandler}
          onDeleteById={deleteHandler}
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

const News = () => {
  const { t } = useTranslation();
  const page = useNewsPageState();

  const filterHandlers = makeFilterHandlers({
    setPagination: page.setPagination,
    setFilters: page.setFilters,
  });
  const saveHandler = makeSaveHandler({
    t,
    updateNewById: page.updateNewById,
    createNew: page.createNew,
    setAlertProps: page.setAlertProps,
    setOpenAlertDialog: page.setOpenAlertDialog,
    setOpenDialog: page.setOpenDialog,
  });
  const deleteHandler = makeDeleteHandler({
    t,
    deleteNewById: page.deleteNewById,
    setAlertProps: page.setAlertProps,
    setOpenAlertDialog: page.setOpenAlertDialog,
    setOpenDialog: page.setOpenDialog,
  });

  return buildNewsLayout({
    t,
    page,
    filterHandlers,
    saveHandler,
    deleteHandler,
  });
};
export default News;
