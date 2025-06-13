import express from 'express'
import { getAllPayroll, createPayroll, updatePayrollById, deletePayrollById } from './controller.js'

import { payrollFiltersSchema, payrollCreateUpdateSchema } from '../../utils/joiSchemas/joi.js'
import { verifyToken, validateQueryParams, validateSchema, checkRoleAuthOrPermisssion } from '../../middleware/index.js'
import { ROLESCODES } from '../../utils/constants/enums.js'

const router = express.Router()
// uso global de middleware
router.use(verifyToken)
router.use(checkRoleAuthOrPermisssion([ROLESCODES.ADMIN, ROLESCODES.MANAGER]))

/**
 * @swagger
 * /v1/payroll:
 *   get:
 *     summary: Get all payroll records
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: integer
 *         description: Filter by employee ID
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Filter by month
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           minimum: 1900
 *           maximum: 2100
 *         description: Filter by year
 *     responses:
 *       200:
 *         description: List of payroll records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Payroll retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       employeeId:
 *                         type: integer
 *                       month:
 *                         type: integer
 *                       year:
 *                         type: integer
 *                       baseSalary:
 *                         type: number
 *                       extraHours:
 *                         type: number
 *                       deductions:
 *                         type: number
 *                       totalPayment:
 *                         type: number
 *                       employee:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           user:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *                               lastName:
 *                                 type: string
 */
router.get('/', validateSchema(payrollFiltersSchema), getAllPayroll)

/**
 * @swagger
 * /v1/payroll:
 *   post:
 *     summary: Create a new payroll record
 *     tags: [Payroll]
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
 *               - month
 *               - year
 *               - baseSalary
 *               - extraHours
 *               - deductions
 *               - totalPayment
 *             properties:
 *               employeeId:
 *                 type: integer
 *               month:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *               year:
 *                 type: integer
 *                 minimum: 1900
 *                 maximum: 2100
 *               baseSalary:
 *                 type: number
 *                 format: float
 *               extraHours:
 *                 type: number
 *                 format: float
 *               deductions:
 *                 type: number
 *                 format: float
 *               totalPayment:
 *                 type: number
 *                 format: float
 *     responses:
 *       201:
 *         description: Payroll record created successfully
 */
router.post('/', validateSchema(payrollCreateUpdateSchema), createPayroll)

/**
 * @swagger
 * /v1/payroll/{id}:
 *   put:
 *     summary: Update a payroll record
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Payroll ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BodyPayrollCreateUpdate'
 *     responses:
 *       200:
 *         description: Payroll record updated successfully
 */
router.put('/:id', validateSchema(payrollCreateUpdateSchema), updatePayrollById)

/**
 * @swagger
 * /v1/payroll/{id}:
 *   delete:
 *     summary: Delete a payroll record
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Payroll ID
 *     responses:
 *       200:
 *         description: Payroll record deleted successfully
 */
router.delete('/:id', deletePayrollById)

export default router
