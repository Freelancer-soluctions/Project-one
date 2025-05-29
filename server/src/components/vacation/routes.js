import express from 'express'
import { getAllVacation, createVacation, updateVacationById, deleteVacationById } from './controller.js'
import verifyToken from '../../middleware/verifyToken.js'
import validateSchema from '../../middleware/validateSchema.js'
import { vacationFiltersSchema, vacationCreateUpdateSchema } from '../../utils/joiSchemas/joi.js'

const router = express.Router()

/**
 * @swagger
 * /v1/vacation:
 *   get:
 *     summary: Get all vacation records
 *     tags: [Vacation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: integer
 *         description: Filter by employee ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         description: Filter by status
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (greater than or equal)
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date (less than or equal)
 *     responses:
 *       200:
 *         description: List of vacation records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       employeeId:
 *                         type: integer
 *                       startDate:
 *                         type: string
 *                         format: date
 *                       endDate:
 *                         type: string
 *                         format: date
 *                       status:
 *                         type: string
 *                       employee:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           user:
 *                             type: object
 *                             properties:
 *                               firstName:
 *                                 type: string
 *                               lastName:
 *                                 type: string
 */
router.get('/', verifyToken, validateSchema(vacationFiltersSchema), getAllVacation)

/**
 * @swagger
 * /v1/vacation:
 *   post:
 *     summary: Create a new vacation record
 *     tags: [Vacation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - startDate
 *               - endDate
 *             properties:
 *               employeeId:
 *                 type: integer
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [PENDING, APPROVED, REJECTED]
 *                 default: PENDING
 *     responses:
 *       201:
 *         description: Vacation record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     employeeId:
 *                       type: integer
 *                     startDate:
 *                       type: string
 *                       format: date
 *                     endDate:
 *                       type: string
 *                       format: date
 *                     status:
 *                       type: string
 */
router.post('/', verifyToken, validateSchema(vacationCreateUpdateSchema), createVacation)

/**
 * @swagger
 * /v1/vacation/{id}:
 *   put:
 *     summary: Update a vacation record by ID
 *     tags: [Vacation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Vacation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BodyVacationCreateUpdate'
 *     responses:
 *       200:
 *         description: Vacation record updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     employeeId:
 *                       type: integer
 *                     startDate:
 *                       type: string
 *                       format: date
 *                     endDate:
 *                       type: string
 *                       format: date
 *                     status:
 *                       type: string
 */
router.put('/:id', verifyToken, validateSchema(vacationCreateUpdateSchema), updateVacationById)

/**
 * @swagger
 * /v1/vacation/{id}:
 *   delete:
 *     summary: Delete a vacation record by ID
 *     tags: [Vacation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Vacation ID
 *     responses:
 *       200:
 *         description: Vacation record deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 */
router.delete('/:id', verifyToken, deleteVacationById)

export default router
