import type { permissionStatus, Prisma } from '@prisma/client';

/**
 * Contratos del módulo `permission` (permisos de empleados) — autocontenidos
 * (design §1-§2). No confundir con el modelo `permissions` (catálogo de permisos
 * de usuario) que usa `users`.
 */

/** Fila de `permission`. */
export type EmployeePermission = Prisma.permissionGetPayload<object>;

/** Estado del permiso: enum `permissionStatus` del schema Prisma. */
export type PermissionStatus = permissionStatus;

/** Fila del listado: `$queryRaw` (permiso + empleado y autores). */
export type EmployeePermissionListRow = EmployeePermission & {
  employeeName: string | null;
  userPermissionCreatedName: string | null;
  userPermissionUpdatedName: string | null;
};

/**
 * Body de `POST /permissions`. Las fechas se declaran `Date` porque el dao las
 * escribe tal cual en columnas DateTime (el Joi las valida como fecha ISO y el
 * controller castea una sola vez; el runtime no cambia).
 */
export interface CreateEmployeePermissionInput {
  employeeId: number;
  type: string;
  startDate: Date;
  endDate: Date;
  reason?: string;
  status?: PermissionStatus;
  approvedBy?: number;
  comments?: string;
  /** Fechas que el service normaliza pero el dao no persiste. */
  fromDate?: Date;
  toDate?: Date;
}

/** Body de `PATCH /permissions/:id` (todo opcional). */
export interface UpdateEmployeePermissionInput {
  employeeId?: number;
  type?: string;
  startDate?: Date;
  endDate?: Date;
  reason?: string;
  status?: PermissionStatus;
  approvedBy?: number;
  comments?: string;
  fromDate?: Date;
  toDate?: Date;
  updatedBy?: number;
}

/** Filtros de `GET /permissions` (`req.safeQuery`). */
export interface EmployeePermissionFilters {
  employeeId?: number;
  type?: string;
  status?: PermissionStatus;
  fromDate?: Date | string;
  toDate?: Date | string;
  page?: number;
  limit?: number;
}

/** Subconjunto de filtros que llega al dao (sin paginación). */
export type EmployeePermissionDaoFilters = Omit<
  EmployeePermissionFilters,
  'page' | 'limit'
>;

/** Datos de creación ya normalizados por el service (timestamp + autor). */
export interface CreateEmployeePermissionData {
  employeeId: number;
  type: string;
  startDate: Date;
  endDate: Date;
  reason?: string;
  status?: PermissionStatus;
  approvedBy?: number;
  comments?: string;
  createdOn: Date;
  createdBy: number;
  fromDate?: Date;
  toDate?: Date;
}

/** Datos de actualización ya normalizados por el service (timestamp + autor). */
export type UpdateEmployeePermissionData = UpdateEmployeePermissionInput & {
  updatedOn: Date;
};

/** Resultado paginado del listado de permisos. */
export interface EmployeePermissionServiceResult {
  dataList: EmployeePermissionListRow[];
  total: number;
}
