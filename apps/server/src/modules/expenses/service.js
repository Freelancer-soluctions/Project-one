// Fully replace the content with the correct version for expenses service
import {
  getAllExpenses as getAllExpensesDao, // Renamed
  createExpense as createExpenseDao, // Renamed
  updateExpenseById as updateExpenseByIdDao, // Renamed
  deleteExpenseById as deleteExpenseByIdDao, // Renamed
} from './dao.js'; // Assuming dao.js will be adapted for expenses
import { getSafePagination } from '../../utils/pagination/pagination.js';

/**
 * Retrieves all expenses based on optional filters.
 *
 * @param {Object} filters - The parameters for filtering the expenses.
 * @param {string} [filters.category] - Filter by expense category.
 * @param {string} [filters.status] - Filter by expense status (PENDING, APPROVED, REJECTED, PAID).
 * @param {Date} [filters.startDate] - Filter by start date.
 * @param {Date} [filters.endDate] - Filter by end date.
 * @param {number} filters.limit - Filter by limit.
 * @param {number} filters.page - Filter by page.
 * @returns {Promise<Object>} A paginated list of expenses matching the filters.
 * @throws {Error} When pagination parameters are missing or invalid.
 */
export const getAllExpenses = async (filters) => {
  const { take, skip } = getSafePagination({
    page: filters.page,
    limit: filters.limit,
  });

  if (!take || take <= 0) {
    throw new Error('Pagination is required');
  }
  return getAllExpensesDao(filters, take, skip);
};

/**
 * Creates a new expense in the database.
 *
 * @param {Object} data - The data for the new expense.
 * @param {string} data.description - The description of the expense.
 * @param {number} data.total - The total amount of the expense.
 * @param {string} data.category - The category of the expense.
 * @param {string} data.status - The status of the expense (PENDING, APPROVED, REJECTED, PAID).
 * @param {number} userId - The ID of the user creating the expense.
 * @returns {Promise<Object>} The created expense.
 */
export const createExpense = async (data, userId) => {
  const expenseData = {
    ...data,
    createdOn: new Date(),
    createdBy: userId,
  };
  return createExpenseDao(expenseData);
};

/**
 * Updates an existing expense in the database by its ID.
 *
 * @param {string} id - The ID of the expense to update.
 * @param {Object} data - The updated data for the expense.
 * @param {string} [data.description] - The description of the expense.
 * @param {number} [data.total] - The total amount of the expense.
 * @param {string} [data.category] - The category of the expense.
 * @param {string} [data.status] - The status of the expense (PENDING, APPROVED, REJECTED, PAID).
 * @param {number} userId - The ID of the user updating the expense.
 * @returns {Promise<Object>} The updated expense.
 */
export const updateExpenseById = async (id, data, userId) => {
  const expenseData = {
    ...data,
    updatedOn: new Date(), // Prisma model for expenses has updatedOn DateTime?
    updatedBy: userId,
  };
  // ID is already a string, no Number() conversion needed for CUID
  return updateExpenseByIdDao(Number(id), expenseData);
};

/**
 * Deletes an expense from the database by its ID.
 *
 * @param {string} id - The ID of the expense to delete.
 * @returns {Promise<Object>} The result of the deletion.
 */
export const deleteExpenseById = async (id) => {
  // ID is already a string, no Number() conversion needed for CUID
  return deleteExpenseByIdDao(Number(id));
};
