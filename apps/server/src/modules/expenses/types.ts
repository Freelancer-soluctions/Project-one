import type { expenseCategory, Prisma } from '@prisma/client';

/**
 * Contratos de dominio del módulo `expenses` — AUTOCONTENIDO.
 * Este módulo es dueño de sus tipos: solo importa de Prisma y primitivas
 * (server-ts-domain-interfaces, design §1-§2).
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. Entidades
// ─────────────────────────────────────────────────────────────────────────────

/** Fila de `expenses`. */
export type Expense = Prisma.expensesGetPayload<object>;

/** Categoría del gasto: enum `expenseCategory` del schema Prisma. */
export type ExpenseCategory = expenseCategory;

/**
 * Fila del listado: proyección del `$queryRaw` (gasto + nombres de los usuarios
 * que lo crearon/actualizaron).
 */
export type ExpenseListRow = Expense & {
  userExpenseCreatedName: string | null;
  userExpenseUpdatedName: string | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. Inputs de escritura — cuerpos validados por Joi (contrato de API)
// ─────────────────────────────────────────────────────────────────────────────

/** Body de `POST /expenses` (`status` viaja en el body aunque no exista columna). */
export interface CreateExpenseInput {
  description: string;
  total: number;
  category: ExpenseCategory;
  status?: string;
}

/** Body de `PATCH /expenses/:id` (todos los campos opcionales). */
export interface UpdateExpenseInput {
  description?: string;
  total?: number;
  category?: ExpenseCategory;
  status?: string;
  updatedBy?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Query / filtros — lo que el controller extrae de `req.safeQuery`
// ─────────────────────────────────────────────────────────────────────────────

/** Filtros de `GET /expenses`. */
export interface ExpenseFilters {
  description?: string;
  category?: ExpenseCategory;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

/** Subconjunto de filtros que llega al dao (sin paginación ni rango de fechas). */
export type ExpenseDaoFilters = Pick<
  ExpenseFilters,
  'description' | 'category' | 'status'
>;

// ─────────────────────────────────────────────────────────────────────────────
// 4. Payloads de persistencia (lo que el dao escribe en Prisma)
// ─────────────────────────────────────────────────────────────────────────────

/** Datos de creación ya normalizados por el service (timestamp + autor). */
export type CreateExpenseData = CreateExpenseInput & {
  createdOn: Date;
  createdBy: number;
};

/** Datos de actualización ya normalizados por el service (timestamp + autor). */
export type UpdateExpenseData = UpdateExpenseInput & { updatedOn?: Date };

// ─────────────────────────────────────────────────────────────────────────────
// 5. Resultados de service — fronteras públicas del módulo
// ─────────────────────────────────────────────────────────────────────────────

/** Resultado paginado del listado de gastos. */
export interface ExpenseServiceResult {
  dataList: ExpenseListRow[];
  total: number;
}
