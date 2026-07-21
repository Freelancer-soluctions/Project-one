import { Router } from 'express';
import { ROLESCODES, PERMISSIONCODES } from '../../../utils/constants/enums.js';
import {
  checkRoleAuthOrPermisssion,
  validateNumericPathParam,
  validateSchema,
  validateQueryParams,
} from '../../../middleware/index.js';
import {
  UpdateAttendeeStatusSchema,
  AttendeeListQuerySchema,
} from '../schemas/event-rsvp.js';
import * as attendeeController from './controller.js';

const router = Router({ mergeParams: true });
// verifyToken is inherited from parent router

// POST /events/:eventId/register — self-service registration
router.post(
  '/register',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER, ROLESCODES.USER],
    permissions: [PERMISSIONCODES.canRegisterForEvent],
  }),
  validateNumericPathParam('eventId'),
  attendeeController.registerForEvent
);

// DELETE /events/:eventId/register — self-service cancellation
router.delete(
  '/register',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER, ROLESCODES.USER],
    permissions: [PERMISSIONCODES.canCancelRegistration],
  }),
  validateNumericPathParam('eventId'),
  attendeeController.cancelRegistration
);

// GET /events/:eventId/attendees — admin attendee listing
router.get(
  '/attendees',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER],
    permissions: [PERMISSIONCODES.canViewAttendees],
  }),
  validateNumericPathParam('eventId'),
  validateQueryParams(AttendeeListQuerySchema),
  attendeeController.listEventAttendees
);

// PATCH /events/:eventId/attendees/:attendeeId — admin status update
router.patch(
  '/attendees/:attendeeId',
  checkRoleAuthOrPermisssion({
    allowedRoles: [ROLESCODES.ADMIN, ROLESCODES.MANAGER],
    permissions: [PERMISSIONCODES.canManageAttendees],
  }),
  validateNumericPathParam('eventId'),
  validateNumericPathParam('attendeeId'),
  validateSchema(UpdateAttendeeStatusSchema),
  attendeeController.updateAttendeeStatus
);

export default router;