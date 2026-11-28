import Joi from 'joi';

export const departmentFiltersSchema = Joi.object({
  code: Joi.string().max(20).allow(''),
  name: Joi.string().max(100).allow(''),
  active: Joi.boolean(),
  limit: Joi.number().integer(),
  page: Joi.number().integer(),
});

export const departmentCreateSchema = Joi.object({
  code: Joi.string().max(20).required(),
  name: Joi.string().max(100).required(),
  active: Joi.boolean().optional(),
});

export const departmentUpdateSchema = Joi.object({
  code: Joi.string().max(20).optional().min(1),
  name: Joi.string().max(100).optional().min(1),
  active: Joi.boolean().optional(),
});
