import type { Prisma } from '@prisma/client';

/** Contratos del módulo `performanceEvaluation` — autocontenidos (design §1-§2). */

/** Fila de `performanceEvaluation`. */
export type PerformanceEvaluation =
  Prisma.performanceEvaluationGetPayload<object>;

/** Fila del listado: `$queryRaw` (evaluación + empleado y autores). */
export type PerformanceEvaluationListRow = PerformanceEvaluation & {
  employeeName: string | null;
  userPerformanceCreatedName: string | null;
  userPerformanceUpdatedName: string | null;
};

/** Body de `POST /performance-evaluations` (`date` llega como fecha ISO). */
export interface CreatePerformanceEvaluationInput {
  employeeId: number;
  date: Date | string;
  /** Escala del schema (Int). */
  calification: number;
  comments?: string;
  /** Campos que viajan en el body aunque no existan como columnas. */
  period?: string;
  rating?: number;
  status?: string;
}

/** Body de `PATCH /performance-evaluations/:id` (todo opcional). */
export interface UpdatePerformanceEvaluationInput {
  employeeId?: number;
  /** El dao lo escribe tal cual en una columna DateTime. */
  date?: Date;
  calification?: number;
  comments?: string;
  period?: string;
  status?: string;
}

/** Filtros de `GET /performance-evaluations` (`req.safeQuery`). */
export interface PerformanceEvaluationFilters {
  employeeId?: number | string;
  startDate?: string;
  endDate?: string;
  period?: string;
  status?: string;
  page?: number;
  limit?: number;
}

/** Subconjunto de filtros que llega al dao (sin paginación). */
export type PerformanceEvaluationDaoFilters = Pick<
  PerformanceEvaluationFilters,
  'employeeId' | 'startDate' | 'endDate'
>;

/** Datos de creación ya normalizados por el service (fecha + autor). */
export interface CreatePerformanceEvaluationData {
  employeeId: number;
  date: Date;
  calification: number;
  comments?: string;
  createdOn: Date;
  createdBy: number;
  period?: string;
  rating?: number;
  status?: string;
}

/** Datos de actualización ya normalizados por el service (timestamp + autor). */
export type UpdatePerformanceEvaluationData =
  UpdatePerformanceEvaluationInput & {
    updatedOn: Date;
    updatedBy: number;
  };

/** Resultado paginado del listado de evaluaciones. */
export interface PerformanceEvaluationServiceResult {
  dataList: PerformanceEvaluationListRow[];
  total: number;
}
