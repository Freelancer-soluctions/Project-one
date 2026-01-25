import express from 'express';
import {
  getAllPermissions,
  createPermission,
  updatePermissionById,
  deletePermissionById,
} from './controller.js';
import {
  verifyToken,
  validateQueryParams,
  validateSchema,
  checkRoleAuthOrPermisssion,
  validatePathParam,
} from '../../middleware/index.js';
import { ROLESCODES, PERMISSIONCODES } from '../../utils/constants/enums.js';
import {
  permissionFiltersSchema,
  permissionCreateUpdateSchema,
} from '../../utils/joiSchemas/joi.js';

const router = express.Router();
// uso global de middleware
router.use(verifyToken);

/**
 * @swagger
 * components:
 *   schemas:
 *     Permission:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The permission ID
 *           example: 1
 *         employeeId:
 *           type: integer
 *           description: The ID of the employee requesting permission
 *           example: 1
 *         type:
 *           type: string
 *           enum: [SICK, PERSONAL, MATERNITY, PATERNITY, OTHER]
 *           description: The type of permission
 *           example: SICK
 *         startDate:
 *           type: string
 *           format: date
 *           description: Start date of the permission
 *           example: "2024-03-25"
 *         endDate:
 *           type: string
 *           format: date
 *           description: End date of the permission
 *           example: "2024-03-26"
 *         reason:
 *           type: string
 *           description: Reason for requesting permission
 *           example: "Medical appointment"
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *           description: Current status of the permission
 *           example: PENDING
 *         approvedBy:
 *           type: integer
 *           description: ID of the user who approved/rejected the permission
 *           example: 2
 *         approvedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the permission was approved/rejected
 *           example: "2024-03-25T10:00:00Z"
 *         comments:
 *           type: string
 *           description: Additional comments about the permission
 *           example: "Approved with conditions"
 *         createdOn:
 *           type: string
 *           format: date-time
 *           description: Creation date and time
 *           example: "2024-03-25T09:00:00Z"
 *         updatedOn:
 *           type: string
 *           format: date-time
 *           description: Last update date and time
 *           example: "2024-03-25T10:00:00Z"
 *         employee:
 *           $ref: '#/components/schemas/Employee'
 *         approver:
 *           $ref: '#/components/schemas/User'
 *       required:
 *         - employeeId
 *         - type
 *         - startDate
 *         - endDate
 *         - reason
 *
 *     PermissionFilters:
 *       type: object
 *       properties:
 *         employeeId:
 *           type: integer
 *           description: Filter by employee ID
 *           example: 1
 *         type:
 *           type: string
 *           enum: [SICK, PERSONAL, MATERNITY, PATERNITY, OTHER]
 *           description: Filter by permission type
 *           example: SICK
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *           description: Filter by permission status
 *           example: PENDING
 *         fromDate:
 *           type: string
 *           format: date
 *           description: Filter by start date (inclusive)
 *           example: "2024-03-01"
 *         toDate:
 *           type: string
 *           format: date
 *           description: Filter by end date (inclusive)
 *           example: "2024-03-31"
 */

/**
 * @swagger
 * /v1/permission:
 *   get:
 *     summary: Get all permissions
 *     description: Retrieve a list of permissions with optional filters
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: integer
 *         description: Filter by employee ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [SICK, PERSONAL, MATERNITY, PATERNITY, OTHER]
 *         description: Filter by permission type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         description: Filter by permission status
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (inclusive)
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date (inclusive)
 *     responses:
 *       200:
 *         description: List of permissions retrieved successfully
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
 *                     $ref: '#/components/schemas/Permission'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get(
  '/',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER, ROLESCODES.USER],
    permissions: [PERMISSIONCODES.canViewPermission],
  }),
  validateQueryParams(permissionFiltersSchema),
  getAllPermissions
);

/**
 * @swagger
 * /v1/permission:
 *   post:
 *     summary: Create a new permission
 *     description: Create a new permission request for an employee
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Permission'
 *     responses:
 *       201:
 *         description: Permission created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Permission'
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.post(
  '/',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER, ROLESCODES.USER],
    permissions: [PERMISSIONCODES.canCreatePermission],
  }),
  validateSchema(permissionCreateUpdateSchema),
  createPermission
);

/**
 * @swagger
 * /v1/permission/{id}:
 *   put:
 *     summary: Update a permission
 *     description: Update an existing permission by its ID
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Permission ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Permission'
 *     responses:
 *       200:
 *         description: Permission updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Permission'
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Permission not found
 *       500:
 *         description: Internal server error
 */
router.put(
  '/:id',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER, ROLESCODES.USER],
    permissions: [PERMISSIONCODES.canEditPermission],
  }),
  validatePathParam,
  validateSchema(permissionCreateUpdateSchema),
  updatePermissionById
);

/**
 * @swagger
 * /v1/permission/{id}:
 *   delete:
 *     summary: Delete a permission
 *     description: Delete an existing permission by its ID
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Permission ID
 *     responses:
 *       200:
 *         description: Permission deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Permission deleted successfully
 *                 data:
 *                   $ref: '#/components/schemas/Permission'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Permission not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  '/:id',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER, ROLESCODES.USER],
    permissions: [PERMISSIONCODES.canDeletePermission],
  }),
  validatePathParam,
  deletePermissionById
);

export default router;
