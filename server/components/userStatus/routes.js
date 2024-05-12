import { Router } from 'express'
import { UserStatus, UserStatusArray } from '../../libs/joi.js'
import { validateSchema } from '../../middleware/validateSchema.js'
import * as userStatusController from './controller.js'

const router = Router()

/**
@openapi
 * /api/v1/userStatus:
 *   get:
 *     tags:
 *       - UserStatus
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
 *                     $ref: "#/components/schemas/Status"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *              $ref: "#/components/schemas/Error"
 *
 *
 */

router.get('/', userStatusController.getAll)



/**
@openapi
 * /api/v1/userStatus/{id}:
 *   get:
 *     tags:
 *       - UserStatus
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: int
 *         description: The userStatus identifier
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
 *                  $ref: "#/components/schemas/Status"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *
 *
 */

router.get('/:id', userStatusController.getOneById)


/**
 * @openapi
 * /api/v1/userStatus:
 *   post:
 *     tags:
 *       - UserStatus
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
 *            $ref: "#/components/schemas/StatusBody"
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Create"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *
 *
 */

router.post('/', validateSchema(UserStatus), userStatusController.createOne)

/**
 * @openapi
 * /api/v1/userStatus/bulk:
 *   post:
 *     tags:
 *       - UserStatus
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
 *              $ref: "#/components/schemas/StatusBody"
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Create"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *
 *
 */

router.post('/bulk', validateSchema(UserStatusArray), userStatusController.createMany)

/**
 * @openapi
 * /api/v1/userStatus/{id}:
 *   put:
 *     tags:
 *       - UserStatus
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: int
 *         description: The userStatus identifier
 *       - in: header
 *         name: x-access-token
 *         schema:
 *          type: string
 *         required: true
 *     requestBody:
 *         content:
 *          application/json:
 *           schema:
 *            $ref: "#/components/schemas/StatusBody"
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Update"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *
 *
 */

router.put('/:id', validateSchema(UserStatus), userStatusController.updateById)

/**
 * @openapi
 * /api/v1/userStatus/{id}:
 *   delete:
 *     tags:
 *       - UserStatus
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: int
 *         description: The userStatus identifier
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
 *               $ref: "#/components/schemas/Delete"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */

router.delete('/:id', userStatusController.deleteById)

export default router
