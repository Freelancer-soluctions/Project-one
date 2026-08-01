import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { EventDialog, EventList, EventFiltersForm } from '../components';
import AlertDialogComponent from '@/components/alertDialog/AlertDialog';
import { BackDashBoard } from '@/components/backDash/BackDashBoard';
import { Spinner } from '@/components/loader/Spinner';
import {
  useCreateEventMutation,
  useGetAllEventTypesQuery,
  useLazyGetAllEventsQuery,
  useUpdateEventByIdMutation,
  useDeleteEventByIdMutation,
} from '../api/eventsAPI';
import { DEFAULT_PAGE_SIZE } from '../constants';

export default function Events() {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [event, setEvent] = useState({});
  const [alertProps, setAlertProps] = useState({});
  const [openAlertDialog, setOpenAlertDialog] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = DEFAULT_PAGE_SIZE;

  const [createEvent, { isLoading: isLoadingPost }] = useCreateEventMutation();

  const [updateEvent, { isLoading: isLoadingPut }] =
    useUpdateEventByIdMutation();
  const [deleteEventById, { isLoading: isLoadingDelete }] =
    useDeleteEventByIdMutation();

  const {
    data: dataTypes = { data: [] },
    isLoading: isLoadingTypes,
    isFetching: isFetchingTypes,
  } = useGetAllEventTypesQuery();

  const [
    triggerGetAllEvents,
    {
      data: dataEvents = { data: { data: [], total: 0 } },
      isLoading: isLoadingEvents,
      isFetching: isFetchingEvents,
    },
  ] = useLazyGetAllEventsQuery();

  useEffect(() => {
    const promise = triggerGetAllEvents({
      page: pageIndex + 1,
      limit: pageSize,
      search: searchQuery,
    });
    return () => {
      promise.abort();
    };
  }, [pageIndex, pageSize, searchQuery, triggerGetAllEvents]);

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    setPageIndex(0);
  }, []);

  const handlePageChange = useCallback((newPageIndex) => {
    setPageIndex(newPageIndex);
  }, []);

  const handleAddEvent = async (result) => {
    try {
      if (result?.id) {
        await updateEvent({ id: result.id, data: result.body }).unwrap();
      } else {
        await createEvent(result).unwrap();
      }

      setAlertProps({
        alertTitle: t(result?.id ? 'update_record' : 'add_record'),
        alertMessage: t(
          result?.id ? 'updated_successfully' : 'added_successfully'
        ),
        cancel: false,
        success: true,
        onSuccess: () => {},
        variantSuccess: 'info',
      });
      setOpenAlertDialog(true);
      setIsDialogOpen(false);
    } catch (_err) {
      // eslint-disable-next-line no-unused-vars
      const _ = _err;
      // Error caught but not used; alert is shown via setAlertProps
      setAlertProps({
        alertTitle: t('error'),
        alertMessage: t('something_went_wrong'),
        cancel: false,
        success: false,
        onSuccess: () => {},
        variantSuccess: 'destructive',
      });
      setOpenAlertDialog(true);
    }
  };

  const handleEditEvent = (updatedEvent) => {
    setEvent(updatedEvent);
    setIsDialogOpen(true);
  };

  const handleDeleteEvent = async (id) => {
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
          await deleteEventById(id).unwrap();

          setAlertProps({
            alertTitle: '',
            alertMessage: t('deleted_successfully'),
            cancel: false,
            success: true,
            onSuccess: () => {},
            variantSuccess: 'info',
          });
          setOpenAlertDialog(true);
        } catch (err) {
          console.error('Error deleting:', err);
        }
      },
    });
    setOpenAlertDialog(true);
  };

  return (
    <>
      <BackDashBoard link={'/home'} moduleName={t('events')} />
      <div className="relative flex flex-col h-screen">
        {/* Show spinner when loading or fetching */}
        {(isLoadingEvents ||
          isLoadingPost ||
          isLoadingPut ||
          isLoadingTypes ||
          isLoadingDelete ||
          isFetchingTypes ||
          isFetchingEvents) && <Spinner />}
        {/* Header fijo */}
        <EventFiltersForm
          setSearchQuery={handleSearchChange}
          searchQuery={searchQuery}
          setIsDialogOpen={setIsDialogOpen}
          setEvent={setEvent}
        />
        {/* Contenedor con scroll */}
        <div className="flex-1 p-4 overflow-y-auto sm:p-6">
          <EventList
            events={dataEvents?.data?.data || []}
            pageIndex={pageIndex}
            pageSize={pageSize}
            total={dataEvents?.data?.total || 0}
            onPageChange={handlePageChange}
            onEdit={handleEditEvent}
            onDelete={handleDeleteEvent}
          />
        </div>

        <EventDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSubmit={handleAddEvent}
          event={event}
          dataTypes={dataTypes?.data}
        />

        <AlertDialogComponent
          openAlertDialog={openAlertDialog}
          setOpenAlertDialog={setOpenAlertDialog}
          alertProps={alertProps}
        />
      </div>
    </>
  );
}
