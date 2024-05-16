import { Router } from 'express'
import { NoteStatus, NoteStatusArray, NoteStatusUpdate } from '../../utils/joiSchemas/joi.js'
import validateSchema from '../../middleware/validateSchema.js'
import * as noteStatusController from './controller.js'

const router = Router()

/**
@openapi
 * /api/v1/noteStatus:
 *   get:
 *     tags:
 *       - NoteStatus
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

router.get('/', noteStatusController.getAll)

/**
@openapi
 * /api/v1/noteStatus/{id}:
 *   get:
 *     tags:
 *       - NoteStatus
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: int
 *         description: The NoteStatus identifier
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

router.get('/:id', noteStatusController.getOneById)

/**
@openapi
 * /api/v1/noteStatus/code/{code}:
 *   get:
 *     tags:
 *       - NoteStatus
 *     parameters:
 *       - in: path
 *         name: code
 *         schema:
 *           type: string
 *         description: The NoteStatus code identifier
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

router.get('/code/:code', noteStatusController.getOneByCode)

/**
 * @openapi
 * /api/v1/noteStatus:
 *   post:
 *     tags:
 *       - NoteStatus
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

router.post('/', validateSchema(NoteStatus), noteStatusController.createOne)

/**
 * @openapi
 * /api/v1/noteStatus/bulk:
 *   post:
 *     tags:
 *       - NoteStatus
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

router.post('/bulk', validateSchema(NoteStatusArray), noteStatusController.createMany)

/**
 * @openapi
 * /api/v1/noteStatus/{id}:
 *   put:
 *     tags:
 *       - NoteStatus
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: int
 *         description: The noteStatus identifier
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

router.put('/:id', validateSchema(NoteStatusUpdate), noteStatusController.updateById)

/**
 * @openapi
 * /api/v1/noteStatus/code/{code}:
 *   put:
 *     tags:
 *       - NoteStatus
 *     parameters:
 *       - in: path
 *         name: code
 *         schema:
 *           type: string
 *         description: The noteStatus code identifier
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

router.put('/code/:code', validateSchema(NoteStatusUpdate), noteStatusController.updateByCode)

/**
 * @openapi
 * /api/v1/noteStatus/{id}:
 *   delete:
 *     tags:
 *       - NoteStatus
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: int
 *         description: The noteStatus identifier
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

router.delete('/:id', noteStatusController.deleteById)

/**
 * @openapi
 * /api/v1/noteStatus/code/{code}:
 *   delete:
 *     tags:
 *       - NoteStatus
 *     parameters:
 *       - in: path
 *         name: code
 *         schema:
 *           type: string
 *         description: The noteStatus code identifier
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

router.delete('/code/:code', noteStatusController.deleteByCode)

export default router
