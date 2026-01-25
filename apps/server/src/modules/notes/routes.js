import { Router } from 'express';
import {
  NoteCreate,
  NoteColumnUpdate,
  NotesFilters,
  NoteUpdate,
} from '../../utils/joiSchemas/joi.js';
import * as noteController from './controller.js';
import {
  verifyToken,
  validateQueryParams,
  validateSchema,
  checkRoleAuthOrPermisssion,
  validatePathParam,
} from '../../middleware/index.js';
import { ROLESCODES } from '../../utils/constants/enums.js';

const router = Router();
// uso global de middleware
router.use(verifyToken);
router.use(
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER, ROLESCODES.USER],
  })
);

router.get('/', validateQueryParams(NotesFilters), noteController.getAllNotes);

router.post('/', validateSchema(NoteCreate), noteController.createNote);

router.get('/notesColumns', noteController.getAllNotesColumns);

router.put(
  '/notecolumn',
  validateSchema(NoteColumnUpdate),
  noteController.updateNoteColumId
);

router.put(
  '/:id',
  checkRoleAuthOrPermisssion,
  validatePathParam,
  validateSchema(NoteUpdate),
  noteController.updateNoteById
);

router.delete('/:id', validatePathParam, noteController.deleteById);

router.get('/notesCount', noteController.getAllNotesCount);

export default router;
