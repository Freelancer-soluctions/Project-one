import type { Prisma } from '@prisma/client';

/** Contratos de dominio del módulo `departments` — autocontenidos. */

/** Fila de `departments`. */
export type Department = Prisma.departmentsGetPayload<object>;

/** Body de `POST /departments` (`departmentCreateSchema` en departments.joi.ts). */
export interface CreateDepartmentInput {
  code: string;
  name: string;
  active?: boolean;
}

/** Body de `PATCH /departments/:id` (`departmentUpdateSchema`). */
export interface UpdateDepartmentInput {
  code?: string;
  name?: string;
  active?: boolean;
}

/** Filtros de `GET /departments` (`req.safeQuery`). */
export interface DepartmentFilters {
  code?: string;
  name?: string;
  active?: boolean;
  page?: number;
  limit?: number;
}

/** Filtros que llegan al dao (sin paginación). */
export type DepartmentDaoFilters = Omit<DepartmentFilters, 'page' | 'limit'>;

/** Datos de creación ya normalizados por el service (timestamp). */
export type CreateDepartmentData = CreateDepartmentInput & { createdOn: Date };

/** Datos de actualización ya normalizados por el service (timestamp). */
export type UpdateDepartmentData = UpdateDepartmentInput & { updatedOn: Date };

/** Resultado paginado del listado de departamentos. */
export interface DepartmentServiceResult {
  dataList: Department[];
  total: number;
}
