import type {
  Attendee,
  AttendeeWithUser,
  EventCapacityRow,
  EventRow,
  RegistrationLog,
} from './types.js';

/**
 * Filas completas para los mocks tipados de los tests de RSVP.
 * Mismo criterio que `events-dao-soft-delete.unit.test.ts`: los mocks tipados
 * exigen la forma COMPLETA de la fila (no fixtures parciales), así que los tests
 * parten de estas factories y sobreescriben solo lo que les importa.
 */

/** Fila completa de `attendees`. */
export const attendeeRow = (overrides: Partial<Attendee> = {}): Attendee => ({
  id: 1,
  eventId: 1,
  userId: 1,
  status: 'CONFIRMED',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: null,
  ...overrides,
});

/** Fila de `attendees` con la relación `user` que incluye `findAttendeeById`. */
export const attendeeWithUserRow = (
  overrides: Partial<AttendeeWithUser> = {}
): AttendeeWithUser => ({
  ...attendeeRow(),
  user: { id: 1, name: 'Test User', email: 'user@test.com' },
  ...overrides,
});

/** Fila del `select` acotado de `findEventById` (capacidad + fecha + contador). */
export const eventCapacityRow = (
  overrides: Partial<EventCapacityRow> = {}
): EventCapacityRow => ({
  id: 1,
  capacity: 10,
  attendeeCount: 0,
  eventDate: new Date('2099-06-30T00:00:00.000Z'),
  ...overrides,
});

/** Fila completa de `events` (la devuelven los updates de `attendeeCount`). */
export const eventRow = (overrides: Partial<EventRow> = {}): EventRow => ({
  id: 1,
  title: 'Test Event',
  description: 'Test description',
  speaker: null,
  startTime: new Date('1970-01-01T10:00:00.000Z'),
  endTime: new Date('1970-01-01T11:00:00.000Z'),
  eventDate: new Date('2099-06-30T00:00:00.000Z'),
  modality: 'IN_PERSON',
  meetingUrl: null,
  location: null,
  createdBy: 1,
  createdOn: new Date('2026-01-01T00:00:00.000Z'),
  updatedOn: null,
  deletedAt: null,
  deletedBy: null,
  eventTypeId: 1,
  capacity: 10,
  attendeeCount: 0,
  ...overrides,
});

/** Fila completa de `registration_log`. */
export const auditLogRow = (
  overrides: Partial<RegistrationLog> = {}
): RegistrationLog => ({
  id: 1,
  attendeeId: 1,
  eventId: 1,
  previousStatus: null,
  newStatus: 'CONFIRMED',
  changedBy: null,
  createdOn: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});
