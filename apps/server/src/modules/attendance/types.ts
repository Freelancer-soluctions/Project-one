import type { Prisma } from '@prisma/client';

/**
 * Contratos de dominio del módulo `attendance` — AUTOCONTENIDO.
 * Este módulo es dueño de sus tipos: solo importa de Prisma y primitivas
 * (server-ts-domain-interfaces, design §1-§2).
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. Entidades
// ─────────────────────────────────────────────────────────────────────────────

/** Fila de `attendance`. */
export type Attendance = Prisma.attendanceGetPayload<object>;

/**
 * Fila del listado: proyección del `$queryRaw` (registro + nombres relacionados).
 * No es la entidad Prisma porque el select manual agrega los nombres de empleado
 * y de los usuarios que crearon/actualizaron el registro.
 */
export interface AttendanceListRow {
  id: number;
  employeeId: number;
  date: Date;
  entryTime: string;
  exitTime: string;
  /** Decimal(18,2): el driver de Postgres devuelve `numeric` como string. */
  workedHours: string;
  createdOn: Date;
  updatedOn: Date | null;
  createdBy: number;
  updatedBy: number | null;
  employeeName: string | null;
  employeeLastName: string | null;
  userAttendanceCreatedName: string | null;
  userAttendanceUpdatedName: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Inputs de escritura — cuerpos validados por Joi (contrato de API)
// ─────────────────────────────────────────────────────────────────────────────

/** Body de `POST /attendance` (`attendanceCreateSchema`). */
export interface CreateAttendanceInput {
  employeeId: number;
  date: Date;
  /** Hora de entrada (VarChar(5)). */
  entryTime: string;
  /** Hora de salida (VarChar(5)). */
  exitTime: string;
  workedHours: number;
}

/** Body de `PATCH /attendance/:id` (`attendanceUpdateSchema`, todos opcionales). */
export interface UpdateAttendanceInput {
  employeeId?: number;
  date?: Date;
  entryTime?: string;
  exitTime?: string;
  workedHours?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Query / filtros — lo que el controller extrae de `req.safeQuery`
// ─────────────────────────────────────────────────────────────────────────────

/** Filtros de `GET /attendance` (`attendanceFiltersSchema`). */
export interface AttendanceFilters {
  employeeId?: number;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}

/** Subconjunto de filtros que llega al dao (los de fecha/empleado, ya sin paginar). */
export interface AttendanceDaoFilters {
  employeeId?: number;
  fromDate?: Date;
  toDate?: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Payloads de persistencia (lo que el dao escribe en Prisma)
// ─────────────────────────────────────────────────────────────────────────────

/** Datos de creación ya normalizados por el service (timestamps + autor). */
export interface CreateAttendanceData extends CreateAttendanceInput {
  createdOn?: Date;
  createdBy: number;
}

/** Datos de actualización ya normalizados por el service (autor + timestamp). */
export interface UpdateAttendanceData extends UpdateAttendanceInput {
  updatedOn?: Date;
  updatedBy?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Resultados de service — fronteras públicas del módulo
// ─────────────────────────────────────────────────────────────────────────────

/** Resultado paginado del listado de asistencias. */
export interface AttendanceServiceResult {
  dataList: AttendanceListRow[];
  total: number;
}
