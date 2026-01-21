import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EventDialog, EventList, EventFiltersForm } from '../components';
import AlertDialogComponent from '@/components/alertDialog/AlertDialog';
import { BackDashBoard } from '@/components/backDash/BackDashBoard';
import { Spinner } from '@/components/loader/Spinner';
import {
  useCreateEventMutation,
  useGetAllEventTypesQuery,
  useGetAllEventsQuery,
  useUpdateEventByIdMutation,
  useDeleteEventByIdMutation,
} from '../api/eventsAPI';

export default function Events() {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [event, setEvent] = useState({});
  const [alertProps, setAlertProps] = useState({});
  const [openAlertDialog, setOpenAlertDialog] = useState(false); //alert dialog open/close

  const [
    createEvent,
    { isLoading: isLoadingPost },
  ] = useCreateEventMutation();

  const [
    updateEvent,
    { isLoading: isLoadingPut },
  ] = useUpdateEventByIdMutation();
  const [
    deleteEventById,
    { isLoading: isLoadingDelete },
  ] = useDeleteEventByIdMutation();

  const {
    data: dataTypes = { data: [] },
    isLoading: isLoadingTypes,
    isFetching: isFetchingTypes,
  } = useGetAllEventTypesQuery();

  const {
    data: dataEvents = { data: [] },
    isLoading: isLoadingEvents,
    isFetching: isFetchingEvents,
  } = useGetAllEventsQuery(searchQuery);

  const handleAddEvent = async (data) => {
    data.id
      ? await updateEvent({
          id: data.id,
          data: {
            title: data.title,
            speaker: data.speaker,
            description: data.description,
            type: data.type,
            eventDate: data.eventDate,
            startTime: data.startTime,
            endTime: data.endTime,
          },
        }).unwrap()
      : await createEvent({
          title: data.title,
          speaker: data.speaker,
          description: data.description,
          type: data.type,
          eventDate: data.eventDate,
          startTime: data.startTime,
          endTime: data.endTime,
        }).unwrap();

    setAlertProps({
      alertTitle: t(data.id ? 'update_record' : 'add_record'),
      alertMessage: t(data.id ? 'updated_successfully' : 'added_successfully'),
      cancel: false,
      success: true,
      onSuccess: () => {},
      variantSuccess: 'info',
    });
    setOpenAlertDialog(true);
    setIsDialogOpen(false);
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
          setOpenAlertDialog(true); // Open alert dialog
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
          setSearchQuery={setSearchQuery}
          searchQuery={searchQuery}
          setIsDialogOpen={setIsDialogOpen}
          setEvent={setEvent}
        />
        {/* Contenedor con scroll */}
        <div className="flex-1 p-4 overflow-y-auto sm:p-6">
          <EventList
            events={dataEvents.data}
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
