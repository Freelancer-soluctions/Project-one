import { Router } from 'express'
import { Role, RoleArray, RoleUpdate } from '../../utils/joiSchemas/joi.js'
import validateSchema from '../../middleware/validateSchema.js'
import * as roleController from './controller.js'
import verifyToken from '../../middleware/verifyToken.js'
const router = Router()

/**
@openapi
 * /api/v1/role:
 *   get:
 *     tags:
 *       - Role
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         schema:
 *          type: string
 *         required: true
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/Role"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *              $ref: "#/components/schemas/Error"
 *
 */

router.get('/', verifyToken, roleController.getAll)

/**
@openapi
 * /api/v1/role/{id}:
 *   get:
 *     tags:
 *       - Role
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: int
 *         description: The Role identifier
 *       - in: header
 *         name: x-access-token
 *         schema:
 *          type: string
 *         required: true
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                  $ref: "#/components/schemas/Role"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *              $ref: "#/components/schemas/Error"
 *
 */

router.get('/:id', verifyToken, roleController.getOneById)

/**
@openapi
 * /api/v1/role/code/{code}:
 *   get:
 *     tags:
 *       - Role
 *     parameters:
 *       - in: path
 *         name: code
 *         schema:
 *           type: string
 *         description: The Role code identifier
 *       - in: header
 *         name: x-access-token
 *         schema:
 *          type: string
 *         required: true
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                  $ref: "#/components/schemas/Role"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *              $ref: "#/components/schemas/Error"
 *
 */

router.get('/role-code/:code', verifyToken, roleController.getOneByCode)

/**
 * @openapi
 * /api/v1/role:
 *   post:
 *     tags:
 *       - Role
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         schema:
 *          type: string
 *         required: true
 *     requestBody:
 *         content:
 *          application/json:
 *           schema:
 *            $ref: "#/components/schemas/RoleBody"
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *              $ref: "#/components/schemas/Create"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *              $ref: "#/components/schemas/Error"
 *
 */

router.post('/', verifyToken, validateSchema(Role), roleController.createOne)

/**
 * @openapi
 * /api/v1/role/bulk:
 *   post:
 *     tags:
 *       - Role
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         schema:
 *          type: string
 *         required: true
 *     requestBody:
 *         content:
 *          application/json:
 *           schema:
 *            type: array
 *            items:
 *              $ref: "#/components/schemas/RoleBody"
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *              $ref: "#/components/schemas/Create"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *              $ref: "#/components/schemas/Error"
 *
 */

router.post('/bulk', validateSchema(RoleArray), roleController.createMany)

/**
 * @openapi
 * /api/v1/role/{id}:
 *   put:
 *     tags:
 *       - Role
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: int
 *         description: The role identifier
 *       - in: header
 *         name: x-access-token
 *         schema:
 *          type: string
 *         required: true
 *     requestBody:
 *         content:
 *          application/json:
 *           schema:
 *            $ref: "#/components/schemas/RoleBody"
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *              $ref: "#/components/schemas/Update"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *              $ref: "#/components/schemas/Error"
 *
 */

router.put('/:id', validateSchema(RoleUpdate), roleController.updateById)

/**
 * @openapi
 * /api/v1/role/code/{code}:
 *   put:
 *     tags:
 *       - Role
 *     parameters:
 *       - in: path
 *         name: code
 *         schema:
 *           type: string
 *         description: The role code identifier
 *       - in: header
 *         name: x-access-token
 *         schema:
 *          type: string
 *         required: true
 *     requestBody:
 *         content:
 *          application/json:
 *           schema:
 *            $ref: "#/components/schemas/RoleBody"
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *              $ref: "#/components/schemas/Update"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *              $ref: "#/components/schemas/Error"
 *
 */

router.put('/code/:code', validateSchema(RoleUpdate), roleController.updateByCode)

/**
 * @openapi
 * /api/v1/role/{id}:
 *   delete:
 *     tags:
 *       - Role
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: int
 *         description: The role identifier
 *       - in: header
 *         name: x-access-token
 *         schema:
 *          type: string
 *         required: true
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *              $ref: "#/components/schemas/Delete"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *              $ref: "#/components/schemas/Error"
 */

router.delete('/:id', roleController.deleteById)

/**
 * @openapi
 * /api/v1/role/code/{code}:
 *   delete:
 *     tags:
 *       - Role
 *     parameters:
 *       - in: path
 *         name: code
 *         schema:
 *           type: string
 *         description: The role code identifier
 *       - in: header
 *         name: x-access-token
 *         schema:
 *          type: string
 *         required: true
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *              $ref: "#/components/schemas/Delete"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *              $ref: "#/components/schemas/Error"
 */

router.delete('/code/:code', roleController.deleteByCode)

export default router
