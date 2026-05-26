import { Router } from 'express';
import {
  NoteCreate,
  NoteColumnUpdate,
  NotesFilters,
  NoteUpdate,
  CreateHashtagSchema,
  UpdateHashtagSchema,
} from './schemas/notes.joi.js';
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
  validatePathParam,
  validateSchema(NoteUpdate),
  noteController.updateNoteById
);

router.delete('/:id', validatePathParam, noteController.deleteById);

router.get('/notesCount', noteController.getAllNotesCount);

// Get mentions for a specific note
router.get('/:id/mentions', validatePathParam, noteController.getMentionsByNoteId);

// Hashtag routes (within notes module)
router.get('/hashtags', noteController.getAllHashtags);
router.post('/hashtags', validateSchema(CreateHashtagSchema), noteController.createHashtag);
router.put('/hashtags/:id', validatePathParam, validateSchema(UpdateHashtagSchema), noteController.updateHashtag);
router.delete('/hashtags/:id', validatePathParam, noteController.deleteHashtag);

export default router;
