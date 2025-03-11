import { Router } from 'express'
import { NoteCreate, NoteColumnUpdate, NotesFilters, NoteUpdate } from '../../utils/joiSchemas/joi.js'
import validateSchema from '../../middleware/validateSchema.js'
import * as noteController from './controller.js'
import validateQueryParams from '../../middleware/validateQueryParams.js'
import verifyToken from '../../middleware/verifyToken.js'

const router = Router()

router.get('/', verifyToken, validateQueryParams(NotesFilters), noteController.getAllNotes)

router.post('/', verifyToken, validateSchema(NoteCreate), noteController.createNote)

router.get('/notesColumns', noteController.getAllNotesColumns)

router.put('/notecolumn', verifyToken, validateSchema(NoteColumnUpdate), noteController.updateNoteColumId)

router.put('/:id', verifyToken, validateSchema(NoteUpdate), noteController.updateNoteById)

router.delete('/:id', verifyToken, noteController.deleteById)

router.get('/notesCount', verifyToken, noteController.getAllNotesCount)

export default router
