import { Router } from 'express'
import { NoteCreate, NoteUpdate, NotesFilters } from '../../utils/joiSchemas/joi.js'
import validateSchema from '../../middleware/validateSchema.js'
import * as noteController from './controller.js'
import upload from '../../utils/multer/multer.js'
import validateQueryParams from '../../middleware/validateQueryParams.js'
import verifyToken from '../../middleware/verifyToken.js'

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

router.get('/', verifyToken, validateQueryParams(NotesFilters), noteController.getAllNotes)

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

router.post('/', verifyToken, validateSchema(NoteCreate), noteController.createNote)

/**
@openapi
 * /api/v1/news/status:
 *   get:
 *     tags:
 *       - News
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
 *                     $ref: "#/components/schemas/NewsStatus"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *              $ref: "#/components/schemas/Error"
 *
 */

router.get('/notesColumns', noteController.getAllNotesColumns)

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
