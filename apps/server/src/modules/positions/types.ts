import type { Prisma } from '@prisma/client';

/** Contratos de dominio del módulo `positions` — autocontenidos. */

/** Fila de `positions`. */
export type Position = Prisma.positionsGetPayload<object>;

/** Body de `POST /positions` (`positionCreateSchema` en positions.joi.ts). */
export interface CreatePositionInput {
  code: string;
  name: string;
  active?: boolean;
}

/** Body de `PATCH /positions/:id` (`positionUpdateSchema` en positions.joi.ts). */
export interface UpdatePositionInput {
  code?: string;
  name?: string;
  active?: boolean;
}

/** Filtros de `GET /positions` (`req.safeQuery`). */
export interface PositionFilters {
  code?: string;
  name?: string;
  active?: boolean;
  page?: number;
  limit?: number;
}

/** Filtros que llegan al dao (sin paginación). */
export type PositionDaoFilters = Omit<PositionFilters, 'page' | 'limit'>;

/** Datos de creación ya normalizados por el service (timestamp). */
export type CreatePositionData = CreatePositionInput & { createdOn: Date };

/** Datos de actualización ya normalizados por el service (timestamp). */
export type UpdatePositionData = UpdatePositionInput & { updatedOn: Date };

/** Resultado paginado del listado de puestos. */
export interface PositionServiceResult {
  dataList: Position[];
  total: number;
}
