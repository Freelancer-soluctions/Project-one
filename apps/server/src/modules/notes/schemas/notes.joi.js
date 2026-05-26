import Joi from 'joi';

export const NotesFilters = Joi.object({
  searchTerm: Joi.string().min(1).max(150).allow(''),
  statusCode: Joi.string().min(3).max(3).allow(''),
  hashtagId: Joi.alternatives().try(
    Joi.number().integer(),
    Joi.array().items(Joi.number().integer())
  ).optional(),
});

export const NoteCreate = Joi.object({
  title: Joi.string().max(50).required(),
  content: Joi.string().max(2000).required(),
  color: Joi.string().max(6).required(),
  columnId: Joi.number().integer().required(),
  hashtagIds: Joi.array().items(Joi.number().integer()).max(20).optional(),
});

export const NoteUpdate = Joi.object({
  title: Joi.string().max(50).required(),
  content: Joi.string().max(2000).required(),
  hashtagIds: Joi.array().items(Joi.number().integer()).max(20).optional(),
});

export const NoteColumnUpdate = Joi.object({
  color: Joi.string().min(3).max(6).required(),
  columnId: Joi.number().integer().required(),
  id: Joi.number().required(),
});

export const CreateHashtagSchema = Joi.object({
  name: Joi.string().max(50).required().trim(),
});

export const UpdateHashtagSchema = Joi.object({
  name: Joi.string().max(50).required().trim(),
});
