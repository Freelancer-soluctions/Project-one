import { useMemo } from 'react';
import { useGetAllEventsQuery } from '@/modules/events/api/eventsAPI';
import { sortedEvents } from '@/modules/events/utils';
import EventCalendar from './EventCalendar';
import PropTypes from 'prop-types';

export function EventCalendarWidget({ onEventClick }) {
  const { data, isLoading } = useGetAllEventsQuery({
    page: 1,
    limit: 200,
    search: '',
  });

  const allEvents = useMemo(() => {
    if (!data?.data?.data) return [];
    return sortedEvents(data.data.data, false);
  }, [data]);

  return (
    <EventCalendar
      events={allEvents}
      isLoading={isLoading}
      onEventClick={onEventClick}
    />
  );
}

EventCalendarWidget.propTypes = {
  onEventClick: PropTypes.func,
};
