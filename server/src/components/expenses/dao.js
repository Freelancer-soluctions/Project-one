// Fully replace the content with the correct version for expenses DAO
import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Get all expenses with optional filters
 * @param {Object} filters - Optional filters for the query
 * @param {string} [filters.description] - Filter by expense description
 * @param {string} [filters.category] - Filter by expense category
 * @param {string} [filters.status] - Filter by expense status (enum expenseCategory)
 * @returns {Promise<Array>} List of expenses with their related data
 * @async
 */
export const getAllExpenses = async (filters = {}) => {
  // console.log(filters); // Keep for debugging if needed
  const whereClauses = []

  if (filters.description) {
    // Using ILIKE for case-insensitive search for description
    whereClauses.push(Prisma.sql`e."description" ILIKE ${'%' + filters.description + '%'}`)
  }
  if (filters.category) {
    // Using ILIKE for case-insensitive search for category
    whereClauses.push(Prisma.sql`e."category" ILIKE ${'%' + filters.category + '%'}`)
  }
  if (filters.status) {
    // Exact match for status (enum)
    whereClauses.push(Prisma.sql`e."status"::text = ${filters.status}`)
  }
  // Add more filters if needed, e.g., for total (range), date range

  const whereSql = whereClauses.length
    ? Prisma.sql`WHERE ${Prisma.join(whereClauses, Prisma.sql` AND `)}`
    : Prisma.empty

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
  `
  return expenses
}

/**
 * Create a new expense
 * @param {Object} data - Expense data
 * @param {string} data.description - Expense description
 * @param {number} data.total - Expense total (Float)
 * @param {string} data.category - Expense category
 * @param {string} data.status - Expense status (enum expenseCategory)
 * @param {Date} data.createdOn - Creation date
 * @param {number} data.createdBy - User ID who created the expense
 * @returns {Promise<Object>} Created expense
 * @async
 */
export const createExpense = async (data) => {
  return prisma.expenses.create({
    data: {
      description: data.description,
      total: data.total, // Prisma expects Float, ensure data.total is a number
      category: data.category,
      status: data.status, // This should be a valid value from the expenseCategory enum
      createdOn: data.createdOn,
      userExpenseCreated: { // Relation name from Prisma schema
        connect: {
          id: data.createdBy
        }
      }
    }
  })
}

/**
 * Update an expense by ID
 * @param {string} id - Expense ID (cuid string)
 * @param {Object} data - Updated expense data
 * @param {string} [data.description] - Expense description
 * @param {number} [data.total] - Expense total (Float)
 * @param {string} [data.category] - Expense category
 * @param {string} [data.status] - Expense status (enum expenseCategory)
 * @param {Date} data.updatedOn - Update date
 * @param {number} data.updatedBy - User ID who updated the expense
 * @returns {Promise<Object>} Updated expense
 * @async
 */
export const updateExpenseById = async (id, data) => {
  const updateData = {
    description: data.description,
    total: data.total,
    category: data.category,
    status: data.status,
    updatedOn: data.updatedOn,
    userExpenseUpdated: undefined
  }

  if (data.updatedBy) {
    updateData.userExpenseUpdated = {
      connect: {
        id: data.updatedBy
      }
    }
  }

  return prisma.expenses.update({
    where: { id }, // id is a string (cuid)
    data: updateData
  })
}

/**
 * Delete an expense by ID
 * @param {string} id - Expense ID (cuid string)
 * @returns {Promise<Object>} Deleted expense
 * @async
 */
export const deleteExpenseById = async (id) => {
  return prisma.expenses.delete({
    where: { id } // id is a string (cuid)
  })
}
