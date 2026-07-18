import Joi from 'joi';

// HH:mm 24-hour format regex: 00:00 - 23:59
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Cross-field validator: startTime must be earlier than endTime.
 * Runs after individual field validation, so both values are valid HH:mm strings.
 * Lexicographic comparison works for HH:mm format (e.g., "09:00" < "17:00").
 */
const startBeforeEndValidator = (value, helpers) => {
  if (value.startTime && value.endTime && value.startTime >= value.endTime) {
    return helpers.message('startTime must be earlier than endTime');
  }
  return value;
};

export const EventsCreateSchema = Joi.object({
  title: Joi.string().max(50).required(),
  description: Joi.string().max(200).required(),
  // Converts "" to undefined via .empty('') — makes speaker truly optional
  speaker: Joi.string().max(20).empty('').optional(),
  startTime: Joi.string().pattern(TIME_REGEX).required().messages({
    'string.pattern.base': 'startTime must be in HH:mm format (00:00-23:59)',
  }),
  endTime: Joi.string().pattern(TIME_REGEX).required().messages({
    'string.pattern.base': 'endTime must be in HH:mm format (00:00-23:59)',
  }),
  eventDate: Joi.date().required(),
  type: Joi.number().integer().required(),
  capacity: Joi.number().integer().min(0).optional(),
  modality: Joi.string().valid('ONLINE', 'IN_PERSON', 'HYBRID').required(),
  meetingUrl: Joi.string().uri().max(500).when('modality', {
    is: 'ONLINE',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }).when('modality', {
    is: 'HYBRID',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }).forbidden().when('modality', {
    is: 'IN_PERSON',
    then: Joi.forbidden(),
    otherwise: Joi.optional(),
  }),
  location: Joi.string().max(200).when('modality', {
    is: 'IN_PERSON',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }).when('modality', {
    is: 'HYBRID',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }).forbidden().when('modality', {
    is: 'ONLINE',
    then: Joi.forbidden(),
    otherwise: Joi.optional(),
  }),
})
  .custom(startBeforeEndValidator);

export const EventsUpdateSchema = Joi.object({
  title: Joi.string().max(50).optional(),
  description: Joi.string().max(200).optional(),
  speaker: Joi.string().max(20).allow('').optional(),
  startTime: Joi.string().pattern(TIME_REGEX).optional().messages({
    'string.pattern.base': 'startTime must be in HH:mm format (00:00-23:59)',
  }),
  endTime: Joi.string().pattern(TIME_REGEX).optional().messages({
    'string.pattern.base': 'endTime must be in HH:mm format (00:00-23:59)',
  }),
  eventDate: Joi.date().optional(),
  type: Joi.number().integer().optional(),
  capacity: Joi.number().integer().min(0).optional(),
  deletedAt: Joi.date().valid(null).optional().raw(),
  deletedBy: Joi.any().valid(null).optional(),
  modality: Joi.string().valid('ONLINE', 'IN_PERSON', 'HYBRID').optional(),
  meetingUrl: Joi.string().uri().max(500).when('modality', {
    is: 'ONLINE',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }).when('modality', {
    is: 'HYBRID',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }).forbidden().when('modality', {
    is: 'IN_PERSON',
    then: Joi.forbidden(),
    otherwise: Joi.optional(),
  }),
  location: Joi.string().max(200).when('modality', {
    is: 'IN_PERSON',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }).when('modality', {
    is: 'HYBRID',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }).forbidden().when('modality', {
    is: 'ONLINE',
    then: Joi.forbidden(),
    otherwise: Joi.optional(),
  }),
})
  // Cross-field runs only when both fields present (partial update safe)
  .custom((value, helpers) => {
    if (value.startTime !== undefined && value.endTime !== undefined && value.startTime >= value.endTime) {
      return helpers.message('startTime must be earlier than endTime');
    }
    return value;
  });

export const EventsFilters = Joi.object({
  searchQuery: Joi.string().min(1).max(100),
  page: Joi.number().integer().positive().default(1),
  limit: Joi.number().integer().positive().default(20),
  showDeleted: Joi.boolean().truthy('true', '1').falsy('false', '0').optional(),
  type: Joi.number().integer().optional(),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().optional(),
  speaker: Joi.string().max(50).optional(),
  status: Joi.string().valid('upcoming', 'past', 'all').optional(),
  modality: Joi.string().valid('ONLINE', 'IN_PERSON', 'HYBRID').optional(),
});
