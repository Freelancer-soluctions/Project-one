import type { EventModality, Prisma } from '@prisma/client';

/**
 * Contratos de dominio del módulo `events` — AUTOCONTENIDO.
 * Este módulo es dueño de sus tipos: solo importa de Prisma y primitivas
 * (server-ts-domain-interfaces, design §1-§2). El estado de RSVP vive en
 * `./stateMachine.js` (ya tipado en F3) y el submódulo `./attendee` tiene su
 * propio `types.ts`.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. Entidades
// ─────────────────────────────────────────────────────────────────────────────

/** Fila de `events` (columna Time(0) → `Date` sobre la fecha epoch). */
export type Event = Prisma.eventsGetPayload<object>;

/** Fila de `eventTypes`. */
export type EventType = Prisma.eventTypesGetPayload<object>;

/** Fila del listado: `events` + tipo y creador, como los incluye `getAllEvents`. */
export type EventListItem = Prisma.eventsGetPayload<{
  include: { eventTypes: true; userEventCreated: true };
}>;

/** Modalidad del evento: enum `EventModality` del schema Prisma. */
export type { EventModality };

// ─────────────────────────────────────────────────────────────────────────────
// 2. Inputs de escritura — cuerpos validados por Joi (contrato de API)
// ─────────────────────────────────────────────────────────────────────────────

/** Body de `POST /events` (`EventsCreateSchema`). */
export interface CreateEventInput {
  title: string;
  description: string;
  speaker?: string;
  /** Hora en formato "HH:mm" (columna Time(0)). */
  startTime: string;
  /** Hora en formato "HH:mm" (columna Time(0)). */
  endTime: string;
  eventDate: Date;
  /** ID del tipo de evento (FK `eventTypeId`). */
  type: number;
  capacity?: number;
  modality: EventModality;
  meetingUrl?: string;
  location?: string;
}

/** Body de `PATCH /events/:id` (`EventsUpdateSchema`, todo opcional). */
export interface UpdateEventInput {
  title?: string;
  description?: string;
  speaker?: string;
  startTime?: string;
  endTime?: string;
  eventDate?: Date;
  type?: number;
  capacity?: number;
  /** `null` explícito = petición de restore del evento soft-deleted. */
  deletedAt?: Date | null;
  deletedBy?: number | null;
  /**
   * Alias que `updateEventById` descarta junto con `deletedAt` al armar el
   * payload de persistencia (el body trae `deletedBy`, que sigue viajando).
   */
  _deletedBy?: number | null;
  modality?: EventModality;
  meetingUrl?: string | null;
  location?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Query / filtros — lo que el controller extrae de `req.safeQuery`
// ─────────────────────────────────────────────────────────────────────────────

/** Filtros de `GET /events` (`EventsFilters`). */
export interface EventFilters {
  searchQuery?: string;
  page?: number;
  limit?: number;
  showDeleted?: boolean;
  type?: number;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  speaker?: string;
  status?: string;
  modality?: EventModality;
}

/** Filtros que recibe el dao (ya paginados y con fechas normalizadas). */
export interface EventDaoFilters {
  searchQuery?: string;
  take?: number;
  skip?: number;
  page?: number;
  pageSize?: number;
  showDeleted?: boolean;
  type?: number;
  dateFrom?: Date;
  dateTo?: Date;
  speaker?: string;
  status?: string;
  modality?: EventModality;
}

/** Límites UTC usados para derivar upcoming/past desde la hora del servidor. */
export interface EventStatusBoundaries {
  startOfTodayUTC: Date;
  endOfTodayUTC: Date;
  currentTimeOnEpoch: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Payloads de persistencia (lo que el dao escribe en Prisma)
// ─────────────────────────────────────────────────────────────────────────────

/** Datos de creación ya normalizados por el service (horas como Date + timestamps). */
export type CreateEventData = Omit<
  CreateEventInput,
  'type' | 'startTime' | 'endTime'
> & {
  startTime: Date;
  endTime: Date;
  createdOn: Date;
};

/** FKs de creación (usuario autor y tipo de evento). */
export interface CreateEventForeignKeys {
  createdBy: number;
  type: number;
}

/** Datos de actualización ya normalizados por el service. */
export interface UpdateEventData {
  title?: string;
  description?: string;
  speaker?: string;
  startTime?: Date;
  endTime?: Date;
  eventDate?: Date;
  capacity?: number;
  modality?: EventModality;
  meetingUrl?: string | null;
  location?: string | null;
  /** El dao lo lee para reconectar el tipo; el service lo elimina del payload actual. */
  type?: number;
  updatedOn?: Date;
}

/** FK de actualización (tipo de evento). */
export interface UpdateEventForeignKeys {
  type: number;
}

/**
 * Payload mutable que arma `updateEventById`: nace del body con las horas en
 * "HH:mm" y el service las reemplaza por `Date` antes de persistir. Declara
 * también `_deletedBy`, el alias que el service descarta junto con `deletedAt`.
 */
export interface UpdateEventPayload {
  title?: string;
  description?: string;
  speaker?: string;
  startTime?: Date | string;
  endTime?: Date | string;
  eventDate?: Date;
  type?: number;
  capacity?: number;
  deletedAt?: Date | null;
  _deletedBy?: number | null;
  modality?: EventModality;
  meetingUrl?: string | null;
  location?: string | null;
  updatedOn?: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Resultados de service — fronteras públicas del módulo
// ─────────────────────────────────────────────────────────────────────────────

/** Evento con las horas serializadas a "HH:mm" para el cliente. */
export type EventResponse = Omit<Event, 'startTime' | 'endTime'> & {
  startTime: string | null;
  endTime: string | null;
};

/** Elemento del listado con las horas serializadas a "HH:mm". */
export type EventListResponse = Omit<EventListItem, 'startTime' | 'endTime'> & {
  startTime: string | null;
  endTime: string | null;
};

/** Resultado crudo del dao (filas Prisma + total y paginación espejada). */
export interface EventDaoResult {
  data: EventListItem[];
  total: number;
  page?: number;
  pageSize?: number;
}

/**
 * Resultado de `getAllEvents`. El service devuelve el listado formateado; la
 * rama defensiva (`data` no es un arreglo) devuelve el resultado crudo del dao
 * tal cual, por eso el tipo los une en lugar de mentir sobre el shape.
 */
export type EventServiceResult =
  | {
      data: EventListResponse[];
      total: number;
      page?: number;
      pageSize?: number;
    }
  | EventDaoResult;

/** Resultado de `createEvent` (evento creado con horas formateadas). */
export type CreateEventResult = EventResponse;

/** Resultado del soft delete: estados posibles que consume el controller. */
export interface SoftDeleteEventResult {
  status: 'not-found' | 'already-deleted' | 'deleted';
  /** Presente solo cuando `status === 'deleted'`. */
  event?: Event;
}

/** Resultado público de `deleteEventById` (status HTTP + payload). */
export interface DeleteEventResult {
  status: 200 | 404 | 409;
  /** Presente en los caminos de error (404/409). */
  message?: string;
  /** Presente solo cuando `status === 200`. */
  event?: Event;
}
