import {
  getAllExpenses as getAllExpensesService,
  createExpense as createExpenseService,
  deleteExpenseById as deleteExpenseByIdService,
  patchExpenseById as patchExpenseByIdService,
} from './service.js';
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js';
import globalResponse from '../../utils/responses&Errors/globalResponse.js';
import type {
  CreateExpenseInput,
  ExpenseFilters,
  UpdateExpenseInput,
} from './types.js';

/**
 * Get all expenses with optional filters.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.safeQuery - Safe query parameters with filters
 * @param {number} [req.safeQuery.page] - Page number for pagination
 * @param {number} [req.safeQuery.limit] - Number of items per page
 * @param {string} [req.safeQuery.category] - Filter by expense category
 * @param {string} [req.safeQuery.status] - Filter by expense status
 * @param {Date} [req.safeQuery.startDate] - Filter by start date
 * @param {Date} [req.safeQuery.endDate] - Filter by end date
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Returns paginated list of expenses
 * @route GET /api/v1/expenses
 * @access Private
 */
export const getAllExpenses = handleCatchErrorAsync(async (req, res) => {
  // console.log(req.safeQuery); // Keep for debugging if needed
  // Cast único de la query validada por Joi
  const filters = req.safeQuery as ExpenseFilters;
  const expenses = await getAllExpensesService(filters);
  globalResponse(res, 200, expenses);
});

/**
 * Create a new expense.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - Request body containing expense data
 * @param {string} req.body.description - Expense description
 * @param {number} req.body.total - Expense total amount
 * @param {string} req.body.category - Expense category
 * @param {string} req.body.status - Expense status (PENDING, APPROVED, REJECTED, PAID)
 * @param {string} req.userId - Authenticated user ID from token verification
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Creates new expense and returns expense object
 * @route POST /api/v1/expenses
 * @access Private
 */
export const createExpense = handleCatchErrorAsync(async (req, res) => {
  // console.log(req.body); // Keep for debugging if needed
  // Cast único del body validado por Joi
  const expenseData = { ...(req.body as CreateExpenseInput) };
  const expense = await createExpenseService(expenseData, req.userId as number);
  globalResponse(res, 201, expense);
});

/**
 * Delete an expense by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Expense ID from URL
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Deletes expense and returns confirmation message
 * @route DELETE /api/v1/expenses/:id
 * @access Private
 */
export const deleteExpenseById = handleCatchErrorAsync(async (req, res) => {
  await deleteExpenseByIdService(req.params.id);
  globalResponse(res, 200, { message: 'Expense deleted successfully' });
});

/**
 * Partially update an expense by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Expense ID from URL
 * @param {Object} req.body - Request body containing partial expense data to update
 * @param {string} [req.body.description] - Expense description
 * @param {number} [req.body.total] - Expense total amount
 * @param {string} [req.body.category] - Expense category
 * @param {string} req.userId - Authenticated user ID from token verification
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Updates expense and returns updated expense object
 * @route PATCH /api/v1/expenses/:id
 * @access Private
 */
export const patchExpenseById = handleCatchErrorAsync(async (req, res) => {
  // Cast único del body validado por Joi
  const expenseData = { ...(req.body as UpdateExpenseInput) };
  const expense = await patchExpenseByIdService(
    req.params.id,
    expenseData,
    req.userId as number
  );
  globalResponse(res, 200, expense);
});
