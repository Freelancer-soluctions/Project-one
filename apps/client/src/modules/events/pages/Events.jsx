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

/**
 * Construye las props del AlertDialog tras guardar (éxito o error).
 *
 * @param {Function} t - Traductor de i18next.
 * @param {boolean} isUpdate - true si la operación fue edición (no creación).
 * @param {boolean} isSuccess - true si la operación terminó bien.
 * @returns {Object} Props listas para el AlertDialogComponent.
 */
const buildSaveAlertProps = (t, isUpdate, isSuccess) => ({
  alertTitle: t(
    isSuccess ? (isUpdate ? 'update_record' : 'add_record') : 'error'
  ),
  alertMessage: t(
    isSuccess
      ? isUpdate
        ? 'updated_successfully'
        : 'added_successfully'
      : 'something_went_wrong'
  ),
  cancel: false,
  success: isSuccess,
  onSuccess: () => {},
  variantSuccess: isSuccess ? 'info' : 'destructive',
});

/**
 * @param {Array<boolean>} flags - Estados de carga/fetch a evaluar.
 * @returns {boolean} true si al menos uno está activo.
 */
const isAnyLoading = (...flags) => flags.some(Boolean);

/**
 * @param {Object} dataEvents - Respuesta RTK Query de eventos.
 * @returns {Array} Lista de eventos (vacía si no hay datos).
 */
const pickEventList = (dataEvents) => dataEvents?.data?.data || [];

/**
 * @param {Object} dataEvents - Respuesta RTK Query de eventos.
 * @returns {number} Total de eventos (0 si no hay datos).
 */
const pickEventTotal = (dataEvents) => dataEvents?.data?.total || 0;

/**
 * Construye las props del AlertDialog de confirmación de borrado.
 *
 * @param {Function} t - Traductor.
 * @param {Function} confirmDelete - Acción de borrado ya preparada.
 * @returns {Object} Props para el AlertDialogComponent.
 */
const buildDeleteAlertProps = (t, confirmDelete) => ({
  alertTitle: t('delete_record'),
  alertMessage: t('request_delete_record'),
  cancel: true,
  success: false,
  destructive: true,
  variantSuccess: '',
  variantDestructive: 'destructive',
  onSuccess: () => {},
  onDelete: confirmDelete,
});

/**
 * Muestra el AlertDialog de resultado tras borrar un evento.
 *
 * @param {Object} p - Dependencias del flujo.
 * @param {Object} p.deleteMutation - Mutación RTK de borrado.
 * @param {number} p.id - Id del evento.
 * @param {Function} p.t - Traductor.
 * @param {Function} p.setAlertProps - Setter de props del alert.
 * @param {Function} p.setOpenAlertDialog - Setter de apertura del alert.
 */
const runDeleteFlow = async ({
  deleteMutation,
  id,
  t,
  setAlertProps,
  setOpenAlertDialog,
}) => {
  try {
    await deleteMutation(id).unwrap();
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
};

/**
 * Envía el form de eventos (crea o actualiza según venga id) y muestra el
 * resultado en el AlertDialog. Devuelve el handler listo para el dialog.
 *
 * @param {Object} p - Dependencias del flujo.
 * @param {Object} p.createMutation - Mutación RTK de creación.
 * @param {Object} p.updateMutation - Mutación RTK de actualización.
 * @param {Function} p.t - Traductor.
 * @param {Function} p.setAlertProps - Setter de props del alert.
 * @param {Function} p.setOpenAlertDialog - Setter de apertura del alert.
 * @param {Function} p.setIsDialogOpen - Setter de apertura del dialog.
 * @returns {Function} onSubmit(result).
 */
const makeSaveHandler = ({
  createMutation,
  updateMutation,
  t,
  setAlertProps,
  setOpenAlertDialog,
  setIsDialogOpen,
}) =>
  async function onSubmit(result) {
    try {
      if (result?.id) {
        await updateMutation({ id: result.id, data: result.body }).unwrap();
      } else {
        await createMutation(result).unwrap();
      }

      setAlertProps(buildSaveAlertProps(t, result?.id, true));
      setOpenAlertDialog(true);
      setIsDialogOpen(false);
    } catch {
      // Error capturado pero no usado; el alert de error se muestra abajo.
      setAlertProps(buildSaveAlertProps(t, result?.id, false));
      setOpenAlertDialog(true);
    }
  };

/**
 * Layout de la página de eventos: agrupa estado plano + handlers + setters
 * y renderiza. Función pura de render (sin hooks), por eso no es componente.
 *
 * @param {Object} p - Estado, handlers y setters de la página.
 * @returns {JSX.Element} Página completa.
 */
const buildEventsLayout = ({
  t,
  searchQuery,
  isLoadingAny,
  dataTypes,
  dataEvents,
  pageIndex,
  pageSize,
  isDialogOpen,
  openAlertDialog,
  alertProps,
  event,
  handlers: { onSearchChange, onPageChange, onEdit, onDelete, onSubmitDialog },
  setters: { setIsDialogOpen, setOpenAlertDialog, setEvent },
}) => (
  <>
    <BackDashBoard link={'/home'} moduleName={t('events')} />
    <div className="relative flex flex-col h-screen">
      {/* Show spinner when loading or fetching */}
      {isLoadingAny && <Spinner />}
      {/* Header fijo */}
      <EventFiltersForm
        setSearchQuery={onSearchChange}
        searchQuery={searchQuery}
        setIsDialogOpen={setIsDialogOpen}
        setEvent={setEvent}
      />
      {/* Contenedor con scroll */}
      <div className="flex-1 p-4 overflow-y-auto sm:p-6">
        <EventList
          events={pickEventList(dataEvents)}
          pageIndex={pageIndex}
          pageSize={pageSize}
          total={pickEventTotal(dataEvents)}
          onPageChange={onPageChange}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>

      <EventDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={onSubmitDialog}
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

/**
 * Hook local: datos de eventos + tipos y banderas de carga/fetch.
 * Agrupa el cableado RTK Query (queries perezosas, abort en desmonte).
 *
 * @param {number} pageIndex - Página actual (0-index).
 * @param {string} searchQuery - Búsqueda activa.
 * @param {number} pageSize - Tamaño de página.
 * @returns {Object} Datos y banderas de carga de eventos/tipos.
 */
function useEventsData(pageIndex, searchQuery, pageSize) {
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

  const isLoadingAny = isAnyLoading(
    isLoadingEvents,
    isLoadingPost,
    isLoadingPut,
    isLoadingTypes,
    isLoadingDelete,
    isFetchingTypes,
    isFetchingEvents
  );

  return {
    createEvent,
    updateEvent,
    deleteEventById,
    dataTypes,
    dataEvents,
    isLoadingAny,
  };
}

export default function Events() {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [event, setEvent] = useState({});
  const [alertProps, setAlertProps] = useState({});
  const [openAlertDialog, setOpenAlertDialog] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = DEFAULT_PAGE_SIZE;

  const {
    createEvent,
    updateEvent,
    deleteEventById,
    dataTypes,
    dataEvents,
    isLoadingAny,
  } = useEventsData(pageIndex, searchQuery, pageSize);

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    setPageIndex(0);
  }, []);

  const handlePageChange = useCallback((newPageIndex) => {
    setPageIndex(newPageIndex);
  }, []);

  const handleEditEvent = (updatedEvent) => {
    setEvent(updatedEvent);
    setIsDialogOpen(true);
  };

  const handleAddEvent = makeSaveHandler({
    createMutation: createEvent,
    updateMutation: updateEvent,
    t,
    setAlertProps,
    setOpenAlertDialog,
    setIsDialogOpen,
  });

  const handleDeleteEvent = (id) => {
    const confirmDelete = () =>
      runDeleteFlow({
        deleteMutation: deleteEventById,
        id,
        t,
        setAlertProps,
        setOpenAlertDialog,
      });

    setAlertProps(buildDeleteAlertProps(t, confirmDelete));
    setOpenAlertDialog(true);
  };

  return buildEventsLayout({
    t,
    searchQuery,
    isLoadingAny,
    dataTypes,
    dataEvents,
    pageIndex,
    pageSize,
    isDialogOpen,
    openAlertDialog,
    alertProps,
    event,
    handlers: {
      onSearchChange: handleSearchChange,
      onPageChange: handlePageChange,
      onEdit: handleEditEvent,
      onDelete: handleDeleteEvent,
      onSubmitDialog: handleAddEvent,
    },
    setters: { setIsDialogOpen, setOpenAlertDialog, setEvent },
  });
}
