import express from 'express'
import {
  getAllPerformanceEvaluations,
  createPerformanceEvaluation,
  updatePerformanceEvaluationById,
  deletePerformanceEvaluationById
} from './controller.js'
import verifyToken from '../../middleware/verifyToken.js'
import validateSchema from '../../middleware/validateSchema.js'
import validateQueryParams from '../../middleware/validateQueryParams.js'
import { performanceEvaluationFiltersSchema, performanceEvaluationCreateUpdateSchema } from '../../utils/joiSchemas/joi.js'

const router = express.Router()

/**
 * @openapi
 * /v1/performance-evaluations:
 *   get:
 *     tags:
 *       - Performance Evaluations
 *     summary: Get all performance evaluations with optional filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filters
 *         schema:
 *           $ref: "#/components/schemas/PerformanceEvaluationFilters"
 *         required: false
 *         description: "Optional filters for performance evaluations"
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
 *                   example: "Success"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/ResponseGetPerformanceEvaluation"
 */
router.get(
  '/',
  verifyToken,
  validateQueryParams(performanceEvaluationFiltersSchema),
  getAllPerformanceEvaluations
)

/**
 * @openapi
 * /v1/performance-evaluations:
 *   post:
 *     tags:
 *       - Performance Evaluations
 *     summary: Create a new performance evaluation
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/PerformanceEvaluationCreate"
 *     responses:
 *       201:
 *         description: Created
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
 *                 message:
 *                   type: string
 *                   example: "Performance evaluation created successfully"
 *                 data:
 *                   $ref: "#/components/schemas/ResponseGetPerformanceEvaluation"
 */
router.post(
  '/',
  verifyToken,
  validateSchema(performanceEvaluationCreateUpdateSchema),
  createPerformanceEvaluation
)

/**
 * @openapi
 * /v1/performance-evaluations/{id}:
 *   put:
 *     tags:
 *       - Performance Evaluations
 *     summary: Update a performance evaluation by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Performance evaluation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/PerformanceEvaluationUpdate"
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
 *                   example: "Performance evaluation updated successfully"
 *                 data:
 *                   $ref: "#/components/schemas/ResponseGetPerformanceEvaluation"
 */
router.put(
  '/:id',
  verifyToken,
  validateSchema(performanceEvaluationCreateUpdateSchema),
  updatePerformanceEvaluationById
)

/**
 * @openapi
 * /v1/performance-evaluations/{id}:
 *   delete:
 *     tags:
 *       - Performance Evaluations
 *     summary: Delete a performance evaluation by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Performance evaluation ID
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
 *                   example: "Performance evaluation deleted successfully"
 *                 data:
 *                   $ref: "#/components/schemas/ResponseGetPerformanceEvaluation"
 */
router.delete('/:id', verifyToken, deletePerformanceEvaluationById)

export default router
