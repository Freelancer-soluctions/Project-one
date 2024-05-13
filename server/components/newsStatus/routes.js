import { Router } from 'express'
import { NewsStatus, NewsStatusArray } from '../../utils/joiSchemas/joi.js'
import validateSchema from '../../middleware/validateSchema.js'
import * as newsStatusController from './controller.js'

const router = Router()

/**
@openapi
 * /api/v1/newsStatus:
 *   get:
 *     tags:
 *       - NewsStatus
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
 */

router.get('/', newsStatusController.getAll)

/**
@openapi
 * /api/v1/newsStatus/{id}:
 *   get:
 *     tags:
 *       - NewsStatus
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: int
 *         description: The NewsStatus identifier
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
 *              $ref: "#/components/schemas/Error"
 *
 */

router.get('/:id', newsStatusController.getOneById)

/**
 * @openapi
 * /api/v1/newsStatus:
 *   post:
 *     tags:
 *       - NewsStatus
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
 *              $ref: "#/components/schemas/Create"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *              $ref: "#/components/schemas/Error"
 *
 */

router.post('/', validateSchema(NewsStatus), newsStatusController.createOne)

/**
 * @openapi
 * /api/v1/newsStatus/bulk:
 *   post:
 *     tags:
 *       - NewsStatus
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
 *              $ref: "#/components/schemas/Create"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *              $ref: "#/components/schemas/Error"
 *
 */

router.post('/bulk', validateSchema(NewsStatusArray), newsStatusController.createMany)

/**
 * @openapi
 * /api/v1/newsStatus/{id}:
 *   put:
 *     tags:
 *       - NewsStatus
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: int
 *         description: The newsStatus identifier
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
 *              $ref: "#/components/schemas/Update"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *              $ref: "#/components/schemas/Error"
 *
 */

router.put('/:id', validateSchema(NewsStatus), newsStatusController.updateById)

/**
 * @openapi
 * /api/v1/newsStatus/{id}:
 *   delete:
 *     tags:
 *       - NewsStatus
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: int
 *         description: The newsStatus identifier
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

router.delete('/:id', newsStatusController.deleteById)

export default router
