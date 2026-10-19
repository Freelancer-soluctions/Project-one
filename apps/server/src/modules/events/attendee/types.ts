import type { AttendeeStatus, Prisma } from '@prisma/client';

/**
 * Contratos de dominio del submódulo `events/attendee` (RSVP) — AUTOCONTENIDO.
 * Es módulo de facto: dueño de sus tipos y sin imports de otros módulos
 * (server-ts-domain-interfaces, design §1-§2). Las transiciones válidas viven en
 * `../stateMachine.js`. El tipo `EventRow` se deriva localmente del schema Prisma
 * para no importar tipos de `events`.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. Entidades
// ─────────────────────────────────────────────────────────────────────────────

/** Fila de `attendees`. */
export type Attendee = Prisma.attendeesGetPayload<object>;

/** Attendee con el usuario que se registró (select de los listados). */
export type AttendeeWithUser = Prisma.attendeesGetPayload<{
  include: { user: { select: { id: true; name: true; email: true } } };
}>;

/** Fila de `registration_log` (auditoría de cambios de estado). */
export type RegistrationLog = Prisma.registration_logGetPayload<object>;

/** Fila de `events` (el submódulo solo actualiza `attendeeCount`). */
export type EventRow = Prisma.eventsGetPayload<object>;

/** Campos del evento que consumen los flujos de RSVP (select de `findEventById`). */
export type EventCapacityRow = Prisma.eventsGetPayload<{
  select: { id: true; capacity: true; attendeeCount: true; eventDate: true };
}>;

/** Estados posibles de un attendee: enum `AttendeeStatus` del schema Prisma. */
export type { AttendeeStatus };

// ─────────────────────────────────────────────────────────────────────────────
// 2. Inputs de escritura
// ─────────────────────────────────────────────────────────────────────────────

/** Alta de un attendee (el estado inicial lo decide el service). */
export interface CreateAttendeeInput {
  eventId: number;
  userId: number;
  status: AttendeeStatus;
}

/** Body de `PATCH /events/:eventId/attendees/:attendeeId` (cambio de estado admin). */
export interface UpdateAttendeeStatusInput {
  status: AttendeeStatus;
  reason?: string;
}

/** Entrada de `registration_log` (auditoría de cada transición). */
export interface CreateAuditLogInput {
  attendeeId: number;
  eventId: number;
  /** `null` cuando el attendee nace (no había estado previo). */
  previousStatus: string | null;
  newStatus: string;
  /** `null` cuando la transición la ejecuta el sistema (promoción FIFO). */
  changedBy: number | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Query / filtros — lo que el controller extrae de `req.safeQuery`
// ─────────────────────────────────────────────────────────────────────────────

/** Filtros de `GET /events/:eventId/attendees`. */
export interface AttendeeListQuery {
  page?: number;
  limit?: number;
  status?: AttendeeStatus;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Resultados de service — fronteras públicas del módulo
// ─────────────────────────────────────────────────────────────────────────────

/** Resultado paginado del listado de asistentes. */
export interface AttendeeListResult {
  data: AttendeeWithUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
