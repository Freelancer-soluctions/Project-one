import Joi from 'joi';

export const News = Joi.object({
  description: Joi.string().min(1).max(400).required(),
  statusId: Joi.number().integer().required(),
  statusCode: Joi.string().max(3).required(),
  document: Joi.string().allow(''),
});

export const NewsCreateSchema = Joi.object({
  description: Joi.string().min(1).max(400).required(),
  statusId: Joi.number().integer().required(),
  statusCode: Joi.string().max(3).required(),
  document: Joi.string().allow(''),
});

export const NewsUpdate = Joi.object({
  description: Joi.string().min(1).max(400).optional(),
  statusId: Joi.number().integer().optional(),
  statusCode: Joi.string().max(3).optional(),
  document: Joi.string().allow('').optional(),
});

export const NewsFilters = Joi.object({
  description: Joi.string().min(1).max(30).allow(''),
  statusCode: Joi.string().min(3).max(3).allow(''),
  toDate: Joi.date().allow(''),
  fromDate: Joi.date().allow(''),
  limit: Joi.number().integer(),
  page: Joi.number().integer(),
});
