// Fully replace the content with the correct version for expenses DAO
import { prisma, Prisma } from '../../config/db.js';
import type { expenseCategory } from '@prisma/client';

/**
 * Get all expenses with optional filters.
 *
 * @param {Object} filters - Filter parameters.
 * @param {string} [filters.description] - Filter by expense description.
 * @param {string} [filters.category] - Filter by expense category.
 * @param {string} [filters.status] - Filter by expense status (enum expenseCategory).
 * @param {number} take - Number of records to retrieve.
 * @param {number} skip - Number of records to skip.
 * @returns {Promise<Object>} Object containing dataList and total count.
 */
export const getAllExpenses = async (
  filters: {
    description?: string;
    category?: expenseCategory;
    status?: string;
  } = {},
  take: number,
  skip: number
) => {
  const whereClauses = [];

  if (filters.description) {
    // Using ILIKE for case-insensitive search for description
    whereClauses.push(
      Prisma.sql`e."description" ILIKE ${'%' + filters.description + '%'}`
    );
  }
  if (filters.category) {
    // `category` es un enum (expenseCategory): ILIKE no aplica, se compara en texto plano
    // (mismo criterio que el count tipado).
    whereClauses.push(Prisma.sql`e."category"::text = ${filters.category}`);
  }
  if (filters.status) {
    // Exact match for status (enum)
    whereClauses.push(Prisma.sql`e."status"::text = ${filters.status}`);
  }
  // Add more filters if needed, e.g., for total (range), date range

  const whereSql = whereClauses.length
    ? Prisma.sql`WHERE ${Prisma.join(whereClauses, ' AND ')}`
    : Prisma.empty;

  const expenses = await prisma.$queryRaw`
    SELECT 
      e.*,
      u.name AS "userExpenseCreatedName",
      uu.name AS "userExpenseUpdatedName"
    FROM "expenses" e
    LEFT JOIN "users" u ON e."createdBy" = u.id
    LEFT JOIN "users" uu ON e."updatedBy" = uu.id
    ${whereSql}
    ORDER BY e."createdOn" DESC
    LIMIT ${take}
    OFFSET ${skip}
  `;

  const where: Prisma.expensesWhereInput = {
    ...(filters.description && {
      description: {
        contains: filters.description,
        mode: 'insensitive', // equivalente a ILIKE
      },
    }),

    // `category` es un enum (expenseCategory): la igualdad es la única forma válida.
    ...(filters.category && {
      category: filters.category,
    }),
    // NOTA (migración TS): `filters.status` NO se filtra aquí — el modelo `expenses`
    // no tiene columna `status` (Prisma: id, description, total, category, createdBy,
    // updatedBy, createdOn, updatedOn). La rama de `dataList` que usa `e."status"`
    // tampoco existe en la tabla; se conserva tal cual (fuera de alcance de la
    // migración) y la inconsistencia queda registrada en el change.
  };
  const total = await prisma.expenses.count({ where });
  return { dataList: expenses, total };
};

/**
 * Create a new expense.
 *
 * @param {Object} data - Expense data.
 * @param {string} data.description - Expense description.
 * @param {number} data.total - Expense total (Float).
 * @param {string} data.category - Expense category.
 * @param {Date} data.createdOn - Creation date.
 * @param {number} data.createdBy - User ID who created the expense.
 * @returns {Promise<Object>} Created expense.
 */
export const createExpense = async (data: {
  description: string;
  total: number;
  category: Prisma.expensesCreateInput['category'];
  createdOn: Date;
  createdBy: number;
}) => {
  return prisma.expenses.create({
    data: {
      description: data.description,
      total: data.total, // Prisma expects Float, ensure data.total is a number
      category: data.category,
      createdOn: data.createdOn,
      userExpenseCreated: {
        // Relation name from Prisma schema
        connect: {
          id: data.createdBy,
        },
      },
    },
  });
};

/**
 * Delete an expense by ID.
 *
 * @param {number} id - Expense ID.
 * @returns {Promise<Object>} Deleted expense.
 */
export const deleteExpenseById = async (id: number) => {
  return prisma.expenses.delete({
    where: { id }, // id es Int (autoincrement) en el schema Prisma
  });
};

/**
 * Patch an expense by ID (only update provided fields).
 *
 * @param {number} id - Expense ID.
 * @param {Object} data - Partial expense data to update.
 * @param {string} [data.description] - Expense description.
 * @param {number} [data.total] - Expense total (Float).
 * @param {string} [data.category] - Expense category.
 * @param {Date} data.updatedOn - Update date.
 * @param {number} data.updatedBy - User ID who updated the expense.
 * @returns {Promise<Object>} Updated expense.
 */
export const patchExpenseById = async (
  id: number,
  data: {
    description?: string;
    total?: number;
    category?: Prisma.expensesUpdateInput['category'];
    updatedOn?: Date;
    updatedBy?: number;
  }
) => {
  // Build update object dynamically - only include fields that are provided
  const updateData: Prisma.expensesUpdateInput = {};

  if (data.description !== undefined) {
    updateData.description = data.description;
  }

  if (data.total !== undefined) {
    updateData.total = data.total;
  }

  if (data.category !== undefined) {
    updateData.category = data.category;
  }

  // Always update the timestamp and user if provided
  if (data.updatedOn !== undefined) {
    updateData.updatedOn = data.updatedOn;
  }

  if (data.updatedBy !== undefined) {
    updateData.userExpenseUpdated = {
      connect: {
        id: data.updatedBy,
      },
    };
  }

  return prisma.expenses.update({
    where: { id }, // id es Int (autoincrement) en el schema Prisma
    data: updateData,
  });
};
