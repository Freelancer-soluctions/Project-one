import Joi from 'joi';

export const warehouseFiltersSchema = Joi.object({
  name: Joi.string().max(50).allow(''),
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'MAINTENANCE').allow(''),
  limit: Joi.number().integer(),
  page: Joi.number().integer(),
});

export const warehouseCreateSchema = Joi.object({
  name: Joi.string().max(50).required(),
  description: Joi.string().max(120).allow(''),
  address: Joi.string().max(120).allow(''),
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'MAINTENANCE').required(),
});

export const warehouseUpdateSchema = Joi.object({
  name: Joi.string().max(50).optional().min(1),
  description: Joi.string().max(120).optional().min(1),
  address: Joi.string().max(120).optional().min(1),
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'MAINTENANCE').optional().min(1),
});
