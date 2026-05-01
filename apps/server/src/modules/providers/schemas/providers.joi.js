import Joi from 'joi';

export const ProvidersFilters = Joi.object({
  name: Joi.string().min(1).max(80).allow(''),
  status: Joi.boolean().allow(null),
  limit: Joi.number().integer(),
  page: Joi.number().integer(),
});

export const Providers = Joi.object({
  code: Joi.string().max(3).required(),
  name: Joi.string().max(100).required(),
  status: Joi.boolean().required(),
  contactName: Joi.string().max(60).allow(null, ''),
  contactEmail: Joi.string().max(80).allow(null, ''),
  contactPhone: Joi.string().max(15).allow(null, ''),
  address: Joi.string().max(120).allow(null, ''),
});
