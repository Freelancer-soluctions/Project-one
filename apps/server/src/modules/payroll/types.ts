import type { Prisma } from '@prisma/client';

/** Contratos del módulo `payroll` — autocontenidos (design §1-§2). */

/** Fila de `payroll`. */
export type Payroll = Prisma.payrollGetPayload<object>;

/** Fila del listado: `$queryRaw` (nómina + nombre del empleado y de los autores). */
export type PayrollListRow = Payroll & {
  employeeName: string | null;
  employeeLastName: string | null;
  userPayrollCreatedName: string | null;
  userPayrollUpdatedName: string | null;
};

/** Body de `POST /payroll` (`period`/`status` viajan aunque no existan como columnas). */
export interface CreatePayrollInput {
  employeeId: number;
  /** Columna Int del schema. */
  month: number;
  /** Columna Int del schema. */
  year: number;
  /** Importes: el service los normaliza con `String(...)` (VarChar(128)). */
  baseSalary: number | string;
  extraHours: number | string;
  deductions: number | string;
  totalPayment: number | string;
  period?: string;
  status?: string;
}

/**
 * Body de `PATCH /payroll/:id`. Los importes se declaran `string` porque el dao
 * los escribe tal cual en columnas VarChar(128) (mismo criterio que el schema).
 */
export interface UpdatePayrollInput {
  employeeId?: number;
  month?: number;
  year?: number;
  baseSalary?: string;
  extraHours?: string;
  deductions?: string;
  totalPayment?: string;
  /** Autor inyectado por el controller. */
  updatedBy?: number;
}

/** Filtros de `GET /payroll` (`req.safeQuery`). */
export interface PayrollFilters {
  employeeId?: number;
  month?: number;
  year?: number;
  period?: string;
  status?: string;
  page?: number;
  limit?: number;
}

/** Subconjunto de filtros que llega al dao (sin paginación). */
export type PayrollDaoFilters = Pick<
  PayrollFilters,
  'employeeId' | 'month' | 'year'
>;

/** Datos de creación ya normalizados por el service (importes + timestamps). */
export interface CreatePayrollData {
  employeeId: number;
  month: number;
  year: number;
  baseSalary: string;
  extraHours: string;
  deductions: string;
  totalPayment: string;
  createdOn: Date;
  createdBy: number;
  period?: string;
  status?: string;
}

/** Datos de actualización ya normalizados por el service (timestamp + autor). */
export type UpdatePayrollData = UpdatePayrollInput & { updatedOn?: Date };

/** Resultado paginado del listado de nóminas. */
export interface PayrollServiceResult {
  dataList: PayrollListRow[];
  total: number;
}
