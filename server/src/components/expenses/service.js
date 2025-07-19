// Fully replace the content with the correct version for expenses service
import {
  getAllExpenses as getAllExpensesDao, // Renamed
  createExpense as createExpenseDao, // Renamed
  updateExpenseById as updateExpenseByIdDao, // Renamed
  deleteExpenseById as deleteExpenseByIdDao // Renamed
} from './dao.js' // Assuming dao.js will be adapted for expenses

/**
 * Get all expenses with optional filters
 * @param {Object} filters - Optional filters for the query
 * @returns {Promise<Array>} List of expenses
 * @async
 */
export const getAllExpenses = async (filters) => {
  return getAllExpensesDao(filters)
}

/**
 * Create a new expense
 * @param {Object} data - Expense data (description, total, category, status, createdBy)
 * @returns {Promise<Object>} Created expense
 * @async
 */
export const createExpense = async (data, userId) => {
  const expenseData = {
    ...data,
    createdOn: new Date(),
    createdBy: userId
  }
  return createExpenseDao(expenseData)
}

/**
 * Update an expense by ID
 * @param {string} id - Expense ID (cuid string)
 * @param {Object} data - Updated expense data (description, total, category, status, updatedBy)
 * @returns {Promise<Object>} Updated expense
 * @async
 */
export const updateExpenseById = async (id, data, userId) => {
  const expenseData = {
    ...data,
    updatedOn: new Date(), // Prisma model for expenses has updatedOn DateTime?
    updatedBy: userId
  }
  // ID is already a string, no Number() conversion needed for CUID
  return updateExpenseByIdDao(Number(id), expenseData)
}

/**
 * Delete an expense by ID
 * @param {string} id - Expense ID (cuid string)
 * @returns {Promise<Object>} Result of the delete operation
 * @async
 */
export const deleteExpenseById = async (id) => {
  // ID is already a string, no Number() conversion needed for CUID
  return deleteExpenseByIdDao(Number(id))
}
