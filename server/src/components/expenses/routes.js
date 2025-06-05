// Fully replace the content with the correct version for expenses routes
import express from 'express'
import {
  getAllExpenses,
  createExpense,
  updateExpenseById,
  deleteExpenseById
} from './controller.js'
import { verifyToken, validateSchema, validateQueryParams } from '../../middleware'
import { expenseFiltersSchema, expenseCreateUpdateSchema } from '../../utils/joiSchemas/joi.js'

const router = express.Router()
// uso global de middleware
router.use(verifyToken)

/**
 * @openapi
 * /v1/expenses:
 *   get:
 *     tags:
 *       - Expenses
 *     summary: Get all expenses with optional filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filters
 *         schema:
 *           $ref: "#/components/schemas/ExpenseFilters"
 *         required: false
 *         description: "Optional filters to search expenses."
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Expenses retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/ResponseGetExpense"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Unauthorized'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/',
  validateQueryParams(expenseFiltersSchema),
  getAllExpenses
)

/**
 * @openapi
 * /v1/expenses:
 *   post:
 *     tags:
 *       - Expenses
 *     summary: Create a new expense
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BodyExpenseCreateUpdate'
 *     responses:
 *       201:
 *         description: Expense created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 statusCode:
 *                   type: integer
 *                   example: 201
 *                 data:
 *                   $ref: '#/components/schemas/ResponseExpenseCreateUpdate'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Unauthorized'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/',
  validateSchema(expenseCreateUpdateSchema),
  createExpense
)

/**
 * @openapi
 * /v1/expenses/{id}:
 *   put:
 *     tags:
 *       - Expenses
 *     summary: Update an expense by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string # ID for expenses is CUID (string)
 *         description: Expense ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BodyExpenseCreateUpdate'
 *     responses:
 *       200:
 *         description: Expense updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   $ref: '#/components/schemas/ResponseExpenseCreateUpdate'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Unauthorized'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/:id',
  validateSchema(expenseCreateUpdateSchema),
  updateExpenseById
)

/**
 * @openapi
 * /v1/expenses/{id}:
 *   delete:
 *     tags:
 *       - Expenses
 *     summary: Delete an expense by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string # ID for expenses is CUID (string)
 *         description: Expense ID
 *     responses:
 *       200:
 *         description: Expense deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Delete' # Generic delete response can be reused
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Unauthorized'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  '/:id',
  deleteExpenseById)

export default router
