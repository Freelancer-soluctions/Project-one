import Joi from 'joi';

/**
 * Registration params schema — eventId from route param.
 */
export const RegisterParamsSchema = Joi.object({
  eventId: Joi.number().integer().positive().required(),
});

/**
 * Admin attendee status update schema.
 */
export const UpdateAttendeeStatusSchema = Joi.object({
  status: Joi.string().valid('CONFIRMED', 'WAITLIST', 'CANCELLED').required(),
  reason: Joi.string().max(500).allow(''),
});

/**
 * Attendee listing query schema.
 */
export const AttendeeListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid('CONFIRMED', 'WAITLIST', 'CANCELLED').optional(),
});
