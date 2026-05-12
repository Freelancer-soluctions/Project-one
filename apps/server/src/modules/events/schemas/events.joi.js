import Joi from 'joi';

export const EventsCreateUpdate = Joi.object({
  title: Joi.string().max(50).required(),
  description: Joi.string().max(200).required(),
  speaker: Joi.string().max(20).allow(''),
  startTime: Joi.string().max(5).required(),
  endTime: Joi.string().max(5).required(),
  eventDate: Joi.date().required(),
  type: Joi.number().integer().required(),
});

export const EventsFilters = Joi.object({
  searchQuery: Joi.string().min(1).max(30).allow(''),
});
