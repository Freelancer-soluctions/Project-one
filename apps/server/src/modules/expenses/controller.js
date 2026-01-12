import {
  getAllExpenses as getAllExpensesService,
  createExpense as createExpenseService,
  updateExpenseById as updateExpenseByIdService,
  deleteExpenseById as deleteExpenseByIdService,
} from './service.js';
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js';
import globalResponse from '../../utils/responses&Errors/globalResponse.js';

/**
 * Get all expenses with optional filters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @route GET /api/v1/expenses
 * @access Private
 */
export const getAllExpenses = handleCatchErrorAsync(async (req, res) => {
  // console.log(req.query); // Keep for debugging if needed
  const expenses = await getAllExpensesService(req.query);
  globalResponse(res, 200, expenses);
});

/**
 * Create a new expense
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @route POST /api/v1/expenses
 * @access Private
 */
export const createExpense = handleCatchErrorAsync(async (req, res) => {
  // console.log(req.body); // Keep for debugging if needed
  const expenseData = {
    ...req.body,
  };
  const expense = await createExpenseService(expenseData, req.userId);
  globalResponse(res, 201, expense);
});

/**
 * Update an expense by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @route PUT /api/v1/expenses/:id
 * @access Private
 */
export const updateExpenseById = handleCatchErrorAsync(async (req, res) => {
  const expenseData = {
    ...req.body, // Expected: { description, total, category, status }
  };
  const expense = await updateExpenseByIdService(
    req.params.id,
    expenseData,
    req.userId
  );
  globalResponse(res, 200, expense);
});

/**
 * Delete an expense by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @route DELETE /api/v1/expenses/:id
 * @access Private
 */
export const deleteExpenseById = handleCatchErrorAsync(async (req, res) => {
  await deleteExpenseByIdService(req.params.id);
  globalResponse(res, 200, { message: 'Expense deleted successfully' });
});
