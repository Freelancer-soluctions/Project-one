import express from 'express';
import { requireApprovalPermission } from '../../middleware/requireApprovalPermission.js';
import {
  getAllVacation,
  createVacation,
  deleteVacationById,
  patchVacationById,
  runAccrual,
  getBalance,
  getApprovalAccess,
} from './controller.js';
import {
  verifyToken,
  validateQueryParams,
  validateSchema,
  checkRoleAuthOrPermisssion,
  validatePathParam,
} from '../../middleware/index.js';
import {
  vacationFiltersSchema,
  vacationCreateSchema,
  vacationUpdateSchema,
  vacationAccrualSchema,
  vacationBalanceQuerySchema,
} from './schemas/vacation.joi.js';
import { ROLESCODES, PERMISSIONCODES } from '../../utils/constants/enums.js';

const router = express.Router();
// uso global de middleware
router.use(verifyToken);

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
 *           enum: [PENDING, APPROVED, REJECTED, CANCELLED]
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
router.get(
  '/',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER, ROLESCODES.USER],
    permissions: [PERMISSIONCODES.canViewVacations],
  }),
  validateQueryParams(vacationFiltersSchema),
  getAllVacation
);

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
 *                 enum: [PENDING, APPROVED, REJECTED, CANCELLED]
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
router.post(
  '/',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER, ROLESCODES.USER],
    permissions: [PERMISSIONCODES.canRequestVacation],
  }),
  requireApprovalPermission(PERMISSIONCODES.canApproveVacation),
  validateSchema(vacationCreateSchema),
  createVacation
);

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
router.delete(
  '/:id',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER, ROLESCODES.USER],
    permissions: [PERMISSIONCODES.canDeleteVacation],
  }),
  validatePathParam,
  deleteVacationById
);

/**
 * @swagger
 * /v1/vacation/{id}:
 *   patch:
 *     summary: Partially update a vacation record by ID
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
 *             $ref: '#/components/schemas/BodyVacationPatch'
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
 *                     type:
 *                       type: string
 *                     reason:
 *                       type: string
 */
router.patch(
  '/:id',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER, ROLESCODES.USER],
    permissions: [PERMISSIONCODES.canEditRequestVacation],
  }),
  validatePathParam,
  requireApprovalPermission(PERMISSIONCODES.canApproveVacation),
  validateSchema(vacationUpdateSchema),
  patchVacationById
);

/**
 * @swagger
 * /v1/vacation/accrual:
 *   post:
 *     summary: Ejecuta el devengo mensual de vacaciones (idempotente por periodo)
 *     tags: [Vacation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Devengo procesado
 *       403:
 *         description: Solo ADMIN
 */
router.post(
  '/accrual',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN],
  }),
  validateSchema(vacationAccrualSchema),
  runAccrual
);

/**
 * @swagger
 * /v1/vacation/balance:
 *   get:
 *     summary: Saldo de vacaciones de un empleado para un año
 *     tags: [Vacation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: accrued, used y remaining (días)
 */
router.get(
  '/balance',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER, ROLESCODES.USER],
    permissions: [PERMISSIONCODES.canViewVacations],
  }),
  validateQueryParams(vacationBalanceQuerySchema),
  getBalance
);

/**
 * @swagger
 * /v1/vacation/approval-access:
 *   get:
 *     summary: Capacidad de aprobación del usuario autenticado
 *     tags: [Vacation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: canApproveVacation / canApprovePermission (booleans)
 */
router.get('/approval-access', getApprovalAccess);

export default router;
