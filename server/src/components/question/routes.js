import { Router } from 'express'
import { Question, QuestionArray, QuestionUpdate } from '../../utils/joiSchemas/joi.js'
import validateSchema from '../../middleware/validateSchema.js'
import * as questionController from './controller.js'

const router = Router()

/**
@openapi
 * /api/v1/question:
 *   get:
 *     tags:
 *       - Question
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
 *                     $ref: "#/components/schemas/Question"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *              $ref: "#/components/schemas/Error"
 *
 *
 */

router.get('/', questionController.getAll)

/**
@openapi
 * /api/v1/question/{id}:
 *   get:
 *     tags:
 *       - Question
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: int
 *         description: The question identifier
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
 *                  $ref: "#/components/schemas/Question"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *
 *
 */

router.get('/:id', questionController.getOneById)

/**
 * @openapi
 * /api/v1/question:
 *   post:
 *     tags:
 *       - Question
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
 *            $ref: "#/components/schemas/QuestionBody"
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

router.post('/', validateSchema(Question), questionController.createOne)

/**
 * @openapi
 * /api/v1/question/bulk:
 *   post:
 *     tags:
 *       - Question
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
 *              $ref: "#/components/schemas/QuestionBody"
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

router.post('/bulk', validateSchema(QuestionArray), questionController.createMany)

/**
 * @openapi
 * /api/v1/question/{id}:
 *   put:
 *     tags:
 *       - Question
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: int
 *         description: The question identifier
 *       - in: header
 *         name: x-access-token
 *         schema:
 *          type: string
 *         required: true
 *     requestBody:
 *         content:
 *          application/json:
 *           schema:
 *            $ref: "#/components/schemas/QuestionBody"
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

router.put('/:id', validateSchema(QuestionUpdate), questionController.updateById)

/**
 * @openapi
 * /api/v1/question/{id}:
 *   delete:
 *     tags:
 *       - Question
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: int
 *         description: The question identifier
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

router.delete('/:id', questionController.deleteById)

export default router
