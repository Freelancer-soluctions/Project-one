// Fully replace the content with the correct version for expenses routes
import express from 'express'
import {
  getAllExpenses, // Renamed
  createExpense, // Renamed
  updateExpenseById, // Renamed
  deleteExpenseById // Renamed
} from './controller.js'
import verifyToken from '../../middleware/verifyToken.js'
import validateSchema from '../../middleware/validateSchema.js'
import validateQueryParams from '../../middleware/validateQueryParams.js'
// Assuming these schemas will be created in the joi.js file
import { expenseFiltersSchema, expenseCreateUpdateSchema } from '../../utils/joiSchemas/joi.js'

const router = express.Router()

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
  verifyToken,
  validateQueryParams(expenseFiltersSchema), // Renamed schema
  getAllExpenses // Renamed controller
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
  verifyToken,
  validateSchema(expenseCreateUpdateSchema), // Renamed schema
  createExpense // Renamed controller
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
  verifyToken,
  validateSchema(expenseCreateUpdateSchema), // Renamed schema
  updateExpenseById // Renamed controller
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
  verifyToken,
  // No schema validation needed for delete by ID typically, only verifyToken
  deleteExpenseById // Renamed controller
)

export default router
