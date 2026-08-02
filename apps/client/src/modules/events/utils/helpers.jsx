import { EventTypeCodes, EventModalityCodes } from './enums';
import { Video, MapPin } from 'lucide-react';

export const getEventTypeColor = (type) => {
  switch (type) {
    case EventTypeCodes.CONFERENCE:
      return 'bg-emerald-100 text-emerald-800';
    case EventTypeCodes.WORKSHOP:
      return 'bg-blue-100 text-blue-800';
    case EventTypeCodes.SESSION:
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getModalityIcon = (modality) => {
  switch (modality) {
    case EventModalityCodes.ONLINE:
      return <Video className="h-4 w-4" />;
    case EventModalityCodes.IN_PERSON:
      return <MapPin className="h-4 w-4" />;
    case EventModalityCodes.HYBRID:
      return (
        <>
          <Video className="h-4 w-4 mr-1" />
          <MapPin className="h-4 w-4" />
        </>
      );
    default:
      return null;
  }
};

export const getModalityColor = (modality) => {
  switch (modality) {
    case EventModalityCodes.ONLINE:
      return 'bg-blue-100 text-blue-800';
    case EventModalityCodes.IN_PERSON:
      return 'bg-amber-100 text-amber-800';
    case EventModalityCodes.HYBRID:
      return 'bg-violet-100 text-violet-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const sortedEvents = (events, needFilterFutureEvents) => {
  if (needFilterFutureEvents) {
    events = filterFutureEvents(events);
  }
  return [...events].sort((a, b) => {
    const dateA = new Date(`${a.eventDate}T${a.startTime}`);
    const dateB = new Date(`${b.eventDate}T${b.startTime}`);
    return dateA.getTime() - dateB.getTime();
  });
};

const filterFutureEvents = (events) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Elimina la hora para comparar solo la fecha

  return [...events].filter((event) => {
    const eventDate = new Date(event.eventDate);

    // Separar la hora y los minutos del startTime (Formato HH:mm)
    const [hours, minutes] = event.startTime.split(':').map(Number);
    eventDate.setHours(hours, minutes, 0, 0); // Actualizar la hora en eventDate
    return eventDate >= today; // Solo mantiene eventos de hoy o futuros
  });
};
