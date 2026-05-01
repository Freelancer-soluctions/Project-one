import Joi from 'joi';

export const NotesFilters = Joi.object({
  searchTerm: Joi.string().min(1).max(150).allow(''),
  statusCode: Joi.string().min(3).max(3).allow(''),
});

export const NoteCreate = Joi.object({
  title: Joi.string().max(50).required(),
  content: Joi.string().max(2000).required(),
  color: Joi.string().max(6).required(),
  columnId: Joi.number().integer().required(),
});

export const NoteUpdate = Joi.object({
  title: Joi.string().max(50).required(),
  content: Joi.string().max(2000).required(),
});

export const NoteColumnUpdate = Joi.object({
  color: Joi.string().min(3).max(6).required(),
  columnId: Joi.number().integer().required(),
  id: Joi.number().required(),
});
