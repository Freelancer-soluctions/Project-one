import express from 'express'
import {
  getAllUsers,
  createUser,
  updateUserById,
  deleteUserById,

  getAllUsersStatus,
  getAllUsersRoles
} from './controller.js'
import { verifyToken, validateQueryParams, validateSchema, checkRoleAuthOrPermisssion } from '../../middleware/index.js'
import { ROLESCODES, PERMISSIONCODES } from '../../utils/constants/enums.js'
import { userFiltersSchema, userCreateUpdateSchema } from '../../utils/joiSchemas/joi.js'

const router = express.Router()
// uso global de middleware
router.use(verifyToken)

/**
 * @openapi
 * /v1/users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get all users with optional filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filters
 *         schema:
 *           $ref: "#/components/schemas/UserFilters"
 *         required: false
 *         description: "Optional filters to search users."
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
 *                   example: "Some success message"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/ResponseGetUser"
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
  '/', checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER],
    permissions: [PERMISSIONCODES.canViewUser]
  }),
  validateQueryParams(userFiltersSchema),
  getAllUsers
)

/**
 * @openapi
 * /v1/users:
 *   post:
 *     tags:
 *       - Users
 *     summary: Create a new user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BodyUserCreateUpdate'
 *     responses:
 *       201:
 *         description: User created successfully
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
 *                   $ref: '#/components/schemas/ResponseUserCreateUpdate'
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
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER],
    permissions: [PERMISSIONCODES.canCreateUser]
  }),
  validateSchema(userCreateUpdateSchema),
  createUser
)

/**
 * @openapi
 * /v1/users/{id}:
 *   put:
 *     tags:
 *       - Users
 *     summary: Update a user by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BodyUserCreateUpdate'
 *     responses:
 *       200:
 *         description: User updated successfully
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
 *                   $ref: '#/components/schemas/ResponseUserCreateUpdate'
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
  '/:id', checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER],
    permissions: [PERMISSIONCODES.canEditUser]
  }),
  validateSchema(userCreateUpdateSchema),
  updateUserById
)

/**
 * @openapi
 * /v1/users/{id}:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Delete a user by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Delete'
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
  '/:id', checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER],
    permissions: [PERMISSIONCODES.canDeleteUser]
  }),
  deleteUserById
)

router.get('/status', checkRoleAuthOrPermisssion({
  allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER],
  permissions: [PERMISSIONCODES.canDeleteUser]
}), getAllUsersStatus)

router.get('/roles', checkRoleAuthOrPermisssion({
  allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER],
  permissions: [PERMISSIONCODES.canDeleteUser]
}), getAllUsersRoles)

export default router
