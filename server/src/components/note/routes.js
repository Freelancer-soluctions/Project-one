import { Router } from 'express'
import { Note, NoteUpdate } from '../../utils/joiSchemas/joi.js'
import validateSchema from '../../middleware/validateSchema.js'
import * as noteController from './controller.js'
import upload from '../../utils/multer/multer.js'

const router = Router()

/**
@openapi
 * /api/v1/note:
 *   get:
 *     tags:
 *       - Note
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
 *                     $ref: "#/components/schemas/Note"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *              $ref: "#/components/schemas/Error"
 *
 */

router.get('/', noteController.getAll)

/**
@openapi
 * /api/v1/note/{id}:
 *   get:
 *     tags:
 *       - Note
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: int
 *         description: The Note identifier
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
 *                  $ref: "#/components/schemas/Note"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *              $ref: "#/components/schemas/Error"
 *
 */

router.get('/:id', noteController.getOneById)

/**
 * @openapi
 * /api/v1/note:
 *   post:
 *     tags:
 *       - Note
 *     parameters:
 *       - in: header
 *         name: x-access-token
 *         schema:
 *          type: string
 *         required: true
 *     requestBody:
 *         content:
 *          multipart/form-data:
 *           schema:
 *            $ref: "#/components/schemas/NoteBody"
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

router.post('/',
  upload.single('document'),
  validateSchema(Note),
  noteController.createOne)

/**
 * @openapi
 * /api/v1/note/{id}:
 *   put:
 *     tags:
 *       - Note
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: int
 *         description: The note identifier
 *       - in: header
 *         name: x-access-token
 *         schema:
 *          type: string
 *         required: true
 *     requestBody:
 *         content:
 *          multipart/form-data:
 *           schema:
 *            $ref: "#/components/schemas/NoteBody"
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

router.put('/:id',
  upload.single('document'),
  validateSchema(NoteUpdate),
  noteController.updateById)

/**
 * @openapi
 * /api/v1/note/{id}:
 *   delete:
 *     tags:
 *       - Note
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: int
 *         description: The note identifier
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

router.delete('/:id', noteController.deleteById)

export default router
