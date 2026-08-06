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

  const [triggerList, { data, isLoading }] = useLazyListAttendeesQuery();
  const [updateStatus, { isLoading: isUpdating }] =
    useUpdateAttendeeStatusMutation();
  const [alertProps, setAlertProps] = useState({});
  const [openAlert, setOpenAlert] = useState(false);

  useEffect(() => {
    if (eventId) {
      const params = { eventId, page: pageIndex + 1, limit: pageSize };
      if (statusFilter) params.status = statusFilter;
      triggerList(params);
    }
  }, [eventId, pageIndex, pageSize, statusFilter, triggerList]);

  const handleStatusChange = async (attendeeId, newStatus) => {
    try {
      await updateStatus({
        eventId,
        attendeeId,
        data: { status: newStatus },
      }).unwrap();
      setAlertProps({
        alertTitle: t('update'),
        alertMessage: t('updated_successfully'),
        cancel: false,
        success: true,
        variantSuccess: 'info',
      });
      setOpenAlert(true);
    } catch (err) {
      setAlertProps({
        alertTitle: t('error'),
        alertMessage: err?.data?.message || t('something_went_wrong'),
        cancel: false,
        success: false,
        variantSuccess: 'destructive',
      });
      setOpenAlert(true);
    }
  };

  if (isLoading || isUpdating) return <Spinner />;

  const result = data?.data || {
    data: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  };

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">{t('status_filter')}</label>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPageIndex(0);
          }}
        >
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

      {/* Table */}
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
            {result.data.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4 text-gray-500">
                  {t('no_data')}
                </td>
              </tr>
            ) : (
              result.data.map((attendee) => (
                <tr key={attendee.id} className="border-b hover:bg-gray-50">
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
                    <Select
                      onValueChange={(v) => handleStatusChange(attendee.id, v)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder={t('change_status')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CONFIRMED">
                          {t('confirmed')}
                        </SelectItem>
                        <SelectItem value="WAITLIST">
                          {t('waitlist')}
                        </SelectItem>
                        <SelectItem value="CANCELLED">
                          {t('cancelled')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
