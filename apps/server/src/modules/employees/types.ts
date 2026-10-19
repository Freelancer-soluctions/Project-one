import type { Prisma } from '@prisma/client';

/** Contratos de dominio del módulo `employees` — autocontenidos (design §1-§2). */

/** Fila de `employees`. */
export type Employee = Prisma.employeesGetPayload<object>;

/** Fila del listado: `$queryRaw` (empleado + nombres de creador/editor). */
export type EmployeeListRow = Employee & {
  userEmployeeCreatedName: string | null;
  userEmployeeUpdatedName: string | null;
};

/** Body de `POST /employees` + autor inyectado por el controller. */
export interface CreateEmployeeInput {
  name: string;
  lastName: string;
  dni: string;
  email: string;
  phone?: string;
  address?: string;
  startDate: Date;
  position: string;
  department: string;
  /**
   * VarChar(128) en el schema Prisma. El Joi lo valida como número: la
   * inconsistencia es preexistente y queda fuera del alcance de este change
   * (aquí manda el schema, que es la fuente de verdad del tipo).
   */
  salary: string;
  createdBy: number;
}

/** Body de `PATCH /employees/:id` + autor inyectado por el controller. */
export interface UpdateEmployeeInput {
  name?: string;
  lastName?: string;
  dni?: string;
  email?: string;
  phone?: string;
  address?: string;
  startDate?: Date;
  position?: string;
  department?: string;
  /** VarChar(128) en el schema Prisma (misma inconsistencia que en la creación). */
  salary?: string;
  updatedBy?: number;
}

/** Filtros de `GET /employees` (`req.safeQuery`). */
export interface EmployeeFilters {
  name?: string;
  lastName?: string;
  dni?: string;
  email?: string;
  department?: string;
  position?: string;
  page?: number;
  limit?: number;
}

/** Filtros que llegan al dao (sin paginación). */
export type EmployeeDaoFilters = Omit<EmployeeFilters, 'page' | 'limit'>;

/** Datos de creación ya normalizados por el service (timestamp). */
export type CreateEmployeeData = CreateEmployeeInput & { createdOn: Date };

/** Datos de actualización ya normalizados por el service (timestamp). */
export type UpdateEmployeeData = UpdateEmployeeInput & { updatedOn: Date };

/** Resultado paginado del listado de empleados. */
export interface EmployeeServiceResult {
  dataList: EmployeeListRow[];
  total: number;
}
