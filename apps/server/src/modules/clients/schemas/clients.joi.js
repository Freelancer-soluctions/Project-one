import Joi from 'joi';

export const clientFiltersSchema = Joi.object({
  name: Joi.string().max(100).allow(''),
  email: Joi.string().email().allow(''),
  limit: Joi.number().integer(),
  page: Joi.number().integer(),
});

export const clientCreateUpdateSchema = Joi.object({
  name: Joi.string().max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().max(15).required(),
  address: Joi.string().max(120).required(),
});
