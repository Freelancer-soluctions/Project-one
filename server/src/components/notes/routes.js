import { Router } from 'express'
import { NoteCreate, NoteColumnUpdate, NotesFilters, NoteUpdate } from '../../utils/joiSchemas/joi.js'
import validateSchema from '../../middleware/validateSchema.js'
import * as noteController from './controller.js'
import validateQueryParams from '../../middleware/validateQueryParams.js'
import verifyToken from '../../middleware/verifyToken.js'

const router = Router()

/**
@openapi
 * /api/v1/notes:
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
 * /api/v1/notes:
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
 * /api/v1/notes/status:
 *   get:
 *     tags:
 *       - Notes
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
 * /api/v1/notes/{id}:
 *   put:
 *     tags:
 *       - Notes
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

router.put('/notecolumn', verifyToken, validateSchema(NoteColumnUpdate), noteController.updateNoteColumId)

/**
 * @openapi
 * /api/v1/notes/{id}:
 *   put:
 *     tags:
 *       - Notes
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: int
 *         description: The news identifier
 *       - in: header
 *         name: x-access-token
 *         schema:
 *          type: string
 *         required: true
 *     requestBody:
 *         content:
 *          multipart/form-data:
 *           schema:
 *            $ref: "#/components/schemas/NewsBody"
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

router.put('/:id', verifyToken, validateSchema(NoteUpdate), noteController.updateNoteById)

/**
 * @openapi
 * /api/v1/notes/{id}:
 *   delete:
 *     tags:
 *       - Notes
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

router.delete('/:id', verifyToken, noteController.deleteById)

/**
@openapi
 * /api/v1/notes/notesCount:
 *   get:
 *     tags:
 *       - Notes
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
 *                     $ref: "#/components/schemas/notesCount"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *              $ref: "#/components/schemas/Error"
 *
 */

router.get('/notesCount', verifyToken, noteController.getAllNotesCount)

export default router
