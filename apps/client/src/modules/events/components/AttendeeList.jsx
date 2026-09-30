import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  useLazyListAttendeesQuery,
  useUpdateAttendeeStatusMutation,
} from '../api/eventsAPI';
import { Spinner } from '@/components/loader/Spinner';
import { Pagination } from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AlertDialogComponent from '@/components/alertDialog/AlertDialog';
import { AttendeeStatus } from './AttendeeStatus';

/**
 * Fila de filtro por estado del listado de asistentes.
 *
 * @param {Object} p - Props del filtro.
 * @param {Function} p.t - Traductor.
 * @param {string} p.statusFilter - Estado seleccionado.
 * @param {Function} p.onFilterChange - Callback al cambiar el filtro.
 * @returns {JSX.Element} Fila de filtro.
 */
const StatusFilterRow = ({ t, statusFilter, onFilterChange }) => (
  <div className="flex items-center gap-2">
    <label className="text-sm font-medium">{t('status_filter')}</label>
    <Select value={statusFilter} onValueChange={onFilterChange}>
      <SelectTrigger className="w-40">
        <SelectValue placeholder={t('all')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">{t('all')}</SelectItem>
        <SelectItem value="CONFIRMED">{t('confirmed')}</SelectItem>
        <SelectItem value="WAITLIST">{t('waitlist')}</SelectItem>
        <SelectItem value="CANCELLED">{t('cancelled')}</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

StatusFilterRow.propTypes = {
  t: PropTypes.func.isRequired,
  statusFilter: PropTypes.string.isRequired,
  onFilterChange: PropTypes.func.isRequired,
};

/**
 * Fila de un asistente: datos, estado, fecha de registro y selector de
 * cambio de estado.
 *
 * @param {Object} p - Props de la fila.
 * @param {Function} p.t - Traductor.
 * @param {Object} p.attendee - Asistente a renderizar.
 * @param {Function} p.onStatusChange - Callback (attendeeId, newStatus).
 * @returns {JSX.Element} Fila de tabla.
 */
const AttendeeRow = ({ t, attendee, onStatusChange }) => (
  <tr className="border-b hover:bg-gray-50">
    <td className="py-2 px-3">{attendee.user?.name || '-'}</td>
    <td className="py-2 px-3">{attendee.user?.email || '-'}</td>
    <td className="py-2 px-3">
      <AttendeeStatus status={attendee.status} />
    </td>
    <td className="py-2 px-3">
      {attendee.createdAt
        ? new Date(attendee.createdAt).toLocaleDateString()
        : '-'}
    </td>
    <td className="py-2 px-3">
      <Select onValueChange={(v) => onStatusChange(attendee.id, v)}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder={t('change_status')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="CONFIRMED">{t('confirmed')}</SelectItem>
          <SelectItem value="WAITLIST">{t('waitlist')}</SelectItem>
          <SelectItem value="CANCELLED">{t('cancelled')}</SelectItem>
        </SelectContent>
      </Select>
    </td>
  </tr>
);

AttendeeRow.propTypes = {
  t: PropTypes.func.isRequired,
  attendee: PropTypes.object.isRequired,
  onStatusChange: PropTypes.func.isRequired,
};

/**
 * Muestra el AlertDialog con el resultado de una operación (éxito o error).
 *
 * @param {Object} p - Parámetros del alert.
 * @param {Function} p.t - Traductor.
 * @param {string} p.titleKey - Clave i18n del título en éxito.
 * @param {string} p.messageKey - Clave i18n del mensaje en éxito.
 * @param {string|null} p.error - Mensaje de error (si lo hubo).
 * @param {Function} p.setAlertProps - Setter de props del alert.
 * @param {Function} p.setOpenAlert - Setter de apertura del alert.
 */
const showResultAlert = ({
  t,
  titleKey,
  messageKey,
  error,
  setAlertProps,
  setOpenAlert,
}) => {
  setAlertProps(
    error
      ? {
          alertTitle: t('error'),
          alertMessage: error || t('something_went_wrong'),
          cancel: false,
          success: false,
          variantSuccess: 'destructive',
        }
      : {
          alertTitle: t(titleKey),
          alertMessage: t(messageKey),
          cancel: false,
          success: true,
          variantSuccess: 'info',
        }
  );
  setOpenAlert(true);
};

/**
 * Cambia el estado de un asistente y muestra el resultado en el alert.
 *
 * @param {Object} p - Parámetros del flujo.
 * @param {Object} p.mutation - Mutación RTK de cambio de estado.
 * @param {number} p.eventId - Id del evento.
 * @param {number} p.attendeeId - Id del asistente.
 * @param {string} p.newStatus - Nuevo estado (CONFIRMED/WAITLIST/CANCELLED).
 * @param {Function} p.t - Traductor.
 * @param {Function} p.setAlertProps - Setter de props del alert.
 * @param {Function} p.setOpenAlert - Setter de apertura del alert.
 */
const runAttendeeStatusFlow = async ({
  mutation,
  eventId,
  attendeeId,
  newStatus,
  t,
  setAlertProps,
  setOpenAlert,
}) => {
  try {
    await mutation({
      eventId,
      attendeeId,
      data: { status: newStatus },
    }).unwrap();
    showResultAlert({
      t,
      titleKey: 'update',
      messageKey: 'updated_successfully',
      error: null,
      setAlertProps,
      setOpenAlert,
    });
  } catch (err) {
    showResultAlert({
      t,
      titleKey: 'error',
      messageKey: 'updated_successfully',
      error: err?.data?.message,
      setAlertProps,
      setOpenAlert,
    });
  }
};

/**
 * Tabla de asistentes: cabecera + filas (delegadas en AttendeeRow).
 *
 * @param {Object} p - Props de la tabla.
 * @param {Function} p.t - Traductor.
 * @param {Array<Object>} p.attendees - Asistentes a renderizar.
 * @param {Function} p.onStatusChange - Callback (attendeeId, newStatus).
 * @returns {JSX.Element} Tabla envuelta en contenedor con scroll.
 */
const AttendeeTable = ({ t, attendees, onStatusChange }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b">
          <th className="text-left py-2 px-3">{t('user')}</th>
          <th className="text-left py-2 px-3">{t('email')}</th>
          <th className="text-left py-2 px-3">{t('status')}</th>
          <th className="text-left py-2 px-3">{t('registered_date')}</th>
          <th className="text-left py-2 px-3">{t('actions')}</th>
        </tr>
      </thead>
      <tbody>
        {attendees.length === 0 ? (
          <tr>
            <td colSpan="5" className="text-center py-4 text-gray-500">
              {t('no_data')}
            </td>
          </tr>
        ) : (
          attendees.map((attendee) => (
            <AttendeeRow
              key={attendee.id}
              t={t}
              attendee={attendee}
              onStatusChange={onStatusChange}
            />
          ))
        )}
      </tbody>
    </table>
  </div>
);

AttendeeTable.propTypes = {
  t: PropTypes.func.isRequired,
  attendees: PropTypes.array.isRequired,
  onStatusChange: PropTypes.func.isRequired,
};

/**
 * Hook local: datos paginados de asistentes con filtro de estado.
 * Encapsula la query perezosa y su refetch ante cambio de página/filtro.
 *
 * @param {number} eventId - Id del evento.
 * @param {number} pageIndex - Página actual (0-index).
 * @param {string} statusFilter - Filtro de estado ('' = todos).
 * @param {number} pageSize - Tamaño de página.
 * @returns {{data: Object, isLoading: boolean, updateStatus: Object}} Resultado RTK.
 */
function useAttendees(eventId, pageIndex, statusFilter, pageSize) {
  const [triggerList, { data, isLoading }] = useLazyListAttendeesQuery();
  const [updateStatus, { isLoading: isUpdating }] =
    useUpdateAttendeeStatusMutation();

  useEffect(() => {
    if (eventId) {
      const params = { eventId, page: pageIndex + 1, limit: pageSize };
      if (statusFilter) params.status = statusFilter;
      triggerList(params);
    }
  }, [eventId, pageIndex, pageSize, statusFilter, triggerList]);

  return { data, isLoading: isLoading || isUpdating, updateStatus };
}

/**
 * AttendeeList — admin paginated table of attendees with status management.
 *
 * @param {Object} props
 * @param {number} props.eventId
 */
export const AttendeeList = ({ eventId }) => {
  const { t } = useTranslation();
  const [pageIndex, setPageIndex] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const pageSize = 20;

  const { data, isLoading, updateStatus } = useAttendees(
    eventId,
    pageIndex,
    statusFilter,
    pageSize
  );
  const [alertProps, setAlertProps] = useState({});
  const [openAlert, setOpenAlert] = useState(false);

  const handleStatusChange = (attendeeId, newStatus) =>
    runAttendeeStatusFlow({
      mutation: updateStatus,
      eventId,
      attendeeId,
      newStatus,
      t,
      setAlertProps,
      setOpenAlert,
    });

  if (isLoading) return <Spinner />;

  const result = data?.data || {
    data: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  };

  const onFilterChange = (v) => {
    setStatusFilter(v);
    setPageIndex(0);
  };

  return (
    <div className="space-y-4">
      {/* Filter */}
      <StatusFilterRow
        t={t}
        statusFilter={statusFilter}
        onFilterChange={onFilterChange}
      />

      {/* Table */}
      <AttendeeTable
        t={t}
        attendees={result.data}
        onStatusChange={handleStatusChange}
      />

      {/* Pagination */}
      {result.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            pageIndex={pageIndex}
            pageCount={result.totalPages}
            onPageChange={setPageIndex}
          />
        </div>
      )}

      <AlertDialogComponent
        openAlertDialog={openAlert}
        setOpenAlertDialog={setOpenAlert}
        alertProps={alertProps}
      />
    </div>
  );
};

AttendeeList.propTypes = {
  eventId: PropTypes.number.isRequired,
};
